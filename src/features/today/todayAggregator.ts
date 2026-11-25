import { db } from '../../db/database';
import { getTaskTimeTag } from './todayScheduling';
import { isSpaceTaskDue } from './spaceTaskService';
import { getEnabledSpaceConfigs } from '../../config/spacesConfig';
import {
  TodayItem,
  TodayAggregationResult,
  TodaySection,
  TodaySectionId,
  TodayItemStatus,
  TodayItemTimeTag,
  TodayItemType,
  ActivePlanSummary,
} from './todayTypes';
import {
  LifeSpaceId,
  TodayPreferences,
  DEFAULT_TODAY_PREFERENCES,
  TaskPriority,
  LifeTask,
  DayPlanSelectedItem,
} from '../../types';
import { getLocalDateString, isPastDate, parseLocalDate } from '../../utils/dateUtils';
import { calculatePlanProgress, getPlanMilestones } from '../../db/goalPlanQueries';
import { getActiveProjects } from '../../db/projectQueries';
import { getWorkoutOccurrences, isWorkoutAvailable, healthRows, routineForSession } from '../health/public';
import {
  getDayPlan,
  buildTaskRefKey,
  buildProjectStepRefKey,
  buildRoutineOccurrenceRefKey,
} from '../../db/dayPlanQueries';
import { isShoppingTask } from '../home/public';
import {
  calculatePrayerTimes,
  getSavedLocation,
  getNextPrayerInfo,
  PrayerTimesResult,
} from '../worship/public';
import {
  isAzkarCategoryCompletedToday,
  getDailyPrayersState,
  getQuranDailyStatus,
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
 * 4. SELECTED       -> 35,000 + position
 * 5. HIGH PRIORITY  -> 40,000
 * 6. FLEXIBLE       -> 50,000
 * 7. PLAN ACTIONS   -> 60,000
 * 8. COMPLETED      -> 90,000 + minutes
 */
function computeTodaySortKey(
  timeTag: TodayItemTimeTag,
  isCompleted: boolean,
  priority?: TaskPriority,
  itemType?: TodayItemType,
  scheduledTime?: string,
  selectionPosition?: number
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

  if (selectionPosition !== undefined) {
    return 35000 + selectionPosition;
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

function hasHardDeadlineDueOrOverdue(task: LifeTask, targetDateStr: string): boolean {
  if (!task.deadlineAt) return false;
  const parsed = new Date(task.deadlineAt);
  if (!Number.isFinite(parsed.getTime())) return false;
  return getLocalDateString(parsed) <= targetDateStr;
}

function isWaitingFollowUpDue(task: LifeTask, targetDateStr: string): boolean {
  return (
    task.status === 'WAITING' &&
    Boolean(task.waitingContext?.followUpDate && task.waitingContext.followUpDate <= targetDateStr)
  );
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
  const requested = options?.preferences || DEFAULT_TODAY_PREFERENCES;
  const settings = await db.settings.get('current_settings');
  const enabled = new Set(getEnabledSpaceConfigs(settings?.enabledSpaces).map((space) => space.id));
  const prefs = {
    ...requested,
    showWorship: requested.showWorship && enabled.has('worship'),
    showHealth: requested.showHealth && enabled.has('health'),
    showWork: requested.showWork && enabled.has('work'),
    showHome: requested.showHome && enabled.has('home'),
    showPlans: requested.showPlans && enabled.has('plans'),
  };
  const isTargetToday = targetDateStr === getLocalDateString();

  const dayPlan = await getDayPlan(targetDateStr);
  const selectedItems = dayPlan?.selectedItems || [];
  const selectedByRefKey = new Map<string, DayPlanSelectedItem>(selectedItems.map((item) => [item.refKey, item]));
  const selectedTaskMap = new Map<string, DayPlanSelectedItem>();
  const selectedStepsByProject = new Map<string, Array<Extract<DayPlanSelectedItem, { sourceType: 'project_step' }>>>();

  for (const item of selectedItems) {
    if (item.sourceType === 'task' || item.sourceType === 'routine_occurrence') {
      selectedTaskMap.set(item.taskId, item);
    } else if (item.sourceType === 'project_step') {
      const list = selectedStepsByProject.get(item.projectId) || [];
      list.push(item);
      selectedStepsByProject.set(item.projectId, list);
    }
  }

  const isTaskEligibleForAutoToday = (task: LifeTask): boolean => {
    if (selectedTaskMap.has(task.id)) return true;
    if (hasHardDeadlineDueOrOverdue(task, targetDateStr)) return true;
    if (isShoppingTask(task)) return false;
    if (task.isSomeday === true) return false;
    if (task.availableFrom && task.availableFrom > targetDateStr) return false;
    if (task.status === 'WAITING') {
      return isWaitingFollowUpDue(task, targetDateStr);
    }
    if (!isSpaceTaskDue(task, targetDateStr)) return false;
    // Undated non-recurring Home tasks stay in Home Ready / Suggestions unless explicitly selected
    if (task.spaceId === 'home' && !task.isRecurring && !task.dueDate && !task.deadlineAt) {
      return false;
    }
    if (task.isRecurring) return true;
    if (!task.dueDate) return true;
    return task.dueDate === targetDateStr || isPastDate(task.dueDate);
  };

  const buildTaskRef = (task: LifeTask) =>
    task.isRecurring ? buildRoutineOccurrenceRefKey(task.id, targetDateStr) : buildTaskRefKey(task.id);

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
            timeTag = 'now';
          } else if (nextPrayerInfo.id === p.id && !nextPrayerInfo.isTomorrow && nextPrayerInfo.diffMinutes <= 20) {
            timeTag = 'now';
          } else if (nowMinutes >= nextMinutes) {
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
          bookmarkPage: quran.bookmarkPage,
        },
        sortKey: quranSortKey,
      });
    }

    // D. Worship Activities (LifeTask with spaceId === 'worship')
    const worshipTasks = await db.tasks.where('spaceId').equals('worship').toArray();
    const relevantWorshipTasks = worshipTasks.filter((t) => isTaskEligibleForAutoToday(t));

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

      const sel = selectedTaskMap.get(t.id);
      const status = deriveItemStatus(isDoneToday, timeTag);
      const sortKey = computeTodaySortKey(timeTag, isDoneToday, t.priority, 'dhikr', t.scheduledTime, sel?.position);

      rawItems.push({
        id: `task_worship_${t.id}_${targetDateStr}`,
        sourceId: t.id,
        refKey: buildTaskRef(t),
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
        isSelectedForToday: Boolean(sel),
        isEssentialForToday: Boolean(sel?.isEssential),
        selectionPosition: sel?.position,
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
    const occurrences = await getWorkoutOccurrences(targetDateStr);
    const plans = await healthRows('plan');
    const healthRuns = await healthRows('run');
    for (const occurrence of occurrences) {
      const plan = plans.find(p => p.id === occurrence.planId);
      const session = plan?.sessions.find(s => s.id === occurrence.sessionId);
      if (!plan || !session) continue;
      const routine = routineForSession(plan, session, occurrence);
      const isDone = occurrence.status === 'completed';
      const skipped = occurrence.status === 'skipped';
      const scheduledTime = occurrence.time;
      let timeTag: TodayItemTimeTag = isDone || skipped ? 'completed' : scheduledTime ? 'scheduled' : 'flexible';
      if (!isDone && !skipped && isPastDate(targetDateStr)) timeTag = 'overdue';
      const stateLabel = occurrence.status === 'partial' ? 'جزئي' : skipped ? 'متخطى' : occurrence.deferred ? 'مؤجل' : '';
      rawItems.push({ id: occurrence.id, sourceId: routine.id, type: 'workout', space: 'health',
        title: routine.name, subtitle: [routine.totalEstimatedMinutes + ' دقيقة', stateLabel].filter(Boolean).join(' · '),
        scheduledTime, estimatedMinutes: routine.totalEstimatedMinutes, priority: 'high', timeTag,
        status: skipped ? 'skipped' : occurrence.status === 'partial' ? 'partial' : deriveItemStatus(isDone, timeTag), isCompleted: isDone,
        actionType: 'start_workout', actionPayload: { routineId: routine.id, routine, canStart: isWorkoutAvailable(occurrence,healthRuns.find(r=>r.id===occurrence.runId),plan) },
        sortKey: computeTodaySortKey(timeTag, isDone, 'high', 'workout', scheduledTime),
      });
    }
  }

  // ==========================================
  // 3. WORK SPACE AGGREGATION
  // ==========================================
  if (prefs.showWork) {
    const workTasks = await db.tasks.where('spaceId').equals('work').toArray();

    let relevantWorkTasks = workTasks.filter((t) => isTaskEligibleForAutoToday(t));

    if (prefs.workOptions?.top3Only) {
      relevantWorkTasks = relevantWorkTasks
        .sort((a, b) => {
          const aSel = selectedTaskMap.has(a.id) || hasHardDeadlineDueOrOverdue(a, targetDateStr) ? 10 : 0;
          const bSel = selectedTaskMap.has(b.id) || hasHardDeadlineDueOrOverdue(b, targetDateStr) ? 10 : 0;
          const priorityScore: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
          return bSel + (priorityScore[b.priority] || 1) - (aSel + (priorityScore[a.priority] || 1));
        })
        .slice(0, Math.max(3, relevantWorkTasks.filter((t) => selectedTaskMap.has(t.id) || hasHardDeadlineDueOrOverdue(t, targetDateStr)).length));
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

      const sel = selectedTaskMap.get(t.id);
      const status = deriveItemStatus(isDoneToday, timeTag);
      const sortKey = computeTodaySortKey(timeTag, isDoneToday, t.priority, 'work_task', t.scheduledTime, sel?.position);

      rawItems.push({
        id: `task_work_${t.id}_${targetDateStr}`,
        sourceId: t.id,
        refKey: buildTaskRef(t),
        type: 'work_task',
        space: 'work',
        title: t.title,
        subtitle:
          t.status === 'WAITING' && t.waitingContext?.waitingOn
            ? `متابعة مع: ${t.waitingContext.waitingOn}`
            : t.description || 'مهمة عمل يومية',
        scheduledTime: t.scheduledTime,
        estimatedMinutes: t.estimatedMinutes,
        priority: t.priority,
        timeTag,
        status,
        isCompleted: isDoneToday,
        isSelectedForToday: Boolean(sel),
        isEssentialForToday: Boolean(sel?.isEssential),
        selectionPosition: sel?.position,
        actionType: 'toggle_task',
        actionPayload: { taskId: t.id, targetDateStr },
        sortKey,
      });
    }

    // Work Projects: Surface explicitly selected steps or Next Action for in_progress projects only
    const allWorkProjects = await db.projects.toArray();
    const workProjects = allWorkProjects.filter((p) => (p.spaceId || 'home') === 'work');
    for (const proj of workProjects) {
      const selectedForProj = selectedStepsByProject.get(proj.id);
      if (selectedForProj && selectedForProj.length > 0) {
        for (const sel of selectedForProj) {
          const step = (proj.steps || []).find((s) => s.id === sel.stepId);
          if (!step) continue;
          const isStepDone = Boolean(step.isCompleted);
          const timeTag: TodayItemTimeTag = isStepDone ? 'completed' : 'flexible';
          const status = deriveItemStatus(isStepDone, timeTag);
          const sortKey = computeTodaySortKey(timeTag, isStepDone, 'high', 'work_task', undefined, sel.position);
          rawItems.push({
            id: `work_proj_${proj.id}_${step.id}`,
            sourceId: proj.id,
            refKey: sel.refKey,
            type: 'project_action',
            space: 'work',
            title: step.title,
            subtitle: `مشروع عمل: ${proj.title}`,
            categoryLabel: proj.title,
            priority: 'high',
            timeTag,
            status,
            isCompleted: isStepDone,
            completedAt: step.completedAt,
            isSelectedForToday: true,
            isEssentialForToday: Boolean(sel.isEssential),
            selectionPosition: sel.position,
            actionType: 'complete_project_step',
            actionPayload: { projectId: proj.id, stepId: step.id },
            sortKey,
          });
        }
      } else if (proj.status === 'in_progress' && proj.nextActionTitle && proj.nextActionId) {
        const refKey = buildProjectStepRefKey(proj.id, proj.nextActionId);
        const sortKey = computeTodaySortKey('flexible', false, 'high', 'work_task');
        rawItems.push({
          id: `work_proj_${proj.id}_${proj.nextActionId}`,
          sourceId: proj.id,
          refKey,
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
    // A. Home Projects (Explicitly selected steps or Next Action for in_progress projects only)
    const allHomeProjects = await db.projects.toArray();
    const homeProjects = allHomeProjects.filter((p) => (p.spaceId || 'home') === 'home');

    for (const proj of homeProjects) {
      const selectedForProj = selectedStepsByProject.get(proj.id);
      if (selectedForProj && selectedForProj.length > 0) {
        for (const sel of selectedForProj) {
          const step = (proj.steps || []).find((s) => s.id === sel.stepId);
          if (!step) continue;
          const isStepDone = Boolean(step.isCompleted);
          const timeTag: TodayItemTimeTag = isStepDone ? 'completed' : 'flexible';
          const status = deriveItemStatus(isStepDone, timeTag);
          const sortKey = computeTodaySortKey(timeTag, isStepDone, 'medium', 'project_action', undefined, sel.position);
          rawItems.push({
            id: `project_${proj.id}_${step.id}`,
            sourceId: proj.id,
            refKey: sel.refKey,
            type: 'project_action',
            space: 'home',
            title: step.title,
            subtitle: `مشروع: ${proj.title}`,
            categoryLabel: proj.title,
            priority: 'medium',
            timeTag,
            status,
            isCompleted: isStepDone,
            completedAt: step.completedAt,
            isSelectedForToday: true,
            isEssentialForToday: Boolean(sel.isEssential),
            selectionPosition: sel.position,
            actionType: 'complete_project_step',
            actionPayload: { projectId: proj.id, stepId: step.id },
            sortKey,
          });
        }
      } else if (proj.status === 'in_progress' && proj.nextActionTitle && proj.nextActionId) {
        const refKey = buildProjectStepRefKey(proj.id, proj.nextActionId);
        const sortKey = computeTodaySortKey('flexible', false, 'medium', 'project_action');
        rawItems.push({
          id: `project_${proj.id}_${proj.nextActionId}`,
          sourceId: proj.id,
          refKey,
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

    const homeTasks = await db.tasks.where('spaceId').equals('home').toArray();
    const relevantHome = homeTasks.filter((t) => {
      const isSelectedOrHardDeadline = selectedTaskMap.has(t.id) || hasHardDeadlineDueOrOverdue(t, targetDateStr);
      if (!isSelectedOrHardDeadline) {
        if (t.isRecurring && !showRoutines) return false;
        if (!t.isRecurring && !showNormalHomeTasks) return false;
      }
      return isTaskEligibleForAutoToday(t);
    });

    for (const t of relevantHome) {
      const isDoneToday = t.isRecurring
        ? Array.isArray(t.recurringCompletionDates) && t.recurringCompletionDates.includes(targetDateStr)
        : t.isCompleted;

      const sel = selectedTaskMap.get(t.id);
      const timeTag = getTaskTimeTag(t, isDoneToday, targetDateStr);
      const status = deriveItemStatus(isDoneToday, timeTag);
      const sortKey = computeTodaySortKey(
        timeTag,
        isDoneToday,
        t.priority,
        t.isRecurring ? 'home_routine' : 'home_task',
        t.scheduledTime,
        sel?.position
      );

      rawItems.push({
        id: `task_home_${t.id}_${targetDateStr}`,
        sourceId: t.id,
        refKey: buildTaskRef(t),
        type: t.isRecurring ? 'home_routine' : 'home_task',
        space: 'home',
        title: t.title,
        subtitle:
          t.status === 'WAITING' && t.waitingContext?.waitingOn
            ? `متابعة مع: ${t.waitingContext.waitingOn}`
            : t.description || (t.isRecurring ? 'روتين منزلي متكرر' : 'مهمة منزلية'),
        scheduledTime: t.scheduledTime,
        estimatedMinutes: t.estimatedMinutes,
        priority: t.priority,
        timeTag,
        status,
        isCompleted: isDoneToday,
        isSelectedForToday: Boolean(sel),
        isEssentialForToday: Boolean(sel?.isEssential),
        selectionPosition: sel?.position,
        actionType: 'toggle_task',
        actionPayload: { taskId: t.id, targetDateStr },
        sortKey,
      });
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
        const relevantPlanTasks = planTasks.filter((t) => isTaskEligibleForAutoToday(t));

        for (const t of relevantPlanTasks) {
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

          const sel = selectedTaskMap.get(t.id);
          const isDoneToday = t.isRecurring ? !!t.recurringCompletionDates?.includes(targetDateStr) : t.isCompleted;
          const timeTag = getTaskTimeTag(t, isDoneToday, targetDateStr);
          const status = deriveItemStatus(isDoneToday, timeTag);
          const sortKey = computeTodaySortKey(timeTag, isDoneToday, t.priority || 'medium', 'plan_action', t.scheduledTime, sel?.position);

          rawItems.push({
            id: `task_plan_${t.id}_${targetDateStr}`,
            sourceId: t.id,
            refKey: buildTaskRef(t),
            type: 'plan_action',
            space: t.spaceId,
            title: t.title,
            subtitle: `خطة: ${plan.title}`,
            categoryLabel: plan.title,
            scheduledTime: t.scheduledTime,
            estimatedMinutes: t.estimatedMinutes,
            priority: t.priority || 'medium',
            timeTag,
            status,
            isCompleted: isDoneToday,
            isSelectedForToday: Boolean(sel),
            isEssentialForToday: Boolean(sel?.isEssential),
            selectionPosition: sel?.position,
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
  const allTasks = await db.tasks.toArray();
  const tasksById = new Map(allTasks.map((task) => [task.id, task]));
  const visible: Record<LifeSpaceId, boolean> = {
    worship: prefs.showWorship,
    health: prefs.showHealth,
    work: prefs.showWork,
    home: prefs.showHome,
    plans: prefs.showPlans,
  };

  const reconciled = rawItems.filter(
    (item) =>
      visible[item.space] &&
      (item.actionType !== 'toggle_task' ||
        !tasksById.has(item.sourceId) ||
        isTaskEligibleForAutoToday(tasksById.get(item.sourceId)!))
  );

  for (const task of allTasks) {
    if (
      !visible[task.spaceId] ||
      !isTaskEligibleForAutoToday(task) ||
      reconciled.some((item) => item.actionType === 'toggle_task' && item.sourceId === task.id)
    ) {
      continue;
    }
    const isSelectedOrHardDeadline = selectedTaskMap.has(task.id) || hasHardDeadlineDueOrOverdue(task, targetDateStr);
    if (!isSelectedOrHardDeadline) {
      if (task.spaceId === 'work' && prefs.workOptions?.top3Only) continue;
      if (task.spaceId === 'home' && (task.isRecurring ? prefs.homeOptions?.routines === false : prefs.homeOptions?.nextActionsOnly)) continue;
      if (task.spaceId === 'plans' && prefs.plansOptions?.showDailyActions === false) continue;
      if (task.spaceId === 'plans' && task.planId) continue;
    }
    const sel = selectedTaskMap.get(task.id);
    const completed = task.isRecurring ? !!task.recurringCompletionDates?.includes(targetDateStr) : task.isCompleted;
    const type: TodayItemType =
      task.spaceId === 'health'
        ? 'health_task'
        : task.spaceId === 'work'
          ? 'work_task'
          : task.spaceId === 'worship'
            ? 'worship_task'
            : task.spaceId === 'plans'
              ? 'plan_action'
              : task.isRecurring
                ? 'home_routine'
                : 'home_task';
    const timeTag = getTaskTimeTag(task, completed, targetDateStr);
    reconciled.push({
      id: `task_${task.spaceId}_${task.id}_${targetDateStr}`,
      sourceId: task.id,
      refKey: buildTaskRef(task),
      type,
      space: task.spaceId,
      title: task.title,
      subtitle: task.description,
      scheduledTime: task.scheduledTime,
      estimatedMinutes: task.estimatedMinutes,
      priority: task.priority,
      timeTag,
      status: deriveItemStatus(completed, timeTag),
      isCompleted: completed,
      isSelectedForToday: Boolean(sel),
      isEssentialForToday: Boolean(sel?.isEssential),
      selectionPosition: sel?.position,
      actionType: 'toggle_task',
      actionPayload: { taskId: task.id, targetDateStr },
      sortKey: computeTodaySortKey(timeTag, completed, task.priority, type, task.scheduledTime, sel?.position),
    });
  }

  const sortedItems = reconciled.sort((a, b) => a.sortKey - b.sortKey);

  // ==========================================
  // 7. READY SUGGESTIONS (MAX 3, NOT IN ITEMS)
  // ==========================================
  const surfacedTaskIds = new Set(
    sortedItems.filter((item) => item.actionType === 'toggle_task').map((item) => item.sourceId)
  );
  const surfacedProjectIds = new Set(
    sortedItems.filter((item) => item.actionType === 'complete_project_step').map((item) => item.sourceId)
  );

  const suggestionCandidates: TodayItem[] = [];
  for (const task of allTasks) {
    if (!visible[task.spaceId]) continue;
    if (surfacedTaskIds.has(task.id) || selectedTaskMap.has(task.id)) continue;
    if (task.isCompleted || task.isRecurring) continue;
    if (isShoppingTask(task) || task.isSomeday === true || task.status === 'WAITING') continue;
    if (task.availableFrom && task.availableFrom > targetDateStr) continue;
    if (task.dueDate && task.dueDate > targetDateStr) continue;

    const isQuick = Boolean(task.estimatedMinutes && task.estimatedMinutes <= 15);
    const reason = isQuick
      ? `مهمة سريعة (${task.estimatedMinutes} د)`
      : task.priority === 'high'
        ? 'أولوية عالية جاهزة للتنفيذ'
        : 'مهمة جاهزة للتنفيذ';

    const type: TodayItemType =
      task.spaceId === 'health'
        ? 'health_task'
        : task.spaceId === 'work'
          ? 'work_task'
          : task.spaceId === 'worship'
            ? 'worship_task'
            : task.spaceId === 'plans'
              ? 'plan_action'
              : 'home_task';

    suggestionCandidates.push({
      id: `suggestion_task_${task.id}_${targetDateStr}`,
      sourceId: task.id,
      refKey: buildTaskRefKey(task.id),
      type,
      space: task.spaceId,
      title: task.title,
      subtitle: task.description || reason,
      suggestionReason: reason,
      estimatedMinutes: task.estimatedMinutes,
      priority: task.priority,
      timeTag: 'flexible',
      status: 'pending',
      isCompleted: false,
      isSelectedForToday: false,
      actionType: 'toggle_task',
      actionPayload: { taskId: task.id, targetDateStr },
      sortKey: (isQuick ? 100 : 200) + (task.priority === 'high' ? 0 : task.priority === 'medium' ? 10 : 20),
    });
  }

  const activeProjectsForSuggestions = await getActiveProjects();
  for (const proj of activeProjectsForSuggestions) {
    const projSpace: LifeSpaceId = proj.spaceId || 'home';
    if (!visible[projSpace]) continue;
    if (proj.status !== 'in_progress') continue;
    if (!proj.nextActionId || !proj.nextActionTitle) continue;
    if (surfacedProjectIds.has(proj.id)) continue;
    const refKey = buildProjectStepRefKey(proj.id, proj.nextActionId);
    if (selectedByRefKey.has(refKey)) continue;

    suggestionCandidates.push({
      id: `suggestion_proj_${proj.id}_${proj.nextActionId}`,
      sourceId: proj.id,
      refKey,
      type: 'project_action',
      space: projSpace,
      title: proj.nextActionTitle,
      subtitle: `مشروع: ${proj.title}`,
      categoryLabel: proj.title,
      suggestionReason: `الخطوة التالية في مشروع: ${proj.title}`,
      priority: 'medium',
      timeTag: 'flexible',
      status: 'pending',
      isCompleted: false,
      isSelectedForToday: false,
      actionType: 'complete_project_step',
      actionPayload: { projectId: proj.id, stepId: proj.nextActionId },
      sortKey: 150,
    });
  }

  const suggestions = suggestionCandidates
    .sort((a, b) => a.sortKey - b.sortKey || a.id.localeCompare(b.id))
    .slice(0, 3);

  const rawSections: Array<{ id: TodaySectionId; title: string; items: TodayItem[] }> = [
    {
      id: 'now',
      title: '⚡ الآن ومتاح للتنفيذ',
      items: sortedItems.filter((i) => i.timeTag === 'now' && !i.isCompleted && i.status !== 'skipped'),
    },
    {
      id: 'overdue',
      title: '⚠️ فات موعدها اليوم',
      items: sortedItems.filter((i) => i.timeTag === 'overdue' && !i.isCompleted && i.status !== 'skipped'),
    },
    {
      id: 'scheduled',
      title: '⏰ الجدول الزمني لليوم',
      items: sortedItems.filter((i) => i.timeTag === 'scheduled' && !i.isCompleted && i.status !== 'skipped'),
    },
    {
      id: 'selected',
      title: '📌 مختار ليومي',
      items: sortedItems.filter(
        (i) =>
          !i.isCompleted && i.status !== 'skipped' &&
          Boolean(i.isSelectedForToday) &&
          i.timeTag !== 'now' &&
          i.timeTag !== 'overdue' &&
          i.timeTag !== 'scheduled'
      ),
    },
    {
      id: 'high_priority',
      title: '🔥 أولويات قصوى اليوم',
      items: sortedItems.filter(
        (i) =>
          !i.isCompleted && i.status !== 'skipped' &&
          !i.isSelectedForToday &&
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
        (i) =>
          !i.isCompleted && i.status !== 'skipped' &&
          !i.isSelectedForToday &&
          i.type === 'project_action' &&
          i.priority !== 'high' &&
          i.timeTag === 'flexible'
      ),
    },
    {
      id: 'tasks',
      title: '📋 مهام وروتين اليوم',
      items: sortedItems.filter(
        (i) =>
          !i.isCompleted && i.status !== 'skipped' &&
          !i.isSelectedForToday &&
          i.type !== 'project_action' &&
          i.type !== 'plan_action' &&
          i.priority !== 'high' &&
          i.timeTag === 'flexible'
      ),
    },
    {
      id: 'plans',
      title: '🎯 خطوات الخطط الاستراتيجية',
      items: sortedItems.filter(
        (i) =>
          !i.isCompleted && i.status !== 'skipped' &&
          !i.isSelectedForToday &&
          i.type === 'plan_action' &&
          i.priority !== 'high' &&
          i.timeTag === 'flexible'
      ),
    },
    {
      id: 'skipped', title: 'الجلسات المتخطاة', items: sortedItems.filter(i=>i.status==='skipped'),
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
    sections.find((s) => s.id === 'selected')?.items[0] ||
    sections.find((s) => s.id === 'high_priority')?.items[0] ||
    sortedItems.find((i) => !i.isCompleted && i.status !== 'skipped') ||
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
    suggestions,
    nextUp,
    totalCount,
    completedCount,
    completionRate,
    spaceBreakdown,
    activePlansSummary,
  };
}
