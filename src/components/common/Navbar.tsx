import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flame, Home, LayoutGrid, BarChart3, Settings, Tv, Sun, Moon } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { LanguageToggle } from './LanguageToggle';
import { MobileDock } from './MobileDock';

export type TabType = 'today' | 'spaces' | 'progress' | 'settings';

interface NavbarProps {
  streakCount: number;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const TABS = [
  { path: '/', id: 'today', labelKey: 'navToday' as const, icon: Home },
  { path: '/spaces', id: 'spaces', labelKey: 'navSpaces' as const, icon: LayoutGrid },
  { path: '/stats', id: 'progress', labelKey: 'navProgress' as const, icon: BarChart3 },
  { path: '/settings', id: 'settings', labelKey: 'navSettings' as const, icon: Settings },
];

export const Navbar: React.FC<NavbarProps> = ({
  streakCount,
  isTvMode,
  onToggleTvMode,
  theme = 'dark',
  onToggleTheme,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentPath = location.pathname;

  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [desktopIndicator, setDesktopIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const getActiveTabPath = () => {
    if (
      currentPath.startsWith('/spaces') ||
      currentPath.startsWith('/worship') ||
      currentPath.startsWith('/health') ||
      currentPath.startsWith('/work') ||
      currentPath.startsWith('/home') ||
      currentPath.startsWith('/plans')
    ) {
      return '/spaces';
    }
    if (currentPath.startsWith('/stats') || currentPath.startsWith('/progress')) return '/stats';
    if (currentPath.startsWith('/settings')) return '/settings';
    return '/';
  };

  const activeTabPath = getActiveTabPath();

  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = desktopTabRefs.current[activeTabPath] || desktopTabRefs.current['/'];
      const nav = desktopNavRef.current;
      if (activeBtn && nav) {
        const navRect = nav.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        setDesktopIndicator({
          left: btnRect.left - navRect.left,
          width: btnRect.width,
          opacity: 1,
        });
      }
    };

    updateIndicator();
    const raf = requestAnimationFrame(updateIndicator);
    const timer = setTimeout(updateIndicator, 60);
    window.addEventListener('resize', updateIndicator);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [currentPath, activeTabPath]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full rounded-none border-b border-white/10 dark:border-white/10 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 p-0.5 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0 liquid-button">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                <span className="text-lg sm:text-xl">🌟</span>
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-['Tajawal']">
                {t('appName')} <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full liquid-glass-pill text-emerald-400 font-bold">{t('appBadge')}</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:block">{t('appSlogan')}</p>
            </div>
          </div>

          {/* Desktop Nav Items with Sliding Indicator */}
          <nav 
            ref={desktopNavRef}
            className="hidden md:flex items-center gap-1 px-2 py-1.5 liquid-glass-dock rounded-2xl shadow-xl relative"
          >
            <div
              className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/25 pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{
                left: `${desktopIndicator.left}px`,
                width: `${desktopIndicator.width}px`,
                opacity: desktopIndicator.opacity,
              }}
            >
              <div className="absolute inset-0 rounded-xl bg-white/15 opacity-60" />
            </div>

            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.path === activeTabPath;
              return (
                <button
                  key={tab.id}
                  ref={(el) => { desktopTabRefs.current[tab.path] = el; }}
                  onClick={() => navigate(tab.path)}
                  className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm transition-colors duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-400 hover:text-white font-medium hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Actions (Language, Streak, Theme, TV) */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <LanguageToggle />

            {/* Streak Counter */}
            <div 
              onClick={() => navigate('/stats')}
              title={`سلسلة الالتزام الحالية: ${streakCount} أيام متتالية`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill cursor-pointer transition-all hover:scale-105"
            >
              <Flame className={`w-4 h-4 ${streakCount > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-xs font-black text-amber-400">{streakCount}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">أيام</span>
            </div>

            {/* Dark/Light Mode Toggle */}
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

            {/* TV Mode Toggle */}
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

      {/* Mobile Dock */}
      <MobileDock />
    </>
  );
};
