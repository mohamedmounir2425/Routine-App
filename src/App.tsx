import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppController } from './app/useAppController';
import { Navbar } from './components/common/Navbar';
import { SpaceContextBar } from './components/layout/SpaceContextBar';
import { AuthModal } from './components/auth/AuthModal';
import { HealthProvider, useHealthIntegration } from './features/health/public';
import { SpacesPage, SpacesOnboardingModal } from './features/spaces';
import { SpaceBoundary } from './shared/ui/SpaceBoundary';
import { UIProvider } from './shared/ui/UIProvider';
import { useTranslation } from './i18n';
import type { LifeSpaceId } from './types/spaces';
import { useContextualSwipeNavigation } from './hooks/useContextualSwipeNavigation';

const HealthSpace = lazy(() => import('./features/health').then(module => ({ default: module.HealthSpace })));
const HomeSpace = lazy(() => import('./features/home').then(module => ({ default: module.HomeSpace })));
const WorkSpace = lazy(() => import('./features/work').then(module => ({ default: module.WorkSpace })));
const WorshipSpace = lazy(() => import('./features/worship').then(module => ({ default: module.WorshipSpace })));
const PlansSpace = lazy(() => import('./features/plans').then(module => ({ default: module.PlansSpace })));
const GlobalProgressSpace = lazy(() => import('./features/progress').then(module => ({ default: module.GlobalProgressSpace })));
const TodayPage = lazy(() => import('./features/today').then(module => ({ default: module.TodayPage })));
const SettingsView = lazy(() => import('./features/settings').then(module => ({ default: module.SettingsView })));

export function App() {
  const app = useAppController();
  const { language } = useTranslation();
  const { loadError, isLoading, loadAppData } = app;
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
        <h2 className="text-xl font-bold text-white font-['Tajawal']">جارٍ تجهيز يومك…</h2>
        <p className="text-xs text-slate-400 mt-1">لحظات وتكون مساحاتك جاهزة.</p>
      </div>
    );
  }


  return <UIProvider mode={app.theme} language={language}>
    <HealthProvider settings={app.settings} isTvMode={app.isTvMode}><AppContent app={app} /></HealthProvider>
  </UIProvider>;
}

function AppContent({ app }: { app: ReturnType<typeof useAppController> }) {
  const location = useLocation();
  const isHomeSpace = location.pathname.startsWith('/home');
  const { settings, isTvMode, setIsTvMode, theme, handleToggleTheme, handleSetTheme,
    handleInstallPwa, deferredPrompt, handleUpdateSettings, loadAppData } = app;
  const { currentStreak, todayRoutine, startRoutinePlayback, isWorkoutActive } = useHealthIntegration();
  useContextualSwipeNavigation({ isWorkoutActive });
  const handleCompleteOnboarding = (enabledSpaces: LifeSpaceId[]) => {
    void handleUpdateSettings({ ...settings, enabledSpaces, hasCompletedOnboarding: true });
  };

  return (
    <div className={`min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950 font-['Tajawal'] relative overflow-x-hidden ${isHomeSpace ? 'home-app' : ''} ${isTvMode ? 'tv-mode text-lg' : ''}`}>
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
        streakCount={currentStreak}
        isTvMode={isTvMode}
        onToggleTvMode={() => setIsTvMode(!isTvMode)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Context Navigation Sub-Bar (Only active when inside a space) */}
      <SpaceContextBar />

      {/* Main Routed Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 md:pb-12 relative z-10">
        <SpaceBoundary key={location.pathname.split('/')[1]}><Suspense fallback={<p role="status" className="p-6 text-center">جارٍ تحميل المساحة…</p>}><Routes>
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
                streakCount={currentStreak}
                todayRoutineName={todayRoutine?.name}
                onStartRoutine={() => todayRoutine && startRoutinePlayback(todayRoutine)}
              />
            }
          />

          {/* 🕌 Worship Space */}
          <Route path="/worship/*" element={<WorshipSpace />} />

          <Route path="/health/*" element={<HealthSpace />} />

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
        </Routes></Suspense></SpaceBoundary>
      </main>

      {/* Spaces First-Launch Onboarding Modal */}
      <SpacesOnboardingModal
        isOpen={!settings.hasCompletedOnboarding}
        onSave={handleCompleteOnboarding}
      />

      {/* Cloud Authentication Modal */}
      <AuthModal />

    </div>
  );
}

export default App;
