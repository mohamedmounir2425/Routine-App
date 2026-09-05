import React from 'react';
import { Flame, Home, Dumbbell, Calendar, BarChart3, Settings, Tv } from 'lucide-react';

export type TabType = 'home' | 'exercises' | 'planner' | 'stats' | 'settings';

interface Props {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  streakCount: number;
  isTvMode: boolean;
  onToggleTvMode: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onTabChange,
  streakCount,
  isTvMode,
  onToggleTvMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onTabChange('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-xl">🧘‍♂️</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-['Tajawal']">
              روتين <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">اليومي</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">رفيق التمارين وعلاج الظهر</p>
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

        {/* Right Actions: Streak badge + TV button */}
        <div className="flex items-center gap-2.5">
          {/* Streak pill */}
          <div 
            onClick={() => onTabChange('stats')}
            title="أيام الالتزام المتتالية"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 cursor-pointer hover:bg-amber-500/20 transition-all text-xs font-bold"
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-bounce" />
            <span>{streakCount} {streakCount === 1 ? 'يوم' : streakCount === 2 ? 'يومان' : streakCount <= 10 ? 'أيام' : 'يوماً'}</span>
          </div>

          {/* Big Screen Mode Button */}
          <button
            onClick={onToggleTvMode}
            title={isTvMode ? 'إلغاء وضع الشاشة الكبيرة' : 'تشغيل وضع الشاشة الكبيرة (TV Mode)'}
            className={`p-2 rounded-xl border transition-all ${
              isTvMode
                ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'home' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>اليوم</span>
        </button>

        <button
          onClick={() => onTabChange('exercises')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'exercises' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Dumbbell className="w-5 h-5" />
          <span>التمارين</span>
        </button>

        <button
          onClick={() => onTabChange('planner')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'planner' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>الجدول</span>
        </button>

        <button
          onClick={() => onTabChange('stats')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'stats' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>الإحصائيات</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            currentTab === 'settings' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>الإعدادات</span>
        </button>
      </div>
    </header>
  );
};
