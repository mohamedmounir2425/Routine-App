import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppController } from './app/useAppController';
import { Navbar } from './components/common/Navbar';
import { SpaceContextBar } from './components/layout/SpaceContextBar';
import { HomeDashboard } from './features/dashboard/HomeDashboard';
import { TodayPage } from './features/today';
import { ExerciseLibrary } from './features/exercises';
import { PlannerPage, RoutineBuilderModal } from './features/planner';
import { ProgressStats } from './features/stats';
import { SettingsView } from './features/settings';
import { WorkoutPlayer } from './features/player';
import { SpacesPage } from './features/spaces/SpacesPage';
import { SpaceTasksView } from './features/spaces/SpaceTasksView';
import { SpacesOnboardingModal } from './features/spaces/components/SpacesOnboardingModal';
import { WorshipSpace } from './features/worship/WorshipSpace';
import { WorkSpace } from './features/work/WorkSpace';
import { HomeSpace } from './features/home/HomeSpace';
import { PlansSpace } from './features/plans/PlansSpace';
import { GlobalProgressSpace } from './features/progress/GlobalProgressSpace';
import { AuthModal } from './components/auth/AuthModal';
import { LifeSpaceId } from './types/spaces';
import { useReminderScheduler } from './app/useReminderScheduler';
import { useContextualSwipeNavigation } from './hooks/useContextualSwipeNavigation';

export function App() {
  const {
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
  } = useAppController();

  // Background reminder scheduler (workout & desk breaks)
  useReminderScheduler(settings, streakStats.hasWorkedOutToday);

  // Contextual Left/Right Swipe Navigation (Root tabs & Nested Space tabs)
  const isWorkoutActive = !!(activeRoutine && activeRoutineExercises.length > 0);
  useContextualSwipeNavigation({
    isWorkoutActive,
  });

  const handleCompleteOnboarding = (enabledSpaces: LifeSpaceId[]) => {
    handleUpdateSettings({
      ...settings,
      enabledSpaces,
      hasCompletedOnboarding: true,
    });
  };

  if (loadError) {
    return <div role="alert" className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-bold">تعذر فتح بياناتك / Unable to load your data</h1>
      <p className="text-slate-400">{loadError}</p>
      <button className="rounded-xl px-5 py-3 bg-emerald-400 text-slate-950 font-bold" onClick={() => void loadAppData()}>إعادة المحاولة / Retry</button>
    </div>;
  }

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
    <div className={`min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-['Tajawal'] relative overflow-x-hidden ${isTvMode ? 'tv-mode text-lg' : ''}`}>
      {/* Apple Liquid Glass Dynamic Ambient Fluid Mesh Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div 
          className="liquid-orb-1 absolute -top-24 -right-24 w-[380px] sm:w-[520px] h-[380px] sm:h-[520px] rounded-full blur-[95px] sm:blur-[125px] transition-all duration-700 opacity-90"
          style={{
            background: theme === 'dark' 
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.10) 60%, transparent 80%)' 
              : 'radial-gradient(circle, rgba(16, 185, 129, 0.09) 0%, rgba(167, 243, 208, 0.04) 50%, transparent 75%)',
          }}
        />
        <div 
          className="liquid-orb-2 absolute top-1/3 -left-28 w-[350px] sm:w-[480px] h-[350px] sm:h-[480px] rounded-full blur-[90px] sm:blur-[115px] transition-all duration-700 opacity-80"
          style={{
            background: theme === 'dark' 
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.20) 0%, rgba(14, 116, 144, 0.08) 60%, transparent 80%)' 
              : 'radial-gradient(circle, rgba(56, 189, 248, 0.07) 0%, rgba(224, 242, 254, 0.03) 50%, transparent 75%)',
          }}
        />
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
        streakCount={streakStats.currentStreak}
        isTvMode={isTvMode}
        onToggleTvMode={() => setIsTvMode(!isTvMode)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Context Navigation Sub-Bar (Only active when inside a space) */}
      <SpaceContextBar />

      {/* Main Routed Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-12 relative z-10">
        <Routes>
          {/* Canonical Today Route */}
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route
            path="/today"
            element={<TodayPage onStartRoutine={(r) => startRoutinePlayback(r)} />}
          />

          {/* Spaces Master Directory */}
          <Route
            path="/spaces"
            element={
              <SpacesPage
                enabledSpaces={settings.enabledSpaces}
                streakCount={streakStats.currentStreak}
                todayRoutineName={todayRoutine?.name}
                onStartRoutine={() => todayRoutine && startRoutinePlayback(todayRoutine)}
              />
            }
          />

          {/* 🕌 Worship Space */}
          <Route path="/worship/*" element={<WorshipSpace />} />

          {/* 🏋️ Health Space */}
          <Route
            path="/health"
            element={
              <HomeDashboard
                todayRoutine={todayRoutine}
                isRestDay={isRestDay}
                streakStats={streakStats}
                miniRescueRoutine={miniRescueRoutine}
                weeklyCompletion={weeklyCompletion}
                exercises={exercises}
                onStartRoutine={(r) => startRoutinePlayback(r)}
              />
            }
          />
          <Route
            path="/health/exercises"
            element={
              <ExerciseLibrary
                exercises={exercises}
                onToggleFavorite={handleToggleFavorite}
                onAddExercise={handleAddExercise}
                onPreviewExerciseInPlayer={handlePreviewSingleExercise}
              />
            }
          />
          <Route
            path="/health/plans"
            element={
              <PlannerPage
                exercises={exercises}
                weeklySchedule={weeklySchedule}
                routines={routines}
                onStartRoutine={(r) => startRoutinePlayback(r)}
                onUpdateScheduleDay={handleUpdateScheduleDay}
                onApplyPreset={handleApplyPreset}
                onCreateCustomRoutine={handleOpenCreateRoutine}
                onEditRoutine={handleOpenEditRoutine}
                onDeleteRoutine={handleDeleteCustomRoutine}
              />
            }
          />
          <Route
            path="/health/progress"
            element={
              <ProgressStats
                streakStats={streakStats}
                workoutLogs={workoutLogs}
              />
            }
          />
          <Route path="/health/*" element={<Navigate to="/health" replace />} />
          <Route path="/health/tasks" element={<SpaceTasksView spaceId="health" />} />

          {/* 💼 Work Space */}
          <Route path="/work/*" element={<WorkSpace />} />

          {/* 🏠 Home Space */}
          <Route path="/home/*" element={<HomeSpace />} />

          {/* 🎯 Plans Space */}
          <Route path="/plans/*" element={<PlansSpace />} />

          {/* 📊 Global Progress */}
          <Route path="/progress/*" element={<GlobalProgressSpace />} />

          {/* Legacy Redirects */}
          <Route path="/exercises" element={<Navigate to="/health/exercises" replace />} />
          <Route path="/planner" element={<Navigate to="/health/plans" replace />} />
          <Route path="/stats" element={<Navigate to="/progress" replace />} />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onInstallPwa={handleInstallPwa}
                canInstallPwa={!!deferredPrompt}
                onRefreshData={loadAppData}
                theme={theme}
                onSetTheme={handleSetTheme}
                isTvMode={isTvMode}
                onToggleTvMode={() => setIsTvMode(!isTvMode)}
              />
            }
          />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
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

      {/* Spaces First-Launch Onboarding Modal */}
      <SpacesOnboardingModal
        isOpen={!settings.hasCompletedOnboarding}
        onSave={handleCompleteOnboarding}
      />

      {/* Cloud Authentication Modal */}
      <AuthModal />

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
