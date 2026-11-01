import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, LayoutGrid, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from '../../i18n';

const TABS = [
  { path: '/today', id: 'today', labelKey: 'navToday' as const, icon: Home },
  { path: '/spaces', id: 'spaces', labelKey: 'navSpaces' as const, icon: LayoutGrid },
  { path: '/progress', id: 'progress', labelKey: 'navProgress' as const, icon: BarChart3 },
  { path: '/settings', id: 'settings', labelKey: 'navSettings' as const, icon: Settings },
];

export const MobileDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentPath = location.pathname;

  const isAzkarSessionActive = useCallback(() => {
    if (!location.pathname.startsWith('/worship/azkar')) {
      return false;
    }
    return (
      (typeof document !== 'undefined' && document.body.classList.contains('azkar-session-active')) ||
      location.search.includes('session')
    );
  }, [location.pathname, location.search]);

  const [sessionActive, setSessionActive] = useState(isAzkarSessionActive);

  useEffect(() => {
    if (!location.pathname.startsWith('/worship/azkar') && typeof document !== 'undefined') {
      document.body.classList.remove('azkar-session-active');
    }

    setSessionActive(isAzkarSessionActive());

    const handleSessionChange = (e: any) => {
      if (!location.pathname.startsWith('/worship/azkar')) {
        setSessionActive(false);
        return;
      }
      if (e?.detail?.active !== undefined) {
        setSessionActive(e.detail.active);
      } else {
        setSessionActive(isAzkarSessionActive());
      }
    };

    window.addEventListener('azkar-session-change', handleSessionChange);
    return () => {
      window.removeEventListener('azkar-session-change', handleSessionChange);
    };
  }, [location.pathname, location.search, isAzkarSessionActive]);

  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [mobileIndicator, setMobileIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const getActiveTabPath = () => {
    if (currentPath === '/' || currentPath.startsWith('/today')) {
      return '/today';
    }
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
    if (currentPath.startsWith('/stats') || currentPath.startsWith('/progress')) return '/progress';
    if (currentPath.startsWith('/settings')) return '/settings';
    return '/today';
  };

  const activeTabPath = getActiveTabPath();

  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = mobileTabRefs.current[activeTabPath] || mobileTabRefs.current['/today'];
      const nav = mobileNavRef.current;
      if (activeBtn && nav) {
        const navRect = nav.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        setMobileIndicator({
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

  if (sessionActive || isAzkarSessionActive()) {
    return null;
  }

  return (
    <div className={`${currentPath.startsWith("/home") ? "home-mobile-dock home-theme" : ""} md:hidden fixed bottom-3 inset-x-3 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]`}>
      <nav 
        ref={mobileNavRef}
        className="pointer-events-auto liquid-glass-dock w-full max-w-md px-1.5 py-1.5 rounded-3xl flex items-center justify-around shadow-2xl relative"
      >
        {/* Mobile Sliding Active Style (Pill) */}
        <div
          className="dock-indicator absolute top-1.5 bottom-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            left: `${mobileIndicator.left}px`,
            width: `${mobileIndicator.width}px`,
            opacity: mobileIndicator.opacity,
          }}
        />

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path === activeTabPath;
          return (
            <button
              key={tab.id}
              type="button"
              ref={(el) => { mobileTabRefs.current[tab.path] = el; }}
              onClick={() => navigate(tab.path)}
              aria-label={t(tab.labelKey)}
              aria-current={isActive ? "page" : undefined}
              className={`relative z-10 flex-1 flex flex-col items-center justify-center min-h-[44px] gap-0.5 py-1 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                isActive
                  ? 'text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
              <span>{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
