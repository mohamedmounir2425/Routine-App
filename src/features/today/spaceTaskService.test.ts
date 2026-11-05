import { db } from '../../db/database';
import { LifeSpaceId, LifeTask, DEFAULT_TODAY_PREFERENCES } from '../../types';
import { aggregateTodayFeed } from './todayAggregator';
import { isSpaceTaskDue, saveSpaceTask, saveEnabledSpaces } from './spaceTaskService';
import { getUserSettings } from '../../db/database';
import { executeToggleTask } from './todayActions';
import { getLocalDateString } from '../../utils/dateUtils';

export async function runSpaceTaskTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  await db.tasks.clear(); await db.plans.clear(); await db.projects.clear();
  const today = getLocalDateString();
  const makeTask = (spaceId: LifeSpaceId, overrides: Partial<LifeTask> = {}): LifeTask => ({ id: `space-test-${spaceId}`, spaceId, title: `مهمة ${spaceId}`, priority: 'medium', isCompleted: false, dueDate: today, createdAt: new Date().toISOString(), ...overrides });
  const spaces: LifeSpaceId[] = ['worship', 'health', 'work', 'home', 'plans'];
  for (const space of spaces) await saveSpaceTask(makeTask(space));
  const feed = await aggregateTodayFeed({ preferences: DEFAULT_TODAY_PREFERENCES });
  for (const space of spaces) {
    const items = feed.items.filter(item => item.sourceId === `space-test-${space}`);
    check(`Create ${space} task once and surface it in its own Today space`, items.length === 1 && items[0].space === space);
  }
  await executeToggleTask('space-test-health');
  const completed = await aggregateTodayFeed();
  check('Health tasks use the shared completion flow', completed.items.some(item => item.sourceId === 'space-test-health' && item.isCompleted));
  const hidden = await aggregateTodayFeed({ preferences: { ...DEFAULT_TODAY_PREFERENCES, showHealth: false } });
  check('Hiding Health also hides its manual tasks', !hidden.items.some(item => item.sourceId === 'space-test-health'));
  await db.plans.put({ id: 'space-plan', title: 'Health goal', category: 'health', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  await saveSpaceTask(makeTask('health', { id: 'health-plan-task', planId: 'space-plan' }));
  const linked = await aggregateTodayFeed();
  const linkedItems = linked.items.filter(item => item.sourceId === 'health-plan-task');
  check('A plan-linked Health task keeps its primary space without duplication', linkedItems.length === 1 && linkedItems[0].space === 'health' && linkedItems[0].estimatedMinutes === undefined);
  const hiddenLinked = await aggregateTodayFeed({ preferences: { ...DEFAULT_TODAY_PREFERENCES, showHealth: false } });
  check('Linking to an active plan does not bypass the primary space visibility', !hiddenLinked.items.some(item => item.sourceId === 'health-plan-task'));
  const recurring = makeTask('home', { isRecurring: true, recurrenceRule: 'weekdays', dueDate: '2026-10-30' });
  check('Weekday recurrence excludes weekends', !isSpaceTaskDue(recurring, '2026-11-01') && isSpaceTaskDue(recurring, '2026-11-02'));
  check('Weekly recurrence uses its original weekday', isSpaceTaskDue({ ...recurring, recurrenceRule: 'weekly' }, '2026-11-06') && !isSpaceTaskDue({ ...recurring, recurrenceRule: 'weekly' }, '2026-11-05'));
  check('Future recurring tasks do not appear before their start date', !isSpaceTaskDue({ ...recurring, dueDate: '2026-11-10' }, '2026-11-02'));
  let rejected = false;
  try { await saveSpaceTask(makeTask('home', { title: '   ' })); } catch { rejected = true; }
  check('Blank task titles are rejected without overwriting saved data', rejected && (await db.tasks.get('space-test-home'))?.title === 'مهمة home');
  await saveSpaceTask(makeTask('work', { id: 'dependency-a', dependsOnTaskIds: ['dependency-b'] }));
  rejected = false;
  try { await saveSpaceTask(makeTask('work', { id: 'dependency-b', dependsOnTaskIds: ['dependency-a'] })); } catch { rejected = true; }
  check('Circular dependencies are rejected', rejected && !await db.tasks.get('dependency-b'));
  await db.projects.put({ id: 'home-only', title: 'Home', spaceId: 'home', status: 'in_progress', steps: [], createdAt: new Date().toISOString() });
  rejected = false;
  try { await saveSpaceTask(makeTask('work', { projectId: 'home-only' })); } catch { rejected = true; }
  check('Projects cannot be linked to tasks from a different space', rejected);
  const originalSettings = await getUserSettings();
  await saveEnabledSpaces(['work']);
  const workOnly = await aggregateTodayFeed({ preferences: DEFAULT_TODAY_PREFERENCES });
  check('Disabled spaces are consistently excluded even when Today preferences request them', workOnly.items.every(item => item.space === 'work'));
  await saveSpaceTask(makeTask('health', { id: 'revealed-health' }), { revealInToday: true });
  const settingsAfterReveal = await getUserSettings();
  const revealedFeed = await aggregateTodayFeed({ preferences: settingsAfterReveal.todayPreferences });
  check('Adding a task can enable only its space and reveal it in Today', settingsAfterReveal.enabledSpaces?.includes('health') === true && settingsAfterReveal.enabledSpaces?.includes('work') === true && revealedFeed.items.some(item => item.sourceId === 'revealed-health'));
  check('Revealing a space preserves unrelated personal settings', settingsAfterReveal.userName === originalSettings.userName && settingsAfterReveal.soundBeepsEnabled === originalSettings.soundBeepsEnabled);
  rejected = false;
  try { await saveEnabledSpaces([]); } catch { rejected = true; }
  check('At least one space stays enabled', rejected && (await getUserSettings()).enabledSpaces?.length === 2);
  const failSettingsWrite = () => { throw new Error('Simulated settings write failure'); };
  db.settings.hook('updating', failSettingsWrite);
  rejected = false;
  try { await saveSpaceTask(makeTask('home', { id: 'must-rollback' }), { revealInToday: true }); } catch { rejected = true; }
  finally { db.settings.hook('updating').unsubscribe(failSettingsWrite); }
  check('Revealing a space and saving its task commit or roll back together', rejected && !await db.tasks.get('must-rollback'));
  await db.settings.put(originalSettings);
  return results;
}
