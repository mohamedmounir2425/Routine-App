import { db, initializeDatabase } from '../../../db/database';
import { addExercise, loadHealthSnapshot, loadPlaybackExercises, saveWorkout } from './healthRepository';

/** Invoked only by the fake-indexeddb test runner, never against browser storage. */
export async function runHealthRepositoryTests() {
  const results: { name: string; passed: boolean }[] = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  await initializeDatabase();
  const initial = await loadHealthSnapshot();
  check('Health loads its catalog, routines and schedule through its own repository',
    initial.exercises.length > 0 && initial.routines.length > 0 && initial.weeklySchedule.length === 7);

  const toArray = db.exercises.toArray;
  try {
    db.exercises.toArray = () => { throw new Error('Simulated exercise catalog failure'); };
    let rejected = false;
    try { await loadHealthSnapshot(); } catch { rejected = true; }
    const task = { id: 'health-isolation-home-task', title: 'Home still available', spaceId: 'home' as const,
      priority: 'medium' as const, isCompleted: false, createdAt: new Date().toISOString() };
    await db.tasks.put(task);
    check('An exercise read failure does not prevent settings or home tasks from being read', rejected
      && !!await db.settings.get('current_settings') && (await db.tasks.get(task.id))?.title === task.title);
  } finally { db.exercises.toArray = toArray; }

  const exercise = await addExercise({ ...initial.exercises[0], arabicName: 'Fresh playback exercise' });
  check('Starting a workout outside health can read newly added exercises without a cached catalog',
    (await loadPlaybackExercises()).some(item => item.id === exercise.id && item.arabicName === exercise.arabicName));

  const routine = initial.routines[0];
  const completedAt = new Date().toISOString();
  await saveWorkout({ routineId: routine.id, routineName: routine.name, completedAt, durationMinutes: 3,
    exercisesCompleted: 1, totalExercises: 1, notes: 'health-module-regression' });
  check('Workout completion remains locally durable with cloud sync disabled',
    (await db.workoutLogs.toArray()).some(log => log.notes === 'health-module-regression' && log.routineId === routine.id));
  return results;
}
