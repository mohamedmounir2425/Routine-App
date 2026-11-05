import { decideToday } from './todayDecisionEngine';
import { DayPlan, LifeTask } from '../../types';
import { TodayItem } from './todayTypes';
import { db } from '../../db/database';
import { exportCompleteBackup, importCompleteBackup } from '../../db/backup';
import { saveDayPlan, deferTaskUntilTomorrow } from './todayPlanningService';

export async function runTodayDecisionTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  const now = new Date(2026, 10, 1, 12, 0);
  const task = (id: string, extra: Partial<LifeTask> = {}): LifeTask => ({ id, title: id, spaceId: 'work', priority: 'medium', isCompleted: false, estimatedMinutes: 45, dueDate: '2026-11-01', createdAt: now.toISOString(), ...extra });
  const item = (t: LifeTask, extra: Partial<TodayItem> = {}): TodayItem => ({ id: `item-${t.id}`, sourceId: t.id, title: t.title, space: t.spaceId, type: 'work_task', estimatedMinutes: t.estimatedMinutes, priority: t.priority, timeTag: 'flexible', status: 'pending', isCompleted: t.isCompleted, actionType: 'toggle_task', sortKey: 50000, ...extra });
  const fixed = task('fixed', { deadlineAt: new Date(2026, 10, 1, 12, 40).toISOString() });
  const optional = task('quick', { priority: 'high', estimatedMinutes: 5 });
  const choose = (tasks: LifeTask[], plan?: DayPlan, slot?: number) => decideToday(tasks.map(t => item(t)), tasks, plan, now, slot);
  check('Fixed deadline and latest-start risk outrank optional high-priority work', choose([optional, fixed]).recommendation?.item.sourceId === 'fixed' && choose([fixed]).recommendation?.reason === 'deadline_risk');
  check('A short session never substitutes optional quick wins for an urgent deadline', choose([optional, fixed], undefined, 15).recommendation?.item.sourceId === 'fixed' && choose([fixed], undefined, 15).sessionTooShort);
  const selected = task('selected');
  const plan: DayPlan = { date: '2026-11-01', availableMinutes: 30, endTime: '22:00', essentialTaskIds: ['selected'], updatedAt: now.toISOString() };
  check('Chosen outcomes outrank optional tasks', choose([optional, selected], plan).recommendation?.item.sourceId === 'selected');
  check('Insufficient capacity produces an explicit workload warning', choose([selected], plan).overloadMinutes === 15);
  check('Unknown durations are shown as unknown instead of fabricated estimates', choose([task('unknown', { commitment: 'must', estimatedMinutes: undefined })], plan).unknownDurations === 1);
  const waiting = task('waiting', { status: 'WAITING', commitment: 'must' });
  check('Blocked essentials produce follow-up instead of an executable focus recommendation', choose([optional, waiting]).recommendation?.blocked === true);
  const dependent = task('dependent', { commitment: 'must', dependsOnTaskIds: ['quick'] });
  check('Dependencies block until their source task is complete', choose([optional, dependent]).decisions.find(entry => entry.task?.id === 'dependent')?.blocked === true && choose([{ ...optional, isCompleted: true }, dependent]).recommendation?.blocked === false);
  check('Missing dependencies stay blocked rather than appearing ready', choose([task('orphan', { dependsOnTaskIds: ['missing'] })]).recommendation === null);
  const hidden = decideToday([], [fixed], undefined, now);
  check('Hidden-space filters cannot suppress hard-deadline commitments', hidden.essentials.length === 1 && hidden.recommendation?.item.sourceId === 'fixed');
  const futurePrayer: TodayItem = { ...item(optional), id: 'prayer', sourceId: 'isha', type: 'prayer', actionType: 'log_prayer', timeTag: 'scheduled', space: 'worship' };
  check('A future prayer window does not displace work available now', decideToday([futurePrayer, item(optional)], [optional], undefined, now).recommendation?.item.id === item(optional).id);
  check('Completion counts essentials separately from the general task count', choose([{ ...selected, isCompleted: true }, optional], plan).essentialCompleted === 1);
  check('Recommendation order is deterministic for equal-priority items', choose([task('b'), task('a')]).recommendation?.item.id === choose([task('a'), task('b')]).recommendation?.item.id);
  check('Expired day capacity clamps to zero', choose([selected], { ...plan, endTime: '11:00' }).capacity === 0);
  const weekdayMust = task('weekday-must', { isRecurring: true, recurrenceRule: 'weekdays', commitment: 'must', dueDate: '2026-10-30' });
  check('The assistant does not resurrect recurring essentials outside their calendar', decideToday([], [weekdayMust], undefined, now).essentials.length === 0);

  await db.tasks.clear(); await db.dayPlans.clear();
  await db.tasks.bulkPut([optional, fixed, selected]);
  await saveDayPlan(plan);
  const backup = await exportCompleteBackup();
  await db.dayPlans.clear();
  const restored = await importCompleteBackup(backup);
  check('Day plans round-trip through version 3 backups', restored.success && (await db.dayPlans.get(plan.date))?.essentialTaskIds[0] === 'selected');
  let rejected = false;
  try { await deferTaskUntilTomorrow('fixed', now); } catch { rejected = true; }
  check('Deferral protects fixed deadlines', rejected && (await db.tasks.get('fixed'))?.dueDate === '2026-11-01');
  rejected = false;
  try { await deferTaskUntilTomorrow('selected', now); } catch { rejected = true; }
  check('Chosen daily outcomes require an explicit plan change before deferral', rejected);
  await deferTaskUntilTomorrow('quick', now);
  check('User-requested deferral moves only the selected flexible task', (await db.tasks.get('quick'))?.dueDate === '2026-11-02' && (await db.tasks.get('fixed'))?.dueDate === '2026-11-01');
  return results;
}
