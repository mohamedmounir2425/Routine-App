import type { LifeTask } from '../../types';

// Compatibility with existing records; structured taskCategory takes precedence when set.
export const isShoppingTask = (task: LifeTask) =>
  task.title.startsWith('🛒') || (task.description ?? '').includes('مشتريات');

export const isMaintenanceTask = (task: LifeTask) => {
  if (isShoppingTask(task)) return false;
  if (task.taskCategory === 'maintenance') return true;
  if (task.taskCategory === 'general') return false;
  return task.title.startsWith('[') || /صيانة|تكييف|سباكة|كهرباء|أجهزة|فحص/.test(task.title);
};

export const isHomeTaskDone = (task: LifeTask, date: string) =>
  task.isRecurring ? (task.recurringCompletionDates ?? []).includes(date) : task.isCompleted;
