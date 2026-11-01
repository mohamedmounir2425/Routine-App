import { db } from '../../db/database';
import { DayPlan } from '../../types';
import { addDaysToLocalDate, getLocalDateString } from '../../utils/dateUtils';
import { saveTask } from '../../db/taskQueries';
import { pauseActiveFocus, getPersistedActiveFocusState } from '../work/focus/focusEngine';

export async function saveDayPlan(plan: DayPlan) {
  if (!Number.isFinite(plan.availableMinutes) || plan.availableMinutes < 0 || plan.availableMinutes > 1440 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.endTime)) throw new Error('Invalid day plan');
  await db.dayPlans.put({ ...plan, essentialTaskIds: [...new Set(plan.essentialTaskIds)], updatedAt: new Date().toISOString() });
}

export async function deferTaskUntilTomorrow(id: string, now = new Date()) {
  const task = await db.tasks.get(id);
  if (!task || task.isCompleted || task.isRecurring) throw new Error('Only open one-off tasks can be deferred');
  const tomorrow = addDaysToLocalDate(getLocalDateString(now), 1);
  if (task.deadlineAt && getLocalDateString(new Date(task.deadlineAt)) <= getLocalDateString(now)) throw new Error('A fixed deadline cannot be deferred');
  if (task.commitment === 'must') throw new Error('Change the must-do commitment explicitly before deferring');
  const plan = await db.dayPlans.get(getLocalDateString(now));
  if (plan?.essentialTaskIds.includes(id)) throw new Error('Remove this task from today’s essentials before deferring');
  if (getPersistedActiveFocusState().focusedTaskId === id) await pauseActiveFocus();
  await saveTask({ ...task, dueDate: tomorrow, scheduledTime: undefined, updatedAt: now.toISOString() });
}
