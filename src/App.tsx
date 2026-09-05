import { useState, useEffect } from 'react';
import { 
  initializeDatabase, 
  db, 
  getTodayRoutine, 
  calculateStreakStats, 
  StreakStats 
} from './db';
import { Exercise, Routine, WeeklyScheduleItem, WorkoutLog, UserSettings } from './types';
import { DEFAULT_USER_SETTINGS, INITIAL_WEEKLY_SCHEDULE } from './db/seedData';
import { Navbar, TabType } from './components/common/Navbar';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { ExerciseLibrary } from './components/exercises/ExerciseLibrary';
import { WeeklyPlanner } from './components/planner/WeeklyPlanner';
import { ProgressStats } from './components/stats/ProgressStats';
import { SettingsView } from './components/settings/SettingsView';
import { WorkoutPlayer } from './components/player/WorkoutPlayer';

export function App() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isTvMode, setIsTvMode] = useState<boolean>(false);

  // Data states
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleItem[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [todayRoutine, setTodayRoutine] = useState<Routine | null>(null);
  const [isRestDay, setIsRestDay] = useState<boolean>(false);
  const [streakStats, setStreakStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
    totalMinutes: 0,
    hasWorkedOutToday: false,
  });

  // Active workout player state
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeRoutineExercises, setActiveRoutineExercises] = useState<Exercise[]>([]);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Load and refresh all data
  const loadAppData = async () => {
    try {
      await initializeDatabase();

      const [allEx, allRoutines, allSchedule, allLogs, userSettings, todayInfo, streaks] = await Promise.all([
        db.exercises.toArray(),
        db.routines.toArray(),
        db.weeklySchedule.toArray(),
        db.workoutLogs.orderBy('completedAt').reverse().toArray(),
        db.settings.get('current_settings'),
        getTodayRoutine(),
        calculateStreakStats(),
      ]);

      setExercises(allEx);
      setRoutines(allRoutines);
      setWeeklySchedule(allSchedule.length > 0 ? allSchedule : INITIAL_WEEKLY_SCHEDULE);
      setWorkoutLogs(allLogs);
      if (userSettings) setSettings(userSettings);
      setTodayRoutine(todayInfo.routine);
      setIsRestDay(todayInfo.isRestDay);
      setStreakStats(streaks);

      // Check if URL shortcut ?action=start-today was clicked
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'start-today') {
        const target = todayInfo.routine || allRoutines[0];
        if (target) {
          startRoutinePlayback(target, allEx);
        }
      }
    } catch (err) {
      console.error('Error loading app data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();

    // Listen for PWA beforeinstallprompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
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

  // Start playback of a routine
  const startRoutinePlayback = (routine: Routine, exList: Exercise[] = exercises) => {
    const routineExercises = routine.exerciseIds
      .map(id => exList.find(e => e.id === id))
      .filter((e): e is Exercise => e !== undefined);

    if (routineExercises.length === 0) return;

    setActiveRoutine(routine);
    setActiveRoutineExercises(routineExercises);
  };

  // Start previewing a single exercise
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

  // Workout finished & saved
  const handleFinishWorkout = async (logData: Omit<WorkoutLog, 'id'>) => {
    const newLog: WorkoutLog = {
      ...logData,
      id: `log-${Date.now()}`,
    };

    await db.workoutLogs.add(newLog);
    setActiveRoutine(null);
    setActiveRoutineExercises([]);
    await loadAppData();
    setCurrentTab('stats');
  };

  // Toggle favorite exercise
  const handleToggleFavorite = async (id: string, isFav: boolean) => {
    await db.exercises.update(id, { isFavorite: isFav });
    setExercises(prev => prev.map(e => e.id === id ? { ...e, isFavorite: isFav } : e));
  };

  // Add custom exercise
  const handleAddExercise = async (newEx: Omit<Exercise, 'id' | 'createdAt'>) => {
    const ex: Exercise = {
      ...newEx,
      id: `custom-ex-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await db.exercises.add(ex);
    setExercises(prev => [ex, ...prev]);
  };

  // Update schedule day
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

  // Apply quick schedule presets
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

  // Update settings
  const handleUpdateSettings = async (newSettings: UserSettings) => {
    await db.settings.put(newSettings);
    setSettings(newSettings);
  };

  const miniRescueRoutine = routines.find(r => r.isMiniRescue) || routines[routines.length - 1] || null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 animate-spin mb-4 shadow-xl shadow-emerald-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <span className="text-2xl animate-pulse">🧘‍♂️</span>
          </div>
        </div>
        <h2 className="text-xl font-bold text-white font-['Tajawal']">جاري إعداد روتينك اليومي...</h2>
        <p className="text-xs text-slate-400 mt-1">تجهيز التمارين وقاعدة البيانات المحلية</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-['Tajawal'] ${isTvMode ? 'text-lg' : ''}`}>
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        streakCount={streakStats.currentStreak}
        isTvMode={isTvMode}
        onToggleTvMode={() => setIsTvMode(!isTvMode)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6">
        {currentTab === 'home' && (
          <HomeDashboard
            todayRoutine={todayRoutine}
            isRestDay={isRestDay}
            streakStats={streakStats}
            miniRescueRoutine={miniRescueRoutine}
            onStartRoutine={(r) => startRoutinePlayback(r)}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'exercises' && (
          <ExerciseLibrary
            exercises={exercises}
            onToggleFavorite={handleToggleFavorite}
            onAddExercise={handleAddExercise}
            onPreviewExerciseInPlayer={handlePreviewSingleExercise}
          />
        )}

        {currentTab === 'planner' && (
          <WeeklyPlanner
            schedule={weeklySchedule}
            routines={routines}
            exercises={exercises}
            onUpdateScheduleDay={handleUpdateScheduleDay}
            onApplyPreset={handleApplyPreset}
            onStartRoutine={(r) => startRoutinePlayback(r)}
          />
        )}

        {currentTab === 'stats' && (
          <ProgressStats
            streakStats={streakStats}
            workoutLogs={workoutLogs}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onInstallPwa={handleInstallPwa}
            canInstallPwa={!!deferredPrompt}
          />
        )}
      </main>

      {/* Active Workout Player Modal / Screen */}
      {activeRoutine && activeRoutineExercises.length > 0 && (
        <WorkoutPlayer
          routine={activeRoutine}
          exercises={activeRoutineExercises}
          defaultRestSeconds={settings.defaultRestSeconds}
          soundEnabled={settings.soundBeepsEnabled}
          voiceCoachEnabled={settings.voiceCoachEnabled}
          isTvModeInitial={isTvMode}
          onClose={() => {
            setActiveRoutine(null);
            setActiveRoutineExercises([]);
          }}
          onFinishWorkout={handleFinishWorkout}
        />
      )}
    </div>
  );
}

export default App;
