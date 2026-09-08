export interface SpaceProgress {
  score: number; // 0-100%
  completedCount: number;
  totalCount: number;
  label: string;
  details: Record<string, any>;
}

export interface GlobalProgressSnapshot {
  date: string; // YYYY-MM-DD
  overallScore: number; // Life OS daily execution score (0-100)
  spaces: {
    worship: SpaceProgress;
    health: SpaceProgress;
    work: SpaceProgress;
    home: SpaceProgress;
  };
  plans: {
    activePlans: number;
    averageProgress: number;
    completedMilestones: number;
    totalMilestones: number;
  };
  today: {
    totalItems: number;
    completedItems: number;
    completionRate: number;
    remainingItems: number;
    overdueItems: number;
  };
}

export interface WeeklyDayProgress {
  date: string; // YYYY-MM-DD
  dayNameAr: string;
  overallScore: number;
  worshipScore: number;
  workoutsCount: number;
  completedTasksCount: number;
  focusMinutes: number;
}

export interface WeeklyProgressMatrix {
  days: WeeklyDayProgress[];
  averageScore: number;
  bestDay: WeeklyDayProgress | null;
  totalWorkouts: number;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
}
