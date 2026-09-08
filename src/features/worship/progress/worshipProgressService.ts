import { db } from '../../../db/database';
import { 
  getDailyPrayersState, 
  getQuranDailyStatus, 
  getAzkarStreak, 
  getTodayDateString 
} from '../../../db/worshipQueries';
import { getTodayTasbeehCount } from '../tasbeeh/tasbeehQueries';
import { 
  calcWorshipDailyProgress, 
  calcWorshipWeeklyMatrix, 
  calcWorshipConsistencyStats, 
  WorshipDayMetrics, 
  WorshipWeeklyMatrix, 
  WorshipConsistencyStats 
} from './worshipProgressCalc';

export async function fetchWorshipProgressData(): Promise<{
  todayMetrics: WorshipDayMetrics;
  weeklyMatrix: WorshipWeeklyMatrix;
  consistencyStats: WorshipConsistencyStats;
}> {
  const todayStr = getTodayDateString();
  const daysMetrics: WorshipDayMetrics[] = [];

  // Generate date strings for the past 7 days (including today)
  const dateStrings: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateStrings.push(dateStr);
  }

  // Load all azkar logs and worship tasks once for efficiency
  const allLogs = await db.azkarLogs.toArray();
  const worshipTasks = await db.tasks.where('spaceId').equals('worship').toArray();

  for (const dateStr of dateStrings) {
    const prayers = getDailyPrayersState(dateStr);
    const dayLogs = allLogs.filter((l) => l.date === dateStr && l.isFullyCompleted);
    const isMorningDone = dayLogs.some((l) => l.categoryKey === 'morning');
    const isEveningDone = dayLogs.some((l) => l.categoryKey === 'evening');
    const quran = getQuranDailyStatus(dateStr);
    const tasbeeh = dateStr === todayStr ? getTodayTasbeehCount() : 0;

    const dayActivities = worshipTasks.filter((t) => {
      if (t.isRecurring) {
        return Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(dateStr);
      }
      return t.dueDate === dateStr;
    });

    const metrics = calcWorshipDailyProgress(
      dateStr,
      prayers,
      isMorningDone,
      isEveningDone,
      quran,
      tasbeeh,
      dayActivities
    );

    daysMetrics.push(metrics);
  }

  const todayMetrics = daysMetrics[daysMetrics.length - 1] || calcWorshipDailyProgress(
    todayStr,
    getDailyPrayersState(todayStr),
    false,
    false,
    getQuranDailyStatus(todayStr),
    getTodayTasbeehCount(),
    []
  );

  const weeklyMatrix = calcWorshipWeeklyMatrix(daysMetrics);
  const streakInfo = await getAzkarStreak();
  const consistencyStats = calcWorshipConsistencyStats(streakInfo.currentStreak, weeklyMatrix);

  return {
    todayMetrics,
    weeklyMatrix,
    consistencyStats,
  };
}
