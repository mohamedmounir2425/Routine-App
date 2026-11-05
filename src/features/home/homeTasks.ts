import type { LifeTask } from '../../types';
// Compatibility with existing records; no migration or implicit retagging.
export const isShoppingTask = (task: LifeTask) => task.title.startsWith('🛒') || (task.description ?? '').includes('مشتريات');
export const isMaintenanceTask = (task: LifeTask) => !isShoppingTask(task) && (task.title.startsWith('[') || /صيانة|تكييف|سباكة|كهرباء|أجهزة|فحص/.test(task.title));
export const isHomeTaskDone = (task: LifeTask, date: string) => task.isRecurring ? (task.recurringCompletionDates ?? []).includes(date) : task.isCompleted;
