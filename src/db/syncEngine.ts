import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from './database';
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
export async function pullUserDataFromCloud(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // 1. Pull Profile / Settings
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile) {
      const localSettings = await db.settings.get('current_settings');
      const updatedSettings: UserSettings = {
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
    const { data: cloudLogs } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId);

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
    const { data: cloudRoutines } = await supabase
      .from('custom_routines')
      .select('*')
      .eq('user_id', userId);

    if (cloudRoutines && cloudRoutines.length > 0) {
      const mappedRoutines: Routine[] = cloudRoutines.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        exerciseIds: r.exercise_ids || [],
        totalEstimatedMinutes: r.total_estimated_minutes || 10,
        level: r.level || 'gentle',
        tag: r.tag || 'تمرين مخصص',
        isCustom: true,
        customExerciseConfigs: r.custom_exercise_configs || {},
      }));
      await db.routines.bulkPut(mappedRoutines);
    }

    // 4. Pull Weekly Schedule
    const { data: cloudSchedule } = await supabase
      .from('weekly_schedule')
      .select('*')
      .eq('user_id', userId);

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
    const { data: cloudAzkar } = await supabase
      .from('azkar_logs')
      .select('*')
      .eq('user_id', userId);

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
    const { data: cloudTasks } = await supabase
      .from('life_tasks')
      .select('*')
      .eq('user_id', userId);

    if (cloudTasks && cloudTasks.length > 0) {
      // Planning metadata remains local until a matching remote schema is deployed.
      const localTasks = new Map((await db.tasks.toArray()).map(task => [task.id, task]));
      const mappedTasks: LifeTask[] = cloudTasks.map((t) => ({
        ...localTasks.get(t.id),
        id: t.id,
        spaceId: t.space_id,
        title: t.title,
        description: t.description,
        dueDate: t.due_date,
        scheduledTime: t.scheduled_time,
        estimatedMinutes: t.estimated_minutes,
        priority: t.priority,
        isCompleted: t.is_completed,
        completedAt: t.completed_at,
        isRecurring: t.is_recurring,
        recurrenceRule: t.recurrence_rule,
        sourceType: t.source_type,
        sourceId: t.source_id,
        projectId: t.project_id,
        planId: t.plan_id,
        milestoneId: t.milestone_id,
        recurringCompletionDates: t.recurring_completion_dates,
        createdAt: t.created_at,
      }));
      await db.tasks.bulkPut(mappedTasks);
    }

    // 7. Safely pull Projects (tolerant if table not yet created on Supabase)
    try {
      const { data: cloudProjects } = await supabase.from('projects').select('*').eq('user_id', userId);
      if (cloudProjects && cloudProjects.length > 0) {
        const mappedProjects: HomeProject[] = cloudProjects.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          status: p.status,
          steps: p.steps || [],
          nextActionId: p.next_action_id,
          nextActionTitle: p.next_action_title,
          targetDate: p.target_date,
          createdAt: p.created_at,
          completedAt: p.completed_at,
          repositoryUrl: p.repository_url,
          devUrl: p.dev_url,
          apiUrl: p.api_url,
          branch: p.branch,
          runCommand: p.run_command,
          requiresVpn: p.requires_vpn,
          setupNotes: p.setup_notes,
        }));
        await db.projects.bulkPut(mappedProjects);
      }
    } catch {
      // Table may not exist yet in remote Supabase schema
    }

    // 8. Safely pull Plans
    try {
      const { data: cloudPlans } = await supabase.from('plans').select('*').eq('user_id', userId);
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
    } catch {}

    // 9. Safely pull Plan Milestones
    try {
      const { data: cloudMilestones } = await supabase.from('plan_milestones').select('*').eq('user_id', userId);
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
    } catch {}

    // 10. Safely pull Workout Schedules
    try {
      const { data: cloudSchedules } = await supabase.from('workout_schedules').select('*').eq('user_id', userId);
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
    } catch {}

    return {
      success: true,
      pulledCounts: {
        logs: cloudLogs?.length || 0,
        tasks: cloudTasks?.length || 0,
        azkar: cloudAzkar?.length || 0,
        routines: cloudRoutines?.length || 0,
      },
    };
  } catch (err: any) {
    console.error('Error pulling user data from Supabase:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

/**
 * Push all local data to Supabase (e.g. on first login or manual sync).
 */
export async function pushLocalDataToCloud(userId: string): Promise<SyncResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    // 1. Push Profile / Settings
    const localSettings = await db.settings.get('current_settings');
    if (localSettings) {
      await supabase.from('profiles').upsert({
        id: userId,
        user_name: localSettings.userName,
        theme: localSettings.theme || 'dark',
        active_plan_type: localSettings.activePlanType || '4-weeks',
        current_week_number: localSettings.currentWeekNumber || 1,
        current_level_number: localSettings.currentLevelNumber || 1,
        sound_beeps_enabled: localSettings.soundBeepsEnabled,
        voice_coach_enabled: localSettings.voiceCoachEnabled,
        voice_language: localSettings.voiceLanguage || 'ar',
        default_rest_seconds: localSettings.defaultRestSeconds || 20,
        reminder_enabled: localSettings.reminderEnabled,
        reminder_time: localSettings.reminderTime || '18:30',
        reminder_days: localSettings.reminderDays || [6, 1, 3, 4],
        work_break_reminder_enabled: localSettings.workBreakReminderEnabled,
        work_break_interval_minutes: localSettings.workBreakIntervalMinutes || 45,
        screen_wake_lock: localSettings.screenWakeLock,
        workout_video_autoplay: localSettings.workoutVideoAutoplay ?? true,
        workout_video_muted: localSettings.workoutVideoMuted ?? true,
        workout_video_loop: localSettings.workoutVideoLoop ?? true,
        workout_default_view_mode: localSettings.workoutDefaultViewMode || 'video',
        enabled_spaces: localSettings.enabledSpaces || ['worship', 'health', 'work', 'plans'],
        has_completed_onboarding: localSettings.hasCompletedOnboarding ?? true,
        updated_at: new Date().toISOString(),
      });
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
      await supabase.from('workout_logs').upsert(records);
    }

    // 3. Push Custom Routines
    const allRoutines = await db.routines.toArray();
    const customRoutines = allRoutines.filter((r) => r.isCustom);
    if (customRoutines.length > 0) {
      const records = customRoutines.map((r) => ({
        id: r.id,
        user_id: userId,
        name: r.name,
        description: r.description,
        exercise_ids: r.exerciseIds,
        total_estimated_minutes: r.totalEstimatedMinutes,
        level: r.level,
        tag: r.tag,
        custom_exercise_configs: r.customExerciseConfigs || {},
      }));
      await supabase.from('custom_routines').upsert(records);
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
      await supabase.from('weekly_schedule').upsert(records);
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
      await supabase.from('azkar_logs').upsert(records);
    }

    // 6. Push Life Tasks
    const localTasks = await db.tasks.toArray();
    if (localTasks.length > 0) {
      const records = localTasks.map((t) => ({
        id: t.id,
        user_id: userId,
        space_id: t.spaceId,
        title: t.title,
        description: t.description,
        due_date: t.dueDate,
        scheduled_time: t.scheduledTime,
        estimated_minutes: t.estimatedMinutes,
        priority: t.priority,
        is_completed: t.isCompleted,
        completed_at: t.completedAt,
        is_recurring: t.isRecurring ?? false,
        recurrence_rule: t.recurrenceRule,
        source_type: t.sourceType,
        source_id: t.sourceId,
        project_id: t.projectId,
        plan_id: t.planId,
        milestone_id: t.milestoneId,
        recurring_completion_dates: t.recurringCompletionDates,
      }));
      await supabase.from('life_tasks').upsert(records);
    }

    // 7. Safely push Projects
    try {
      const localProjects = await db.projects.toArray();
      if (localProjects.length > 0) {
        const records = localProjects.map((p) => ({
          id: p.id,
          user_id: userId,
          title: p.title,
          description: p.description,
          status: p.status,
          steps: p.steps,
          next_action_id: p.nextActionId,
          next_action_title: p.nextActionTitle,
          target_date: p.targetDate,
          created_at: p.createdAt,
          completed_at: p.completedAt,
        }));
        await supabase.from('projects').upsert(records);
      }
    } catch {}

    // 8. Safely push Plans
    try {
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
        await supabase.from('plans').upsert(records);
      }
    } catch {}

    // 9. Safely push Plan Milestones
    try {
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
        await supabase.from('plan_milestones').upsert(records);
      }
    } catch {}

    // 10. Safely push Workout Schedules
    try {
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
        await supabase.from('workout_schedules').upsert(records);
      }
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error('Error pushing local data to Supabase:', err);
    return { success: false, error: err?.message || 'Unknown error' };
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

  const pullResult = await pullUserDataFromCloud(userId);
  if (!pullResult.success) {
    return pullResult;
  }

  const pushResult = await pushLocalDataToCloud(userId);
  return pushResult;
}

/**
 * Check for real Internet connectivity using a fast health check ping.
 * Prevents false positives from captive portals or local WiFi.
 */
export async function checkRealConnectivity(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // Light ping to Supabase auth endpoint
    const { error } = await supabase.auth.getSession();
    clearTimeout(timeoutId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Enqueue a mutation to Dexie pendingSync store with Operation Squashing.
 * 
 * Squashing Logic:
 * - If item already in queue with action 'upsert' and new action is 'delete':
 *   - If it was created offline (never sent to cloud), cancel both completely!
 *   - If it existed on cloud, change pending action to 'delete'.
 * - If item already in queue with action 'upsert' and new action is 'upsert':
 *   - Overwrite data with latest values and update timestamp (LWW).
 */
export async function enqueuePendingMutation(
  item: Omit<import('./database').PendingSyncItem, 'id' | 'retryCount' | 'status'>,
  isCreatedOffline: boolean = false
): Promise<void> {
  try {
    const existing = await db.pendingSync
      .where('[table+entityId]')
      .equals([item.table, item.entityId])
      .first();

    if (existing) {
      if (existing.action === 'upsert' && item.action === 'delete') {
        const wasCreatedOffline = existing.isCreatedOffline || isCreatedOffline;
        if (wasCreatedOffline) {
          // Cancel both: was created offline, now deleted offline. Never touch cloud!
          if (existing.id) await db.pendingSync.delete(existing.id);
          return;
        } else {
          // Record existed on cloud prior to this session -> must retain 'delete' action for cloud sync
          await db.pendingSync.put({
            ...existing,
            action: 'delete',
            data: null,
            timestamp: item.timestamp,
            status: 'pending',
            retryCount: 0,
            nextRetryAt: undefined,
          });
          return;
        }
      }

      // If updating an existing queued upsert
      if (item.action === 'upsert') {
        await db.pendingSync.put({
          ...existing,
          action: 'upsert',
          data: item.data,
          timestamp: item.timestamp,
          status: 'pending',
          retryCount: 0,
          nextRetryAt: undefined,
          isCreatedOffline: existing.isCreatedOffline || isCreatedOffline,
        });
        return;
      }
    }

    // Add new pending item
    await db.pendingSync.add({
      ...item,
      status: 'pending',
      retryCount: 0,
      isCreatedOffline: item.isCreatedOffline ?? isCreatedOffline,
    });
  } catch (err) {
    console.error('Failed to enqueue pending sync mutation:', err);
  }
}

/**
 * Process and flush the offline mutation queue with Exponential Backoff & Max Retries (3).
 * Non-blocking: individual failed items do not freeze the rest of the queue.
 */
export async function flushPendingSyncQueue(userId: string): Promise<{ processed: number; failed: number }> {
  const isConnected = await checkRealConnectivity();
  if (!isConnected) {
    return { processed: 0, failed: 0 };
  }

  const now = Date.now();
  const queue = await db.pendingSync
    .where('userId')
    .equals(userId)
    .and((item) => item.status === 'pending' && (!item.nextRetryAt || item.nextRetryAt <= now))
    .toArray();

  if (queue.length === 0) {
    return { processed: 0, failed: 0 };
  }

  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      let error: any = null;

      if (item.action === 'delete') {
        const res = await supabase.from(item.table).delete().eq('id', item.entityId);
        error = res.error;
      } else {
        const res = await supabase.from(item.table).upsert(item.data);
        error = res.error;
      }

      if (!error) {
        if (item.id) await db.pendingSync.delete(item.id);
        processed++;
      } else {
        throw error;
      }
    } catch (err: any) {
      failed++;
      const retries = (item.retryCount || 0) + 1;
      const isMaxExceeded = retries >= 3;

      await db.pendingSync.put({
        ...item,
        retryCount: retries,
        status: isMaxExceeded ? 'failed' : 'pending',
        // Exponential backoff: 2s, 4s, 8s
        nextRetryAt: isMaxExceeded ? undefined : Date.now() + Math.pow(2, retries) * 1000,
        lastError: err?.message || 'Network error',
      });
    }
  }

  return { processed, failed };
}

/**
 * Get count of active pending mutations
 */
export async function getPendingSyncCount(userId: string): Promise<number> {
  try {
    return await db.pendingSync
      .where('userId')
      .equals(userId)
      .and((item) => item.status === 'pending')
      .count();
  } catch {
    return 0;
  }
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

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'workout_logs',
      entityId: log.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: log.completedAt || new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('workout_logs').upsert(payload);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for workout log, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'workout_logs',
      entityId: log.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: log.completedAt || new Date().toISOString(),
    });
  }
}

export async function syncSingleTask(userId: string, task: LifeTask): Promise<void> {
  const payload = {
    id: task.id,
    user_id: userId,
    space_id: task.spaceId,
    title: task.title,
    description: task.description,
    due_date: task.dueDate,
    scheduled_time: task.scheduledTime,
    estimated_minutes: task.estimatedMinutes,
    priority: task.priority,
    is_completed: task.isCompleted,
    completed_at: task.completedAt,
    is_recurring: task.isRecurring ?? false,
    recurrence_rule: task.recurrenceRule,
  };

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'life_tasks',
      entityId: task.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('life_tasks').upsert(payload);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for task, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'life_tasks',
      entityId: task.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function syncSingleTaskDelete(userId: string, taskId: string): Promise<void> {
  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'life_tasks',
      entityId: taskId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('life_tasks').delete().eq('id', taskId);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for task delete, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'life_tasks',
      entityId: taskId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
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

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'azkar_logs',
      entityId: log.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: log.completedAt || new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('azkar_logs').upsert(payload);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for azkar log, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'azkar_logs',
      entityId: log.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: log.completedAt || new Date().toISOString(),
    });
  }
}

export async function syncSingleProject(userId: string, project: HomeProject): Promise<void> {
  const payload = {
    id: project.id,
    user_id: userId,
    title: project.title,
    description: project.description,
    status: project.status,
    steps: project.steps,
    next_action_id: project.nextActionId,
    next_action_title: project.nextActionTitle,
    target_date: project.targetDate,
    created_at: project.createdAt,
    completed_at: project.completedAt,
    repository_url: project.repositoryUrl,
    dev_url: project.devUrl,
    api_url: project.apiUrl,
    branch: project.branch,
    run_command: project.runCommand,
    requires_vpn: project.requiresVpn,
    setup_notes: project.setupNotes,
  };

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'projects',
      entityId: project.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('projects').upsert(payload);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for project, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'projects',
      entityId: project.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function syncSingleProjectDelete(userId: string, projectId: string): Promise<void> {
  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'projects',
      entityId: projectId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for project delete, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'projects',
      entityId: projectId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
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

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'plans',
      entityId: plan.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: plan.updatedAt || new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('plans').upsert(payload);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for plan, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'plans',
      entityId: plan.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: plan.updatedAt || new Date().toISOString(),
    });
  }
}

export async function syncSinglePlanDelete(userId: string, planId: string): Promise<void> {
  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'plans',
      entityId: planId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('plans').delete().eq('id', planId);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for plan delete, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'plans',
      entityId: planId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
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

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'plan_milestones',
      entityId: milestone.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: milestone.completedAt || new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('plan_milestones').upsert(payload);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for milestone, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'plan_milestones',
      entityId: milestone.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: milestone.completedAt || new Date().toISOString(),
    });
  }
}

export async function syncSingleMilestoneDelete(userId: string, milestoneId: string): Promise<void> {
  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'plan_milestones',
      entityId: milestoneId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('plan_milestones').delete().eq('id', milestoneId);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for milestone delete, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'plan_milestones',
      entityId: milestoneId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
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

  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'workout_schedules',
      entityId: schedule.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('workout_schedules').upsert(payload);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for workout schedule, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'workout_schedules',
      entityId: schedule.id,
      action: 'upsert',
      data: payload,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

export async function syncSingleWorkoutScheduleDelete(userId: string, scheduleId: string): Promise<void> {
  if (!isSupabaseConfigured() || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    await enqueuePendingMutation({
      table: 'workout_schedules',
      entityId: scheduleId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const { error } = await supabase.from('workout_schedules').delete().eq('id', scheduleId);
    if (error) throw error;
  } catch (e) {
    console.warn('Background sync failed for workout schedule delete, queueing offline:', e);
    await enqueuePendingMutation({
      table: 'workout_schedules',
      entityId: scheduleId,
      action: 'delete',
      data: null,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}

