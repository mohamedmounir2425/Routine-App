import { db } from '../../db/database';
import { LifeSpaceId, LifeTask, DEFAULT_TODAY_PREFERENCES } from '../../types';
import { aggregateTodayFeed } from './todayAggregator';
import { isSpaceTaskDue, saveSpaceTask, saveEnabledSpaces, selectTaskForToday } from './spaceTaskService';
import {
  addItemToDayPlan,
  removeItemFromDayPlan,
  reorderDayPlanItems,
  buildTaskRefKey,
  buildProjectStepRefKey,
} from './todayPlanningService';
import { getUserSettings } from '../../db/database';
import { createHomeProject } from '../../db/projectQueries';
import { executeToggleTask, executeCompleteProjectAction } from './todayActions';
import { getLocalDateString } from '../../utils/dateUtils';
import { isMaintenanceTask } from '../home/public';

export async function runSpaceTaskTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  await db.tasks.clear(); await db.plans.clear(); await db.projects.clear(); await db.dayPlans.clear();
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

  // =========================================================================
  // Card 1 Acceptance Criteria Verification
  // =========================================================================
  await db.tasks.clear(); await db.projects.clear(); await db.plans.clear(); await db.dayPlans.clear();

  // 1. Undated Home task stays out of Today commitments automatically, appears in suggestions
  await saveSpaceTask(makeTask('home', { id: 'home-iron-shirt', title: 'كي القميص', dueDate: undefined, estimatedMinutes: 15 }));
  const feedUndated = await aggregateTodayFeed({ customDateStr: today, preferences: DEFAULT_TODAY_PREFERENCES });
  check(
    'Card 1: Undated Home task does not enter Today commitments automatically and surfaces in suggestions',
    !feedUndated.items.some(i => i.sourceId === 'home-iron-shirt') &&
      Boolean(feedUndated.suggestions?.some(s => s.sourceId === 'home-iron-shirt'))
  );

  // 2. Someday tasks, shopping tasks, future availableFrom, WAITING tasks before followUpDate, and backlog/waiting projects stay out of Today and suggestions
  await saveSpaceTask(makeTask('home', { id: 'home-someday-rug', title: 'شراء سجاد جديد', dueDate: undefined, isSomeday: true, reviewDate: today }));
  await saveSpaceTask(makeTask('home', { id: 'home-shopping-milk', title: '🛒 لبن وجبنة', dueDate: today }));
  await saveSpaceTask(makeTask('home', { id: 'home-future-avail', title: 'تنظيف التراس', dueDate: undefined, availableFrom: '2099-01-01' }));
  await saveSpaceTask(makeTask('home', {
    id: 'home-waiting-plumber',
    title: 'انتظار السباك',
    dueDate: today,
    status: 'WAITING',
    waitingContext: { waitingOn: 'السباك', followUpDate: '2099-01-01' },
  }));
  const backlogProj = await createHomeProject({
    id: 'proj-backlog-sofa',
    title: 'تجديد الركنة',
    status: 'backlog',
    reviewDate: today,
    steps: [{ id: 'step-sofa-1', title: 'اختيار القماش', order: 1, isCompleted: false }],
  });
  const feedFiltered = await aggregateTodayFeed({ customDateStr: today, preferences: DEFAULT_TODAY_PREFERENCES });
  const forbiddenIds = new Set(['home-someday-rug', 'home-shopping-milk', 'home-future-avail', 'home-waiting-plumber', backlogProj.id]);
  check(
    'Card 1: Someday, shopping, future availableFrom, WAITING (before follow-up), and backlog projects are excluded from Today and suggestions',
    !feedFiltered.items.some(i => forbiddenIds.has(i.sourceId)) &&
      !feedFiltered.suggestions?.some(s => forbiddenIds.has(s.sourceId))
  );

  // 3. Selecting an undated Home task via Add to My Day surfaces it in Today; removing it keeps the task in DB without changing dueDate/deadlineAt
  await selectTaskForToday('home-iron-shirt', today);
  const feedSelected = await aggregateTodayFeed({ customDateStr: today, preferences: DEFAULT_TODAY_PREFERENCES });
  const selectedItem = feedSelected.items.find(i => i.sourceId === 'home-iron-shirt');
  const taskInDbAfterSelect = await db.tasks.get('home-iron-shirt');
  check(
    'Card 1: Selecting an undated Home task surfaces it in Today without mutating dueDate',
    Boolean(selectedItem?.isSelectedForToday) &&
      feedSelected.sections.some(s => s.id === 'selected' && s.items.some(i => i.sourceId === 'home-iron-shirt')) &&
      taskInDbAfterSelect?.dueDate === undefined
  );

  await removeItemFromDayPlan(today, buildTaskRefKey('home-iron-shirt'));
  const feedRemoved = await aggregateTodayFeed({ customDateStr: today, preferences: DEFAULT_TODAY_PREFERENCES });
  const taskInDbAfterRemove = await db.tasks.get('home-iron-shirt');
  check(
    'Card 1: Removing a selected task from Today removes it from Today commitments while keeping the task intact in Home',
    !feedRemoved.items.some(i => i.sourceId === 'home-iron-shirt') &&
      taskInDbAfterRemove !== undefined &&
      taskInDbAfterRemove.dueDate === undefined
  );

  // 4. Selecting and completing a project step in Today marks the step complete in db.projects without auto-adding the next step to DayPlan
  const hoodProj = await createHomeProject({
    id: 'proj-hood',
    title: 'تركيب شفاط المطبخ',
    status: 'in_progress',
    steps: [
      { id: 'step-hood-1', title: 'قياس مكان الشفاط', order: 1, isCompleted: false },
      { id: 'step-hood-2', title: 'شراء الشفاط', order: 2, isCompleted: false },
    ],
  });
  const step1Ref = buildProjectStepRefKey(hoodProj.id, 'step-hood-1');
  await addItemToDayPlan(today, {
    refKey: step1Ref,
    sourceType: 'project_step',
    projectId: hoodProj.id,
    stepId: 'step-hood-1',
  });
  await executeCompleteProjectAction(hoodProj.id, 'step-hood-1');
  const updatedHoodProj = await db.projects.get(hoodProj.id);
  const feedAfterStepComplete = await aggregateTodayFeed({ customDateStr: today, preferences: DEFAULT_TODAY_PREFERENCES });
  const hoodItemsToday = feedAfterStepComplete.items.filter(i => i.sourceId === hoodProj.id);
  check(
    'Card 1: Completing a selected project step in Today completes it on the project without auto-pulling the next project step into Today',
    updatedHoodProj?.steps.find(s => s.id === 'step-hood-1')?.isCompleted === true &&
      updatedHoodProj?.nextActionId === 'step-hood-2' &&
      hoodItemsToday.length === 1 &&
      hoodItemsToday[0].refKey === step1Ref &&
      hoodItemsToday[0].isCompleted === true
  );

  // 5. Hard deadline (deadlineAt today) remains visible in Today even when not in selectedItems
  await saveSpaceTask(makeTask('home', {
    id: 'home-hard-deadline',
    title: 'سداد فاتورة الكهرباء قبل الإغلاق',
    dueDate: undefined,
    deadlineAt: `${today}T14:00:00.000Z`,
  }));
  const feedDeadline = await aggregateTodayFeed({ customDateStr: today, preferences: DEFAULT_TODAY_PREFERENCES });
  check(
    'Card 1: Task with hard deadlineAt today remains visible in Today even without manual selection',
    feedDeadline.items.some(i => i.sourceId === 'home-hard-deadline')
  );

  // 6. Reordering selected items updates their order in Today
  await saveSpaceTask(makeTask('home', { id: 'home-pick-a', title: 'ترتيب المكتبة', dueDate: undefined }));
  await saveSpaceTask(makeTask('home', { id: 'home-pick-b', title: 'تنظيف المكتب', dueDate: undefined }));
  await selectTaskForToday('home-pick-a', today);
  await selectTaskForToday('home-pick-b', today);
  await reorderDayPlanItems(today, [buildTaskRefKey('home-pick-b'), buildTaskRefKey('home-pick-a')]);
  const feedReordered = await aggregateTodayFeed({ customDateStr: today, preferences: DEFAULT_TODAY_PREFERENCES });
  const idxB = feedReordered.items.findIndex(i => i.sourceId === 'home-pick-b');
  const idxA = feedReordered.items.findIndex(i => i.sourceId === 'home-pick-a');
  check('Card 1: Reordering DayPlan selectedItems controls their order in Today', idxB >= 0 && idxA >= 0 && idxB < idxA);

  // 7. Structured taskCategory on LifeTask takes precedence in isMaintenanceTask
  check(
    'Card 1: isMaintenanceTask respects structured taskCategory before title fallback',
    isMaintenanceTask(makeTask('home', { title: 'تغيير جلدة الحنفية', taskCategory: 'maintenance' })) === true &&
      isMaintenanceTask(makeTask('home', { title: 'فحص القائمة', taskCategory: 'general' })) === false
  );

  await db.tasks.clear(); await db.projects.clear(); await db.plans.clear(); await db.dayPlans.clear();
  return results;
}
