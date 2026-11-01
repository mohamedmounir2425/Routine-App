import { LifeSpaceId } from './spaces';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE';

export interface TaskFocusSession {
  id: string;               // Unique session identifier e.g. "sess_1710400000_abc"
  taskId: string;           // Target task ID
  startedAt: string;        // ISO timestamp when focus began
  endedAt?: string;         // ISO timestamp when focus paused or completed (undefined if active)
  durationMinutes: number;  // Rounded elapsed duration in minutes
  createdAt: string;        // ISO timestamp
}

export interface TaskWaitingContext {
  waitingOn?: string;         // e.g. "م. أحمد (Backend API)" or "Manager approval"
  waitingReason?: string;     // e.g. "Waiting for Swagger endpoint deployment"
  blockedSince?: string;      // ISO timestamp when task entered waiting state
  followUpDate?: string;      // YYYY-MM-DD
  alternativeTaskId?: string; // Optional task to switch to while waiting
}

export interface TaskInterruptionContext {
  interruptedAt?: string;         // ISO timestamp when interruption occurred
  interruptionReason?: string;    // e.g. "Urgent manager request", "Review colleague PR"
  interruptedBy?: string;         // e.g. "Manager", "Colleague", "QA"
  previousFocusedTaskId?: string; // Task ID that was active when interrupted
}

export interface LifeTask {
  id: string;
  spaceId: LifeSpaceId;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  estimatedMinutes?: number;
  // Actual minutes derived strictly from focusSessions, preserved on interface for fast reads
  actualMinutes?: number;
  priority: TaskPriority;

  // Task Status (Separate from focused state)
  status?: TaskStatus;

  // Preserved for 100% backward compatibility across all existing queries and views
  isCompleted: boolean;
  completedAt?: string;

  // Explicit Focus Sessions (Source of truth for actual task time)
  focusSessions?: TaskFocusSession[];

  // Waiting & Interruption contexts
  waitingContext?: TaskWaitingContext;
  interruptionContext?: TaskInterruptionContext;

  // Source Lineage & Project Relationship
  sourceType?: 'manual' | 'plan' | 'project' | 'routine';
  sourceId?: string;
  projectId?: string;
  planId?: string;
  milestoneId?: string;

  isRecurring?: boolean;
  recurrenceRule?: 'daily' | 'weekdays' | 'weekly';
  // History of completion dates for recurring tasks
  recurringCompletionDates?: string[];
  createdAt: string;
  updatedAt?: string;
}

