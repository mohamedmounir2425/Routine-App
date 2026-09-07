import { LifeSpaceId } from './spaces';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface LifeTask {
  id: string;
  spaceId: LifeSpaceId;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  estimatedMinutes?: number;
  priority: TaskPriority;
  isCompleted: boolean;
  completedAt?: string;
  isRecurring?: boolean;
  recurrenceRule?: 'daily' | 'weekdays' | 'weekly';
  createdAt: string;
}
