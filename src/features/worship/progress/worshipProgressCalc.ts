import { DailyPrayerRecord, QuranDailyStatus } from '../../../db/worshipQueries';
import { LifeTask } from '../../../types';

export interface WorshipDayMetrics {
  dateStr: string;
  dayNameAr: string;
  prayersCompletedCount: number; // out of 5
  prayersTotal: number; // 5
  prayerDetails: Record<string, DailyPrayerRecord>;
  isMorningAzkarDone: boolean;
  isEveningAzkarDone: boolean;
  quran: QuranDailyStatus;
  tasbeehCount: number;
  worshipActivities: LifeTask[];
  primaryCommitmentPercent: number; // 0-100% deterministic (Prayers + Morning + Evening + Quran + Tasbih)
}

export interface WorshipWeeklyMatrix {
  days: WorshipDayMetrics[];
  avgCommitmentPercent: number;
  totalPrayersCompleted: number; // out of 35
  totalMorningAzkarCount: number; // out of 7
  totalEveningAzkarCount: number; // out of 7
  totalQuranPagesRead: number;
  totalTasbeehTaps: number;
}

export interface WorshipConsistencyStats {
  azkarStreak: number;
  weeklyPrayerRate: number; // %
  weeklyQuranTotalPages: number;
  weeklyTasbeehTotal: number;
}

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function getArabicDayName(date: Date): string {
  return ARABIC_DAYS[date.getDay()] || '';
}

/**
 * Pure calculation function for single day worship metrics.
 * Primary percentage is composed of:
 * - 5 Prayers (each 10% -> 50% max)
 * - Morning Azkar (15%)
 * - Evening Azkar (15%)
 * - Quran reading (15% if met, or prorated)
 * - Tasbeeh active (5% if > 0)
 * Sum = 100%
 */
export function calcWorshipDailyProgress(
  dateStr: string,
  prayerState: Record<string, DailyPrayerRecord>,
  isMorningDone: boolean,
  isEveningDone: boolean,
  quran: QuranDailyStatus,
  tasbeehCount: number,
  worshipActivities: LifeTask[] = []
): WorshipDayMetrics {
  const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  let prayersCompletedCount = 0;
  for (const k of prayerKeys) {
    if (prayerState[k]?.fard) {
      prayersCompletedCount++;
    }
  }

  // 1. Prayers: up to 50 points (10 per fard prayer)
  const prayerScore = prayersCompletedCount * 10;

  // 2. Azkar: 15 points each
  const morningScore = isMorningDone ? 15 : 0;
  const eveningScore = isEveningDone ? 15 : 0;

  // 3. Quran: up to 15 points
  let quranScore = 0;
  if (quran.isCompleted) {
    quranScore = 15;
  } else if (quran.targetPages > 0 && quran.pagesRead > 0) {
    quranScore = Math.min(15, Math.round((quran.pagesRead / quran.targetPages) * 15));
  }

  // 4. Tasbeeh: 5 points if count >= 33, or prorated
  let tasbeehScore = 0;
  if (tasbeehCount >= 33) {
    tasbeehScore = 5;
  } else if (tasbeehCount > 0) {
    tasbeehScore = Math.min(5, Math.max(1, Math.round((tasbeehCount / 33) * 5)));
  }

  const primaryCommitmentPercent = Math.min(100, Math.round(prayerScore + morningScore + eveningScore + quranScore + tasbeehScore));

  const [y, m, d] = dateStr.split('-').map(Number);
  const localDate = new Date(y, m - 1, d);

  return {
    dateStr,
    dayNameAr: getArabicDayName(localDate),
    prayersCompletedCount,
    prayersTotal: 5,
    prayerDetails: prayerState,
    isMorningAzkarDone: isMorningDone,
    isEveningAzkarDone: isEveningDone,
    quran,
    tasbeehCount,
    worshipActivities,
    primaryCommitmentPercent,
  };
}

/**
 * Pure calculation function for 7-day weekly matrix
 */
export function calcWorshipWeeklyMatrix(days: WorshipDayMetrics[]): WorshipWeeklyMatrix {
  if (!days.length) {
    return {
      days: [],
      avgCommitmentPercent: 0,
      totalPrayersCompleted: 0,
      totalMorningAzkarCount: 0,
      totalEveningAzkarCount: 0,
      totalQuranPagesRead: 0,
      totalTasbeehTaps: 0,
    };
  }

  let sumCommitment = 0;
  let totalPrayersCompleted = 0;
  let totalMorningAzkarCount = 0;
  let totalEveningAzkarCount = 0;
  let totalQuranPagesRead = 0;
  let totalTasbeehTaps = 0;

  for (const d of days) {
    sumCommitment += d.primaryCommitmentPercent;
    totalPrayersCompleted += d.prayersCompletedCount;
    if (d.isMorningAzkarDone) totalMorningAzkarCount++;
    if (d.isEveningAzkarDone) totalEveningAzkarCount++;
    totalQuranPagesRead += d.quran.pagesRead;
    totalTasbeehTaps += d.tasbeehCount;
  }

  const avgCommitmentPercent = Math.round(sumCommitment / days.length);

  return {
    days,
    avgCommitmentPercent,
    totalPrayersCompleted,
    totalMorningAzkarCount,
    totalEveningAzkarCount,
    totalQuranPagesRead,
    totalTasbeehTaps,
  };
}

/**
 * Pure calculation function for overall consistency metrics
 */
export function calcWorshipConsistencyStats(
  azkarStreak: number,
  weeklyMatrix: WorshipWeeklyMatrix
): WorshipConsistencyStats {
  const maxPrayers = weeklyMatrix.days.length * 5;
  const weeklyPrayerRate = maxPrayers > 0
    ? Math.round((weeklyMatrix.totalPrayersCompleted / maxPrayers) * 100)
    : 0;

  return {
    azkarStreak,
    weeklyPrayerRate,
    weeklyQuranTotalPages: weeklyMatrix.totalQuranPagesRead,
    weeklyTasbeehTotal: weeklyMatrix.totalTasbeehTaps,
  };
}
