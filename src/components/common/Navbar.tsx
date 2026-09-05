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
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <span className="text-lg sm:text-xl">🧘‍♂️</span>
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-['Tajawal']">
                روتين <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">اليومي</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:block">رفيق التمارين وعلاج الظهر</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => onTabChange('home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'home'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>اليوم</span>
            </button>

            <button
              onClick={() => onTabChange('exercises')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'exercises'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              <span>التمارين</span>
            </button>

            <button
              onClick={() => onTabChange('planner')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'planner'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>جدول الأسبوع</span>
            </button>

            <button
              onClick={() => onTabChange('stats')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'stats'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>الإحصائيات</span>
            </button>

            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                currentTab === 'settings'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>الإعدادات</span>
            </button>
          </nav>

          {/* Right Actions: Theme toggle + Streak badge + TV button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Dark / Light Theme Toggle Button with Animation */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'التحويل إلى الوضع الفاتح (Light Mode)' : 'التحويل إلى الوضع الداكن (Dark Mode)'}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all active:scale-90 group relative overflow-hidden ${
                  theme === 'light'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 hover:bg-amber-500/25 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform duration-500 theme-icon-animate" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-45 transition-transform duration-500 theme-icon-animate" />
                )}
              </button>
            )}

            {/* Streak pill */}
            <div 
              onClick={() => onTabChange('stats')}
              title="أيام الالتزام المتتالية"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-all text-xs font-bold"
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500 animate-bounce" />
              <span>{streakCount} {streakCount === 1 ? 'يوم' : streakCount === 2 ? 'يومان' : streakCount <= 10 ? 'أيام' : 'يوماً'}</span>
            </div>

            {/* Big Screen Mode Button */}
            <button
              onClick={onToggleTvMode}
              title={isTvMode ? 'إلغاء وضع الشاشة الكبيرة' : 'تشغيل وضع الشاشة الكبيرة (TV Mode)'}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
                isTvMode
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
            >
              <Tv className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Independent fixed element attached to true viewport bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-1.5 py-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onTabChange('home')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
            currentTab === 'home'
              ? 'text-emerald-400 bg-emerald-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>اليوم</span>
        </button>

        <button
          onClick={() => onTabChange('exercises')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
            currentTab === 'exercises'
              ? 'text-emerald-400 bg-emerald-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>التمارين</span>
        </button>

        <button
          onClick={() => onTabChange('planner')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
            currentTab === 'planner'
              ? 'text-emerald-400 bg-emerald-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>الجدول</span>
        </button>

        <button
          onClick={() => onTabChange('stats')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
            currentTab === 'stats'
              ? 'text-emerald-400 bg-emerald-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>التقدم</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
            currentTab === 'settings'
              ? 'text-emerald-400 bg-emerald-500/15'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>الإعدادات</span>
        </button>
      </nav>
    </>
  );
};
