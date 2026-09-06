import { Routine, WeeklyScheduleItem, PlanSession } from '../types';
import { db, getUserSettings, updateUserSettings } from './database';
import { FOUR_WEEK_PLAN } from './seedData';

export interface TodayPlanStatus {
  isWorkoutDay: boolean;
  isRestDay: boolean;
  restReason?: string;
  weekNumber: number;
  sessionCode?: 'A' | 'B' | 'C' | 'D';
  sessionTitle?: string;
  session?: PlanSession | null;
  routine: Routine | null;
  estimatedMinutes: number;
  scheduleItem: WeeklyScheduleItem;
  nextSession?: {
    dayNameAr: string;
    sessionCode: 'A' | 'B' | 'C' | 'D';
    title: string;
    time: string;
  };
  completedSessionsThisWeek: number;
  totalSessionsThisWeek: number;
  overallCompletedSessions: number;
  totalOverallSessions: number;
}

export async function getTodayPlanStatus(): Promise<TodayPlanStatus> {
  const settings = await getUserSettings();
  const currentWeekNum = settings.currentWeekNumber || 1;
  const todayDay = new Date().getDay();

  let scheduleItem = await db.weeklySchedule.get(todayDay);
  if (!scheduleItem) {
    scheduleItem = {
      dayOfWeek: todayDay,
      dayNameAr: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][todayDay],
      routineId: null,
      isRestDay: true,
    };
  }

  const currentWeek = FOUR_WEEK_PLAN.find(w => w.weekNumber === currentWeekNum) || FOUR_WEEK_PLAN[0];
  let todaySession: PlanSession | null = null;

  if (scheduleItem.sessionCode) {
    todaySession = currentWeek.sessions.find(s => s.sessionCode === scheduleItem?.sessionCode) || null;
  } else if (scheduleItem.routineId) {
    todaySession = currentWeek.sessions.find(s => s.routineId === scheduleItem?.routineId) || null;
  }

  let routine: Routine | null = null;
  if (scheduleItem.routineId) {
    routine = (await db.routines.get(scheduleItem.routineId)) || null;
  }
  if (!routine && todaySession) {
    routine = (await db.routines.get(todaySession.routineId)) || null;
  }

  const isRestDay = !routine || scheduleItem.isRestDay === true;
  const isWorkoutDay = !isRestDay;

  let nextSessionInfo: TodayPlanStatus['nextSession'] = undefined;
  if (isRestDay) {
    const dayOrder = [6, 0, 1, 2, 3, 4, 5];
    const todayIndex = dayOrder.indexOf(todayDay);
    for (let i = 1; i <= 6; i++) {
      const nextDayNum = dayOrder[(todayIndex + i) % 7];
      const nextItem = await db.weeklySchedule.get(nextDayNum);
      if (nextItem && nextItem.routineId) {
        const nextSession = currentWeek.sessions.find(s => s.sessionCode === nextItem.sessionCode || s.routineId === nextItem.routineId);
        nextSessionInfo = {
          dayNameAr: nextItem.dayNameAr,
          sessionCode: (nextItem.sessionCode || nextSession?.sessionCode || 'A') as any,
          title: nextSession ? nextSession.title : 'جلسة التمرين التالية',
          time: '15-20 دقيقة',
        };
        break;
      }
    }
  }

  const weekRoutineIds = currentWeek.sessions.map(s => s.routineId);
  const allLogs = await db.workoutLogs.toArray();
  const completedRoutinesThisWeek = new Set(
    allLogs.filter(l => weekRoutineIds.includes(l.routineId)).map(l => l.routineId)
  );
  const uniqueSessionsCompleted = new Set(allLogs.map(l => l.routineId)).size;

  return {
    isWorkoutDay,
    isRestDay,
    restReason: scheduleItem.restReason || 'راحة واستشفاء للغضاريف والعضلات',
    weekNumber: currentWeekNum,
    sessionCode: scheduleItem.sessionCode || todaySession?.sessionCode,
    sessionTitle: todaySession?.title,
    session: todaySession,
    routine,
    estimatedMinutes: routine?.totalEstimatedMinutes || (todaySession ? 15 : 0),
    scheduleItem,
    nextSession: nextSessionInfo,
    completedSessionsThisWeek: completedRoutinesThisWeek.size,
    totalSessionsThisWeek: currentWeek.sessions.length,
    overallCompletedSessions: Math.min(16, uniqueSessionsCompleted),
    totalOverallSessions: 16,
  };
}

export async function setActivePlanWeek(weekNumber: number): Promise<void> {
  await updateUserSettings({ currentWeekNumber: weekNumber });
  const week = FOUR_WEEK_PLAN.find(w => w.weekNumber === weekNumber);
  if (!week) return;

  for (const s of week.sessions) {
    await db.weeklySchedule.put({
      dayOfWeek: s.dayOfWeek,
      dayNameAr: s.dayNameAr,
      routineId: s.routineId,
      sessionCode: s.sessionCode,
      weekNumber: weekNumber,
    });
  }
}

export async function getTodayRoutine(): Promise<{ routine: Routine | null; isRestDay: boolean; scheduleItem: WeeklyScheduleItem }> {
  const planStatus = await getTodayPlanStatus();
  return {
    routine: planStatus.routine,
    isRestDay: planStatus.isRestDay,
    scheduleItem: planStatus.scheduleItem,
  };
}

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

export async function saveCustomRoutine(routine: Routine): Promise<void> {
  await db.routines.put({
    ...routine,
    isCustom: true,
  });
}

export async function deleteCustomRoutine(routineId: string): Promise<void> {
  await db.routines.delete(routineId);
  const affectedDays = await db.weeklySchedule.where('routineId').equals(routineId).toArray();
  for (const day of affectedDays) {
    await db.weeklySchedule.update(day.dayOfWeek, { routineId: null });
  }
}

export async function getWeeklyCompletionStatus(): Promise<{ [dayOfWeek: number]: boolean }> {
  const result: { [dayOfWeek: number]: boolean } = {
    0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false
  };

  const now = new Date();
  const currentDay = now.getDay();
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
