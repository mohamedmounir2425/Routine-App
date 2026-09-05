import React from 'react';
import { Flame, Home, Dumbbell, Calendar, BarChart3, Settings, Tv, Sun, Moon } from 'lucide-react';

export type TabType = 'home' | 'exercises' | 'planner' | 'stats' | 'settings';

interface Props {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  streakCount: number;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onTabChange,
  streakCount,
  isTvMode,
  onToggleTvMode,
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 liquid-glass">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 p-0.5 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0 liquid-button">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                <span className="text-lg sm:text-xl">🧘‍♂️</span>
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-['Tajawal']">
                روتين <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full liquid-glass-pill text-emerald-400 font-bold">اليومي</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:block">رفيق التمارين وعلاج الظهر</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 liquid-glass-dock p-1.5 rounded-2xl">
            <button
              onClick={() => onTabChange('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 liquid-button font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>اليوم</span>
            </button>

            <button
              onClick={() => onTabChange('exercises')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'exercises'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 liquid-button font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>التمارين</span>
            </button>

            <button
              onClick={() => onTabChange('planner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'planner'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 liquid-button font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>جدول الأسبوع</span>
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'stats'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 liquid-button font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>الإحصائيات</span>
            </button>

            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'settings'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 liquid-button font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>الإعدادات</span>
            </button>
          </nav>

          {/* Quick Actions (Streak & TV Mode & Theme) */}
          <div className="flex items-center gap-2">
            {/* Streak Counter */}
            <div 
              onClick={() => onTabChange('stats')}
              title={`سلسلة الالتزام الحالية: ${streakCount} أيام متتالية`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill cursor-pointer transition-all hover:scale-105"
            >
              <Flame className={`w-4 h-4 ${streakCount > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-xs font-black text-amber-400">{streakCount}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">أيام</span>
            </div>

            {/* Dark/Light Mode Animated Toggle Button */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'التبديل إلى الوضع النهاري (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
                className="p-1.5 sm:p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all duration-300 active:scale-90 relative overflow-hidden"
              >
                {theme === 'dark' ? (
                  <Sun key="sun-icon" className="w-4 h-4 text-amber-300 theme-icon-animate" />
                ) : (
                  <Moon key="moon-icon" className="w-4 h-4 text-indigo-500 theme-icon-animate" />
                )}
              </button>
            )}

            {/* Big Screen Mode Button */}
            <button
              onClick={onToggleTvMode}
              title={isTvMode ? 'إلغاء وضع الشاشة الكبيرة' : 'تشغيل وضع الشاشة الكبيرة (TV Mode)'}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
                isTvMode
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                  : 'liquid-glass-pill text-slate-300 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Apple VisionOS Floating Liquid Glass Mobile Dock */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <nav className="pointer-events-auto liquid-glass-dock w-full max-w-md px-2 py-1.5 rounded-3xl flex items-center justify-around shadow-2xl">
          <button
            onClick={() => onTabChange('home')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-90 ${
              currentTab === 'home'
                ? 'text-emerald-400 liquid-glass-pill shadow-inner shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>اليوم</span>
          </button>

          <button
            onClick={() => onTabChange('exercises')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-90 ${
              currentTab === 'exercises'
                ? 'text-emerald-400 liquid-glass-pill shadow-inner shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>التمارين</span>
          </button>

          <button
            onClick={() => onTabChange('planner')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-90 ${
              currentTab === 'planner'
                ? 'text-emerald-400 liquid-glass-pill shadow-inner shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>الجدول</span>
          </button>

          <button
            onClick={() => onTabChange('stats')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-90 ${
              currentTab === 'stats'
                ? 'text-emerald-400 liquid-glass-pill shadow-inner shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>التقدم</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-90 ${
              currentTab === 'settings'
                ? 'text-emerald-400 liquid-glass-pill shadow-inner shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>الإعدادات</span>
          </button>
        </nav>
      </div>
    </>
  );
};
