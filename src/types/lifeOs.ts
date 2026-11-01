/**
 * Domain types for Life OS extended features:
 * - Home Projects & Steps (Domestic maintenance & multi-step projects)
 * - Goals & Milestones (Long-term roadmaps e.g. .NET, Quran memorization)
 * - Workout Schedule Entries (Multi-workout daily scheduling)
 * - Today Preferences (Customizable view toggles)
 */

export interface ProjectStep {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  order: number;
}

export interface LifeProject {
  id: string;
  spaceId?: 'home' | 'work'; // Optional for backward compatibility: undefined or 'home' = home project
  title: string;
  description?: string;
  status: 'backlog' | 'in_progress' | 'waiting' | 'completed';
  steps: ProjectStep[];
  nextActionId?: string;
  nextActionTitle?: string;
  targetDate?: string; // YYYY-MM-DD
  createdAt: string;
  completedAt?: string;

  // Work Project Hub Dev Context (Phase 2 - No secrets/tokens)
  repositoryUrl?: string;
  devUrl?: string;
  apiUrl?: string;
  branch?: string;
  runCommand?: string;
  requiresVpn?: boolean;
  setupNotes?: string;
}

// Backward compatibility aliases
export type HomeProject = LifeProject;
export type WorkProject = LifeProject;

export type PlanCategory = 'career' | 'faith' | 'health' | 'finance' | 'personal';

export interface GoalPlan {
  id: string;
  title: string;
  category: PlanCategory;
  description?: string;
  targetDate?: string; // YYYY-MM-DD
  status: 'active' | 'paused' | 'completed';
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanMilestone {
  id: string;
  planId: string;
  title: string;
  order: number;
  isCompleted: boolean;
  targetDate?: string; // YYYY-MM-DD
  completedAt?: string;
}

export interface WorkoutScheduleEntry {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  routineId: string;
  scheduledTime: string; // HH:mm
  sessionLabel?: string; // e.g. "صباحي - فك التيبس", "مسائي - تقوية الجذع"
  durationMinutes: number;
  isEnabled: boolean;
}

export interface TodayPreferences {
  showWorship: boolean;
  showHealth: boolean;
  showWork: boolean;
  showHome: boolean;
  showPlans: boolean;
  worshipOptions?: {
    prayers?: boolean;
    azkar?: boolean;
    quran?: boolean;
  };
  workOptions?: {
    top3Only?: boolean;
    focusTimer?: boolean;
  };
  homeOptions?: {
    routines?: boolean;
    nextActionsOnly?: boolean;
  };
  plansOptions?: {
    showActiveProgress?: boolean;
    showDailyActions?: boolean;
  };
}

export const DEFAULT_TODAY_PREFERENCES: TodayPreferences = {
  showWorship: true,
  showHealth: true,
  showWork: true,
  showHome: true,
  showPlans: true,
  worshipOptions: {
    prayers: true,
    azkar: true,
    quran: true,
  },
  workOptions: {
    top3Only: false,
    focusTimer: true,
  },
  homeOptions: {
    routines: true,
    nextActionsOnly: true,
  },
  plansOptions: {
    showActiveProgress: true,
    showDailyActions: true,
  },
};
