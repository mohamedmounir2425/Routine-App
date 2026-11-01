import { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  initializeDatabase, 
  db, 
  getTodayRoutine, 
  calculateStreakStats, 
  getWeeklyCompletionStatus,
  StreakStats 
} from '../db';
import { Exercise, Routine, WeeklyScheduleItem, WorkoutLog, UserSettings } from '../types';
import { DEFAULT_USER_SETTINGS, INITIAL_WEEKLY_SCHEDULE } from '../db/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncSingleWorkoutLog } from '../db/syncEngine';
import { useAppTheme } from './useAppTheme';
import { useCustomRoutines } from './useCustomRoutines';

export function useAppController() {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isTvMode, setIsTvMode] = useState<boolean>(false);

  // Data states
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [isRestDay, setIsRestDay] = useState<boolean>(false);
  const [weeklyCompletion, setWeeklyCompletion] = useState<{ [dayOfWeek: number]: boolean }>({});
  const [streakStats, setStreakStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
    totalMinutes: 0,
    hasWorkedOutToday: false,
  });

  // Planner sub-tab
  const [plannerSubTab, setPlannerSubTab] = useState<'prescribed' | 'custom'>('prescribed');

  // Active workout player state
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeRoutineExercises, setActiveRoutineExercises] = useState<Exercise[]>([]);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Theme hook
  const { theme, setTheme, handleToggleTheme, handleSetTheme } = useAppTheme(settings, setSettings);

  // Custom routines hook
  const {
    isRoutineBuilderOpen,
    setIsRoutineBuilderOpen,
    editingRoutine,
    setEditingRoutine,
    handleOpenCreateRoutine,
    handleOpenEditRoutine,
    handleSaveCustomRoutine,
    handleDeleteCustomRoutine,
  } = useCustomRoutines(async () => {
    await loadAppData();
  });

  // Lock body scroll when player is open
  useEffect(() => {
    if (activeRoutine) {
      window.scrollTo(0, 0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeRoutine]);

  // Load and refresh all data
  const loadAppData = async () => {
    setLoadError(null);
    try {
      await initializeDatabase();

      const [allEx, allRoutines, allSchedule, allLogs, userSettings, todayInfo, streaks, weeklyStatus] = await Promise.all([
        db.exercises.toArray(),
        db.routines.toArray(),
        db.weeklySchedule.toArray(),
        db.workoutLogs.orderBy('completedAt').reverse().toArray(),
        db.settings.get('current_settings'),
        getTodayRoutine(),
        calculateStreakStats(),
        getWeeklyCompletionStatus(),
      ]);

      setExercises(allEx);
      setRoutines(allRoutines);
      setWeeklySchedule(allSchedule.length > 0 ? allSchedule : INITIAL_WEEKLY_SCHEDULE);
      setWorkoutLogs(allLogs);
      if (userSettings) {
        setSettings(userSettings);
        if (userSettings.theme) {
          setTheme(userSettings.theme);
        }
      }
      setTodayRoutine(todayInfo.routine);
      setIsRestDay(todayInfo.isRestDay);
      setStreakStats(streaks);
      setWeeklyCompletion(weeklyStatus);

      // Check shortcut query param
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'start-today') {
        const target = todayInfo.routine || allRoutines[0];
        if (target) {
          startRoutinePlayback(target, allEx);
        }
      }
    } catch (err) {
      console.error('Error loading app data:', err);
      setLoadError('تعذر تحميل بيانات التطبيق. تأكد من السماح بالتخزين المحلي ثم أعد المحاولة.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const startRoutinePlayback = (routine: Routine, exList: Exercise[] = exercises) => {
    const routineExercises = routine.exerciseIds
      .map(id => exList.find(e => e.id === id))
      .filter((e): e is Exercise => e !== undefined);

    if (routineExercises.length === 0) return;

    setActiveRoutine(routine);
    setActiveRoutineExercises(routineExercises);
  };

  const handlePreviewSingleExercise = (exercise: Exercise) => {
    const singleRoutine: Routine = {
      id: `single-${exercise.id}`,
      name: exercise.arabicName,
      description: exercise.description,
      exerciseIds: [exercise.id],
      totalEstimatedMinutes: Math.ceil(exercise.durationSeconds / 60),
      level: 'gentle',
      tag: 'تمرين فردي',
    };
    setActiveRoutine(singleRoutine);
    setActiveRoutineExercises([exercise]);
  };

  const handleFinishWorkout = async (logData: Omit<WorkoutLog, 'id'>) => {
    const newLog: WorkoutLog = {
      ...logData,
      id: `log-${Date.now()}`,
    };

    await db.workoutLogs.add(newLog);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleWorkoutLog(session.user.id, newLog);
        }
      });
    }

    setActiveRoutine(null);
    setActiveRoutineExercises([]);
    await loadAppData();
    startTransition(() => {
      navigate('/progress');
    });
  };

  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    await db.exercises.update(id, { isFavorite: isFav });
    setExercises(prev => prev.map(e => e.id === id ? { ...e, isFavorite: isFav } : e));
  };

  const handleAddExercise = async (newEx: Omit<Exercise, 'id' | 'createdAt'>) => {
    const ex: Exercise = {
      ...newEx,
      id: `custom-ex-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await db.exercises.add(ex);
    setExercises(prev => [ex, ...prev]);
  };

  const handleUpdateScheduleDay = async (dayOfWeek: number, routineId: string | null) => {
    await db.weeklySchedule.put({
      dayOfWeek,
      dayNameAr: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][dayOfWeek],
      routineId,
    });
    setWeeklySchedule(prev => prev.map(s => s.dayOfWeek === dayOfWeek ? { ...s, routineId } : s));
    const todayInfo = await getTodayRoutine();
    setTodayRoutine(todayInfo.routine);
    setIsRestDay(todayInfo.isRestDay);
  };

  const handleApplyPreset = async (presetType: '3days' | '4days' | 'daily') => {
    const rotA = routines[0]?.id || null;
    const rotB = routines[1]?.id || rotA;

    const newSchedule: WeeklyScheduleItem[] = [
      { dayOfWeek: 6, dayNameAr: 'السبت', routineId: rotA },
      { dayOfWeek: 0, dayNameAr: 'الأحد', routineId: null },
      { dayOfWeek: 1, dayNameAr: 'الاثنين', routineId: rotB },
      { dayOfWeek: 2, dayNameAr: 'الثلاثاء', routineId: presetType === 'daily' ? rotA : null },
      { dayOfWeek: 3, dayNameAr: 'الأربعاء', routineId: rotA },
      { dayOfWeek: 4, dayNameAr: 'الخميس', routineId: presetType === '4days' || presetType === 'daily' ? rotB : null },
      { dayOfWeek: 5, dayNameAr: 'الجمعة', routineId: presetType === 'daily' ? rotB : null },
    ];

    await db.weeklySchedule.clear();
    await db.weeklySchedule.bulkAdd(newSchedule);
    setWeeklySchedule(newSchedule);

    const todayInfo = await getTodayRoutine();
    setTodayRoutine(todayInfo.routine);
    setIsRestDay(todayInfo.isRestDay);
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    await db.settings.put(newSettings);
    setSettings(newSettings);
  };

  const miniRescueRoutine = routines.find(r => r.isMiniRescue) || routines[routines.length - 1] || null;

  return {
    isLoading,
    loadError,
    isTvMode,
    setIsTvMode,
    exercises,
    routines,
    weeklySchedule,
    workoutLogs,
    settings,
    todayRoutine,
    isRestDay,
    weeklyCompletion,
    streakStats,
    isRoutineBuilderOpen,
    setIsRoutineBuilderOpen,
    editingRoutine,
    setEditingRoutine,
    plannerSubTab,
    setPlannerSubTab,
    activeRoutine,
    setActiveRoutine,
    activeRoutineExercises,
    setActiveRoutineExercises,
    deferredPrompt,
    theme,
    handleToggleTheme,
    handleSetTheme,
    handleInstallPwa,
    startRoutinePlayback,
    handlePreviewSingleExercise,
    handleFinishWorkout,
    handleToggleFavorite,
    handleAddExercise,
    handleUpdateScheduleDay,
    handleApplyPreset,
    handleUpdateSettings,
    handleSaveCustomRoutine,
    handleDeleteCustomRoutine,
    handleOpenCreateRoutine,
    handleOpenEditRoutine,
    loadAppData,
    miniRescueRoutine,
  };
}
