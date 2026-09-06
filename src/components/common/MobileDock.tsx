import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Dumbbell, Calendar, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from '../../i18n';

const TABS = [
  { path: '/', id: 'home', labelKey: 'navHome' as const, icon: Home },
  { path: '/exercises', id: 'exercises', labelKey: 'navExercises' as const, icon: Dumbbell },
  { path: '/planner', id: 'planner', labelKey: 'navPlanner' as const, icon: Calendar },
  { path: '/stats', id: 'stats', labelKey: 'navStats' as const, icon: BarChart3 },
  { path: '/settings', id: 'settings', labelKey: 'navSettings' as const, icon: Settings },
];

export const MobileDock: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const currentPath = location.pathname;
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [mobileIndicator, setMobileIndicator] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const activeBtn = mobileTabRefs.current[currentPath] || mobileTabRefs.current['/'];
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
  }, [currentPath]);

  return (
    <div className="md:hidden fixed bottom-3 inset-x-3 z-40 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <nav 
        ref={mobileNavRef}
        className="pointer-events-auto liquid-glass-dock w-full max-w-md px-1.5 py-1.5 rounded-3xl flex items-center justify-around shadow-2xl relative"
      >
        {/* Mobile Sliding Active Style (Pill) */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            left: `${mobileIndicator.left}px`,
            width: `${mobileIndicator.width}px`,
            opacity: mobileIndicator.opacity,
          }}
        />

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPath === tab.path || (tab.path === '/' && currentPath === '');
          return (
            <button
              key={tab.id}
              ref={(el) => { mobileTabRefs.current[tab.path] = el; }}
              onClick={() => navigate(tab.path)}
              className={`relative z-10 flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 ${
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
