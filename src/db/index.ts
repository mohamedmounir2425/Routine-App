import Dexie, { type Table } from 'dexie';
import { Exercise, Routine, WeeklyScheduleItem, WorkoutLog, UserSettings } from '../types';
import { INITIAL_EXERCISES, INITIAL_ROUTINES, INITIAL_WEEKLY_SCHEDULE, DEFAULT_USER_SETTINGS } from './seedData';

export class RoutineDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  weeklySchedule!: Table<WeeklyScheduleItem, number>;
  workoutLogs!: Table<WorkoutLog, string>;
  settings!: Table<UserSettings, string>;

  constructor() {
    super('RoutineAppDB');
    this.version(1).stores({
      exercises: 'id, category, isFavorite, createdAt',
      routines: 'id, isDefault, isMiniRescue',
      weeklySchedule: 'dayOfWeek, routineId',
      workoutLogs: 'id, routineId, completedAt',
      settings: 'id'
    });
  }
}

export const db = new RoutineDatabase();

// Initialize DB with seed data on first run or when updated
export async function initializeDatabase(forceRefresh: boolean = false): Promise<void> {
  try {
    const exerciseCount = await db.exercises.count();
    const sampleEx = await db.exercises.get('ab-mcgill-curlup');
    const needsUpdate = exerciseCount < 30 || !sampleEx?.youtubeUrl || (sampleEx as any)?.localVideoUrl !== undefined || forceRefresh;

    if (needsUpdate) {
      await db.exercises.clear();
      await db.exercises.bulkAdd(INITIAL_EXERCISES);

      await db.routines.clear();
      await db.routines.bulkAdd(INITIAL_ROUTINES);

      await db.weeklySchedule.clear();
      await db.weeklySchedule.bulkAdd(INITIAL_WEEKLY_SCHEDULE);
    }

    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add(DEFAULT_USER_SETTINGS);
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Get routine assigned for today based on day of week
export async function getTodayRoutine(): Promise<{ routine: Routine | null; isRestDay: boolean; scheduleItem: WeeklyScheduleItem }> {
  const todayDay = new Date().getDay(); // 0-6 (0 is Sunday, 6 is Saturday)
  let scheduleItem = await db.weeklySchedule.get(todayDay);

  if (!scheduleItem) {
    const fallback = INITIAL_WEEKLY_SCHEDULE.find(s => s.dayOfWeek === todayDay) || INITIAL_WEEKLY_SCHEDULE[0];
    scheduleItem = fallback;
  }

  if (!scheduleItem.routineId) {
    return { routine: null, isRestDay: true, scheduleItem };
  }

  const routine = (await db.routines.get(scheduleItem.routineId)) || null;
  return { routine, isRestDay: false, scheduleItem };
}

// Get consecutive days streak calculation
export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  totalWorkouts: number;
  totalMinutes: number;
  hasWorkedOutToday: boolean;
}

export async function calculateStreakStats(): Promise<StreakStats> {
  const allLogs = await db.workoutLogs.orderBy('completedAt').reverse().toArray();
  
  if (allLogs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
      totalWorkouts: 0,
      totalMinutes: 0,
      hasWorkedOutToday: false,
    };
  }

  const totalWorkouts = allLogs.length;
  const totalMinutes = allLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
  const lastWorkout = allLogs[0];
  const lastWorkoutDate = lastWorkout ? lastWorkout.completedAt : null;

  // Extract unique sorted dates (YYYY-MM-DD)
  const uniqueDates = Array.from(
    new Set(allLogs.map(l => new Date(l.completedAt).toISOString().split('T')[0]))
  ).sort().reverse();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const hasWorkedOutToday = uniqueDates.includes(todayStr);

  let currentStreak = 0;
  let checkDate = new Date();

  // If didn't work out today, check if yesterday was done, else streak resets
  if (!hasWorkedOutToday) {
    if (uniqueDates.includes(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      return {
        currentStreak: 0,
        longestStreak: calculateLongestStreak(uniqueDates),
        lastWorkoutDate,
        totalWorkouts,
        totalMinutes,
        hasWorkedOutToday: false,
      };
    }
  }

  // Count backwards day by day
  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (uniqueDates.includes(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, calculateLongestStreak(uniqueDates)),
    lastWorkoutDate,
    totalWorkouts,
    totalMinutes,
    hasWorkedOutToday,
  };
}

function calculateLongestStreak(sortedDescDates: string[]): number {
  if (sortedDescDates.length === 0) return 0;
  const sortedAsc = [...sortedDescDates].sort();
  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1]);
    const curr = new Date(sortedAsc[i]);
    const diffTime = curr.getTime() - prev.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  return maxStreak;
}

// Save or update custom routine
export async function saveCustomRoutine(routine: Routine): Promise<void> {
  await db.routines.put({
    ...routine,
    isCustom: true,
  });
}

// Delete a custom routine and unassign from schedule if assigned
export async function deleteCustomRoutine(routineId: string): Promise<void> {
  await db.routines.delete(routineId);
  const affectedDays = await db.weeklySchedule.where('routineId').equals(routineId).toArray();
  for (const day of affectedDays) {
    await db.weeklySchedule.update(day.dayOfWeek, { routineId: null });
  }
}

// Get completed days for the current week (Saturday through Friday)
export async function getWeeklyCompletionStatus(): Promise<{ [dayOfWeek: number]: boolean }> {
  const result: { [dayOfWeek: number]: boolean } = {
    0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false
  };

  const now = new Date();
  const currentDay = now.getDay(); // 0-6 (0=Sun, 6=Sat)
  
  // Calculate distance from previous Saturday
  // If today is Saturday (6), daysFromSat = 0
  // If today is Sunday (0), daysFromSat = 1
  // If today is Friday (5), daysFromSat = 6
  const daysFromSat = (currentDay + 1) % 7;
  
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - daysFromSat);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const logs = await db.workoutLogs
    .where('completedAt')
    .between(startOfWeek.toISOString(), endOfWeek.toISOString(), true, true)
    .toArray();

  for (const log of logs) {
    const logDate = new Date(log.completedAt);
    const day = logDate.getDay();
    result[day] = true;
  }

  return result;
}

// Export full backup
export async function exportCompleteBackup(): Promise<string> {
  const [exercises, routines, logs, schedule, settings] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.workoutLogs.toArray(),
    db.weeklySchedule.toArray(),
    db.settings.toArray(),
  ]);

  const backupObj = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'MoveCare Routine App',
    data: {
      exercises,
      routines,
      logs,
      schedule,
      settings,
    }
  };

  return JSON.stringify(backupObj, null, 2);
}

// Import full backup
export async function importCompleteBackup(jsonData: string): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(jsonData);
    if (!parsed || !parsed.data) {
      return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو تالف' };
    }

    const { routines, logs, schedule, settings } = parsed.data;

    if (routines && Array.isArray(routines)) {
      for (const r of routines) {
        await db.routines.put(r);
      }
    }

    if (logs && Array.isArray(logs)) {
      for (const l of logs) {
        await db.workoutLogs.put(l);
      }
    }

    if (schedule && Array.isArray(schedule)) {
      for (const s of schedule) {
        await db.weeklySchedule.put(s);
      }
    }

    if (settings && Array.isArray(settings) && settings.length > 0) {
      await db.settings.put(settings[0]);
    }

    return { success: true, message: 'تم استرجاع النسخة الاحتياطية بنجاح!' };
  } catch (err: any) {
    return { success: false, message: `فشل الاسترجاع: ${err.message || 'خطأ في تنسيق الملف'}` };
  }
}
