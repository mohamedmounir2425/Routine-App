import { db } from '../../db/database';
import { 
  GlobalProgressSnapshot, 
  SpaceProgress, 
  WeeklyDayProgress, 
  WeeklyProgressMatrix 
} from './progressTypes';
import { 
  TodayPreferences, 
  DEFAULT_TODAY_PREFERENCES 
} from '../../types';
import { 
  getLocalDateString, 
  getTodayDayOfWeek, 
  parseLocalDate 
} from '../../utils/dateUtils';
import { aggregateTodayFeed } from '../today/todayAggregator';
import { getPlans, calculatePlanProgress } from '../../db/goalPlanQueries';
import { 
  getDailyPrayersState, 
  getQuranDailyStatus 
} from '../../db/worshipQueries';
import { getTodayTasbeehCount } from '../worship/tasbeeh/tasbeehQueries';
import { calcWorshipDailyProgress } from '../worship/progress/worshipProgressCalc';
import { getFocusHistory } from '../work/focus/focusService';

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

/**
 * Generate a complete, derived Global Progress Snapshot for any given date.
 * Does NOT persist anything in Dexie.
 */
export async function getGlobalProgressSnapshot(
  targetDateStr?: string,
  preferences: TodayPreferences = DEFAULT_TODAY_PREFERENCES
): Promise<GlobalProgressSnapshot> {
  const dateStr = targetDateStr || getLocalDateString();
  const parsedDate = parseLocalDate(dateStr);
  const dayOfWeek = getTodayDayOfWeek(parsedDate);

  // 1. Run Today Aggregator for deterministic daily due items
  // Ensure nextActionsOnly is false so all due items for Home are counted
  const progressFeedPreferences: TodayPreferences = {
    ...preferences,
    homeOptions: {
      ...preferences.homeOptions,
      nextActionsOnly: false,
    },
  };

  const todayFeed = await aggregateTodayFeed({
    customDateStr: dateStr,
    preferences: progressFeedPreferences,
  });

  // 2. Derive Worship Progress
  const prayers = getDailyPrayersState(dateStr);
  const azkarLogs = await db.azkarLogs.toArray();
  const dayAzkar = azkarLogs.filter((l) => l.date === dateStr && l.isFullyCompleted);
  const isMorningDone = dayAzkar.some((l) => l.categoryKey === 'morning');
  const isEveningDone = dayAzkar.some((l) => l.categoryKey === 'evening');
  const quran = getQuranDailyStatus(dateStr);
  const tasbeehCount = dateStr === getLocalDateString() ? getTodayTasbeehCount() : 0;

  const worshipMetrics = calcWorshipDailyProgress(
    dateStr,
    prayers,
    isMorningDone,
    isEveningDone,
    quran,
    tasbeehCount
  );

  let prayersCompleted = 0;
  ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((p) => {
    if (prayers[p]?.fard) prayersCompleted++;
  });

  const worshipProgress: SpaceProgress = {
    score: worshipMetrics.primaryCommitmentPercent,
    completedCount: prayersCompleted + (isMorningDone ? 1 : 0) + (isEveningDone ? 1 : 0),
    totalCount: 7, // 5 prayers + morning + evening
    label: 'العبادات والروحانيات',
    details: {
      prayersCompleted,
      prayersTotal: 5,
      isMorningDone,
      isEveningDone,
      quranPages: quran.pagesRead,
      tasbeehCount,
    },
  };

  // 3. Derive Health Progress (scheduled & due workouts for today)
  const scheduledWorkouts = await db.workoutSchedules
    .where('dayOfWeek')
    .equals(dayOfWeek)
    .toArray();
  const activeSchedules = scheduledWorkouts.filter((s) => s.isEnabled !== false);

  const workoutLogs = await db.workoutLogs.toArray();
  const logsForDate = workoutLogs.filter(
    (l) => l.completedAt && l.completedAt.startsWith(dateStr)
  );

  let healthScore = 100;
  let healthCompleted = 0;
  let healthTotal = activeSchedules.length;

  if (activeSchedules.length > 0) {
    for (const sched of activeSchedules) {
      if (logsForDate.some((l) => l.routineId === sched.routineId)) {
        healthCompleted++;
      }
    }
    healthScore = Math.min(100, Math.round((healthCompleted / activeSchedules.length) * 100));
  } else if (logsForDate.length > 0) {
    // Rest day with bonus workout
    healthCompleted = logsForDate.length;
    healthTotal = logsForDate.length;
    healthScore = 100;
  } else {
    // Scheduled rest day completed
    healthCompleted = 0;
    healthTotal = 0;
    healthScore = 100;
  }

  const healthProgress: SpaceProgress = {
    score: healthScore,
    completedCount: healthCompleted,
    totalCount: healthTotal,
    label: 'الصحة والتمارين',
    details: {
      scheduledCount: activeSchedules.length,
      logsCount: logsForDate.length,
      isRestDay: activeSchedules.length === 0,
      totalMinutes: logsForDate.reduce((sum, l) => sum + (l.durationMinutes || 0), 0),
    },
  };

  // 4. Derive Work Progress (due today items only)
  const workStats = todayFeed.spaceBreakdown.work;
  const workTotal = workStats.total;
  const workCompleted = workStats.completed;
  const workScore = workTotal > 0 ? Math.min(100, Math.round((workCompleted / workTotal) * 100)) : 100;

  const focusHistory = getFocusHistory();
  const todayFocusMinutes = focusHistory
    .filter((s) => s.date && s.date.startsWith(dateStr))
    .reduce((sum, s) => sum + (s.minutes || 0), 0);

  const workProgress: SpaceProgress = {
    score: workScore,
    completedCount: workCompleted,
    totalCount: workTotal,
    label: 'العمل والإنتاجية',
    details: {
      dueItemsCount: workTotal,
      completedItemsCount: workCompleted,
      focusMinutes: todayFocusMinutes,
    },
  };

  // 5. Derive Home Progress (due today items only)
  const homeStats = todayFeed.spaceBreakdown.home;
  const homeTotal = homeStats.total;
  const homeCompleted = homeStats.completed;
  const homeScore = homeTotal > 0 ? Math.min(100, Math.round((homeCompleted / homeTotal) * 100)) : 100;

  const homeProgress: SpaceProgress = {
    score: homeScore,
    completedCount: homeCompleted,
    totalCount: homeTotal,
    label: 'المنزل والأسرة',
    details: {
      dueItemsCount: homeTotal,
      completedItemsCount: homeCompleted,
    },
  };

  // 6. Overall Daily Execution Score:
  // Base weights: Worship (30%), Health (25%), Work (25%), Home (20%)
  // Normalized dynamically based on preferences.
  // Plans are strictly EXCLUDED from this daily score.
  const spaceWeights = {
    worship: { weight: 0.30, enabled: preferences.showWorship !== false, score: worshipProgress.score },
    health: { weight: 0.25, enabled: preferences.showHealth !== false, score: healthProgress.score },
    work: { weight: 0.25, enabled: preferences.showWork !== false, score: workProgress.score },
    home: { weight: 0.20, enabled: preferences.showHome !== false, score: homeProgress.score },
  };

  const activeWeightTotal = Object.values(spaceWeights)
    .filter((s) => s.enabled)
    .reduce((sum, s) => sum + s.weight, 0);

  let overallScore = 0;
  if (activeWeightTotal > 0) {
    const totalWeightedScore = Object.values(spaceWeights)
      .filter((s) => s.enabled)
      .reduce((sum, s) => sum + s.score * (s.weight / activeWeightTotal), 0);
    overallScore = Math.min(100, Math.max(0, Math.round(totalWeightedScore)));
  }

  // 7. Derive Plans Progress (strategic context, read-only)
  const allPlans = await getPlans();
  const activePlans = allPlans.filter((p) => p.status === 'active');
  const allMilestones = await db.planMilestones.toArray();
  const completedMilestones = allMilestones.filter((m) => m.isCompleted).length;

  let planProgressSum = 0;
  for (const plan of activePlans) {
    const score = await calculatePlanProgress(plan.id);
    planProgressSum += score;
  }
  const averageProgress = activePlans.length > 0 
    ? Math.round(planProgressSum / activePlans.length) 
    : 0;

  // 8. Today performance metrics
  const remainingItems = todayFeed.totalCount - todayFeed.completedCount;
  const overdueSection = todayFeed.sections.find((s) => s.id === 'overdue');
  const overdueItems = overdueSection?.items.length || 0;

  return {
    date: dateStr,
    overallScore,
    spaces: {
      worship: worshipProgress,
      health: healthProgress,
      work: workProgress,
      home: homeProgress,
    },
    plans: {
      activePlans: activePlans.length,
      averageProgress,
      completedMilestones,
      totalMilestones: allMilestones.length,
    },
    today: {
      totalItems: todayFeed.totalCount,
      completedItems: todayFeed.completedCount,
      completionRate: todayFeed.completionRate,
      remainingItems: Math.max(0, remainingItems),
      overdueItems,
    },
  };
}

/**
 * Trailing 7-day consistency and trends calculation.
 * Derives daily performance across the trailing 7 days without creating historical snapshot tables.
 */
export async function getWeeklyProgress(
  anchorDateStr?: string,
  preferences: TodayPreferences = DEFAULT_TODAY_PREFERENCES
): Promise<WeeklyProgressMatrix> {
  const endDateStr = anchorDateStr || getLocalDateString();
  const days: WeeklyDayProgress[] = [];

  const focusHistory = getFocusHistory();
  const workoutLogs = await db.workoutLogs.toArray();
  const allTasks = await db.tasks.toArray();

  for (let i = 6; i >= 0; i--) {
    const d = parseLocalDate(endDateStr);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNameAr = ARABIC_DAYS[d.getDay()] || '';

    // Snapshot for this day
    const snapshot = await getGlobalProgressSnapshot(dateStr, preferences);

    // Workout count on date
    const dayWorkouts = workoutLogs.filter(
      (l) => l.completedAt && l.completedAt.startsWith(dateStr)
    ).length;

    // Completed tasks count on date
    const dayTasks = allTasks.filter((t) => {
      if (!t.isCompleted) return false;
      if (t.isRecurring) {
        return Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(dateStr);
      }
      return t.completedAt && t.completedAt.startsWith(dateStr);
    }).length;

    // Focus minutes on date
    const dayFocus = focusHistory
      .filter((s) => s.date && s.date.startsWith(dateStr))
      .reduce((sum, s) => sum + (s.minutes || 0), 0);

    days.push({
      date: dateStr,
      dayNameAr,
      overallScore: snapshot.overallScore,
      worshipScore: snapshot.spaces.worship.score,
      workoutsCount: dayWorkouts,
      completedTasksCount: dayTasks,
      focusMinutes: dayFocus,
    });
  }

  const averageScore = Math.round(
    days.reduce((sum, d) => sum + d.overallScore, 0) / days.length
  );

  let bestDay: WeeklyDayProgress | null = null;
  let maxScore = -1;
  for (const day of days) {
    if (day.overallScore > maxScore) {
      maxScore = day.overallScore;
      bestDay = day;
    }
  }

  const totalWorkouts = days.reduce((sum, d) => sum + d.workoutsCount, 0);
  const totalTasksCompleted = days.reduce((sum, d) => sum + d.completedTasksCount, 0);
  const totalFocusMinutes = days.reduce((sum, d) => sum + d.focusMinutes, 0);

  return {
    days,
    averageScore,
    bestDay,
    totalWorkouts,
    totalTasksCompleted,
    totalFocusMinutes,
  };
}
