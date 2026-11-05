import type { DayPlan, LifeTask, HomeProject, Routine, UserSettings } from '../types';

/** Explicit nulls clear removed values; omitted JSON keys would leave old cloud values. */
export function taskToCloud(userId: string, task: LifeTask) {
  const status = task.status ?? (task.isCompleted ? 'DONE' : 'TODO');
  return {
    id: task.id, user_id: userId, space_id: task.spaceId, title: task.title,
    description: task.description ?? null, due_date: task.dueDate ?? null,
    scheduled_time: task.scheduledTime ?? null, estimated_minutes: task.estimatedMinutes ?? null,
    priority: task.priority, status, is_completed: status === 'DONE', completed_at: task.completedAt ?? null,
    is_recurring: task.isRecurring ?? false, recurrence_rule: task.recurrenceRule ?? null,
    recurring_completion_dates: task.recurringCompletionDates ?? [],
    source_type: task.sourceType ?? null, source_id: task.sourceId ?? null,
    project_id: task.projectId ?? null, plan_id: task.planId ?? null, milestone_id: task.milestoneId ?? null,
    focus_sessions: task.focusSessions ?? [],
    actual_minutes: task.focusSessions ? task.focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0) : task.actualMinutes ?? 0,
    waiting_context: task.waitingContext ?? null, interruption_context: task.interruptionContext ?? null,
    deadline_at: task.deadlineAt ?? null, commitment: task.commitment ?? null,
    goal_impact: task.goalImpact ?? null, depends_on_task_ids: task.dependsOnTaskIds ?? [],
    created_at: task.createdAt, updated_at: task.updatedAt ?? task.createdAt, client_data_version: 1,
  };
}

export type CloudTask = Partial<ReturnType<typeof taskToCloud>> & {
  id: string; title: string; space_id: LifeTask['spaceId']; is_completed: boolean; created_at: string;
};

export function taskFromCloud(row: CloudTask, local?: LifeTask): LifeTask {
  const base: LifeTask = {
    ...local, id: row.id, title: row.title, spaceId: row.space_id,
    description: row.description ?? undefined, dueDate: row.due_date ?? undefined,
    scheduledTime: row.scheduled_time ?? undefined, estimatedMinutes: row.estimated_minutes ?? undefined,
    priority: row.priority ?? 'medium', isCompleted: row.is_completed,
    completedAt: row.completed_at ?? undefined, isRecurring: row.is_recurring ?? false,
    recurrenceRule: row.recurrence_rule ?? undefined, createdAt: row.created_at,
  };
  // Newly added NULL columns on old rows are not evidence that local metadata was removed.
  if ((row.client_data_version ?? 0) < 1) {
    base.status = row.is_completed ? 'DONE' : local?.status === 'DONE' ? 'TODO' : local?.status ?? 'TODO';
    // Older clients already write some lineage fields, even without the version marker.
    base.sourceType = row.source_type ?? local?.sourceType;
    base.sourceId = row.source_id ?? local?.sourceId;
    base.projectId = row.project_id ?? local?.projectId;
    base.planId = row.plan_id ?? local?.planId;
    base.milestoneId = row.milestone_id ?? local?.milestoneId;
    base.recurringCompletionDates = row.recurring_completion_dates ?? local?.recurringCompletionDates;
    return base;
  }
  return {
    ...base, status: row.status ?? (row.is_completed ? 'DONE' : 'TODO'),
    sourceType: row.source_type ?? undefined, sourceId: row.source_id ?? undefined,
    projectId: row.project_id ?? undefined, planId: row.plan_id ?? undefined, milestoneId: row.milestone_id ?? undefined,
    recurringCompletionDates: row.recurring_completion_dates ?? [],
    focusSessions: row.focus_sessions ?? [], actualMinutes: row.actual_minutes ?? undefined,
    waitingContext: row.waiting_context ?? undefined, interruptionContext: row.interruption_context ?? undefined,
    deadlineAt: row.deadline_at ?? undefined, commitment: row.commitment ?? undefined,
    goalImpact: row.goal_impact ?? undefined, dependsOnTaskIds: row.depends_on_task_ids ?? [],
    updatedAt: row.updated_at ?? undefined,
  };
}

export function projectToCloud(userId: string, project: HomeProject) {
  return {
    id: project.id, user_id: userId, space_id: project.spaceId ?? 'home', title: project.title,
    description: project.description ?? null, status: project.status, steps: project.steps,
    next_action_id: project.nextActionId ?? null, next_action_title: project.nextActionTitle ?? null,
    target_date: project.targetDate ?? null, created_at: project.createdAt, completed_at: project.completedAt ?? null,
    repository_url: project.repositoryUrl ?? null, dev_url: project.devUrl ?? null, api_url: project.apiUrl ?? null,
    branch: project.branch ?? null, run_command: project.runCommand ?? null,
    requires_vpn: project.requiresVpn ?? false, setup_notes: project.setupNotes ?? null,
  };
}

export function projectFromCloud(row: ReturnType<typeof projectToCloud>): HomeProject {
  return {
    id: row.id, spaceId: row.space_id ?? 'home', title: row.title, description: row.description ?? undefined,
    status: row.status, steps: row.steps ?? [], nextActionId: row.next_action_id ?? undefined,
    nextActionTitle: row.next_action_title ?? undefined, targetDate: row.target_date ?? undefined,
    createdAt: row.created_at, completedAt: row.completed_at ?? undefined,
    repositoryUrl: row.repository_url ?? undefined, devUrl: row.dev_url ?? undefined, apiUrl: row.api_url ?? undefined,
    branch: row.branch ?? undefined, runCommand: row.run_command ?? undefined,
    requiresVpn: row.requires_vpn ?? false, setupNotes: row.setup_notes ?? undefined,
  };
}

export function routineToCloud(userId: string, routine: Routine) {
  return {
    id: routine.id, user_id: userId, name: routine.name, description: routine.description,
    exercise_ids: routine.exerciseIds, total_estimated_minutes: routine.totalEstimatedMinutes,
    level: routine.level, tag: routine.tag, custom_exercise_configs: routine.customExerciseConfigs ?? {},
    is_default: routine.isDefault ?? false, is_mini_rescue: routine.isMiniRescue ?? false,
    plan_session_id: routine.planSessionId ?? null, week_number: routine.weekNumber ?? null,
    session_code: routine.sessionCode ?? null, prescriptions: routine.prescriptions ?? null,
  };
}

export function routineFromCloud(row: ReturnType<typeof routineToCloud>): Routine {
  return {
    id: row.id, name: row.name, description: row.description ?? '', exerciseIds: row.exercise_ids ?? [],
    totalEstimatedMinutes: row.total_estimated_minutes ?? 10, level: row.level ?? 'gentle',
    tag: row.tag ?? 'تمرين مخصص', isCustom: true, customExerciseConfigs: row.custom_exercise_configs ?? {},
    isDefault: row.is_default ?? false, isMiniRescue: row.is_mini_rescue ?? false,
    planSessionId: row.plan_session_id ?? undefined, weekNumber: row.week_number ?? undefined,
    sessionCode: row.session_code ?? undefined, prescriptions: row.prescriptions ?? undefined,
  };
}

export function dayPlanToCloud(userId: string, plan: DayPlan) {
  return {
    id: `${userId}_date_${plan.date}`, user_id: userId, date: plan.date,
    available_minutes: plan.availableMinutes, end_time: plan.endTime,
    essential_task_ids: [...new Set(plan.essentialTaskIds)], updated_at: plan.updatedAt,
  };
}

export function dayPlanFromCloud(row: ReturnType<typeof dayPlanToCloud>): DayPlan {
  return { date: row.date, availableMinutes: row.available_minutes, endTime: row.end_time,
    essentialTaskIds: row.essential_task_ids ?? [], updatedAt: row.updated_at };
}

export function settingsToCloud(userId: string, settings: UserSettings) {
  return {
        id: userId,
        user_name: settings.userName,
        theme: settings.theme || 'dark',
        active_plan_type: settings.activePlanType || '4-weeks',
        current_week_number: settings.currentWeekNumber || 1,
        current_level_number: settings.currentLevelNumber || 1,
        sound_beeps_enabled: settings.soundBeepsEnabled,
        voice_coach_enabled: settings.voiceCoachEnabled,
        voice_language: settings.voiceLanguage || 'ar',
        default_rest_seconds: settings.defaultRestSeconds || 20,
        reminder_enabled: settings.reminderEnabled,
        reminder_time: settings.reminderTime || '18:30',
        reminder_days: settings.reminderDays || [6, 1, 3, 4],
        work_break_reminder_enabled: settings.workBreakReminderEnabled,
        work_break_interval_minutes: settings.workBreakIntervalMinutes || 45,
        screen_wake_lock: settings.screenWakeLock,
        workout_video_autoplay: settings.workoutVideoAutoplay ?? true,
        workout_video_muted: settings.workoutVideoMuted ?? true,
        workout_video_loop: settings.workoutVideoLoop ?? true,
        workout_default_view_mode: settings.workoutDefaultViewMode || 'video',
        today_preferences: settings.todayPreferences ?? null,
        enabled_spaces: settings.enabledSpaces || ['worship', 'health', 'work', 'plans'],
        has_completed_onboarding: settings.hasCompletedOnboarding ?? true,
        updated_at: new Date().toISOString(),

  };
}
