import React, { useRef, useState, useEffect } from 'react';
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

const TABS: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'اليوم', icon: Home },
  { id: 'exercises', label: 'التمارين', icon: Dumbbell },
  { id: 'planner', label: 'خطة التمارين', icon: Calendar },
  { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export const Navbar: React.FC<Props> = ({
  currentTab,
  onTabChange,
  streakCount,
  isTvMode,
  onToggleTvMode,
  theme = 'dark',
  onToggleTheme,
}) => {
  // Desktop sliding indicator state & refs
  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopTabRefs = useRef<Record<TabType, HTMLButtonElement | null>>({
    home: null,
    exercises: null,
    planner: null,
    stats: null,
    settings: null,
  });
  const [desktopIndicator, setDesktopIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  // Mobile sliding indicator state & refs
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileTabRefs = useRef<Record<TabType, HTMLButtonElement | null>>({
    home: null,
    exercises: null,
    planner: null,
    stats: null,
    settings: null,
  });
  const [mobileIndicator, setMobileIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  // Smoothly update indicators whenever currentTab changes or window resizes
  useEffect(() => {
    const updateIndicators = () => {
      // Desktop
      const activeDesktopBtn = desktopTabRefs.current[currentTab];
      const desktopNav = desktopNavRef.current;
      if (activeDesktopBtn && desktopNav) {
        const navRect = desktopNav.getBoundingClientRect();
        const btnRect = activeDesktopBtn.getBoundingClientRect();
        setDesktopIndicator({
          left: btnRect.left - navRect.left,
          width: btnRect.width,
          opacity: 1,
        });
      }

      // Mobile
      const activeMobileBtn = mobileTabRefs.current[currentTab];
      const mobileNav = mobileNavRef.current;
      if (activeMobileBtn && mobileNav) {
        const navRect = mobileNav.getBoundingClientRect();
        const btnRect = activeMobileBtn.getBoundingClientRect();
        setMobileIndicator({
          left: btnRect.left - navRect.left,
          width: btnRect.width,
          opacity: 1,
        });
      }
    };

    updateIndicators();
    const raf = requestAnimationFrame(updateIndicators);
    const timer = setTimeout(updateIndicators, 60);
    window.addEventListener('resize', updateIndicators);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicators);
    };
  }, [currentTab]);

  return (
    <>
      {/* Edge-to-edge Top Navbar (No border-radius, no around stroke) */}
      <header className="sticky top-0 z-40 w-full rounded-none border-b border-white/10 dark:border-white/10 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
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

          {/* Desktop Nav Items with Sliding / Swipe Active Indicator */}
          <nav 
            ref={desktopNavRef}
            className="hidden md:flex items-center gap-1 p-1.5 navbar-liquid-glass relative"
          >
            {/* Smooth Sliding Active Style (Pill without bottom line) */}
            <div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/25 pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                left: `${desktopIndicator.left}px`,
                width: `${desktopIndicator.width}px`,
                opacity: desktopIndicator.opacity,
              }}
            >
              {/* Glossy top specular reflection */}
              <div className="absolute inset-0 rounded-xl bg-white/15 opacity-60" />
            </div>

            {/* Nav Tabs */}
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { desktopTabRefs.current[tab.id] = el; }}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm transition-colors duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-400 hover:text-white font-medium hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
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

      {/* Apple VisionOS Floating Liquid Glass Mobile Dock with Sliding Swipe Indicator */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
        <nav 
          ref={mobileNavRef}
          className="pointer-events-auto liquid-glass-dock w-full max-w-md px-1.5 py-1.5 rounded-3xl flex items-center justify-around shadow-2xl relative"
        >
          {/* Mobile Sliding Active Style (Pill without bottom line) */}
          <div
            className="absolute top-1.5 bottom-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              left: `${mobileIndicator.left}px`,
              width: `${mobileIndicator.width}px`,
              opacity: mobileIndicator.opacity,
            }}
          />

          {/* Mobile Tabs */}
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => { mobileTabRefs.current[tab.id] = el; }}
                onClick={() => onTabChange(tab.id)}
                className={`relative z-10 flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                <span>{tab.id === 'stats' ? 'التقدم' : tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};
