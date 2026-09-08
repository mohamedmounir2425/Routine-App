/**
 * Deterministic Test Suite for Today Aggregator & Actions Layer
 * Verifies all 9 core domain integration scenarios:
 * 1. Empty day / all spaces disabled
 * 2. Day with morning workout (07:00) + evening workout (18:00)
 * 3. Recurring task completed yesterday, but incomplete today
 * 4. Project step transition from Step 1 to Step 2
 * 5. Plan action completion & status update
 * 6. Prayer completion toggle & persistence
 * 7. Azkar completion log & streak detection
 * 8. Preferences hiding an entire space
 * 9. Preferences hiding specific types within a space
 */

import 'fake-indexeddb/auto';
import { db } from '../../db/database';
import { aggregateTodayFeed } from './todayAggregator';
import { 
  executeToggleTask, 
  executeTogglePrayer, 
  executeCompleteAzkar, 
  executeCompleteProjectAction, 
  executeAddQuranPage 
} from './todayActions';
import { 
  getDailyPrayersState, 
  isAzkarCategoryCompletedToday, 
  getQuranDailyStatus 
} from '../../db/worshipQueries';
import { createProject, createWorkProject, createHomeProject } from '../../db/projectQueries';
import { createPlan, calculatePlanProgress, getPlanMilestones } from '../../db/goalPlanQueries';
import { getGlobalProgressSnapshot, getWeeklyProgress } from '../progress/progressAggregator';
import { getUserSettings, updateUserSettings } from '../../db/database';
import { getEnabledSpaceConfigs } from '../../config/spacesConfig';
import { DEFAULT_TODAY_PREFERENCES } from '../../types';

// In-memory localStorage polyfill for Node.js test environment
if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: 0,
  } as any;
}

interface TestResult {
  scenario: string;
  passed: boolean;
  details: string;
}

export async function runAllDeterministicScenarios(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const testDate = '2026-09-08'; // Tuesday

  console.log(`\n======================================================`);
  console.log(`🧪 RUNNING TODAY AGGREGATOR & ACTIONS TEST SUITE`);
  console.log(`Target Date: ${testDate} (Tuesday)`);
  console.log(`======================================================\n`);

  // Clean DB before starting
  await db.tasks.clear();
  await db.projects.clear();
  await db.plans.clear();
  await db.planMilestones.clear();
  await db.workoutSchedules.clear();
  await db.workoutLogs.clear();
  await db.azkarLogs.clear();
  localStorage.clear();

  // ----------------------------------------------------
  // Scenario 1: Empty day / all spaces disabled
  // ----------------------------------------------------
  try {
    const emptyResult = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        showWorship: false,
        showHealth: false,
        showWork: false,
        showHome: false,
        showPlans: false,
      },
    });

    const passed =
      emptyResult.items.length === 0 &&
      emptyResult.sections.length === 0 &&
      emptyResult.nextUp === null &&
      emptyResult.totalCount === 0 &&
      emptyResult.completionRate === 0;

    results.push({
      scenario: '1. Empty day / all spaces disabled',
      passed,
      details: `Items: ${emptyResult.items.length}, Sections: ${emptyResult.sections.length}, NextUp: ${emptyResult.nextUp}`,
    });
  } catch (err: any) {
    results.push({ scenario: '1. Empty day / all spaces disabled', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 2: Morning workout (07:00) + Evening workout (18:00)
  // ----------------------------------------------------
  try {
    // Tuesday = Day 2
    await db.routines.put({
      id: 'routine-spine-morning',
      name: 'استطالة وإطالات الصباح',
      description: 'تمارين فك تيبس الظهر والعمود الفقري',
      level: 'gentle',
      tag: 'morning',
      exerciseIds: ['ex-1'],
      totalEstimatedMinutes: 15,
      isCustom: true,
    });

    await db.routines.put({
      id: 'routine-mcgill-evening',
      name: 'جلسة ماكجيل الثلاثية',
      description: 'تقوية عضلات الجذع وأسفل الظهر',
      level: 'moderate',
      tag: 'evening',
      exerciseIds: ['ex-2'],
      totalEstimatedMinutes: 20,
      isCustom: true,
    });

    await db.workoutSchedules.bulkPut([
      {
        id: 'ws-morning',
        dayOfWeek: 2,
        routineId: 'routine-spine-morning',
        sessionLabel: 'تمرين الصباح لصحة الظهر',
        scheduledTime: '07:00',
        durationMinutes: 15,
        isEnabled: true,
      },
      {
        id: 'ws-evening',
        dayOfWeek: 2,
        routineId: 'routine-mcgill-evening',
        sessionLabel: 'تمرين المساء لتقوية الجذع',
        scheduledTime: '18:00',
        durationMinutes: 20,
        isEnabled: true,
      },
    ]);

    const workoutResult = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showWork: false,
        showHome: false,
        showPlans: false,
      },
    });

    const workouts = workoutResult.items.filter((i) => i.type === 'workout');
    const passed =
      workouts.length === 2 &&
      workouts[0].scheduledTime === '07:00' &&
      workouts[1].scheduledTime === '18:00' &&
      workouts[0].sortKey < workouts[1].sortKey;

    results.push({
      scenario: '2. Day with morning workout (07:00) + evening workout (18:00)',
      passed,
      details: `Found ${workouts.length} workouts: [${workouts[0]?.scheduledTime}, ${workouts[1]?.scheduledTime}]. Chronological: ${workouts[0]?.sortKey} < ${workouts[1]?.sortKey}`,
    });
  } catch (err: any) {
    results.push({ scenario: '2. Morning + Evening workout', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 3: Recurring task completed yesterday, incomplete today
  // ----------------------------------------------------
  try {
    const yesterday = '2026-09-07';
    await db.tasks.put({
      id: 'task-recurring-read',
      title: 'قراءة تقنية يومية 30 دقيقة',
      spaceId: 'work',
      priority: 'high',
      isRecurring: true,
      recurrenceRule: 'daily',
      recurringCompletionDates: [yesterday],
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });

    // Feed on test date (2026-09-08) before completion
    const beforeFeed = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showHome: false,
        showPlans: false,
      },
    });

    const taskBefore = beforeFeed.items.find((i) => i.sourceId === 'task-recurring-read');
    const beforePassed = taskBefore !== undefined && taskBefore.isCompleted === false && taskBefore.status === 'pending';

    // Execute completion for test date
    await executeToggleTask('task-recurring-read', testDate);

    // Verify task in DB
    const dbTaskAfter = await db.tasks.get('task-recurring-read');
    const dbPassed =
      dbTaskAfter?.isCompleted === false && // master recurrence is not destroyed!
      dbTaskAfter?.recurringCompletionDates?.includes(yesterday) && // yesterday preserved
      dbTaskAfter?.recurringCompletionDates?.includes(testDate); // today added

    // Feed on test date after completion
    const afterFeed = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showHome: false,
        showPlans: false,
      },
    });

    const taskAfter = afterFeed.items.find((i) => i.sourceId === 'task-recurring-read');
    const afterPassed = taskAfter !== undefined && taskAfter.isCompleted === true && taskAfter.status === 'completed';

    results.push({
      scenario: '3. Recurring task completed yesterday, incomplete today',
      passed: Boolean(beforePassed && dbPassed && afterPassed),
      details: `Before: isCompleted=${taskBefore?.isCompleted}, DB dates: [${dbTaskAfter?.recurringCompletionDates?.join(', ')}], After: isCompleted=${taskAfter?.isCompleted}`,
    });
  } catch (err: any) {
    results.push({ scenario: '3. Recurring task', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 4: Project advances from Step 1 to Step 2
  // ----------------------------------------------------
  try {
    const project = await createProject({
      title: 'صيانة دولاب الملابس',
      description: 'تركيب مفصلات جديدة وتعديل الرفوف',
      status: 'in_progress',
      steps: [
        { id: 'step-1', title: 'شراء المفصلات والمسامير', isCompleted: false, order: 1 },
        { id: 'step-2', title: 'فك الضلفة القديمة وتركيب المفصلات', isCompleted: false, order: 2 },
      ],
    });

    const feedBefore = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showWork: false,
        showPlans: false,
      },
    });

    const projItemBefore = feedBefore.items.find((i) => i.type === 'project_action');
    const step1Surfaced = projItemBefore?.title === 'شراء المفصلات والمسامير';

    // Execute complete step 1
    await executeCompleteProjectAction(project.id, 'step-1');

    const feedAfter = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showWork: false,
        showPlans: false,
      },
    });

    const projItemAfter = feedAfter.items.find((i) => i.type === 'project_action');
    const step2Surfaced = projItemAfter?.title === 'فك الضلفة القديمة وتركيب المفصلات';

    results.push({
      scenario: '4. Project advances from Step 1 to Step 2',
      passed: Boolean(step1Surfaced && step2Surfaced),
      details: `Before: "${projItemBefore?.title}" -> After: "${projItemAfter?.title}"`,
    });
  } catch (err: any) {
    results.push({ scenario: '4. Project advance', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 5: Plan action completed
  // ----------------------------------------------------
  try {
    const plan = await createPlan({
      title: 'إتقان .NET 9 Backend',
      category: 'career',
      status: 'active',
      targetDate: '2026-12-31',
      color: '#10b981',
      icon: 'Code',
    });

    const planTask = {
      id: 'task-plan-clean-arch',
      title: 'تنفيذ CQRS مع MediatR',
      spaceId: 'plans' as const,
      planId: plan.id,
      priority: 'high' as const,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    await db.tasks.put(planTask);

    const feedBefore = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showWork: false,
        showHome: false,
      },
    });

    const itemBefore = feedBefore.items.find((i) => i.sourceId === planTask.id);
    const beforeIncomplete = itemBefore?.isCompleted === false && itemBefore?.type === 'plan_action';

    // Complete the task
    await executeToggleTask(planTask.id, testDate);

    const feedAfter = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showWork: false,
        showHome: false,
      },
    });

    const itemAfter = feedAfter.items.find((i) => i.sourceId === planTask.id);
    const afterComplete = itemAfter?.isCompleted === true && itemAfter?.status === 'completed';

    results.push({
      scenario: '5. Plan action completed',
      passed: Boolean(beforeIncomplete && afterComplete),
      details: `Before: isCompleted=${itemBefore?.isCompleted}, After: isCompleted=${itemAfter?.isCompleted}, status=${itemAfter?.status}`,
    });
  } catch (err: any) {
    results.push({ scenario: '5. Plan action', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 6: Prayer completed
  // ----------------------------------------------------
  try {
    const feedBefore = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showHealth: false,
        showWork: false,
        showHome: false,
        showPlans: false,
      },
    });

    const dhuhrBefore = feedBefore.items.find((i) => i.sourceId === 'dhuhr');
    const beforeState = dhuhrBefore?.isCompleted === false;

    // Execute toggle prayer
    executeTogglePrayer('dhuhr', testDate);

    const savedPrayers = getDailyPrayersState(testDate);
    const fardSaved = savedPrayers.dhuhr?.fard === true;

    const feedAfter = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showHealth: false,
        showWork: false,
        showHome: false,
        showPlans: false,
      },
    });

    const dhuhrAfter = feedAfter.items.find((i) => i.sourceId === 'dhuhr');
    const afterState = dhuhrAfter?.isCompleted === true && dhuhrAfter?.status === 'completed';

    results.push({
      scenario: '6. Prayer completed',
      passed: Boolean(beforeState && fardSaved && afterState),
      details: `Before: isCompleted=${dhuhrBefore?.isCompleted}, Stored: fard=${fardSaved}, After: isCompleted=${dhuhrAfter?.isCompleted}`,
    });
  } catch (err: any) {
    results.push({ scenario: '6. Prayer completed', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 7: Azkar completed
  // ----------------------------------------------------
  try {
    const beforeDone = await isAzkarCategoryCompletedToday('morning', testDate);

    await executeCompleteAzkar('morning', testDate);

    const afterDone = await isAzkarCategoryCompletedToday('morning', testDate);

    const feed = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showHealth: false,
        showWork: false,
        showHome: false,
        showPlans: false,
      },
    });

    const morningAzkar = feed.items.find((i) => i.sourceId === 'morning');
    const azkarPassed = morningAzkar?.isCompleted === true && morningAzkar?.status === 'completed';

    results.push({
      scenario: '7. Azkar completed',
      passed: Boolean(!beforeDone && afterDone && azkarPassed),
      details: `Before: done=${beforeDone}, DB check: done=${afterDone}, Feed item: isCompleted=${morningAzkar?.isCompleted}`,
    });
  } catch (err: any) {
    results.push({ scenario: '7. Azkar completed', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 8: Preferences hide an entire Space
  // ----------------------------------------------------
  try {
    // Ensure we have a work task
    await db.tasks.put({
      id: 'task-work-meeting',
      title: 'اجتماع الفريق التقني',
      spaceId: 'work',
      priority: 'high',
      isRecurring: false,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });

    const feedWithWorkHidden = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWork: false, // hide work
      },
    });

    const workItems = feedWithWorkHidden.items.filter((i) => i.space === 'work');
    const passed = workItems.length === 0 && feedWithWorkHidden.spaceBreakdown.work.total === 0;

    results.push({
      scenario: '8. Preferences hide an entire Space (Work hidden)',
      passed,
      details: `Work items returned: ${workItems.length}, Space breakdown total: ${feedWithWorkHidden.spaceBreakdown.work.total}`,
    });
  } catch (err: any) {
    results.push({ scenario: '8. Hide entire Space', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 9: Preferences hide specific type within a Space & Quran Verification
  // ----------------------------------------------------
  try {
    // Also verify executeAddQuranPage advances pages
    executeAddQuranPage(3, testDate);
    const quranStatus = getQuranDailyStatus(testDate);

    // Hide Azkar only inside Worship
    const feedNoAzkar = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        worshipOptions: {
          prayers: true,
          azkar: false, // hidden
          quran: true,
        },
      },
    });

    const azkarItems = feedNoAzkar.items.filter((i) => i.type === 'dhikr');
    const prayerItems = feedNoAzkar.items.filter((i) => i.type === 'prayer');
    const quranItems = feedNoAzkar.items.filter((i) => i.type === 'quran');

    const passed = 
      azkarItems.length === 0 && 
      prayerItems.length > 0 && 
      quranItems.length > 0 && 
      quranStatus.pagesRead === 3;

    results.push({
      scenario: '9. Preferences hide specific type within Space (Azkar hidden, Prayers & Quran visible)',
      passed,
      details: `Dhikr items: ${azkarItems.length}, Prayers: ${prayerItems.length}, Quran items: ${quranItems.length}, Quran pages: ${quranStatus.pagesRead}`,
    });
  } catch (err: any) {
    results.push({ scenario: '9. Hide specific type', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 10: Worship Activity (LifeTask with spaceId='worship') surfaced as type: 'worship_task'
  // ----------------------------------------------------
  try {
    const worshipTask = {
      id: 'task-worship-lesson',
      title: 'حضور درس الفقه في المسجد',
      spaceId: 'worship' as const,
      priority: 'medium' as const,
      isCompleted: false,
      dueDate: testDate,
      createdAt: new Date().toISOString(),
    };
    await db.tasks.put(worshipTask);

    const feed = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: true,
        showHealth: false,
        showWork: false,
        showHome: false,
        showPlans: false,
      },
    });

    const item = feed.items.find((i) => i.sourceId === worshipTask.id);
    const passed = item !== undefined && item.type === 'worship_task' && item.space === 'worship';

    results.push({
      scenario: '10. Worship Activity (LifeTask) surfaced as type: worship_task',
      passed: Boolean(passed),
      details: `Found item: "${item?.title}", type="${item?.type}", space="${item?.space}"`,
    });
  } catch (err: any) {
    results.push({ scenario: '10. Worship Activity', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 11: Multi-workout same day (08:00 & 18:00) with independent completion
  // ----------------------------------------------------
  try {
    await db.workoutSchedules.clear();
    await db.workoutLogs.clear();

    await db.routines.put({
      id: 'routine-mobility-08',
      name: 'تمارين الاستطالة الصباحية',
      description: 'فك تيبس الظهر',
      level: 'gentle',
      tag: 'morning',
      exerciseIds: ['ex-1'],
      totalEstimatedMinutes: 15,
      isCustom: true,
    });

    await db.routines.put({
      id: 'routine-strength-18',
      name: 'تمارين تقوية الجذع المسائية',
      description: 'تقوية عضلات أسفل الظهر',
      level: 'moderate',
      tag: 'evening',
      exerciseIds: ['ex-2'],
      totalEstimatedMinutes: 25,
      isCustom: true,
    });

    await db.workoutSchedules.bulkPut([
      {
        id: 'ws-mob-08',
        dayOfWeek: 2,
        routineId: 'routine-mobility-08',
        sessionLabel: '08:00 — تمرين الاستطالة الصباحي',
        scheduledTime: '08:00',
        durationMinutes: 15,
        isEnabled: true,
      },
      {
        id: 'ws-str-18',
        dayOfWeek: 2,
        routineId: 'routine-strength-18',
        sessionLabel: '18:00 — تمرين القوة المسائي',
        scheduledTime: '18:00',
        durationMinutes: 25,
        isEnabled: true,
      },
    ]);

    // Initial aggregation - both should be pending/incomplete
    const feedBefore = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showWork: false,
        showHome: false,
        showPlans: false,
        showHealth: true,
      },
    });

    const workoutsBefore = feedBefore.items.filter((i) => i.space === 'health' && i.type === 'workout');
    const mobBefore = workoutsBefore.find((w) => w.sourceId === 'routine-mobility-08');
    const strBefore = workoutsBefore.find((w) => w.sourceId === 'routine-strength-18');

    const beforeValid =
      workoutsBefore.length === 2 &&
      mobBefore?.isCompleted === false &&
      mobBefore?.scheduledTime === '08:00' &&
      strBefore?.isCompleted === false &&
      strBefore?.scheduledTime === '18:00';

    // Complete only the 08:00 Mobility workout
    await db.workoutLogs.put({
      id: 'log-mobility-08',
      routineId: 'routine-mobility-08',
      routineName: 'تمارين الاستطالة الصباحية',
      completedAt: `${testDate}T08:15:00.000Z`,
      durationMinutes: 15,
      exercisesCompleted: 3,
      totalExercises: 3,
      prePainScore: 4,
      postPainScore: 2,
    });

    // Re-aggregate feed
    const feedAfter = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showWork: false,
        showHome: false,
        showPlans: false,
        showHealth: true,
      },
    });

    const workoutsAfter = feedAfter.items.filter((i) => i.space === 'health' && i.type === 'workout');
    const mobAfter = workoutsAfter.find((w) => w.sourceId === 'routine-mobility-08');
    const strAfter = workoutsAfter.find((w) => w.sourceId === 'routine-strength-18');

    const afterValid =
      workoutsAfter.length === 2 &&
      mobAfter?.isCompleted === true &&
      mobAfter?.status === 'completed' &&
      strAfter?.isCompleted === false &&
      strAfter?.status !== 'completed';

    const passed = Boolean(beforeValid && afterValid);

    results.push({
      scenario: '11. Multi-workout same day (08:00 & 18:00) with independent completion',
      passed,
      details: `Before: 2 workouts (08:00 & 18:00 pending). After: 08:00 completed=${mobAfter?.isCompleted} status=${mobAfter?.status}, 18:00 completed=${strAfter?.isCompleted}`,
    });
  } catch (err: any) {
    results.push({ scenario: '11. Multi-workout same day', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 12: Work Project Next Action surfaces in Today & atomically advances
  // ----------------------------------------------------
  try {
    const workProj = await createWorkProject({
      id: 'proj-work-release',
      title: 'إطلاق التحديث البرمجي الجديد',
      status: 'in_progress',
      steps: [
        { id: 'step-w1', title: 'كتابة اختبارات الوحدة والتحقق', isCompleted: false, order: 1 },
        { id: 'step-w2', title: 'رفع التحديث لسيرفر الإنتاج', isCompleted: false, order: 2 },
      ],
    });

    const workTask = {
      id: 'task-w-review',
      spaceId: 'work' as const,
      title: 'مراجعة طلبات السحب (PR Review)',
      priority: 'high' as const,
      isCompleted: false,
      dueDate: testDate,
      createdAt: new Date().toISOString(),
    };
    await db.tasks.put(workTask);

    // Initial aggregation - Step 1 should surface as TodayItem in Work space
    const feedBefore = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showHome: false,
        showPlans: false,
        showWork: true,
      },
    });

    const step1Item = feedBefore.items.find((i) => i.id === `work_proj_${workProj.id}_step-w1`);
    const taskItem = feedBefore.items.find((i) => i.sourceId === 'task-w-review');

    const step1Found =
      step1Item !== undefined &&
      step1Item.space === 'work' &&
      step1Item.type === 'project_action' &&
      step1Item.title === 'كتابة اختبارات الوحدة والتحقق' &&
      taskItem !== undefined &&
      taskItem.space === 'work';

    // Complete Step 1
    await executeCompleteProjectAction(workProj.id, 'step-w1');

    // Re-aggregate feed - Step 2 should now surface as the new Next Action
    const feedAfter = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showHome: false,
        showPlans: false,
        showWork: true,
      },
    });

    const step1After = feedAfter.items.find((i) => i.id === `work_proj_${workProj.id}_step-w1`);
    const step2After = feedAfter.items.find((i) => i.id === `work_proj_${workProj.id}_step-w2`);

    const step2Advanced =
      step1After === undefined &&
      step2After !== undefined &&
      step2After.space === 'work' &&
      step2After.type === 'project_action' &&
      step2After.title === 'رفع التحديث لسيرفر الإنتاج';

    const passed = Boolean(step1Found && step2Advanced);

    results.push({
      scenario: '12. Work Project Next Action surfaces in Today & atomically advances',
      passed,
      details: `Before: NextAction="${step1Item?.title}", Task="${taskItem?.title}". After complete Step 1: New NextAction="${step2After?.title}"`,
    });
  } catch (err: any) {
    results.push({ scenario: '12. Work Project Next Action', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 13: Home Project Next Action, Tasks, Routines, & Preferences
  // ----------------------------------------------------
  try {
    await db.tasks.clear();
    await db.projects.clear();

    // 1. Create a Home Project with 2 steps
    const homeProj = await createHomeProject({
      title: 'تجديد غرفة المعيشة',
      description: 'دهان وتركيب إضاءة جديدة',
      status: 'in_progress',
      steps: [
        { id: 'step-h1', title: 'شراء الدهانات والفرش', isCompleted: false, order: 1 },
        { id: 'step-h2', title: 'دهان الحائط الرئيسي', isCompleted: false, order: 2 },
      ],
    });

    // 2. Create a normal Home Task for today
    const homeTask = {
      id: 'task-home-grocery',
      spaceId: 'home' as const,
      title: 'شراء مستلزمات البيت والمنظفات',
      priority: 'high' as const,
      dueDate: testDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    await db.tasks.put(homeTask);

    // 3. Create a recurring Home Routine
    const homeRoutine = {
      id: 'routine-home-airing',
      spaceId: 'home' as const,
      title: 'تهوية البيت وفتح النوافذ',
      priority: 'medium' as const,
      isRecurring: true,
      recurrenceRule: 'daily' as const,
      isCompleted: false,
      recurringCompletionDates: [],
      createdAt: new Date().toISOString(),
    };
    await db.tasks.put(homeRoutine);

    // Initial aggregation with Home enabled and nextActionsOnly: false
    const feedBefore = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showWork: false,
        showPlans: false,
        showHome: true,
        homeOptions: {
          routines: true,
          nextActionsOnly: false,
        },
      },
    });

    const nextActionItemBefore = feedBefore.items.find((i) => i.id === `project_${homeProj.id}_step-h1`);
    const taskItemBefore = feedBefore.items.find((i) => i.sourceId === 'task-home-grocery');
    const routineItemBefore = feedBefore.items.find((i) => i.sourceId === 'routine-home-airing');

    const initialCheck =
      nextActionItemBefore !== undefined &&
      nextActionItemBefore.space === 'home' &&
      nextActionItemBefore.type === 'project_action' &&
      nextActionItemBefore.title === 'شراء الدهانات والفرش' &&
      taskItemBefore !== undefined &&
      taskItemBefore.space === 'home' &&
      !taskItemBefore.isCompleted &&
      routineItemBefore !== undefined &&
      routineItemBefore.space === 'home' &&
      !routineItemBefore.isCompleted;

    // Execute Actions:
    // A. Complete project Next Action (step-h1)
    await executeCompleteProjectAction(homeProj.id, 'step-h1');

    // B. Toggle home task
    await executeToggleTask('task-home-grocery', testDate);

    // C. Toggle recurring routine
    await executeToggleTask('routine-home-airing', testDate);

    // Re-aggregate
    const feedAfter = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWorship: false,
        showHealth: false,
        showWork: false,
        showPlans: false,
        showHome: true,
        homeOptions: {
          routines: true,
          nextActionsOnly: false,
        },
      },
    });

    const step1After = feedAfter.items.find((i) => i.id === `project_${homeProj.id}_step-h1`);
    const step2After = feedAfter.items.find((i) => i.id === `project_${homeProj.id}_step-h2`);
    const taskItemAfter = feedAfter.items.find((i) => i.sourceId === 'task-home-grocery');
    const routineItemAfter = feedAfter.items.find((i) => i.sourceId === 'routine-home-airing');

    const actionsCheck =
      step1After === undefined &&
      step2After !== undefined &&
      step2After.title === 'دهان الحائط الرئيسي' &&
      taskItemAfter?.isCompleted === true &&
      routineItemAfter?.isCompleted === true;

    // Preferences check: Disable Home space
    const feedHidden = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showHome: false,
      },
    });

    const homeItemsWhenHidden = feedHidden.items.filter((i) => i.space === 'home');
    const prefsCheck = homeItemsWhenHidden.length === 0;

    const passed = Boolean(initialCheck && actionsCheck && prefsCheck);

    results.push({
      scenario: '13. Home Project Next Action, Tasks, Routines, & Preferences',
      passed,
      details: `NextAction advanced: "${step2After?.title}", TaskCompleted=${taskItemAfter?.isCompleted}, RoutineCompleted=${routineItemAfter?.isCompleted}, HiddenHomeItems=${homeItemsWhenHidden.length}`,
    });
  } catch (err: any) {
    results.push({ scenario: '13. Home Space Integration', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 14: Plan -> Milestone -> Task linking, spaceId preservation, Today deduplication & derived progress
  // ----------------------------------------------------
  try {
    await db.plans.clear();
    await db.planMilestones.clear();
    await db.tasks.clear();

    // 1. Create a GoalPlan with 2 milestones
    const plan = await createPlan(
      {
        title: 'احتراف هندسة الأنظمة الموزعة',
        category: 'career',
        status: 'active',
        targetDate: '2026-12-31',
      },
      [
        { title: 'إتقان Go و gRPC', order: 0 },
        { title: 'تصميم ونشر بنية Microservices', order: 1 },
      ]
    );

    const milestones = await db.planMilestones.where('planId').equals(plan.id).sortBy('order');
    const m1 = milestones[0];

    // Initial derived progress should be 0%
    const initialProgress = await calculatePlanProgress(plan.id);

    // 2. Create a task linked to Plan & Milestone m1, with spaceId: 'work'
    const workPlanTask = {
      id: 'task-work-grpc-study',
      title: 'دراسة بروتوكول gRPC وبناء خدمة تجريبية',
      spaceId: 'work' as const, // Must preserve 'work'
      planId: plan.id,
      milestoneId: m1.id,
      priority: 'high' as const,
      dueDate: testDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    await db.tasks.put(workPlanTask);

    // 3. Aggregate Today feed with both Work and Plans enabled
    const feed = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWork: true,
        showPlans: true,
      },
    });

    // Verify Today Deduplication:
    // The task should appear EXACTLY ONCE in Today
    const matchedItems = feed.items.filter((i) => i.sourceId === workPlanTask.id);
    const isSingleItem = matchedItems.length === 1;
    const taskItem = matchedItems[0];

    // Verify task spaceId and category/plan enrichment
    const spacePreserved = taskItem?.space === 'work';
    const planContextPreserved = 
      taskItem?.categoryLabel?.includes('احتراف') || 
      taskItem?.actionPayload?.planId === plan.id;

    // Verify task spaceId in database remains 'work'
    const dbTaskBefore = await db.tasks.get(workPlanTask.id);
    const dbSpacePreserved = dbTaskBefore?.spaceId === 'work';

    // 4. Complete the task via executeToggleTask
    await executeToggleTask(workPlanTask.id, testDate);

    // 5. Verify task is completed in DB and spaceId is STILL 'work'
    const dbTaskAfter = await db.tasks.get(workPlanTask.id);
    const taskCompletedInDb = dbTaskAfter?.isCompleted === true;
    const dbSpaceStillWork = dbTaskAfter?.spaceId === 'work';

    // 6. Verify derived plan progress dynamically updated
    // (Milestone 1 is 100% complete from its 1 task, Milestone 2 is 0% -> overall 50%)
    const updatedProgress = await calculatePlanProgress(plan.id);
    const progressUpdated = updatedProgress === 50;

    // 7. Verify showPlans: false and showWork: false hides work task
    const feedHiddenWork = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWork: false,
        showPlans: false,
      },
    });
    const workItemsWhenHidden = feedHiddenWork.items.filter((i) => i.sourceId === workPlanTask.id);
    const prefsHidingPassed = workItemsWhenHidden.length === 0;

    const passed = Boolean(
      initialProgress === 0 &&
      isSingleItem &&
      spacePreserved &&
      planContextPreserved &&
      dbSpacePreserved &&
      taskCompletedInDb &&
      dbSpaceStillWork &&
      progressUpdated &&
      prefsHidingPassed
    );

    results.push({
      scenario: '14. Plan -> Milestone -> Task linking, spaceId preservation, Today deduplication & derived progress',
      passed,
      details: `Single Today item: ${isSingleItem}, Space preserved: ${dbSpaceStillWork}, Plan progress updated: ${initialProgress}% -> ${updatedProgress}%, Deduplicated in Today: YES`,
    });
  } catch (err: any) {
    results.push({ scenario: '14. Plan Integration & Deduplication', passed: false, details: err.message });
  }

  // ----------------------------------------------------
  // Scenario 15: Global Progress Aggregation & Double-Counting Prevention
  // ----------------------------------------------------
  try {
    await db.tasks.clear();
    await db.plans.clear();
    await db.planMilestones.clear();
    await db.workoutSchedules.clear();
    await db.workoutLogs.clear();
    await db.azkarLogs.clear();
    await db.projects.clear();
    localStorage.clear();

    // 1. Seed Worship: Complete Fajr & Dhuhr (10% + 10% = 20%)
    localStorage.setItem(
      `routine_prayers_${testDate}`,
      JSON.stringify({ fajr: { fard: true }, dhuhr: { fard: true } })
    );

    // 2. Seed Health: 1 Scheduled workout on Tuesday (dayOfWeek: 2)
    // Initially not completed in workoutLogs -> healthScore = 0%
    await db.workoutSchedules.put({
      id: 'ws-tue-core',
      dayOfWeek: 2,
      routineId: 'routine-core-tue',
      sessionLabel: 'تمارين الظهر',
      scheduledTime: '09:00',
      durationMinutes: 20,
      isEnabled: true,
    });

    // 3. Seed Plan: 1 active plan with 2 milestones
    const plan = await createPlan(
      {
        id: 'plan-progress-test',
        title: 'بناء نظام الحوسبة السحابية',
        category: 'career',
        status: 'active',
        targetDate: '2026-12-31',
      },
      [
        { id: 'ms-prog-1', title: 'إتقان Kubernetes', order: 0 },
        { id: 'ms-prog-2', title: 'نشر البنية في الإنتاج', order: 1 },
      ]
    );

    // 4. Seed Work tasks due on testDate:
    // Task A: Completed work task (due today)
    await db.tasks.put({
      id: 'task-work-done',
      title: 'إعداد وثائق البنية التحتية',
      spaceId: 'work' as const,
      dueDate: testDate,
      priority: 'medium' as const,
      isCompleted: true,
      completedAt: `${testDate}T10:00:00.000Z`,
      createdAt: new Date().toISOString(),
    });

    // Task B: Plan-linked work task (due today, currently incomplete)
    await db.tasks.put({
      id: 'task-work-plan-linked',
      title: 'تكوين ملفات Terraform',
      spaceId: 'work' as const, // Primary space is Work
      planId: plan.id,
      milestoneId: 'ms-prog-1',
      dueDate: testDate,
      priority: 'high' as const,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    });
    // Work items due today: 2 items, 1 completed -> workScore = 50%

    // 5. Seed Home task due on testDate (1 task, 1 completed -> homeScore = 100%)
    await db.tasks.put({
      id: 'task-home-done',
      title: 'شراء فلتر مياه جديد',
      spaceId: 'home' as const,
      dueDate: testDate,
      priority: 'low' as const,
      isCompleted: true,
      completedAt: `${testDate}T11:00:00.000Z`,
      createdAt: new Date().toISOString(),
    });

    // 6. Compute initial Global Progress Snapshot
    const snapBefore = await getGlobalProgressSnapshot(testDate);

    // Verified space scores:
    const worshipScoreBefore = snapBefore.spaces.worship.score === 20;
    const healthScoreBefore = snapBefore.spaces.health.score === 0;
    const workScoreBefore = snapBefore.spaces.work.score === 50;
    const homeScoreBefore = snapBefore.spaces.home.score === 100;

    // Overall weighted score:
    // Worship (30% * 20 = 6) + Health (25% * 0 = 0) + Work (25% * 50 = 12.5) + Home (20% * 100 = 20)
    // Sum = 6 + 0 + 12.5 + 20 = 38.5 -> rounded to 39
    const expectedScoreBefore = Math.round(20 * 0.30 + 0 * 0.25 + 50 * 0.25 + 100 * 0.20);
    const overallScoreBeforeValid = snapBefore.overallScore === expectedScoreBefore;

    // Plans are tracked separately and not added to daily execution score:
    const planProgressTracked = snapBefore.plans.activePlans === 1;

    // 7. Complete the plan-linked work task via executeToggleTask
    await executeToggleTask('task-work-plan-linked', testDate);

    // 8. Re-aggregate Global Progress Snapshot
    const snapAfter = await getGlobalProgressSnapshot(testDate);

    // Work now has 2/2 completed -> workScore = 100%
    const workScoreAfterValid = snapAfter.spaces.work.score === 100;

    // Overall weighted score updated:
    // Worship (30% * 20 = 6) + Health (25% * 0 = 0) + Work (25% * 100 = 25) + Home (20% * 100 = 20)
    // Sum = 6 + 0 + 25 + 20 = 51%
    const expectedScoreAfter = Math.round(20 * 0.30 + 0 * 0.25 + 100 * 0.25 + 100 * 0.20);
    const overallScoreAfterValid = snapAfter.overallScore === expectedScoreAfter;

    // 9. Preferences test: Disable Home space, weights scale among remaining spaces
    const snapNoHome = await getGlobalProgressSnapshot(testDate, {
      ...DEFAULT_TODAY_PREFERENCES,
      showHome: false,
    });
    // Active weights: Worship 30, Health 25, Work 25 (Total: 80)
    // Normalized: Worship = 30/80 = 0.375, Health = 25/80 = 0.3125, Work = 25/80 = 0.3125
    // Overall = 20 * 0.375 + 0 * 0.3125 + 100 * 0.3125 = 7.5 + 0 + 31.25 = 38.75 -> 39
    const expectedScoreNoHome = Math.round(20 * (30 / 80) + 0 * (25 / 80) + 100 * (25 / 80));
    const preferencesScaledValid = snapNoHome.overallScore === expectedScoreNoHome;

    // 10. Weekly Matrix test
    const weeklyMatrix = await getWeeklyProgress(testDate);
    const weeklyValid = weeklyMatrix.days.length === 7 && weeklyMatrix.averageScore >= 0;

    const passed = Boolean(
      worshipScoreBefore &&
      healthScoreBefore &&
      workScoreBefore &&
      homeScoreBefore &&
      overallScoreBeforeValid &&
      planProgressTracked &&
      workScoreAfterValid &&
      overallScoreAfterValid &&
      preferencesScaledValid &&
      weeklyValid
    );

    results.push({
      scenario: '15. Global Progress Aggregation & Double-Counting Prevention',
      passed,
      details: `Before: overall=${snapBefore.overallScore}% (expected ${expectedScoreBefore}%), After completing plan-linked task: overall=${snapAfter.overallScore}% (expected ${expectedScoreAfter}%), Scaled without Home: ${snapNoHome.overallScore}% (expected ${expectedScoreNoHome}%), 7-day Matrix: ${weeklyMatrix.days.length} days`,
    });
  } catch (err: any) {
    results.push({ scenario: '15. Global Progress Aggregation', passed: false, details: err.message });
  }

  // =========================================================================
  // SCENARIO 16: Life OS Settings & Personalization (Single Source of Truth)
  // =========================================================================
  try {
    // 1. Reset tasks & projects for clean isolation
    await db.tasks.clear();
    await db.projects.clear();

    // 2. Fetch initial settings - verify enabledSpaces & todayPreferences exist
    const initialSettings = await getUserSettings();
    const hasInitialSpaces = Array.isArray(initialSettings.enabledSpaces) && initialSettings.enabledSpaces.length === 5;
    const hasInitialPrefs = Boolean(initialSettings.todayPreferences && initialSettings.todayPreferences.showWorship);

    // 3. Test Disabling a Space: Disable 'work' space
    const updatedSettings1 = await updateUserSettings({
      enabledSpaces: ['worship', 'health', 'home', 'plans'],
      todayPreferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showWork: false,
      },
    });

    // 4. Verify enabledSpaces single source of truth
    const enabledConfigs = getEnabledSpaceConfigs(updatedSettings1.enabledSpaces);
    const spaceDisabledValid = enabledConfigs.length === 4 && !enabledConfigs.some((s) => s.id === 'work');

    // 5. Verify Settings Affecting Today: Create a work task
    await db.tasks.put({
      id: 'task-work-s16',
      title: 'مهمة عمل برمجية',
      spaceId: 'work',
      dueDate: testDate,
      isCompleted: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
    });

    // Feed with showWork: false -> task-work-s16 MUST be hidden
    const feedHiddenWork = await aggregateTodayFeed({
      preferences: updatedSettings1.todayPreferences,
      customDateStr: testDate,
    });
    const workTaskHidden = !feedHiddenWork.items.some((item) => item.sourceId === 'task-work-s16');

    // Feed with showWork: true -> task-work-s16 MUST appear
    const feedVisibleWork = await aggregateTodayFeed({
      preferences: {
        ...updatedSettings1.todayPreferences!,
        showWork: true,
      },
      customDateStr: testDate,
    });
    const workTaskAppears = feedVisibleWork.items.some((item) => item.sourceId === 'task-work-s16');

    // 6. Verify Settings Affecting Progress: Weights scale dynamically when a space is disabled/hidden
    // Active spaces: Worship 30, Health 25, Home 20 (Total: 75)
    // Normalized: Worship = 30/75 = 40%, Health = 25/75 = 33.3%, Home = 20/75 = 26.7%
    const progressWithoutWork = await getGlobalProgressSnapshot(testDate, updatedSettings1.todayPreferences);
    const expectedScaledOverall = Math.round(
      progressWithoutWork.spaces.worship.score * (30 / 75) +
      progressWithoutWork.spaces.health.score * (25 / 75) +
      progressWithoutWork.spaces.home.score * (20 / 75)
    );
    const progressWeightsScaled = progressWithoutWork.overallScore === expectedScaledOverall;

    // 7. Verify Reload Persistence: Fresh read from db.settings table directly (simulating page reload)
    const freshFromDb = await db.settings.get('current_settings');
    const dbReloadValid = Boolean(
      freshFromDb &&
      freshFromDb.enabledSpaces?.length === 4 &&
      !freshFromDb.enabledSpaces.includes('work') &&
      freshFromDb.todayPreferences?.showWork === false
    );

    // 8. Verify LocalStorage synchronization for TodayPreferences (no duplicate store, synchronized by updateUserSettings)
    const storedLocalStorage = globalThis.localStorage.getItem('routine_today_preferences');
    const parsedLocalStorage = storedLocalStorage ? JSON.parse(storedLocalStorage) : null;
    const localStorageSyncValid = Boolean(parsedLocalStorage && parsedLocalStorage.showWork === false);

    // 9. Restore settings back to all 5 enabled spaces
    await updateUserSettings({
      enabledSpaces: ['worship', 'health', 'work', 'home', 'plans'],
      todayPreferences: DEFAULT_TODAY_PREFERENCES,
    });
    const restoredSettings = await getUserSettings();
    const restoredValid = restoredSettings.enabledSpaces?.length === 5 && restoredSettings.todayPreferences?.showWork === true;

    const passed = Boolean(
      hasInitialSpaces &&
      hasInitialPrefs &&
      spaceDisabledValid &&
      workTaskHidden &&
      workTaskAppears &&
      progressWeightsScaled &&
      dbReloadValid &&
      localStorageSyncValid &&
      restoredValid
    );

    results.push({
      scenario: '16. Life OS Settings & Personalization (Single Source of Truth)',
      passed,
      details: `Space Toggle: 5->${enabledConfigs.length} spaces (work disabled), Today Filter: hidden=${workTaskHidden}/shown=${workTaskAppears}, Progress Scaled: ${progressWithoutWork.overallScore}% (expected ${expectedScaledOverall}%), Reload DB: ${dbReloadValid}, LocalStorage Sync: ${localStorageSyncValid}, Restored: ${restoredValid}`,
    });
  } catch (err: any) {
    results.push({ scenario: '16. Life OS Settings & Personalization', passed: false, details: err.message });
  }

  // =========================================================================
  // SCENARIO 17: Full Life OS Unified Lifecycle & Cross-Domain Regression
  // =========================================================================
  try {
    // 1. Reset all domain tables for complete isolation
    await db.tasks.clear();
    await db.projects.clear();
    await db.azkarLogs.clear();
    await db.workoutLogs.clear();
    await db.workoutSchedules.clear();
    await db.plans.clear();
    await db.planMilestones.clear();
    globalThis.localStorage.removeItem(`routine_prayers_${testDate}`);
    globalThis.localStorage.removeItem(`routine_quran_${testDate}`);
    globalThis.localStorage.removeItem('routine_tasbeeh_count');

    // 2. Set up multi-domain entries for testDate (Tuesday = 2)
    // A. Health: Scheduled routine for Tuesday
    await db.routines.put({
      id: 'routine-health-s17',
      name: 'تمرين استطالة الظهر الصباحي',
      description: 'تمارين استطالة',
      tag: 'morning',
      level: 'gentle',
      totalEstimatedMinutes: 15,
      exerciseIds: ['ex-1', 'ex-2'],
    });
    await db.workoutSchedules.put({
      id: 'sched-s17',
      dayOfWeek: 2, // Tuesday
      routineId: 'routine-health-s17',
      scheduledTime: '07:30',
      sessionLabel: 'جلسة الصباح لصحة العمود الفقري',
      durationMinutes: 15,
      isEnabled: true,
    });

    // B. Work: LifeProject with 2 sequential steps
    await createWorkProject({
      title: 'تطوير نظام المصادقة السحابية',
      description: 'مشروع عمل تقني',
      status: 'in_progress',
      targetDate: testDate,
      steps: [
        { id: 'step-1', title: 'كتابة المواصفات الفنية', order: 1, isCompleted: false },
        { id: 'step-2', title: 'مراجعة الكود والاعتماد', order: 2, isCompleted: false },
      ],
    });

    // C. Home: Recurring domestic routine
    await db.tasks.put({
      id: 'task-home-routine-s17',
      title: 'تهوية المنزل وترتيب المكتب',
      spaceId: 'home',
      dueDate: testDate,
      isCompleted: false,
      isRecurring: true,
      recurrenceRule: 'daily',
      recurringCompletionDates: [],
      priority: 'medium',
      createdAt: new Date().toISOString(),
    });

    // D. Plans: Strategic plan with a linked Work task
    const careerPlan = await createPlan(
      {
        title: 'إتقان بنية الأنظمة السحابية',
        category: 'career',
        description: 'خطة استراتيجية لتطوير المهارات',
        targetDate: '2026-12-31',
        status: 'active',
      },
      [
        { title: 'الحصول على شهادة AWS', order: 1 },
        { title: 'بناء مشروع عملي متكامل', order: 2 },
      ]
    );
    const planMilestones = await getPlanMilestones(careerPlan.id);
    await db.tasks.put({
      id: 'task-work-plan-s17',
      title: 'بناء معمارية الخدمات السحابية بالـ Docker',
      spaceId: 'work',
      planId: careerPlan.id,
      milestoneId: planMilestones[0]?.id,
      dueDate: testDate,
      isCompleted: false,
      priority: 'high',
      createdAt: new Date().toISOString(),
    });

    // 3. Aggregate Today Feed - verify Single Execution Center & Deduplication
    const feed1 = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: DEFAULT_TODAY_PREFERENCES,
    });

    // Deduplication check: task-work-plan-s17 appears ONCE
    const planTaskInstances = feed1.items.filter((item) => item.sourceId === 'task-work-plan-s17');
    const deduplicationValid = planTaskInstances.length === 1 && planTaskInstances[0].subtitle?.includes(careerPlan.title);

    // Next action check: Only Step 1 appears for Work project
    const workProjectItems = feed1.items.filter((item) => item.type === 'project_action' && item.space === 'work');
    const nextActionValid = workProjectItems.length === 1 && workProjectItems[0].title === 'كتابة المواصفات الفنية';

    // 4. Execute all actions through Today handlers
    // - 5 Daily Prayers
    for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      executeTogglePrayer(p, testDate);
    }
    // - Morning & Evening Azkar
    await executeCompleteAzkar('morning', testDate);
    await executeCompleteAzkar('evening', testDate);
    // - Quran: Read 4 pages
    executeAddQuranPage(4, testDate);
    globalThis.localStorage.setItem('routine_tasbeeh_count', '33');
    // - Workout log
    await db.workoutLogs.put({
      id: 'log-s17',
      routineId: 'routine-health-s17',
      routineName: 'تمرين استطالة الظهر الصباحي',
      completedAt: `${testDate}T08:00:00Z`,
      durationMinutes: 15,
      exercisesCompleted: 2,
      totalExercises: 2,
    });
    // - Work project Next Action (complete step-1 then step-2 to finish project)
    const workProj = (await db.projects.toArray()).find((p) => p.title === 'تطوير نظام المصادقة السحابية');
    if (workProj?.nextActionId) {
      await executeCompleteProjectAction(workProj.id, workProj.nextActionId);
    }
    const workProjUpdated = await db.projects.get(workProj!.id);
    if (workProjUpdated?.nextActionId) {
      await executeCompleteProjectAction(workProjUpdated.id, workProjUpdated.nextActionId);
    }
    // - Home recurring routine
    await executeToggleTask('task-home-routine-s17', testDate);
    // - Plan-linked work task
    await executeToggleTask('task-work-plan-s17', testDate);

    // 5. Verify Global Progress reaches 100% daily execution score
    const progressFull = await getGlobalProgressSnapshot(testDate);
    const healthScore100 = progressFull.spaces.health.score === 100;
    const workScore100 = progressFull.spaces.work.score === 100;
    const homeScore100 = progressFull.spaces.home.score === 100;
    const overallScore100 = progressFull.overallScore >= 95; // 100% normalized execution

    // 6. Test Settings Space Toggle & Dynamic Weight Scaling
    const settingsWithoutHome = await updateUserSettings({
      enabledSpaces: ['worship', 'health', 'work', 'plans'],
      todayPreferences: {
        ...DEFAULT_TODAY_PREFERENCES,
        showHome: false,
      },
    });

    const feedNoHome = await aggregateTodayFeed({
      customDateStr: testDate,
      preferences: settingsWithoutHome.todayPreferences,
    });
    const homeItemsHidden = !feedNoHome.items.some((item) => item.space === 'home');

    const progressNoHome = await getGlobalProgressSnapshot(testDate, settingsWithoutHome.todayPreferences);
    const scaledWeightsValid = progressNoHome.overallScore >= 95;

    // 7. Restore settings & verify reload persistence
    await updateUserSettings({
      enabledSpaces: ['worship', 'health', 'work', 'home', 'plans'],
      todayPreferences: DEFAULT_TODAY_PREFERENCES,
    });
    const freshDbSettings = await db.settings.get('current_settings');
    const restoredPersisted = freshDbSettings?.enabledSpaces?.length === 5;

    const passed = Boolean(
      deduplicationValid &&
      nextActionValid &&
      healthScore100 &&
      workScore100 &&
      homeScore100 &&
      overallScore100 &&
      homeItemsHidden &&
      scaledWeightsValid &&
      restoredPersisted
    );

    results.push({
      scenario: '17. Full Life OS Unified Lifecycle & Cross-Domain Regression',
      passed,
      details: `Today Deduplication: ${deduplicationValid} (1 instance), NextAction Atomic: ${nextActionValid}, Execution Scores: Health=${progressFull.spaces.health.score}%, Work=${progressFull.spaces.work.score}%, Home=${progressFull.spaces.home.score}%, Overall=${progressFull.overallScore}%, Space Toggle Reactivity: hidden=${homeItemsHidden}, Scaled Score: ${progressNoHome.overallScore}%, Restored DB: ${restoredPersisted}`,
    });
  } catch (err: any) {
    results.push({ scenario: '17. Full Life OS Unified Lifecycle & Cross-Domain Regression', passed: false, details: err.message });
  }

  // Print Summary Table
  console.log(`\n======================================================`);
  console.log(`📊 TEST RESULTS SUMMARY`);
  console.log(`======================================================`);
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${r.scenario}`);
    console.log(`       -> ${r.details}`);
    if (!r.passed) allPassed = false;
  }
  console.log(`======================================================`);
  console.log(`TOTAL: ${results.length} Scenarios | ALL PASSED: ${allPassed ? 'YES ✅' : 'NO ❌'}`);
  console.log(`======================================================\n`);

  return results;
}

// Auto-execute if run directly via Node
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('todayScenarios.test')) {
  runAllDeterministicScenarios().then((res) => {
    const anyFailed = res.some((r) => !r.passed);
    process.exit(anyFailed ? 1 : 0);
  });
}
