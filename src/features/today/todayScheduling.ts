import { LifeTask } from '../../types';
import { getLocalDateString } from '../../utils/dateUtils';
import { TodayItemTimeTag } from './todayTypes';

export function getTaskTimeTag(task: LifeTask, completed: boolean, targetDate: string, now = new Date()): TodayItemTimeTag {
  if (completed) return 'completed';
  if (task.dueDate && task.dueDate < targetDate && !task.isRecurring) return 'overdue';
  if (!task.scheduledTime) return 'flexible';
  const today = getLocalDateString(now);
  if (targetDate < today) return 'overdue';
  if (targetDate > today) return 'scheduled';
  const [hours, minutes] = task.scheduledTime.split(':').map(Number);
  const scheduled = hours * 60 + minutes;
  const current = now.getHours() * 60 + now.getMinutes();
  if (!Number.isFinite(scheduled)) return 'flexible';
  if (current < scheduled - 10) return 'scheduled';
  if (current > scheduled + 30) return 'overdue';
  return 'now';
}
