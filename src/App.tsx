import { useState, useEffect } from 'react';
import { 
  initializeDatabase, 
  db, 
  getTodayRoutine, 
  calculateStreakStats, 
  getWeeklyCompletionStatus,
  saveCustomRoutine,
  deleteCustomRoutine,
  StreakStats 
} from './db';
import { Exercise, Routine, WeeklyScheduleItem, WorkoutLog, UserSettings } from './types';
import { DEFAULT_USER_SETTINGS, INITIAL_WEEKLY_SCHEDULE } from './db/seedData';
import { Navbar, TabType } from './components/common/Navbar';
import { HomeDashboard } from './components/dashboard/HomeDashboard';
import { ExerciseLibrary } from './components/exercises/ExerciseLibrary';
import { WeeklyPlanner } from './components/planner/WeeklyPlanner';
import { TrainingPlanView } from './components/planner/TrainingPlanView';
import { RoutineBuilderModal } from './components/planner/RoutineBuilderModal';
import { ProgressStats } from './components/stats/ProgressStats';
import { SettingsView } from './components/settings/SettingsView';
import { WorkoutPlayer } from './components/player/WorkoutPlayer';
import { SlidingTabs } from './components/common/SlidingTabs';

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
  const [weeklyCompletion, setWeeklyCompletion] = useState<{ [dayOfWeek: number]: boolean }>({});
  const [streakStats, setStreakStats] = useState<StreakStats>({
    currentStreak: 0,
    longestStreak: 0,
    lastWorkoutDate: null,
    totalWorkouts: 0,
    totalMinutes: 0,
    hasWorkedOutToday: false,
  });

  // Custom routine builder modal state
  const [isRoutineBuilderOpen, setIsRoutineBuilderOpen] = useState<boolean>(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Planner sub-tab ('prescribed' for 4-week/3-levels plan, 'custom' for weekly builder)
  const [plannerSubTab, setPlannerSubTab] = useState<'prescribed' | 'custom'>('prescribed');

  // Active workout player state
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [activeRoutineExercises, setActiveRoutineExercises] = useState<Exercise[]>([]);

  // PWA install prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Theme state ('dark' | 'light') with animation
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('movecare_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });

  // Apply theme to document element with smooth transition animation
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');

    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    localStorage.setItem('movecare_theme', theme);

    const timer = setTimeout(() => {
      root.classList.remove('theme-transition');
    }, 450);

    return () => clearTimeout(timer);
  }, [theme]);

  // Lock body scroll when WorkoutPlayer is active and scroll to top
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

  const handleToggleTheme = () => {
    const nextTheme: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    const updated: UserSettings = { ...settings, theme: nextTheme };
    db.settings.put(updated);
    setSettings(updated);
  };

  const handleSetTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    const updated: UserSettings = { ...settings, theme: newTheme };
    db.settings.put(updated);
    setSettings(updated);
  };

  // Load and refresh all data
  const loadAppData = async () => {
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

  // Custom routine actions
  const handleSaveCustomRoutine = async (routine: Routine) => {
    await saveCustomRoutine(routine);
    await loadAppData();
    setIsRoutineBuilderOpen(false);
    setEditingRoutine(null);
  };

  const handleDeleteCustomRoutine = async (routineId: string) => {
    await deleteCustomRoutine(routineId);
    await loadAppData();
  };

  const handleOpenCreateRoutine = () => {
    setEditingRoutine(null);
    setIsRoutineBuilderOpen(true);
  };

  const handleOpenEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsRoutineBuilderOpen(true);
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
    <div className={`min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-['Tajawal'] relative overflow-x-hidden ${isTvMode ? 'text-lg' : ''}`}>
      {/* Apple Liquid Glass Dynamic Ambient Fluid Mesh Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {/* Fluid Orb 1 - Emerald / Mint */}
        <div 
          className="liquid-orb-1 absolute -top-24 -right-24 w-[380px] sm:w-[520px] h-[380px] sm:h-[520px] rounded-full blur-[95px] sm:blur-[125px] transition-all duration-700 opacity-90"
          style={{
            background: theme === 'dark' 
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.10) 60%, transparent 80%)' 
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.09) 0%, rgba(167, 243, 208, 0.04) 50%, transparent 75%)',
          }}
        />
        {/* Fluid Orb 2 - Cyan / Teal / Sky */}
        <div 
          className="liquid-orb-2 absolute top-1/3 -left-28 w-[350px] sm:w-[480px] h-[350px] sm:h-[480px] rounded-full blur-[90px] sm:blur-[115px] transition-all duration-700 opacity-80"
          style={{
            background: theme === 'dark' 
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.20) 0%, rgba(14, 116, 144, 0.08) 60%, transparent 80%)' 
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.07) 0%, rgba(224, 242, 254, 0.03) 50%, transparent 75%)',
          }}
        />
        {/* Fluid Orb 3 - Deep Indigo / Cobalt / Soft Jade */}
        <div 
          className="liquid-orb-3 absolute -bottom-20 right-1/4 w-[420px] sm:w-[550px] h-[420px] sm:h-[550px] rounded-full blur-[100px] sm:blur-[130px] transition-all duration-700 opacity-75"
          style={{
            background: theme === 'dark' 
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(99, 102, 241, 0.10) 50%, transparent 80%)' 
              : 'radial-gradient(circle, rgba(129, 140, 248, 0.07) 0%, rgba(224, 231, 255, 0.03) 50%, transparent 75%)',
          }}
        />
      </div>

      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        streakCount={streakStats.currentStreak}
        isTvMode={isTvMode}
        onToggleTvMode={() => setIsTvMode(!isTvMode)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-28 md:pb-12 relative z-10">
        {currentTab === 'home' && (
          <HomeDashboard
            todayRoutine={todayRoutine}
            isRestDay={isRestDay}
            streakStats={streakStats}
            miniRescueRoutine={miniRescueRoutine}
            weeklyCompletion={weeklyCompletion}
            exercises={exercises}
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
          <div className="space-y-6">
            {/* View Switcher: Prescribed Plan vs Custom Builder */}
            <SlidingTabs
              tabs={[
                { id: 'prescribed', label: 'خطة الـ 4 أسابيع والأساس' },
                { id: 'custom', label: 'تخصيص جدول الأسبوع' },
              ]}
              activeTab={plannerSubTab}
              onChange={(tab) => setPlannerSubTab(tab as 'prescribed' | 'custom')}
              fullWidth
              className="max-w-md mx-auto"
            />

            {plannerSubTab === 'prescribed' ? (
              <TrainingPlanView
                exercises={exercises}
                onStartRoutine={(r) => startRoutinePlayback(r)}
              />
            ) : (
              <WeeklyPlanner
                schedule={weeklySchedule}
                routines={routines}
                exercises={exercises}
                onUpdateScheduleDay={handleUpdateScheduleDay}
                onApplyPreset={handleApplyPreset}
                onStartRoutine={(r) => startRoutinePlayback(r)}
                onCreateCustomRoutine={handleOpenCreateRoutine}
                onEditRoutine={handleOpenEditRoutine}
                onDeleteRoutine={handleDeleteCustomRoutine}
              />
            )}
          </div>
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
            onRefreshData={loadAppData}
            theme={theme}
            onSetTheme={handleSetTheme}
          />
        )}
      </main>

      {/* Routine Builder Modal */}
      <RoutineBuilderModal
        isOpen={isRoutineBuilderOpen}
        onClose={() => {
          setIsRoutineBuilderOpen(false);
          setEditingRoutine(null);
        }}
        onSave={handleSaveCustomRoutine}
        availableExercises={exercises}
        initialRoutine={editingRoutine}
      />

      {/* Active Workout Player Modal / Screen */}
      {activeRoutine && activeRoutineExercises.length > 0 && (
        <WorkoutPlayer
          routine={activeRoutine}
          exercises={activeRoutineExercises}
          allAvailableExercises={exercises}
          defaultRestSeconds={settings.defaultRestSeconds}
          soundEnabled={settings.soundBeepsEnabled}
          voiceCoachEnabled={settings.voiceCoachEnabled}
          isTvModeInitial={isTvMode}
          workoutVideoAutoplay={settings.workoutVideoAutoplay ?? true}
          workoutVideoMuted={settings.workoutVideoMuted ?? true}
          workoutVideoLoop={settings.workoutVideoLoop ?? true}
          defaultViewMode={settings.workoutDefaultViewMode || 'video'}
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
