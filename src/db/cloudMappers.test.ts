import type { SupabaseClient } from '@supabase/supabase-js';
import { db } from './database';
import { DEFAULT_USER_SETTINGS } from './seedData';
import type { DayPlan, HomeProject, LifeTask, Routine } from '../types';
import { taskToCloud, taskFromCloud, projectToCloud, projectFromCloud, routineToCloud, routineFromCloud, dayPlanToCloud, dayPlanFromCloud } from './cloudMappers';
import { pullUserDataFromCloud, pushLocalDataToCloud, syncSingleTask, syncSingleProject, syncSingleDayPlan, syncSingleSettings } from './syncEngine';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).filter(([, entry]) => entry !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => `${JSON.stringify(key)}:${canonical(entry)}`).join(',')}}`;
  return JSON.stringify(value);
}

export async function runCloudMapperTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  const stamp = '2026-11-01T10:00:00.000Z';
  const task: LifeTask = {
    id: 'complete-task', spaceId: 'work', title: 'Complete metadata', description: 'Details',
    dueDate: '2026-11-01', scheduledTime: '11:00', estimatedMinutes: 30, actualMinutes: 999,
    priority: 'high', status: 'WAITING', isCompleted: false, createdAt: stamp, updatedAt: stamp,
    focusSessions: [{ id: 'session', taskId: 'complete-task', startedAt: stamp, endedAt: stamp, durationMinutes: 6, createdAt: stamp }],
    waitingContext: { waitingOn: 'Review', waitingReason: 'Approval' },
    interruptionContext: { interruptionReason: 'Meeting', interruptedAt: stamp },
    sourceType: 'plan', sourceId: 'goal', planId: 'goal', milestoneId: 'milestone', projectId: 'project',
    isRecurring: true, recurrenceRule: 'weekly', recurringCompletionDates: ['2026-10-25'],
    deadlineAt: '2026-11-01T18:00:00.000Z', commitment: 'must', goalImpact: 'high', dependsOnTaskIds: ['dependency'],
  };
  const taskRow = taskToCloud('account-a', task);
  check('Task round trip preserves all planning, recurrence, focus and lineage fields', canonical(taskFromCloud(taskRow)) === canonical({ ...task, actualMinutes: 6 }));
  check('Cloud payload derives actual minutes from focus sessions rather than a stale cached total', taskRow.actual_minutes === 6);
  const cleared = taskToCloud('account-a', { ...task, description: undefined, deadlineAt: undefined, planId: undefined, waitingContext: undefined, dependsOnTaskIds: [], focusSessions: [] });
  const clearedLocal = taskFromCloud(cleared, task);
  check('Explicit nulls and empty arrays clear removed cloud fields on another device', cleared.description === null && cleared.deadline_at === null && clearedLocal.description === undefined && clearedLocal.deadlineAt === undefined && clearedLocal.planId === undefined && clearedLocal.waitingContext === undefined && clearedLocal.dependsOnTaskIds?.length === 0 && clearedLocal.focusSessions?.length === 0);
  const legacy = taskFromCloud({ id: task.id, title: 'Old client', space_id: 'work', is_completed: false, created_at: stamp, client_data_version: 0, deadline_at: null }, task);
  check('Legacy rows do not erase newer local planning fields after additive schema migration', legacy.deadlineAt === task.deadlineAt && legacy.planId === task.planId && legacy.focusSessions?.length === 1);
  const legacyCompleted = taskFromCloud({ id: task.id, title: task.title, space_id: 'work', is_completed: true, created_at: stamp }, task);
  check('Legacy completion remains consistent with the task status', legacyCompleted.status === 'DONE' && legacyCompleted.isCompleted);
  const legacyLinks = taskFromCloud({ id: task.id, title: task.title, space_id: 'work', is_completed: false, created_at: stamp, source_type: 'plan', plan_id: 'goal', recurring_completion_dates: ['2026-10-25'] });
  check('Partial legacy cloud rows retain lineage and recurrence history on a fresh device', legacyLinks.sourceType === 'plan' && legacyLinks.planId === 'goal' && legacyLinks.recurringCompletionDates?.[0] === '2026-10-25');
  const project: HomeProject = { id: 'project', spaceId: 'work', title: 'Work project', description: 'Details', status: 'in_progress', steps: [{ id: 'step', title: 'Step', order: 0, isCompleted: false }], nextActionId: 'step', nextActionTitle: 'Step', targetDate: '2026-11-07', createdAt: stamp, repositoryUrl: 'https://example.com/repo', devUrl: 'https://example.com/dev', apiUrl: 'https://example.com/api', branch: 'main', runCommand: 'npm run dev', requiresVpn: true, setupNotes: 'Setup' };
  check('Work projects round trip without turning into Home projects or losing development context', canonical(projectFromCloud(projectToCloud('account-a', project))) === canonical(project));
  check('Legacy projects without a space retain the Home compatibility rule', projectToCloud('account-a', { ...project, spaceId: undefined }).space_id === 'home');
  const routine: Routine = { id: 'custom-routine', name: 'Routine', description: 'Test', exerciseIds: ['exercise'], totalEstimatedMinutes: 10, level: 'gentle', tag: 'Custom', isCustom: true, isDefault: false, isMiniRescue: true, planSessionId: 'plan-session', weekNumber: 2, sessionCode: 'A', prescriptions: [{ exerciseId: 'exercise', sets: 2, reps: 8 }], customExerciseConfigs: { exercise: { reps: 8 } } };
  check('Custom routine round trip preserves prescriptions and plan session settings', canonical(routineFromCloud(routineToCloud('account-a', routine))) === canonical(routine));
  const day: DayPlan = { date: '2026-11-01', availableMinutes: 90, endTime: '21:00', essentialTaskIds: [task.id], updatedAt: stamp };
  check('Day plans round trip and have different cloud IDs for two users on the same date', canonical(dayPlanFromCloud(dayPlanToCloud('account-a', day))) === canonical(day) && dayPlanToCloud('account-a', day).id !== dayPlanToCloud('account-b', day).id);

  await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear(); });
  await db.tasks.put(task); await db.projects.put(project); await db.routines.put(routine); await db.dayPlans.put(day);
  const settings = { ...DEFAULT_USER_SETTINGS, todayPreferences: { ...DEFAULT_USER_SETTINGS.todayPreferences!, showWork: false } };
  await db.settings.put(settings);
  const payloads: Record<string, Record<string, unknown>[]> = {};
  const client = { from(table: string) {
    const query = {
      upsert(payload: Record<string, unknown> | Record<string, unknown>[]) { payloads[table] = Array.isArray(payload) ? payload : [payload]; return query; },
      async throwOnError() { return { error: null }; },
      select() { return query; }, eq() { return query; }, order() { return query; },
      async range(start: number, end: number) { return { data: (payloads[table] ?? []).slice(start, end + 1), error: null }; },
    };
    return query;
  } } as unknown as SupabaseClient;
  const pushed = await pushLocalDataToCloud('account-a', client);
  check('Bulk upload uses complete mapper payloads for tasks, projects, routines and Today', pushed.success && canonical(payloads.life_tasks[0]) === canonical(taskRow) && canonical(payloads.projects[0]) === canonical(projectToCloud('account-a', project)) && canonical(payloads.custom_routines[0]) === canonical(routineToCloud('account-a', routine)) && canonical(payloads.day_plans[0]) === canonical(dayPlanToCloud('account-a', day)));
  await syncSingleTask('account-a', task); await syncSingleProject('account-a', project); await syncSingleDayPlan('account-a', day); await syncSingleSettings('account-a', settings);
  const queued = await db.pendingSync.toArray();
  check('Individual online/offline saves persist the same complete payload as bulk sync', ['life_tasks', 'projects', 'day_plans'].every(table => canonical(queued.find(item => item.table === table)?.data) === canonical(payloads[table][0])));
  check('Today preferences are present in both individual and bulk profile uploads', canonical(queued.find(item => item.table === 'profiles')?.data?.today_preferences) === canonical(payloads.profiles[0].today_preferences));
  await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear(); });
  const pulled = await pullUserDataFromCloud('account-a', client);
  check('A second empty device receives full tasks, Work project context and Today plan', pulled.success && canonical(await db.tasks.get(task.id)) === canonical({ ...task, actualMinutes: 6 }) && canonical(await db.projects.get(project.id)) === canonical(project) && canonical(await db.dayPlans.get(day.date)) === canonical(day));
  check('Cloud Today preferences survive a fresh-device profile pull', canonical((await db.settings.get('current_settings'))?.todayPreferences) === canonical(settings.todayPreferences));
  await db.settings.update('current_settings', { todayPreferences: { ...settings.todayPreferences, showWork: true } });
  const refreshed = await pullUserDataFromCloud('account-a', client);
  check('Synced Today preferences replace stale local preferences without being shadowed by the local spread', refreshed.success && (await db.settings.get('current_settings'))?.todayPreferences?.showWork === false);
  return results;
}
