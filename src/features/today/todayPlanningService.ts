import { db } from '../../db/database';
import { addDaysToLocalDate, getLocalDateString } from '../../utils/dateUtils';
import { saveTask } from '../../db/taskQueries';
import { pauseActiveFocus, getPersistedActiveFocusState } from '../work/public';
import {
  saveDayPlan,
  addItemToDayPlan,
  removeItemFromDayPlan,
  reorderDayPlanItems,
  normalizeDayPlan,
  isItemSelectedForDay,
  getDayPlan,
  buildTaskRefKey,
  buildProjectStepRefKey,
  buildRoutineOccurrenceRefKey,
  type DayPlanSelectedItemInput,
} from '../../db/dayPlanQueries';

export {
  saveDayPlan,
  addItemToDayPlan,
  removeItemFromDayPlan,
  reorderDayPlanItems,
  normalizeDayPlan,
  isItemSelectedForDay,
  getDayPlan,
  buildTaskRefKey,
  buildProjectStepRefKey,
  buildRoutineOccurrenceRefKey,
  type DayPlanSelectedItemInput,
};

export async function deferTaskUntilTomorrow(id: string, now = new Date()) {
  const task = await db.tasks.get(id);
  if (!task || task.isCompleted || task.isRecurring) throw new Error('Only open one-off tasks can be deferred');
  const todayStr = getLocalDateString(now);
  const tomorrow = addDaysToLocalDate(todayStr, 1);
  if (task.deadlineAt && getLocalDateString(new Date(task.deadlineAt)) <= todayStr) throw new Error('A fixed deadline cannot be deferred');
  if (task.commitment === 'must') throw new Error('Change the must-do commitment explicitly before deferring');
  const plan = await getDayPlan(todayStr);
  if (plan?.essentialTaskIds.includes(id)) throw new Error('Remove this task from today’s essentials before deferring');
  const taskRef = buildTaskRefKey(id);
  if (isItemSelectedForDay(plan, taskRef)) {
    await removeItemFromDayPlan(todayStr, taskRef);
  }
  if (getPersistedActiveFocusState().focusedTaskId === id) await pauseActiveFocus();
  await saveTask({ ...task, dueDate: tomorrow, scheduledTime: undefined, updatedAt: now.toISOString() });
}
