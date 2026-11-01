import { db } from '../../db/database';
import { getTaskTimeTag } from './todayScheduling';
import { 
  TodayItem, 
  TodayAggregationResult, 
  TodaySection, 
  TodaySectionId,
  TodayItemStatus,
  TodayItemTimeTag,
  TodayItemType,
  ActivePlanSummary
} from './todayTypes';
import { 
  LifeSpaceId, 
  TodayPreferences, 
  DEFAULT_TODAY_PREFERENCES,
  TaskPriority
} from '../../types';
import { getLocalDateString, getTodayDayOfWeek, isPastDate, parseLocalDate } from '../../utils/dateUtils';
import { calculatePlanProgress, getPlanMilestones } from '../../db/goalPlanQueries';
import { getActiveProjects } from '../../db/projectQueries';
import { getSchedulesForDay } from '../../db/workoutScheduleQueries';
import { getTodayPlanStatus } from '../../db/planQueries';
import { 
  calculatePrayerTimes, 
  getSavedLocation, 
  getNextPrayerInfo, 
  PrayerTimesResult 
} from '../worship/prayers/prayerTimesEngine';
import { 
  isAzkarCategoryCompletedToday, 
  getDailyPrayersState, 
  getQuranDailyStatus 
} from '../../db/worshipQueries';

/**
 * Helper to convert "HH:mm" time string into total minutes from midnight (0..1439).
 */
function parseHHmmToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Deterministic sorting rank:
 * 1. NOW            -> 10,000 + minutes
 * 2. OVERDUE        -> 20,000 + minutes
 * 3. SCHEDULED      -> 30,000 + minutes (Chronological by scheduledTime)
 * 4. HIGH PRIORITY  -> 40,000
 * 5. FLEXIBLE       -> 50,000
 * 6. PLAN ACTIONS   -> 60,000
 * 7. COMPLETED      -> 90,000 + minutes
 */
function computeTodaySortKey(
  timeTag: TodayItemTimeTag,
  isCompleted: boolean,
  priority?: TaskPriority,
  itemType?: TodayItemType,
  scheduledTime?: string
): number {
  const minutes = parseHHmmToMinutes(scheduledTime);

  if (isCompleted) {
    return 90000 + minutes;
  }

  if (timeTag === 'now') {
    return 10000 + minutes;
  }

  if (timeTag === 'overdue') {
    return 20000 + minutes;
  }

  if (timeTag === 'scheduled' || (scheduledTime && timeTag !== 'flexible')) {
    return 30000 + minutes;
  }

  if (priority === 'high') {
    return 40000;
  }

  if (itemType === 'plan_action') {
    return 60000;
  }

  return 50000;
}

/**
 * Helper to derive semantic TodayItemStatus from isCompleted and timeTag.
 */
function deriveItemStatus(isCompleted: boolean, timeTag: TodayItemTimeTag): TodayItemStatus {
  if (isCompleted) return 'completed';
  if (timeTag === 'now') return 'now';
  if (timeTag === 'overdue') return 'overdue';
  return 'pending';
}

/**
 * Pure/read aggregation engine that aggregates all life spaces into a normalized TodayItem feed.
 * Does NOT mutate database records and does NOT create a Dexie today table.
 */
export async function aggregateTodayFeed(
  options?: {
    customDateStr?: string;
    preferences?: TodayPreferences;
  }
): Promise<TodayAggregationResult> {
  const targetDateStr = options?.customDateStr || getLocalDateString();
  const prefs = options?.preferences || DEFAULT_TODAY_PREFERENCES;
  const isTargetToday = targetDateStr === getLocalDateString();

  const rawItems: TodayItem[] = [];

  // ==========================================
  // 1. WORSHIP SPACE AGGREGATION
  // ==========================================
  if (prefs.showWorship) {
    const loc = getSavedLocation();
    const targetDate = options?.customDateStr ? parseLocalDate(options.customDateStr) : new Date();
    const prayerTimes: PrayerTimesResult = calculatePrayerTimes(loc.coords, targetDate, loc.city.method);
    const nextPrayerInfo = getNextPrayerInfo(loc.coords, loc.city.method);

    // Read prayer completion states for target date from unified domain query
    const prayerState = getDailyPrayersState(targetDateStr);

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const formatTimeToHHmm = (d: Date) => {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const prayerDefinitions = [
      { id: 'fajr', name: 'صلاة الفجر', time: prayerTimes.fajr },
      { id: 'dhuhr', name: 'صلاة الظهر', time: prayerTimes.dhuhr },
      { id: 'asr', name: 'صلاة العصر', time: prayerTimes.asr },
      { id: 'maghrib', name: 'صلاة المغرب', time: prayerTimes.maghrib },
      { id: 'isha', name: 'صلاة العشاء', time: prayerTimes.isha },
    ];

    // A. Daily Prayers
    if (prefs.worshipOptions?.prayers !== false) {
      for (let i = 0; i < prayerDefinitions.length; i++) {
        const p = prayerDefinitions[i];
        const nextP = prayerDefinitions[i + 1];
        const pTimeStr = formatTimeToHHmm(p.time);
        const pMinutes = p.time.getHours() * 60 + p.time.getMinutes();
        const nextMinutes = nextP ? nextP.time.getHours() * 60 + nextP.time.getMinutes() : 24 * 60;
        const isFardDone = prayerState[p.id]?.fard === true;

        let timeTag: TodayItemTimeTag = 'scheduled';
        if (isFardDone) {
          timeTag = 'completed';
        } else if (isTargetToday) {
          if (nowMinutes >= pMinutes && nowMinutes < nextMinutes) {
            // Currently within this prayer's active window
            timeTag = 'now';
          } else if (nextPrayerInfo.id === p.id && !nextPrayerInfo.isTomorrow && nextPrayerInfo.diffMinutes <= 20) {
            // Approaching within 20 mins
            timeTag = 'now';
          } else if (nowMinutes >= nextMinutes) {
            // Window has passed and not prayed
            timeTag = 'overdue';
          } else {
            timeTag = 'scheduled';
          }
        } else if (isPastDate(targetDateStr)) {
          timeTag = 'overdue';
        }

        const status = deriveItemStatus(isFardDone, timeTag);
        const sortKey = computeTodaySortKey(timeTag, isFardDone, 'high', 'prayer', pTimeStr);

        rawItems.push({
          id: `prayer_${p.id}_${targetDateStr}`,
          sourceId: p.id,
          type: 'prayer',
          space: 'worship',
          title: p.name,
          subtitle: isFardDone ? 'تمت الصلاة بفضل الله ✓' : 'فرض الوقت',
          scheduledTime: pTimeStr,
          estimatedMinutes: 10,
          priority: 'high',
          timeTag,
          status,
          isCompleted: isFardDone,
          actionType: 'log_prayer',
          actionPayload: { prayerId: p.id, targetDateStr },
          sortKey,
        });
      }
    }

    // B. Morning and Evening Azkar
    if (prefs.worshipOptions?.azkar !== false) {
      const isMorningDone = await isAzkarCategoryCompletedToday('morning', targetDateStr);
      const isEveningDone = await isAzkarCategoryCompletedToday('evening', targetDateStr);

      const asrMinutes = prayerTimes.asr.getHours() * 60 + prayerTimes.asr.getMinutes();
      const ishaMinutes = prayerTimes.isha.getHours() * 60 + prayerTimes.isha.getMinutes();

      // Morning Azkar
      let morningTag: TodayItemTimeTag = 'scheduled';
      if (isMorningDone) {
        morningTag = 'completed';
      } else if (isTargetToday) {
        if (nowMinutes >= 5 * 60 && nowMinutes <= 11 * 60 + 30) {
          morningTag = 'now';
        } else if (nowMinutes > 11 * 60 + 30) {
          morningTag = 'overdue';
        } else {
          morningTag = 'scheduled';
        }
      } else if (isPastDate(targetDateStr)) {
        morningTag = 'overdue';
      }

      const morningStatus = deriveItemStatus(isMorningDone, morningTag);
      const morningSortKey = computeTodaySortKey(morningTag, isMorningDone, 'high', 'dhikr', '06:30');

      rawItems.push({
        id: `azkar_morning_${targetDateStr}`,
        sourceId: 'morning',
        type: 'dhikr',
        space: 'worship',
        title: 'أذكار الصباح',
        subtitle: isMorningDone ? 'تم إتمام أذكار الصباح ✓' : 'حصن يومك وبركة نهارك',
        scheduledTime: '06:30',
        estimatedMinutes: 12,
        priority: 'high',
        timeTag: morningTag,
        status: morningStatus,
        isCompleted: isMorningDone,
        actionType: 'open_azkar',
        actionPayload: { categoryKey: 'morning' },
        sortKey: morningSortKey,
      });

      // Evening Azkar (Scheduled after Asr)
      const eveningTimeStr = formatTimeToHHmm(prayerTimes.asr);
      let eveningTag: TodayItemTimeTag = 'scheduled';
      if (isEveningDone) {
        eveningTag = 'completed';
      } else if (isTargetToday) {
        if (nowMinutes >= asrMinutes && nowMinutes <= ishaMinutes + 60) {
          eveningTag = 'now';
        } else if (nowMinutes > ishaMinutes + 60) {
          eveningTag = 'overdue';
        } else {
          eveningTag = 'scheduled';
        }
      } else if (isPastDate(targetDateStr)) {
        eveningTag = 'overdue';
      }

      const eveningStatus = deriveItemStatus(isEveningDone, eveningTag);
      const eveningSortKey = computeTodaySortKey(eveningTag, isEveningDone, 'high', 'dhikr', eveningTimeStr);

      rawItems.push({
        id: `azkar_evening_${targetDateStr}`,
        sourceId: 'evening',
        type: 'dhikr',
        space: 'worship',
        title: 'أذكار المساء',
        subtitle: isEveningDone ? 'تم إتمام أذكار المساء ✓' : 'بعد صلاة العصر - حفظ وسكينة',
        scheduledTime: eveningTimeStr,
        estimatedMinutes: 12,
        priority: 'high',
        timeTag: eveningTag,
        status: eveningStatus,
        isCompleted: isEveningDone,
        actionType: 'open_azkar',
        actionPayload: { categoryKey: 'evening' },
        sortKey: eveningSortKey,
      });
    }

    // C. Quran Daily Target
    if (prefs.worshipOptions?.quran !== false) {
      const quran = getQuranDailyStatus(targetDateStr);

      const quranTag: TodayItemTimeTag = quran.isCompleted ? 'completed' : 'flexible';
      const quranStatus = deriveItemStatus(quran.isCompleted, quranTag);
      const quranSortKey = computeTodaySortKey(quranTag, quran.isCompleted, 'medium', 'quran');

      rawItems.push({
        id: `quran_daily_${targetDateStr}`,
        sourceId: 'daily_wird',
        type: 'quran',
        space: 'worship',
        title: 'ورد القرآن الكريم اليومي',
        subtitle: quran.isCompleted 
          ? `تم إتمام الورد (${quran.pagesRead}/${quran.targetPages} صفحة) ✓` 
          : `الهدف اليومي: ${quran.targetPages} صفحات (قرأت ${quran.pagesRead}) · الفاصل: ${quran.bookmarkSurah} ص ${quran.bookmarkPage}`,
        categoryLabel: `${quran.bookmarkSurah} · ص ${quran.bookmarkPage}`,
        estimatedMinutes: 15,
        priority: 'medium',
        timeTag: quranTag,
        status: quranStatus,
        isCompleted: quran.isCompleted,
        actionType: 'open_quran',
        actionPayload: { 
          pagesRead: quran.pagesRead, 
          targetPages: quran.targetPages,
          bookmarkSurah: quran.bookmarkSurah,
          bookmarkPage: quran.bookmarkPage 
        },
        sortKey: quranSortKey,
      });
    }

    // D. Worship Activities (LifeTask with spaceId === 'worship')
    const worshipTasks = await db.tasks.where('spaceId').equals('worship').toArray();
    const relevantWorshipTasks = worshipTasks.filter((t) => {
      if (t.isRecurring) return true;
      if (!t.dueDate) return true;
      return t.dueDate === targetDateStr || isPastDate(t.dueDate);
    });

    for (const t of relevantWorshipTasks) {
      const isDoneToday = t.isRecurring
        ? Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(targetDateStr)
        : t.isCompleted;

      let timeTag: TodayItemTimeTag = 'flexible';
      if (isDoneToday) {
        timeTag = 'completed';
      } else if (t.scheduledTime) {
        const scheduledMinutes = parseHHmmToMinutes(t.scheduledTime);
        if (isTargetToday) {
          if (nowMinutes >= scheduledMinutes - 10 && nowMinutes <= scheduledMinutes + 30) {
            timeTag = 'now';
          } else if (nowMinutes > scheduledMinutes + 30) {
            timeTag = 'overdue';
          } else {
            timeTag = 'scheduled';
          }
        } else if (isPastDate(targetDateStr)) {
          timeTag = 'overdue';
        } else {
          timeTag = 'scheduled';
        }
      } else if (t.dueDate && isPastDate(t.dueDate)) {
        timeTag = 'overdue';
      }

      const status = deriveItemStatus(isDoneToday, timeTag);
      const sortKey = computeTodaySortKey(timeTag, isDoneToday, t.priority, 'dhikr', t.scheduledTime);

      rawItems.push({
        id: `task_worship_${t.id}_${targetDateStr}`,
        sourceId: t.id,
        type: 'worship_task',
        space: 'worship',
        title: t.title,
        subtitle: t.description || 'نشاط عبادي',
        scheduledTime: t.scheduledTime,
        estimatedMinutes: t.estimatedMinutes,
        priority: t.priority,
        timeTag,
        status,
        isCompleted: isDoneToday,
        actionType: 'toggle_task',
        actionPayload: { taskId: t.id, targetDateStr },
        sortKey,
      });
    }
  }

  // ==========================================
  // 2. HEALTH SPACE AGGREGATION
  // ==========================================
  if (prefs.showHealth) {
    const targetDate = options?.customDateStr ? parseLocalDate(options.customDateStr) : new Date();
    const targetDayOfWeek = getTodayDayOfWeek(targetDate);

    // Check workout completion logs
    const allWorkoutLogs = await db.workoutLogs.toArray();
    const todayLogs = allWorkoutLogs.filter((l) => {
      if (!l.completedAt) return false;
      const logDate = getLocalDateString(new Date(l.completedAt));
      return logDate === targetDateStr;
    });

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // 1. Check modern multi-workout scheduler entries first
    const customSchedules = await getSchedulesForDay(targetDayOfWeek);
    const totalCustomConfigured = await db.workoutSchedules.count();

    if (customSchedules.length > 0) {
      for (const entry of customSchedules) {
        const routine = await db.routines.get(entry.routineId);
        const isDone = todayLogs.some((l) => l.routineId === entry.routineId);

        const scheduledTime = entry.scheduledTime || '18:00';
        const [hours, mins] = scheduledTime.split(':').map(Number);
        const scheduledMinutes = (hours || 0) * 60 + (mins || 0);

        let timeTag: TodayItemTimeTag = 'scheduled';
        if (isDone) {
          timeTag = 'completed';
        } else if (isTargetToday) {
          if (nowMinutes >= scheduledMinutes - 15 && nowMinutes <= scheduledMinutes + 60) {
            timeTag = 'now';
          } else if (nowMinutes > scheduledMinutes + 60) {
            timeTag = 'overdue';
          } else {
            timeTag = 'scheduled';
          }
        } else if (isPastDate(targetDateStr)) {
          timeTag = 'overdue';
        }

        const status = deriveItemStatus(isDone, timeTag);
        const sortKey = computeTodaySortKey(timeTag, isDone, 'high', 'workout', scheduledTime);

        rawItems.push({
          id: `workout_ws_${entry.id}_${targetDateStr}`,
          sourceId: entry.routineId,
          type: 'workout',
          space: 'health',
          title: entry.sessionLabel || routine?.name || 'تمرين اليوم لصحة الظهر',
          subtitle: `${routine?.totalEstimatedMinutes || entry.durationMinutes || 15} دقيقة · ${routine?.exerciseIds?.length || 5} تمارين`,
          scheduledTime,
          estimatedMinutes: routine?.totalEstimatedMinutes || entry.durationMinutes || 15,
          priority: 'high',
          timeTag,
          status,
          isCompleted: isDone,
          actionType: 'start_workout',
          actionPayload: { routineId: entry.routineId, routine },
          sortKey,
        });
      }
    } else if (totalCustomConfigured === 0) {
      // 2. Fallback to existing 4-week weeklySchedule plan when no custom schedules exist
      const planStatus = await getTodayPlanStatus();

      if (planStatus.isWorkoutDay && planStatus.routine) {
        const isDone = todayLogs.some((l) => l.routineId === planStatus.routine?.id);
        const scheduledTime = '18:00'; // Default optimal spine decompression time
        const scheduledMinutes = 18 * 60;

        let timeTag: TodayItemTimeTag = 'scheduled';
        if (isDone) {
          timeTag = 'completed';
        } else if (isTargetToday) {
          if (nowMinutes >= scheduledMinutes - 15 && nowMinutes <= scheduledMinutes + 60) {
            timeTag = 'now';
          } else if (nowMinutes > scheduledMinutes + 60) {
            timeTag = 'overdue';
          } else {
            timeTag = 'scheduled';
          }
        } else if (isPastDate(targetDateStr)) {
          timeTag = 'overdue';
        }

        const status = deriveItemStatus(isDone, timeTag);
        const sortKey = computeTodaySortKey(timeTag, isDone, 'high', 'workout', scheduledTime);

        rawItems.push({
          id: `workout_plan_${planStatus.routine.id}_${targetDateStr}`,
          sourceId: planStatus.routine.id,
          type: 'workout',
          space: 'health',
          title: `تمرين اليوم: ${planStatus.sessionTitle || planStatus.routine.name}`,
          subtitle: `الأسبوع ${planStatus.weekNumber} · جلسة ${planStatus.sessionCode || 'A'} · ${planStatus.estimatedMinutes} دقيقة`,
          scheduledTime,
          estimatedMinutes: planStatus.estimatedMinutes,
          priority: 'high',
          timeTag,
          status,
          isCompleted: isDone,
          actionType: 'start_workout',
          actionPayload: { routineId: planStatus.routine.id, routine: planStatus.routine },
          sortKey,
        });
      }
    }
  }

  // ==========================================
  // 3. WORK SPACE AGGREGATION
  // ==========================================
  if (prefs.showWork) {
    const workTasks = await db.tasks.where('spaceId').equals('work').toArray();

    // Filter relevant for target date: recurring, due today, overdue, or unscheduled
    let relevantWorkTasks = workTasks.filter((t) => {
      if (t.isRecurring) return true;
      if (!t.dueDate) return true;
      return t.dueDate === targetDateStr || isPastDate(t.dueDate);
    });

    if (prefs.workOptions?.top3Only) {
      // Sort high priority first and take top 3
      relevantWorkTasks = relevantWorkTasks
        .sort((a, b) => {
          const priorityScore: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
          return (priorityScore[b.priority] || 1) - (priorityScore[a.priority] || 1);
        })
        .slice(0, 3);
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const t of relevantWorkTasks) {
      const isDoneToday = t.isRecurring
        ? Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(targetDateStr)
        : t.isCompleted;

      let timeTag: TodayItemTimeTag = 'flexible';
      if (isDoneToday) {
        timeTag = 'completed';
      } else if (t.scheduledTime) {
        const scheduledMinutes = parseHHmmToMinutes(t.scheduledTime);
        if (isTargetToday) {
          if (nowMinutes >= scheduledMinutes - 10 && nowMinutes <= scheduledMinutes + 30) {
            timeTag = 'now';
          } else if (nowMinutes > scheduledMinutes + 30) {
            timeTag = 'overdue';
          } else {
            timeTag = 'scheduled';
          }
        } else if (isPastDate(targetDateStr)) {
          timeTag = 'overdue';
        } else {
          timeTag = 'scheduled';
        }
      } else if (t.dueDate && isPastDate(t.dueDate)) {
        timeTag = 'overdue';
      }

      const status = deriveItemStatus(isDoneToday, timeTag);
      const sortKey = computeTodaySortKey(timeTag, isDoneToday, t.priority, 'work_task', t.scheduledTime);

      rawItems.push({
        id: `task_work_${t.id}_${targetDateStr}`,
        sourceId: t.id,
        type: 'work_task',
        space: 'work',
        title: t.title,
        subtitle: t.description || 'مهمة عمل يومية',
        scheduledTime: t.scheduledTime,
        estimatedMinutes: t.estimatedMinutes,
        priority: t.priority,
        timeTag,
        status,
        isCompleted: isDoneToday,
        actionType: 'toggle_task',
        actionPayload: { taskId: t.id, targetDateStr },
        sortKey,
      });
    }

    // Work Projects: Surface Next Action only
    const activeWorkProjects = await getActiveProjects('work');
    for (const proj of activeWorkProjects) {
      if (proj.nextActionTitle && proj.nextActionId) {
        const sortKey = computeTodaySortKey('flexible', false, 'high', 'work_task');

        rawItems.push({
          id: `work_proj_${proj.id}_${proj.nextActionId}`,
          sourceId: proj.id,
          type: 'project_action',
          space: 'work',
          title: proj.nextActionTitle,
          subtitle: `مشروع عمل: ${proj.title}`,
          categoryLabel: proj.title,
          priority: 'high',
          timeTag: 'flexible',
          status: 'pending',
          isCompleted: false,
          actionType: 'complete_project_step',
          actionPayload: { projectId: proj.id, stepId: proj.nextActionId },
          sortKey,
        });
      }
    }
  }

  // ==========================================
  // 4. HOME SPACE AGGREGATION
  // ==========================================
  if (prefs.showHome) {
    // A. Active Home Projects (Surfacing Next Action only)
    const activeProjects = await getActiveProjects('home');

    for (const proj of activeProjects) {
      if (proj.nextActionTitle && proj.nextActionId) {
        const sortKey = computeTodaySortKey('flexible', false, 'medium', 'project_action');

        rawItems.push({
          id: `project_${proj.id}_${proj.nextActionId}`,
          sourceId: proj.id,
          type: 'project_action',
          space: 'home',
          title: proj.nextActionTitle,
          subtitle: `مشروع: ${proj.title}`,
          categoryLabel: proj.title,
          priority: 'medium',
          timeTag: 'flexible',
          status: 'pending',
          isCompleted: false,
          actionType: 'complete_project_step',
          actionPayload: { projectId: proj.id, stepId: proj.nextActionId },
          sortKey,
        });
      }
    }

    // B. Home Tasks and Routines
    const showRoutines = prefs.homeOptions?.routines !== false;
    const showNormalHomeTasks = !prefs.homeOptions?.nextActionsOnly;

    if (showRoutines || showNormalHomeTasks) {
      const homeTasks = await db.tasks.where('spaceId').equals('home').toArray();
      const relevantHome = homeTasks.filter((t) => {
        if (t.isRecurring && !showRoutines) return false;
        if (!t.isRecurring && !showNormalHomeTasks) return false;
        if (t.isRecurring) return true;
        if (!t.dueDate) return true;
        return t.dueDate === targetDateStr || isPastDate(t.dueDate);
      });

      for (const t of relevantHome) {
        const isDoneToday = t.isRecurring
          ? Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(targetDateStr)
          : t.isCompleted;

        const timeTag = getTaskTimeTag(t, isDoneToday, targetDateStr);
        const status = deriveItemStatus(isDoneToday, timeTag);
        const sortKey = computeTodaySortKey(timeTag, isDoneToday, t.priority, t.isRecurring ? 'home_routine' : 'home_task', t.scheduledTime);

        rawItems.push({
          id: `task_home_${t.id}_${targetDateStr}`,
          sourceId: t.id,
          type: t.isRecurring ? 'home_routine' : 'home_task',
          space: 'home',
          title: t.title,
          subtitle: t.description || (t.isRecurring ? 'روتين منزلي متكرر' : 'مهمة منزلية'),
          scheduledTime: t.scheduledTime,
          estimatedMinutes: t.estimatedMinutes,
          priority: t.priority,
          timeTag,
          status,
          isCompleted: isDoneToday,
          actionType: 'toggle_task',
          actionPayload: { taskId: t.id, targetDateStr },
          sortKey,
        });
      }
    }
  }

  // ==========================================
  // 5. PLANS SPACE AGGREGATION
  // ==========================================
  const activePlansSummary: ActivePlanSummary[] = [];

  if (prefs.showPlans) {
    const allPlans = await db.plans.toArray();
    const activePlans = allPlans.filter((p) => p.status === 'active');

    for (const plan of activePlans) {
      // A. Generate Active Plans Progress Summaries
      const progress = await calculatePlanProgress(plan.id);
      const milestones = await getPlanMilestones(plan.id);
      const nextMilestone = milestones.find((m) => !m.isCompleted);
      const planTasks = await db.tasks.where('planId').equals(plan.id).toArray();

      if (prefs.plansOptions?.showActiveProgress !== false) {
        activePlansSummary.push({
          id: plan.id,
          title: plan.title,
          category: plan.category,
          progressPercent: progress,
          nextMilestoneTitle: nextMilestone?.title,
          todayActionCount: planTasks.filter((t) => !t.isCompleted).length,
        });
      }

      // B. Surface Today's Action items belonging to this plan
      if (prefs.plansOptions?.showDailyActions !== false) {
        const relevantPlanTasks = planTasks.filter((t) => {
          if (!t.dueDate) return true;
          return t.dueDate === targetDateStr || isPastDate(t.dueDate);
        });

        for (const t of relevantPlanTasks) {
          // Deduplication: if already surfaced by its primary space, enrich with Plan context and do not duplicate
          const alreadySurfacedIndex = rawItems.findIndex((item) => item.sourceId === t.id);
          if (alreadySurfacedIndex !== -1) {
            rawItems[alreadySurfacedIndex] = {
              ...rawItems[alreadySurfacedIndex],
              categoryLabel: plan.title,
              subtitle: rawItems[alreadySurfacedIndex].subtitle
                ? `${rawItems[alreadySurfacedIndex].subtitle} · خطة: ${plan.title}`
                : `خطة: ${plan.title}`,
              actionPayload: {
                ...rawItems[alreadySurfacedIndex].actionPayload,
                planId: plan.id,
                planTitle: plan.title,
              },
            };
            continue;
          }

          const isDoneToday = t.isRecurring ? !!t.recurringCompletionDates?.includes(targetDateStr) : t.isCompleted;
          const timeTag = getTaskTimeTag(t, isDoneToday, targetDateStr);
          const status = deriveItemStatus(isDoneToday, timeTag);
          const sortKey = computeTodaySortKey(timeTag, isDoneToday, t.priority || 'medium', 'plan_action', t.scheduledTime);

          rawItems.push({
            id: `task_plan_${t.id}_${targetDateStr}`,
            sourceId: t.id,
            type: 'plan_action',
            space: 'plans',
            title: t.title,
            subtitle: `خطة: ${plan.title}`,
            categoryLabel: plan.title,
            scheduledTime: t.scheduledTime,
            estimatedMinutes: t.estimatedMinutes || 30,
            priority: t.priority || 'medium',
            timeTag,
            status,
            isCompleted: isDoneToday,
            actionType: 'toggle_task',
            actionPayload: { taskId: t.id, targetDateStr, planId: plan.id, planTitle: plan.title },
            sortKey,
          });
        }
      }
    }
  }

  // ==========================================
  // 6. DETERMINISTIC SORTING & SECTIONING
  // ==========================================
  // Ordering: NOW -> OVERDUE -> SCHEDULED -> HIGH PRIORITY -> FLEXIBLE -> PLAN ACTIONS -> COMPLETED
  // With chronological ordering preserved inside SCHEDULED.
  const sortedItems = [...rawItems].sort((a, b) => a.sortKey - b.sortKey);

  const rawSections: Array<{ id: TodaySectionId; title: string; items: TodayItem[] }> = [
    {
      id: 'now',
      title: '⚡ الآن ومتاح للتنفيذ',
      items: sortedItems.filter((i) => i.timeTag === 'now' && !i.isCompleted),
    },
    {
      id: 'overdue',
      title: '⚠️ فات موعدها اليوم',
      items: sortedItems.filter((i) => i.timeTag === 'overdue' && !i.isCompleted),
    },
    {
      id: 'scheduled',
      title: '⏰ الجدول الزمني لليوم',
      items: sortedItems.filter((i) => i.timeTag === 'scheduled' && !i.isCompleted),
    },
    {
      id: 'high_priority',
      title: '🔥 أولويات قصوى اليوم',
      items: sortedItems.filter(
        (i) =>
          !i.isCompleted &&
          i.priority === 'high' &&
          i.timeTag !== 'now' &&
          i.timeTag !== 'overdue' &&
          i.timeTag !== 'scheduled'
      ),
    },
    {
      id: 'next_actions',
      title: '➡️ الخطوات التالية للمشاريع',
      items: sortedItems.filter(
        (i) => !i.isCompleted && i.type === 'project_action' && i.priority !== 'high' && i.timeTag === 'flexible'
      ),
    },
    {
      id: 'tasks',
      title: '📋 مهام وروتين اليوم',
      items: sortedItems.filter(
        (i) =>
          !i.isCompleted &&
          i.type !== 'project_action' && i.type !== 'plan_action' &&
          i.priority !== 'high' &&
          i.timeTag === 'flexible'
      ),
    },
    {
      id: 'plans',
      title: '🎯 خطوات الخطط الاستراتيجية',
      items: sortedItems.filter(
        (i) => !i.isCompleted && i.type === 'plan_action' && i.priority !== 'high' && i.timeTag === 'flexible'
      ),
    },
    {
      id: 'completed',
      title: '✅ المكتمل اليوم',
      items: sortedItems.filter((i) => i.isCompleted),
    },
  ];

  const sections: TodaySection[] = rawSections
    .filter((s) => s.items.length > 0)
    .map((s) => ({
      ...s,
      badgeCount: s.items.length,
    }));

  // Compute Next Up
  const nextUp =
    sections.find((s) => s.id === 'now')?.items[0] ||
    sections.find((s) => s.id === 'overdue')?.items[0] ||
    sections.find((s) => s.id === 'scheduled')?.items[0] ||
    sections.find((s) => s.id === 'high_priority')?.items[0] ||
    sortedItems.find((i) => !i.isCompleted) ||
    null;

  // Compute stats
  const totalCount = sortedItems.length;
  const completedCount = sortedItems.filter((i) => i.isCompleted).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const spaceBreakdown: Record<LifeSpaceId, { total: number; completed: number }> = {
    worship: { total: 0, completed: 0 },
    health: { total: 0, completed: 0 },
    work: { total: 0, completed: 0 },
    home: { total: 0, completed: 0 },
    plans: { total: 0, completed: 0 },
  };

  for (const item of sortedItems) {
    if (spaceBreakdown[item.space]) {
      spaceBreakdown[item.space].total++;
      if (item.isCompleted) spaceBreakdown[item.space].completed++;
    }
  }

  return {
    dateStr: targetDateStr,
    items: sortedItems,
    sections,
    nextUp,
    totalCount,
    completedCount,
    completionRate,
    spaceBreakdown,
    activePlansSummary,
  };
}
