import { db } from '../../../db/database';
import { calculateStreakStats, getTodayRoutine, getWeeklyCompletionStatus } from '../../../db/planQueries';
import { INITIAL_WEEKLY_SCHEDULE } from '../../../db/seeds/tipsAndDefaults';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { syncSingleWorkoutLog } from '../../../db/syncEngine';
import type { Exercise, WorkoutLog } from '../../../types';

export { calculateStreakStats, getTodayRoutine };

export async function loadHealthSnapshot() {
  const [exercises, routines, schedule, workoutLogs, today, streakStats, weeklyCompletion] = await Promise.all([
    db.exercises.toArray(), db.routines.toArray(), db.weeklySchedule.toArray(),
    db.workoutLogs.orderBy('completedAt').reverse().toArray(),
    getTodayRoutine(), calculateStreakStats(), getWeeklyCompletionStatus(),
  ]);
  return { exercises, routines, weeklySchedule: schedule.length ? schedule : INITIAL_WEEKLY_SCHEDULE,
    workoutLogs, todayRoutine: today.routine, isRestDay: today.isRestDay, streakStats, weeklyCompletion };
}

export async function loadPlaybackExercises() {
  return db.exercises.toArray();
}

export async function saveWorkout(logData: Omit<WorkoutLog, 'id'>) {
  const log: WorkoutLog = { ...logData, id: `log-${Date.now()}` };
  await db.workoutLogs.add(log);
  if (isSupabaseConfigured()) {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) return syncSingleWorkoutLog(session.user.id, log);
    }).catch(error => console.error('Workout sync will be retried:', error));
  }
}

export async function addExercise(draft: Omit<Exercise, 'id' | 'createdAt'>) {
  const exercise: Exercise = { ...draft, id: `custom-ex-${Date.now()}`, createdAt: new Date().toISOString() };
  await db.exercises.add(exercise);
  return exercise;
}
