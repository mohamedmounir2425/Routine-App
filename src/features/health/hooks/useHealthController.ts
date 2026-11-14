import { useCallback, useEffect, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../db/database';
import type { StreakStats } from '../../../db/planQueries';
import type { Exercise, Routine, UserSettings, WeeklyScheduleItem, WorkoutLog } from '../../../types';
import { addExercise, calculateStreakStats, getTodayRoutine, loadHealthSnapshot, loadPlaybackExercises, saveWorkout } from '../data/healthRepository';
import { useCustomRoutines } from './useCustomRoutines';
import { useReminderScheduler } from './useReminderScheduler';

const emptyStreak: StreakStats = { currentStreak: 0, longestStreak: 0, lastWorkoutDate: null, totalWorkouts: 0, totalMinutes: 0, hasWorkedOutToday: false };

export function useHealthController(settings: UserSettings) {
  const inHealth = useLocation().pathname.startsWith('/health');
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [isRestDay, setIsRestDay] = useState(false);
  const [weeklyCompletion, setWeeklyCompletion] = useState<Record<number, boolean>>({});
  const [streakStats, setStreakStats] = useState(emptyStreak);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeRoutineExercises, setActiveRoutineExercises] = useState<Exercise[]>([]);
  const [playbackLoading, setPlaybackLoading] = useState(false);
  const playbackRequest = useRef(0);
  const shortcutHandled = useRef(false);

  const loadHealthData = useCallback(async () => {
    setLoadError(null);
    try {
      const snapshot = await loadHealthSnapshot();
      setExercises(snapshot.exercises); setRoutines(snapshot.routines);
      setWeeklySchedule(snapshot.weeklySchedule); setWorkoutLogs(snapshot.workoutLogs);
      setTodayRoutine(snapshot.todayRoutine); setIsRestDay(snapshot.isRestDay);
      setStreakStats(snapshot.streakStats); setWeeklyCompletion(snapshot.weeklyCompletion);
    } catch (error) {
      console.error('Health data could not be loaded:', error);
      setLoadError('تعذر تحميل مساحة الصحة. أعد المحاولة.');
    } finally { setIsLoading(false); }
  }, []);

  // A small reactive summary serves the navbar, directory and reminders.
  // Exercise-library failures must never prevent another space from opening.
  useEffect(() => {
    if (settings.enabledSpaces && !settings.enabledSpaces.includes('health')) return;
    const subscription = liveQuery(async () => ({ today: await getTodayRoutine(), streaks: await calculateStreakStats() })).subscribe({
      next: ({ today, streaks }) => { setTodayRoutine(today.routine); setIsRestDay(today.isRestDay); setStreakStats(streaks); },
      error: error => console.error('Health summary could not be loaded:', error),
    });
    return () => subscription.unsubscribe();
  }, [settings.enabledSpaces]);

  useEffect(() => { if (inHealth) void loadHealthData(); }, [inHealth, loadHealthData]);
  useReminderScheduler(settings, streakStats.hasWorkedOutToday);

  const startRoutinePlayback = useCallback(async (routine: Routine) => {
    const request = ++playbackRequest.current;
    setPlaybackLoading(true); setActionError(null);
    try {
      const available = await loadPlaybackExercises();
      if (request !== playbackRequest.current) return;
      const selected = routine.exerciseIds.map(id => available.find(item => item.id === id)).filter((item): item is Exercise => !!item);
      if (!selected.length) throw new Error('لا توجد تمارين متاحة لهذا الروتين.');
      setExercises(available); setActiveRoutine(routine); setActiveRoutineExercises(selected);
    } catch (error) {
      if (request === playbackRequest.current) setActionError(error instanceof Error ? error.message : 'تعذر بدء التمرين.');
    } finally { if (request === playbackRequest.current) setPlaybackLoading(false); }
  }, []);

  useEffect(() => {
    if (shortcutHandled.current || !todayRoutine || new URLSearchParams(window.location.search).get('action') !== 'start-today') return;
    shortcutHandled.current = true;
    void startRoutinePlayback(todayRoutine);
  }, [todayRoutine, startRoutinePlayback]);

  const customRoutines = useCustomRoutines(loadHealthData);
  const closePlayer = () => {
    playbackRequest.current += 1;
    setPlaybackLoading(false); setActiveRoutine(null); setActiveRoutineExercises([]);
  };
  const handlePreviewSingleExercise = (exercise: Exercise) => {
    playbackRequest.current += 1;
    setPlaybackLoading(false); setActionError(null);
    setActiveRoutine({ id: `single-${exercise.id}`, name: exercise.arabicName, description: exercise.description,
      exerciseIds: [exercise.id], totalEstimatedMinutes: Math.ceil(exercise.durationSeconds / 60), level: 'gentle', tag: 'تمرين فردي' });
    setActiveRoutineExercises([exercise]);
  };

  useEffect(() => {
    if (!activeRoutine) return;
    const previous = document.body.style.overflow;
    window.scrollTo(0, 0); document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [activeRoutine]);

  const handleFinishWorkout = async (log: Omit<WorkoutLog, 'id'>) => {
    await saveWorkout(log); closePlayer(); await loadHealthData(); navigate('/progress');
  };
  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    await db.exercises.update(id, { isFavorite });
    setExercises(current => current.map(item => item.id === id ? { ...item, isFavorite } : item));
  };
  const handleAddExercise = async (draft: Omit<Exercise, 'id' | 'createdAt'>) => {
    const exercise = await addExercise(draft); setExercises(current => [exercise, ...current]);
  };
  const refreshToday = async () => {
    const today = await getTodayRoutine(); setTodayRoutine(today.routine); setIsRestDay(today.isRestDay);
  };
  const handleUpdateScheduleDay = async (dayOfWeek: number, routineId: string | null) => {
    await db.weeklySchedule.put({ dayOfWeek, dayNameAr: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek], routineId });
    setWeeklySchedule(current => current.map(day => day.dayOfWeek === dayOfWeek ? { ...day, routineId } : day));
    await refreshToday();
  };
  const handleApplyPreset = async (preset: '3days' | '4days' | 'daily') => {
    const a = routines[0]?.id || null; const b = routines[1]?.id || a;
    const next: WeeklyScheduleItem[] = [
      { dayOfWeek: 6, dayNameAr: 'السبت', routineId: a }, { dayOfWeek: 0, dayNameAr: 'الأحد', routineId: null },
      { dayOfWeek: 1, dayNameAr: 'الاثنين', routineId: b }, { dayOfWeek: 2, dayNameAr: 'الثلاثاء', routineId: preset === 'daily' ? a : null },
      { dayOfWeek: 3, dayNameAr: 'الأربعاء', routineId: a }, { dayOfWeek: 4, dayNameAr: 'الخميس', routineId: preset === '3days' ? null : b },
      { dayOfWeek: 5, dayNameAr: 'الجمعة', routineId: preset === 'daily' ? b : null },
    ];
    await db.transaction('rw', db.weeklySchedule, async () => { await db.weeklySchedule.clear(); await db.weeklySchedule.bulkAdd(next); });
    setWeeklySchedule(next); await refreshToday();
  };

  return { isLoading, loadError, actionError, setActionError, playbackLoading,
    exercises, routines, weeklySchedule, workoutLogs, todayRoutine, isRestDay, weeklyCompletion, streakStats,
    activeRoutine, activeRoutineExercises, closePlayer, startRoutinePlayback,
    handlePreviewSingleExercise, handleFinishWorkout, handleToggleFavorite, handleAddExercise,
    handleUpdateScheduleDay, handleApplyPreset, loadHealthData,
    miniRescueRoutine: routines.find(routine => routine.isMiniRescue) || routines[routines.length - 1] || null,
    ...customRoutines };
}
