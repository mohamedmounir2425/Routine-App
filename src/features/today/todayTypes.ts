import { LifeSpaceId, TaskPriority } from '../../types';

export type TodayItemType =
  | 'prayer'
  | 'dhikr'
  | 'quran'
  | 'workout'
  | 'work_task'
  | 'health_task'
  | 'home_task'
  | 'worship_task'
  | 'home_routine'
  | 'project_action'
  | 'plan_action'
  | 'focus_session';

export type TodayItemTimeTag =
  | 'now'        // Current window (e.g. current prayer window, workout due right now)
  | 'overdue'    // Scheduled earlier today or past due date
  | 'scheduled'  // Bound to a specific time today (HH:mm)
  | 'flexible'   // Unscheduled / flexible anytime today
  | 'completed'; // Finished for today

export type TodayItemStatus =
  | 'pending'    // Awaiting execution
  | 'now'        // In the active execution window right now
  | 'overdue'    // Scheduled window passed or overdue
  | 'completed'; // Completed for today

export type TodayActionType =
  | 'log_prayer'
  | 'start_workout'
  | 'open_azkar'
  | 'open_quran'
  | 'toggle_task'
  | 'complete_project_step'
  | 'start_focus';

/**
 * Normalized read-model item for Today Execution Center.
 * Generated purely in-memory by todayAggregator.ts (NOT a Dexie table).
 */
export interface TodayItem {
  id: string; // Unique instance ID for today (e.g. 'prayer_dhuhr_2026-09-07')
  sourceId: string; // ID of the underlying entity (taskId, projectId, routineId, prayer name)
  type: TodayItemType;
  space: LifeSpaceId;
  title: string;
  subtitle?: string;
  categoryLabel?: string; // e.g. "مشروع ضلفة الدولاب", "تعلم .NET"
  scheduledTime?: string; // HH:mm
  estimatedMinutes?: number;
  priority?: TaskPriority; // 'high' | 'medium' | 'low'
  timeTag: TodayItemTimeTag;
  status: TodayItemStatus;
  isCompleted: boolean;
  completedAt?: string;
  actionType: TodayActionType;
  actionPayload?: Record<string, any>;
  sortKey: number; // Deterministic sorting rank
}

export type TodaySectionId =
  | 'now'
  | 'overdue'
  | 'scheduled'
  | 'high_priority'
  | 'next_actions'
  | 'tasks'
  | 'plans'
  | 'completed';

export interface TodaySection {
  id: TodaySectionId;
  title: string;
  items: TodayItem[];
  badgeCount?: number;
}

export interface ActivePlanSummary {
  id: string;
  title: string;
  category: string;
  progressPercent: number;
  nextMilestoneTitle?: string;
  todayActionCount: number;
}

/**
 * The consolidated result returned by todayAggregator
 */
export interface TodayAggregationResult {
  dateStr: string; // YYYY-MM-DD
  items: TodayItem[];
  sections: TodaySection[];
  nextUp: TodayItem | null;
  totalCount: number;
  completedCount: number;
  completionRate: number; // 0 to 100
  spaceBreakdown: Record<LifeSpaceId, { total: number; completed: number }>;
  activePlansSummary: ActivePlanSummary[];
}
