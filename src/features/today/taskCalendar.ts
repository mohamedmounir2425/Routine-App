import { LifeTask } from '../../types';
import { parseLocalDate } from '../../utils/dateUtils';

/** Shared pure calendar policy for Today, space screens and the decision assistant. */
export function isSpaceTaskDue(task: LifeTask, date: string): boolean {
  if (task.dueDate && task.dueDate > date) return false;
  if (!task.isRecurring) return true;
  const day = parseLocalDate(date).getDay();
  if (task.recurrenceRule === 'weekdays') return day >= 1 && day <= 5;
  if (task.recurrenceRule === 'weekly') {
    const anchor = task.dueDate || task.createdAt?.split('T')[0];
    return !!anchor && parseLocalDate(anchor).getDay() === day;
  }
  return true;
}
