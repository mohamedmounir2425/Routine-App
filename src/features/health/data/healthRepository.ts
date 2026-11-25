import { INITIAL_EXERCISES } from '../../../db/seedData';
import { syncFingerprint } from '../../../db/syncEntities';
import { db } from '../../../db/database';
import { calculateStreakStats, getWeeklyCompletionStatus } from '../../../db/planQueries';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { syncSingleWorkoutLog } from '../../../db/syncEngine';
import type { Exercise, WorkoutLog } from '../../../types';

import { getWorkoutOccurrences, isWorkoutAvailable, healthRows, routineForSession, putHealth, recordTrainingExecution } from './trainingRepository';
export { calculateStreakStats };
export async function getTodayRoutine() {
  const date = new Date();
  const occurrences = await getWorkoutOccurrences();
  const plans = await healthRows('plan');
  const runs = await healthRows('run');
  const next = occurrences.find(o => isWorkoutAvailable(o,runs.find(r=>r.id===o.runId),plans.find(p=>p.id===o.planId)));
  const plan = plans.find(p => p.id === next?.planId);
  const session = plan?.sessions.find(s => s.id === next?.sessionId);
  return { routine: plan && session ? routineForSession(plan,session,next) : null,
    isRestDay: !occurrences.length && runs.some(r => !r.endedOn && r.restDays?.includes(date.getDay())) };
}

export async function loadHealthSnapshot() {
  const [exercises, routines, schedule, workoutLogs, today, streakStats, weeklyCompletion] = await Promise.all([
    loadPlaybackExercises(), db.routines.toArray(), db.weeklySchedule.toArray(),
    loadWorkoutHistory(),
    getTodayRoutine(), calculateStreakStats(), getWeeklyCompletionStatus(),
  ]);
  return { exercises, routines, weeklySchedule: schedule,
    workoutLogs, todayRoutine: today.routine, isRestDay: today.isRestDay, streakStats, weeklyCompletion };
}

export async function loadPlaybackExercises() {
  const library=await db.exercises.toArray();
  const overrides=await healthRows('exercise');
  for(const e of library){
    const initial=INITIAL_EXERCISES.find(i=>i.id===e.id);
    if(!overrides.some(o=>o.id===e.id)&&(!initial||syncFingerprint(initial)!==syncFingerprint(e)))await putHealth('exercise',e);
  }
  return [...new Map([...library,...overrides].map(e=>[e.id,e])).values()];
}

export async function saveWorkout(logData: Omit<WorkoutLog, 'id'>) {
  const log: WorkoutLog = { ...logData, id: crypto.randomUUID() };
  await recordTrainingExecution(log);
  if (isSupabaseConfigured()) {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) return syncSingleWorkoutLog(session.user.id, log);
    }).catch(error => console.error('Workout sync will be retried:', error));
  }
}

export async function addExercise(draft: Omit<Exercise, 'id' | 'createdAt'>) {
  const exercise: Exercise = { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await putHealth('exercise',exercise);
  await db.exercises.add(exercise);
  return exercise;
}

export async function toggleHealthFavorite(id:string,isFavorite:boolean){
  const exercise=(await loadPlaybackExercises()).find(e=>e.id===id);
  if(!exercise)throw new Error('التمرين غير متاح');
  await putHealth('exercise',{...exercise,isFavorite});
  await db.exercises.put({...exercise,isFavorite});
}

async function loadWorkoutHistory(){
  const legacy=await db.workoutLogs.toArray();const current=await healthRows('execution');
  return [...new Map([...legacy,...current].map(log=>[log.id,log])).values()].sort((a,b)=>b.completedAt.localeCompare(a.completedAt));
}
