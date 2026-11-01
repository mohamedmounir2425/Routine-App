import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from './database';
import { taskToCloud, taskFromCloud, projectToCloud, projectFromCloud, routineToCloud, routineFromCloud, dayPlanToCloud, dayPlanFromCloud, settingsToCloud } from './cloudMappers';
import { fetchCloudSnapshot, syncErrorMessage } from './cloudSyncChecks';
import { queueMutation, pendingMutationCount, processSyncQueue, retryFailedMutations } from './syncQueue';
export { retryFailedMutations };

import { 
  WorkoutLog, 
  UserSettings, 
  Routine, 
  WeeklyScheduleItem, 
  LifeTask,
  HomeProject,
  GoalPlan,
  PlanMilestone,
  WorkoutScheduleEntry
} from '../types';
import { AzkarLog } from '../features/worship/types';

export interface SyncResult {
  success: boolean;
  error?: string;
  pulledCounts?: {
    logs: number;
    tasks: number;
    azkar: number;
    routines: number;
  };
}

/**
 * Pull all data belonging to the user from Supabase and update local Dexie DB.
 */
export async function pullUserDataFromCloud(userId: string, client: SupabaseClient = supabase): Promise<SyncResult> {
  if (client === supabase && !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    if (await pendingMutationCount(userId)) throw new Error('توجد تعديلات لم تصل للسحابة؛ لن يتم استبدال بيانات الجهاز.');
    const tables = [db.settings, db.workoutLogs, db.routines, db.weeklySchedule,
      db.azkarLogs, db.tasks, db.projects, db.plans, db.planMilestones, db.workoutSchedules, db.dayPlans];
    const before = await db.transaction('r', tables, () => Promise.all(tables.map(async table => JSON.stringify(await table.toArray()))));
    const snapshot = await fetchCloudSnapshot(client, userId);
    return await db.transaction('rw', [...tables, db.pendingSync], async () => {
      for (let index = 0; index < tables.length; index++) {
        if (JSON.stringify(await tables[index].toArray()) !== before[index]) throw new Error('تم تعديل بيانات الجهاز أثناء السحب؛ أعد المزامنة لحماية التعديل الجديد.');
      }
      if (await pendingMutationCount(userId)) throw new Error('وصل تعديل جديد أثناء المزامنة؛ أعد المحاولة.');
      // 1. Pull Profile / Settings
      const profile = snapshot.profiles[0];

      if (profile) {
        const localSettings = await db.settings.get('current_settings');
        const updatedSettings: UserSettings = {
          todayPreferences: profile.today_preferences ?? localSettings?.todayPreferences,
          ...localSettings,
          id: 'current_settings',
          userName: profile.user_name || localSettings?.userName || 'بطل الروتين',
          theme: profile.theme || localSettings?.theme || 'dark',
          activePlanType: profile.active_plan_type || localSettings?.activePlanType || '4-weeks',
          currentWeekNumber: profile.current_week_number || localSettings?.currentWeekNumber || 1,
          currentLevelNumber: profile.current_level_number || localSettings?.currentLevelNumber || 1,
          soundBeepsEnabled: profile.sound_beeps_enabled ?? localSettings?.soundBeepsEnabled ?? true,
          voiceCoachEnabled: profile.voice_coach_enabled ?? localSettings?.voiceCoachEnabled ?? true,
          voiceLanguage: profile.voice_language || localSettings?.voiceLanguage || 'ar',
          defaultRestSeconds: profile.default_rest_seconds || localSettings?.defaultRestSeconds || 20,
          reminderEnabled: profile.reminder_enabled ?? localSettings?.reminderEnabled ?? false,
          reminderTime: profile.reminder_time || localSettings?.reminderTime || '18:30',
          reminderDays: profile.reminder_days || localSettings?.reminderDays || [6, 1, 3, 4],
          workBreakReminderEnabled: profile.work_break_reminder_enabled ?? localSettings?.workBreakReminderEnabled ?? false,
          workBreakIntervalMinutes: profile.work_break_interval_minutes || localSettings?.workBreakIntervalMinutes || 45,
          screenWakeLock: profile.screen_wake_lock ?? localSettings?.screenWakeLock ?? true,
          workoutVideoAutoplay: profile.workout_video_autoplay ?? localSettings?.workoutVideoAutoplay ?? true,
          workoutVideoMuted: profile.workout_video_muted ?? localSettings?.workoutVideoMuted ?? true,
          workoutVideoLoop: profile.workout_video_loop ?? localSettings?.workoutVideoLoop ?? true,
          workoutDefaultViewMode: profile.workout_default_view_mode || localSettings?.workoutDefaultViewMode || 'video',
          enabledSpaces: profile.enabled_spaces || localSettings?.enabledSpaces || ['worship', 'health', 'work', 'plans'],
          hasCompletedOnboarding: profile.has_completed_onboarding ?? localSettings?.hasCompletedOnboarding ?? true,
        };
        await db.settings.put(updatedSettings);
      }

      // 2. Pull Workout Logs
      const cloudLogs = snapshot.workout_logs;

      if (cloudLogs && cloudLogs.length > 0) {
        const mappedLogs: WorkoutLog[] = cloudLogs.map((l) => ({
          id: l.id,
          routineId: l.routine_id,
          routineName: l.routine_name,
          completedAt: l.completed_at,
          durationMinutes: l.duration_minutes,
          exercisesCompleted: l.exercises_completed,
          totalExercises: l.total_exercises,
          weekNumber: l.week_number,
          sessionCode: l.session_code,
          prePainScore: l.pre_pain_score,
          postPainScore: l.post_pain_score,
          difficultyRating: l.difficulty_rating,
          notes: l.notes,
        }));
        await db.workoutLogs.bulkPut(mappedLogs);
      }

      // 3. Pull Custom Routines
      const cloudRoutines = snapshot.custom_routines;

      if (cloudRoutines && cloudRoutines.length > 0) {
        const mappedRoutines: Routine[] = cloudRoutines.map(routineFromCloud);
        await db.routines.bulkPut(mappedRoutines);
      }

      // 4. Pull Weekly Schedule
      const cloudSchedule = snapshot.weekly_schedule;

      if (cloudSchedule && cloudSchedule.length > 0) {
        const mappedSchedule: WeeklyScheduleItem[] = cloudSchedule.map((s) => ({
          dayOfWeek: s.day_of_week,
          dayNameAr: s.day_name_ar,
          routineId: s.routine_id,
          isRestDay: s.is_rest_day,
          restReason: s.rest_reason,
          sessionCode: s.session_code,
          weekNumber: s.week_number,
        }));
        await db.weeklySchedule.bulkPut(mappedSchedule);
      }

      // 5. Pull Azkar Logs
      const cloudAzkar = snapshot.azkar_logs;

      if (cloudAzkar && cloudAzkar.length > 0) {
        const mappedAzkar: AzkarLog[] = cloudAzkar.map((a) => ({
          id: a.id,
          date: a.date,
          categoryKey: a.category_key,
          categoryArabic: a.category_arabic,
          totalDhikr: a.total_dhikr,
          completedDhikr: a.completed_dhikr,
          isFullyCompleted: a.is_fully_completed,
          durationSeconds: a.duration_seconds,
          completedAt: a.completed_at,
        }));
        await db.azkarLogs.bulkPut(mappedAzkar);
      }

      // 6. Pull Life Tasks
      const cloudTasks = snapshot.life_tasks;

      if (cloudTasks && cloudTasks.length > 0) {
        const localTasks = new Map((await db.tasks.toArray()).map(task => [task.id, task]));
        const mappedTasks: LifeTask[] = cloudTasks.map(row => taskFromCloud(row, localTasks.get(row.id)));
        await db.tasks.bulkPut(mappedTasks);
      }

      // 7. Pull Projects (all required tables have been checked before local writes)
      const cloudProjects = snapshot.projects;
      if (cloudProjects && cloudProjects.length > 0) {
        const mappedProjects: HomeProject[] = cloudProjects.map(projectFromCloud);
        await db.projects.bulkPut(mappedProjects);
      }

      // 8. Safely pull Plans
      const cloudPlans = snapshot.plans;
      if (cloudPlans && cloudPlans.length > 0) {
        const mappedPlans: GoalPlan[] = cloudPlans.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          description: p.description,
          targetDate: p.target_date,
          status: p.status,
          color: p.color,
          icon: p.icon,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }));
        await db.plans.bulkPut(mappedPlans);
      }

      // 9. Safely pull Plan Milestones
      const cloudMilestones = snapshot.plan_milestones;
      if (cloudMilestones && cloudMilestones.length > 0) {
        const mappedMilestones: PlanMilestone[] = cloudMilestones.map((m) => ({
          id: m.id,
          planId: m.plan_id,
          title: m.title,
          order: m.order,
          isCompleted: m.is_completed,
          targetDate: m.target_date,
          completedAt: m.completed_at,
        }));
        await db.planMilestones.bulkPut(mappedMilestones);
      }

      // 10. Safely pull Workout Schedules
      const cloudSchedules = snapshot.workout_schedules;
      if (cloudSchedules && cloudSchedules.length > 0) {
        const mappedSchedules: WorkoutScheduleEntry[] = cloudSchedules.map((s) => ({
          id: s.id,
          dayOfWeek: s.day_of_week,
          routineId: s.routine_id,
          scheduledTime: s.scheduled_time,
          sessionLabel: s.session_label,
          durationMinutes: s.duration_minutes,
          isEnabled: s.is_enabled,
        }));
        await db.workoutSchedules.bulkPut(mappedSchedules);
      }

      const cloudDayPlans = snapshot.day_plans;
      if (cloudDayPlans.length) await db.dayPlans.bulkPut(cloudDayPlans.map(dayPlanFromCloud));
      return {
        success: true,
        pulledCounts: {
          logs: cloudLogs?.length || 0,
          tasks: cloudTasks?.length || 0,
          azkar: cloudAzkar?.length || 0,
          routines: cloudRoutines?.length || 0,
        },
      };
    });
  } catch (err: unknown) {
    console.error('Error pulling user data from Supabase:', err);
    return { success: false, error: syncErrorMessage(err) };
  }
}

/**
 * Push all local data to Supabase (e.g. on first login or manual sync).
 */
export async function pushLocalDataToCloud(userId: string, client: SupabaseClient = supabase): Promise<SyncResult> {
  if (client === supabase && !isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // 1. Push Profile / Settings
    const localSettings = await db.settings.get('current_settings');
    if (localSettings) {
      await client.from('profiles').upsert(settingsToCloud(userId, localSettings)).throwOnError();
    }

    // 2. Push Workout Logs
    const localLogs = await db.workoutLogs.toArray();
    if (localLogs.length > 0) {
      const records = localLogs.map((l) => ({
        id: l.id,
        user_id: userId,
        routine_id: l.routineId,
        routine_name: l.routineName,
        completed_at: l.completedAt,
        duration_minutes: l.durationMinutes || 0,
        exercises_completed: l.exercisesCompleted || 0,
        total_exercises: l.totalExercises || 0,
        week_number: l.weekNumber,
        session_code: l.sessionCode,
        pre_pain_score: l.prePainScore,
        post_pain_score: l.postPainScore,
        difficulty_rating: l.difficultyRating,
        notes: l.notes,
      }));
      await client.from('workout_logs').upsert(records).throwOnError();
    }

    // 3. Push Custom Routines
    const allRoutines = await db.routines.toArray();
    const customRoutines = allRoutines.filter((r) => r.isCustom);
    if (customRoutines.length > 0) {
      const records = customRoutines.map(routine => routineToCloud(userId, routine));
      await client.from('custom_routines').upsert(records).throwOnError();
    }

    // 4. Push Weekly Schedule
    const localSchedule = await db.weeklySchedule.toArray();
    if (localSchedule.length > 0) {
      const records = localSchedule.map((s) => ({
        id: `${userId}_day_${s.dayOfWeek}`,
        user_id: userId,
        day_of_week: s.dayOfWeek,
        day_name_ar: s.dayNameAr,
        routine_id: s.routineId,
        is_rest_day: s.isRestDay ?? false,
        rest_reason: s.restReason,
        session_code: s.sessionCode,
        week_number: s.weekNumber,
        updated_at: new Date().toISOString(),
      }));
      await client.from('weekly_schedule').upsert(records).throwOnError();
    }

    // 5. Push Azkar Logs
    const localAzkar = await db.azkarLogs.toArray();
    if (localAzkar.length > 0) {
      const records = localAzkar.map((a) => ({
        id: a.id,
        user_id: userId,
        date: a.date,
        category_key: a.categoryKey,
        category_arabic: a.categoryArabic,
        total_dhikr: a.totalDhikr,
        completed_dhikr: a.completedDhikr,
        is_fully_completed: a.isFullyCompleted,
        duration_seconds: a.durationSeconds,
        completed_at: a.completedAt,
      }));
      await client.from('azkar_logs').upsert(records).throwOnError();
    }

    // 6. Push Life Tasks
    const localTasks = await db.tasks.toArray();
    if (localTasks.length > 0) {
      const records = localTasks.map(task => taskToCloud(userId, task));
      await client.from('life_tasks').upsert(records).throwOnError();
    }

    // 7. Safely push Projects
    const localProjects = await db.projects.toArray();
    if (localProjects.length > 0) {
      const records = localProjects.map(project => projectToCloud(userId, project));
      await client.from('projects').upsert(records).throwOnError();
    }

    // 8. Safely push Plans
    const localPlans = await db.plans.toArray();
    if (localPlans.length > 0) {
      const records = localPlans.map((p) => ({
        id: p.id,
        user_id: userId,
        title: p.title,
        category: p.category,
        description: p.description,
        target_date: p.targetDate,
        status: p.status,
        color: p.color,
        icon: p.icon,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }));
      await client.from('plans').upsert(records).throwOnError();
    }

    // 9. Safely push Plan Milestones
    const localMilestones = await db.planMilestones.toArray();
    if (localMilestones.length > 0) {
      const records = localMilestones.map((m) => ({
        id: m.id,
        user_id: userId,
        plan_id: m.planId,
        title: m.title,
        order: m.order,
        is_completed: m.isCompleted,
        target_date: m.targetDate,
        completed_at: m.completedAt,
      }));
      await client.from('plan_milestones').upsert(records).throwOnError();
    }

    // 10. Safely push Workout Schedules
    const localSchedules = await db.workoutSchedules.toArray();
    if (localSchedules.length > 0) {
      const records = localSchedules.map((s) => ({
        id: s.id,
        user_id: userId,
        day_of_week: s.dayOfWeek,
        routine_id: s.routineId,
        scheduled_time: s.scheduledTime,
        session_label: s.sessionLabel,
        duration_minutes: s.durationMinutes,
        is_enabled: s.isEnabled,
      }));
      await client.from('workout_schedules').upsert(records).throwOnError();
    }

    const localDayPlans = await db.dayPlans.toArray();
    if (localDayPlans.length) await client.from('day_plans').upsert(localDayPlans.map(plan => dayPlanToCloud(userId, plan))).throwOnError();

    return { success: true };
  } catch (err: unknown) {
    console.error('Error pushing local data to Supabase:', err);
    return { success: false, error: syncErrorMessage(err) };
  }
}

/**
 * Full bidirectional sync:
 * 1. Pull cloud changes first into local Dexie.
 * 2. Push any remaining local records to ensure cloud is up to date.
 */
export async function syncAllWithCloud(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  if (await pendingMutationCount(userId)) return { success: false, error: 'توجد تعديلات مؤجلة أو فاشلة لم تصل للسحابة.' };
  const pullResult = await pullUserDataFromCloud(userId);
  if (!pullResult.success) {
    return pullResult;
  }

  const pushResult = await pushLocalDataToCloud(userId);
  if (pushResult.success && await pendingMutationCount(userId)) return { success: false, error: 'وصلت تعديلات جديدة لم تتزامن بعد؛ أعد المحاولة.' };
  return pushResult;
}

/**
 * Check for real Internet connectivity using a fast health check ping.
 * Prevents false positives from captive portals or local WiFi.
 */
export async function checkRealConnectivity(): Promise<boolean> {
  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const { error } = await supabase.from('profiles').select('id').limit(0).abortSignal(controller.signal);
    return !error;
  } catch { return false; } finally { clearTimeout(timeout); }
}

/** Persist account-scoped mutations; preserve deletion intentions until acknowledged. */
export async function enqueuePendingMutation(
  item: Omit<import('./database').PendingSyncItem, 'id' | 'retryCount' | 'status'>,
  isCreatedOffline = false,
): Promise<void> {
  await queueMutation(item, isCreatedOffline);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('lifeos:sync-pending'));
}

let flushTail: Promise<unknown> = Promise.resolve();
export async function flushPendingSyncQueue(userId: string): Promise<{ processed: number; failed: number }> {
  const work = async () => {
    if (!await checkRealConnectivity()) return { processed: 0, failed: 0 };
    return processSyncQueue(userId, async item => {
      if (item.action === 'upsert' && (item.table === 'profiles' ? item.data?.id : item.data?.user_id) !== userId) {
        throw new Error('هوية التعديل لا تطابق الحساب؛ لم يتم إرساله.');
      }
      const result = item.action === 'delete'
        ? await supabase.from(item.table).delete().eq('id', item.entityId).eq(item.table === 'profiles' ? 'id' : 'user_id', userId)
        : await supabase.from(item.table).upsert(item.data!);
      if (result.error) throw result.error;
    });
  };
  const pending = flushTail.then(work, work);
  flushTail = pending.catch(() => undefined);
  return pending;
}

export async function getPendingSyncCount(userId: string): Promise<number> {
  return pendingMutationCount(userId);
}

/**
 * Incremental helpers with automatic offline queueing
 */
export async function syncSingleWorkoutLog(userId: string, log: WorkoutLog): Promise<void> {
  const payload = {
    id: log.id,
    user_id: userId,
    routine_id: log.routineId,
    routine_name: log.routineName,
    completed_at: log.completedAt,
    duration_minutes: log.durationMinutes || 0,
    exercises_completed: log.exercisesCompleted || 0,
    total_exercises: log.totalExercises || 0,
    week_number: log.weekNumber,
    session_code: log.sessionCode,
    pre_pain_score: log.prePainScore,
    post_pain_score: log.postPainScore,
    difficulty_rating: log.difficultyRating,
    notes: log.notes,
  };
  await submitMutation(userId, 'workout_logs', log.id, 'upsert', payload);
}

export async function syncSingleTask(userId: string, task: LifeTask): Promise<void> {
  const payload = taskToCloud(userId, task);
  await submitMutation(userId, 'life_tasks', task.id, 'upsert', payload);
}

export async function syncSingleTaskDelete(userId: string, taskId: string): Promise<void> {
  await submitMutation(userId, 'life_tasks', taskId, 'delete', null);
}

export async function syncSingleAzkarLog(userId: string, log: AzkarLog): Promise<void> {
  const payload = {
    id: log.id,
    user_id: userId,
    date: log.date,
    category_key: log.categoryKey,
    category_arabic: log.categoryArabic,
    total_dhikr: log.totalDhikr,
    completed_dhikr: log.completedDhikr,
    is_fully_completed: log.isFullyCompleted,
    duration_seconds: log.durationSeconds,
    completed_at: log.completedAt,
  };
  await submitMutation(userId, 'azkar_logs', log.id, 'upsert', payload);
}

export async function syncSingleProject(userId: string, project: HomeProject): Promise<void> {
  const payload = projectToCloud(userId, project);
  await submitMutation(userId, 'projects', project.id, 'upsert', payload);
}

export async function syncSingleProjectDelete(userId: string, projectId: string): Promise<void> {
  await submitMutation(userId, 'projects', projectId, 'delete', null);
}

export async function syncSinglePlan(userId: string, plan: GoalPlan): Promise<void> {
  const payload = {
    id: plan.id,
    user_id: userId,
    title: plan.title,
    category: plan.category,
    description: plan.description,
    target_date: plan.targetDate,
    status: plan.status,
    color: plan.color,
    icon: plan.icon,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
  await submitMutation(userId, 'plans', plan.id, 'upsert', payload);
}

export async function syncSinglePlanDelete(userId: string, planId: string): Promise<void> {
  await submitMutation(userId, 'plans', planId, 'delete', null);
}

export async function syncSingleMilestone(userId: string, milestone: PlanMilestone): Promise<void> {
  const payload = {
    id: milestone.id,
    user_id: userId,
    plan_id: milestone.planId,
    title: milestone.title,
    order: milestone.order,
    is_completed: milestone.isCompleted,
    target_date: milestone.targetDate,
    completed_at: milestone.completedAt,
  };
  await submitMutation(userId, 'plan_milestones', milestone.id, 'upsert', payload);
}

export async function syncSingleMilestoneDelete(userId: string, milestoneId: string): Promise<void> {
  await submitMutation(userId, 'plan_milestones', milestoneId, 'delete', null);
}

export async function syncSingleWorkoutSchedule(userId: string, schedule: WorkoutScheduleEntry): Promise<void> {
  const payload = {
    id: schedule.id,
    user_id: userId,
    day_of_week: schedule.dayOfWeek,
    routine_id: schedule.routineId,
    scheduled_time: schedule.scheduledTime,
    session_label: schedule.sessionLabel,
    duration_minutes: schedule.durationMinutes,
    is_enabled: schedule.isEnabled,
  };
  await submitMutation(userId, 'workout_schedules', schedule.id, 'upsert', payload);
}

export async function syncSingleWorkoutScheduleDelete(userId: string, scheduleId: string): Promise<void> {
  await submitMutation(userId, 'workout_schedules', scheduleId, 'delete', null);
}

async function submitMutation(userId: string, table: import('./database').PendingSyncItem['table'], entityId: string, action: 'upsert' | 'delete', data: Record<string, unknown> | null) {
  // Persist the latest intent before any request, including online saves.
  await enqueuePendingMutation({ userId, table, entityId, action, data, timestamp: new Date().toISOString() });
  await flushPendingSyncQueue(userId);
}

export async function syncSingleDayPlan(userId: string, plan: import('../types').DayPlan) {
  const payload = dayPlanToCloud(userId, plan);
  await submitMutation(userId, 'day_plans', payload.id, 'upsert', payload);
}

export async function syncSingleSettings(userId: string, settings: UserSettings) {
  await submitMutation(userId, 'profiles', userId, 'upsert', settingsToCloud(userId, settings));
}
