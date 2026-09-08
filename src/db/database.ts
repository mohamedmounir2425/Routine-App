import Dexie, { type Table } from 'dexie';
import { 
  Exercise, 
  Routine, 
  WeeklyScheduleItem, 
  WorkoutLog, 
  UserSettings, 
  LifeTask,
  HomeProject,
  GoalPlan,
  PlanMilestone,
  WorkoutScheduleEntry 
} from '../types';
import { AzkarLog } from '../features/worship/types';
import { 
  INITIAL_EXERCISES, 
  INITIAL_ROUTINES, 
  INITIAL_WEEKLY_SCHEDULE, 
  DEFAULT_USER_SETTINGS, 
  ALL_PLAN_ROUTINES 
} from './seedData';

export interface PendingSyncItem {
  id?: number;
  table: 
    | 'workout_logs' 
    | 'life_tasks' 
    | 'azkar_logs' 
    | 'profiles' 
    | 'custom_routines' 
    | 'weekly_schedule'
    | 'projects'
    | 'plans'
    | 'plan_milestones'
    | 'workout_schedules';
  entityId: string;
  action: 'upsert' | 'delete';
  data: any;
  userId: string;
  timestamp: string;
  retryCount: number;
  nextRetryAt?: number;
  status: 'pending' | 'failed';
  lastError?: string;
  isCreatedOffline?: boolean;
}

export class RoutineDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  weeklySchedule!: Table<WeeklyScheduleItem, number>;
  workoutLogs!: Table<WorkoutLog, string>;
  settings!: Table<UserSettings, string>;
  azkarLogs!: Table<AzkarLog, string>;
  tasks!: Table<LifeTask, string>;
  pendingSync!: Table<PendingSyncItem, number>;
  projects!: Table<HomeProject, string>;
  plans!: Table<GoalPlan, string>;
  planMilestones!: Table<PlanMilestone, string>;
  workoutSchedules!: Table<WorkoutScheduleEntry, string>;

  constructor() {
    super('RoutineAppDB');
    this.version(1).stores({
      exercises: 'id, category, isFavorite, createdAt',
      routines: 'id, isDefault, isMiniRescue, weekNumber, sessionCode',
      weeklySchedule: 'dayOfWeek, routineId',
      workoutLogs: 'id, routineId, completedAt, weekNumber, sessionCode',
      settings: 'id'
    });

    this.version(2).stores({
      exercises: 'id, category, isFavorite, createdAt',
      routines: 'id, isDefault, isMiniRescue, weekNumber, sessionCode',
      weeklySchedule: 'dayOfWeek, routineId',
      workoutLogs: 'id, routineId, completedAt, weekNumber, sessionCode',
      settings: 'id',
      azkarLogs: 'id, date, categoryKey, isFullyCompleted, completedAt',
      tasks: 'id, spaceId, isCompleted, dueDate, priority'
    });

    this.version(3).stores({
      exercises: 'id, category, isFavorite, createdAt',
      routines: 'id, isDefault, isMiniRescue, weekNumber, sessionCode',
      weeklySchedule: 'dayOfWeek, routineId',
      workoutLogs: 'id, routineId, completedAt, weekNumber, sessionCode',
      settings: 'id',
      azkarLogs: 'id, date, categoryKey, isFullyCompleted, completedAt',
      tasks: 'id, spaceId, isCompleted, dueDate, priority',
      pendingSync: '++id, entityId, status, nextRetryAt, [table+entityId]'
    });

    this.version(4).stores({
      exercises: 'id, category, isFavorite, createdAt',
      routines: 'id, isDefault, isMiniRescue, weekNumber, sessionCode',
      weeklySchedule: 'dayOfWeek, routineId',
      workoutLogs: 'id, routineId, completedAt, weekNumber, sessionCode',
      settings: 'id',
      azkarLogs: 'id, date, categoryKey, isFullyCompleted, completedAt',
      tasks: 'id, spaceId, isCompleted, dueDate, priority, sourceType, projectId, planId',
      pendingSync: '++id, entityId, status, nextRetryAt, [table+entityId]',
      projects: 'id, status, createdAt',
      plans: 'id, category, status, createdAt',
      planMilestones: 'id, planId, isCompleted, order',
      workoutSchedules: 'id, dayOfWeek, scheduledTime, isEnabled'
    });
  }
}

export const db = new RoutineDatabase();

// Initialize DB with seed data on first run or when updated
export async function initializeDatabase(forceRefresh: boolean = false): Promise<void> {
  try {
    const exerciseCount = await db.exercises.count();
    const routineCount = await db.routines.count();
    const sampleEx = await db.exercises.get('ab-mcgill-curlup');
    const needsUpdate = exerciseCount < 30 || routineCount < 15 || !sampleEx?.youtubeUrl || (sampleEx as any)?.localVideoUrl !== undefined || forceRefresh;

    if (needsUpdate) {
      await db.exercises.clear();
      await db.exercises.bulkPut(INITIAL_EXERCISES);

      await db.routines.clear();
      // Seed both core routines and all 16 sessions of the 4-week program
      await db.routines.bulkPut([...INITIAL_ROUTINES, ...ALL_PLAN_ROUTINES]);

      await db.weeklySchedule.clear();
      await db.weeklySchedule.bulkPut(INITIAL_WEEKLY_SCHEDULE);
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.put(DEFAULT_USER_SETTINGS);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

export async function getUserSettings(): Promise<UserSettings> {
  let settings = await db.settings.get('current_settings');
  if (!settings) {
    settings = DEFAULT_USER_SETTINGS;
    await db.settings.put(settings);
  }
  return settings;
}

export async function updateUserSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getUserSettings();
  const updated = { ...current, ...partial };
  await db.settings.put(updated);
  return updated;
}
