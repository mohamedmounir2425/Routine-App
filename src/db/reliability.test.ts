import { db, initializeDatabase } from './database';
import { exportCompleteBackup, importCompleteBackup } from './backup';
import { getTaskTimeTag } from '../features/today/todayScheduling';
import { aggregateTodayFeed } from '../features/today/todayAggregator';
import { DEFAULT_TODAY_PREFERENCES, LifeTask } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

export async function runReliabilityTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => { results.push({ name, passed }); };
  // This suite is called only by scripts/run-tests.mjs, with fake-indexeddb loaded.
  await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear(); });
  localStorage.clear();
  await initializeDatabase();
  const exercise = (await db.exercises.toArray())[0];
  const routine = (await db.routines.toArray())[0];
  await db.exercises.put({ ...exercise, id: 'custom-preserve', isFavorite: true });
  await db.exercises.update(exercise.id, { isFavorite: true });
  await db.routines.put({ ...routine, id: 'custom-routine-preserve', isCustom: true });
  await db.weeklySchedule.put({ dayOfWeek: 1, dayNameAr: 'الاثنين', routineId: 'custom-routine-preserve' });
  await initializeDatabase(true);
  check('Seed updates preserve custom content, favorites and schedules',
    !!await db.exercises.get('custom-preserve') && !!await db.routines.get('custom-routine-preserve')
    && !!(await db.exercises.get(exercise.id))?.isFavorite
    && (await db.weeklySchedule.get(1))?.routineId === 'custom-routine-preserve');

  const date = getLocalDateString();
  const task: LifeTask = { id: 'round-trip-task', title: 'Backup test', spaceId: 'home', priority: 'medium', isCompleted: false, dueDate: date, createdAt: new Date().toISOString() };
  await db.tasks.put(task);
  await db.projects.put({ id: 'backup-project', title: 'Project', spaceId: 'home', status: 'in_progress', steps: [], createdAt: new Date().toISOString() });
  localStorage.setItem(`routine_prayers_${date}`, '{"fajr":{"fard":true}}');
  localStorage.setItem('life_focus_sessions', '[]');
  localStorage.setItem('sb-private-auth-token', 'must-not-export');
  const backup = await exportCompleteBackup();
  const parsed = JSON.parse(backup);
  check('Backup includes every portable database table and excludes credentials/queue', Object.keys(parsed.data).length === 12 && !backup.includes('must-not-export') && !('pendingSync' in parsed.data));
  await db.tasks.clear(); await db.projects.clear(); await db.exercises.delete('custom-preserve');
  localStorage.removeItem(`routine_prayers_${date}`);
  const restored = await importCompleteBackup(backup);
  check('Full backup round trip restores custom exercises, tasks, projects and prayer history', restored.success && !!await db.tasks.get(task.id) && !!await db.projects.get('backup-project') && !!await db.exercises.get('custom-preserve') && localStorage.getItem(`routine_prayers_${date}`) !== null);

  const invalid = JSON.parse(backup);
  invalid.data.tasks = [{ ...task, title: 'Should never be written' }];
  invalid.data.schedule = [{ dayOfWeek: 99 }];
  const invalidResult = await importCompleteBackup(JSON.stringify(invalid));
  check('Malformed backup is rejected before any data changes', !invalidResult.success && (await db.tasks.get(task.id))?.title === task.title);
  const legacy = await importCompleteBackup(JSON.stringify({ version: 1, data: { exercises: [{ ...exercise, id: 'legacy-exercise' }] } }));
  check('Legacy v1 backup restores exported exercises', legacy.success && !!await db.exercises.get('legacy-exercise'));

  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, value) => { if (key === 'movecare_theme') throw new Error('Simulated quota failure'); originalSetItem(key, value); };
  const quotaResult = await importCompleteBackup(JSON.stringify({ version: 2, data: { tasks: [{ ...task, title: 'Uncommitted' }] }, localData: { movecare_theme: 'dark' } }));
  localStorage.setItem = originalSetItem;
  check('Storage failure aborts database restoration', !quotaResult.success && (await db.tasks.get(task.id))?.title === task.title);

  const now = new Date(2026, 10, 1, 12, 0);
  check('Home/plan task time windows classify upcoming, current and late items',
    getTaskTimeTag({ ...task, dueDate: undefined, scheduledTime: '14:00' }, false, '2026-11-01', now) === 'scheduled'
    && getTaskTimeTag({ ...task, dueDate: undefined, scheduledTime: '12:00' }, false, '2026-11-01', now) === 'now'
    && getTaskTimeTag({ ...task, dueDate: undefined, scheduledTime: '09:00' }, false, '2026-11-01', now) === 'overdue');
  check('Completed and overdue tasks retain correct date semantics', getTaskTimeTag(task, true, date, now) === 'completed' && getTaskTimeTag({ ...task, dueDate: '2026-10-31' }, false, '2026-11-01', now) === 'overdue');

  await db.tasks.put({ ...task, id: 'worship-flexible', spaceId: 'worship' });
  const feed = await aggregateTodayFeed({ preferences: { ...DEFAULT_TODAY_PREFERENCES, showWorship: true, showHome: true } });
  check('Flexible worship tasks appear in agenda sections', feed.sections.some(section => section.items.some(item => item.sourceId === 'worship-flexible')));
  const ids = feed.sections.flatMap(section => section.items.map(item => item.id));
  check('Each agenda item belongs to exactly one section', new Set(ids).size === ids.length && ids.length === feed.items.length);
  return results;
}
