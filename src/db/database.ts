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
import { DayPlan } from '../types/tasks';
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
    | 'workout_schedules'
    | 'day_plans';
  entityId: string;
  action: 'upsert' | 'delete';
  data: Record<string, unknown> | null;
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
  dayPlans!: Table<DayPlan, string>;

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

    this.version(5).stores({
      tasks: 'id, spaceId, isCompleted, status, dueDate, priority, sourceType, projectId, planId'
    });
    this.version(6).stores({ dayPlans: 'date, updatedAt' });
    this.version(7).stores({
      pendingSync: '++id, entityId, userId, status, nextRetryAt, [table+entityId], [userId+table+entityId]',
    });
  }
}

export const db = new RoutineDatabase();

// Initialize DB with seed data on first run or when updated
export async function initializeDatabase(forceRefresh: boolean = false): Promise<void> {
  try {
    await db.transaction('rw', [db.exercises, db.routines, db.weeklySchedule, db.settings], async () => {
      // Repair missing defaults without deleting user-created records or schedules.
      const existingExercises = new Map((await db.exercises.toArray()).map(exercise => [exercise.id, exercise]));
      for (const exercise of INITIAL_EXERCISES) {
        const existing = existingExercises.get(exercise.id);
        if (!existing || forceRefresh) {
          await db.exercises.put({ ...exercise, isFavorite: existing?.isFavorite ?? exercise.isFavorite });
        }
      }
      const existingRoutines = new Set(await db.routines.toCollection().primaryKeys());
      for (const routine of [...INITIAL_ROUTINES, ...ALL_PLAN_ROUTINES]) {
        if (!existingRoutines.has(routine.id)) await db.routines.put(routine);
      }
      const existingDays = new Set(await db.weeklySchedule.toCollection().primaryKeys());
      for (const day of INITIAL_WEEKLY_SCHEDULE) {
        if (!existingDays.has(day.dayOfWeek)) await db.weeklySchedule.put(day);
      }
      if (!await db.settings.get('current_settings')) await db.settings.put(DEFAULT_USER_SETTINGS);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export async function getUserSettings(): Promise<UserSettings> {
  let settings = await db.settings.get('current_settings');
  if (!settings) {
    settings = { ...DEFAULT_USER_SETTINGS };
    await db.settings.put(settings);
  } else {
    let needsUpdate = false;
    if (!settings.todayPreferences) {
      settings = {
        ...settings,
        todayPreferences: DEFAULT_USER_SETTINGS.todayPreferences,
      };
      needsUpdate = true;
    }
    if (!settings.enabledSpaces || settings.enabledSpaces.length === 0) {
      settings = {
        ...settings,
        enabledSpaces: DEFAULT_USER_SETTINGS.enabledSpaces,
      };
      needsUpdate = true;
    }
    if (needsUpdate) {
      await db.settings.put(settings);
    }
  }
  return settings;
}

export async function updateUserSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getUserSettings();
  const updated = { ...current, ...partial };
  await db.settings.put(updated);

  syncSettingsInBackground(updated);

  if (partial.todayPreferences && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('routine_today_preferences', JSON.stringify(partial.todayPreferences));
    } catch {
      // ignore
    }
  }

  return updated;
}

export function syncSettingsInBackground(settings: UserSettings): void {
  // Keep cloud imports out of database initialization.
  void import('./settingsSync').then(module => module.syncSettingsInBackground(settings))
    .catch(error => console.warn('Settings sync could not start:', error));
}
