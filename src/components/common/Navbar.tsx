import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flame, Home, LayoutGrid, BarChart3, Settings, Tv, Sun, Moon, Cloud, LogOut, RefreshCw, MoreHorizontal } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../context/AuthContext';
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
  { path: '/today', id: 'today', labelKey: 'navToday' as const, icon: Home },
  { path: '/spaces', id: 'spaces', labelKey: 'navSpaces' as const, icon: LayoutGrid },
  { path: '/progress', id: 'progress', labelKey: 'navProgress' as const, icon: BarChart3 },
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
  const { user, syncStatus, syncError, pendingCount, lastSyncedAt, openAuthModal, signOut, triggerSync } = useAuth();
  const currentPath = location.pathname;
  const homeArea = currentPath.startsWith("/home");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const desktopNavRef = useRef<HTMLElement>(null);
  const desktopTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [desktopIndicator, setDesktopIndicator] = useState<{ left: number; width: number; opacity: number }>({
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
      const activeBtn = desktopTabRefs.current[activeTabPath] || desktopTabRefs.current['/today'];
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
      <header className={`${homeArea ? "home-navbar home-theme" : ""} sticky top-0 z-40 w-full rounded-none border-b border-white/10 dark:border-white/10 bg-slate-950/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Brand */}
          <div 
            onClick={() => navigate('/today')}
            className="home-brand flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
          >
            <div className="home-brand-mark w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-300 p-0.5 shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform shrink-0 liquid-button">
              <div className="w-full h-full bg-slate-950/80 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                <span className="text-lg sm:text-xl">🌟</span>
              </div>
            </div>
            <div>
              <h1 className="home-brand-title text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-['Tajawal']">
                {t('appName')} <span className="text-[10px] sm:text-xs home-brand-badge px-2 py-0.5 rounded-full liquid-glass-pill text-emerald-400 font-bold">{t('appBadge')}</span>
              </h1>
              <p className="home-brand-slogan text-[10px] sm:text-[11px] text-slate-400 font-medium hidden xs:block">{t('appSlogan')}</p>
            </div>
          </div>

          {/* Desktop Nav Items with Sliding Indicator */}
          <nav 
            ref={desktopNavRef}
            role="navigation"
            aria-label="شريط التنقل الرئيسي"
            className="hidden md:flex items-center gap-1 px-2 py-1.5 liquid-glass-dock rounded-2xl shadow-xl relative"
          >
            <div
              className="nav-active-indicator absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/25 pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.25,1,0.5,1)]"
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
                  type="button"
                  ref={(el) => { desktopTabRefs.current[tab.path] = el; }}
                  onClick={() => navigate(tab.path)}
                  aria-label={t(tab.labelKey)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm transition-colors duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
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
          <div className="home-global-actions flex items-center gap-2">
            {/* Language Switcher */}
            <div className="home-header-extra"><LanguageToggle /></div>

            {/* Streak Counter */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => navigate('/progress')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/progress'); }}
              aria-label={`سلسلة الالتزام الحالية: ${streakCount} أيام متتالية`}
              title={`سلسلة الالتزام الحالية: ${streakCount} أيام متتالية`}
              className="home-header-extra flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <Flame className={`w-4 h-4 ${streakCount > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="text-xs font-black text-amber-400">{streakCount}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">أيام</span>
            </div>

            {/* Dark/Light Mode Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
                title={theme === 'dark' ? 'التبديل إلى الوضع النهاري (Light Mode)' : 'التبديل إلى الوضع الليلي (Dark Mode)'}
                className="p-1.5 sm:p-2 rounded-xl liquid-glass-pill text-slate-300 hover:text-white transition-all duration-300 active:scale-90 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
              type="button"
              onClick={onToggleTvMode}
              aria-label={isTvMode ? 'إلغاء وضع الشاشة الكبيرة' : 'تشغيل وضع الشاشة الكبيرة'}
              title={isTvMode ? 'إلغاء وضع الشاشة الكبيرة' : 'تشغيل وضع الشاشة الكبيرة (TV Mode)'}
              className={`home-header-extra p-1.5 sm:p-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 ${
                isTvMode
                  ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                  : 'liquid-glass-pill text-slate-300 hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
            </button>

            {homeArea && <details className="home-header-menu md:hidden"><summary aria-label="المزيد من الإجراءات"><MoreHorizontal size={20} /></summary><div><LanguageToggle /><button type="button" onClick={onToggleTvMode}>{isTvMode ? 'إلغاء وضع الشاشة الكبيرة' : 'وضع الشاشة الكبيرة'}</button><button type="button" onClick={() => navigate('/progress')}>التقدم وسلسلة الالتزام: {streakCount}</button></div></details>}
            {/* Cloud Sync & User Profile */}
            <div className="relative">
              {user ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    title={user.email}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-pill border border-emerald-500/30 hover:border-emerald-500/60 text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                      {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-xs font-bold hidden lg:inline max-w-[80px] truncate">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <span 
                      className={`w-2 h-2 rounded-full ${
                        syncStatus === 'syncing' 
                          ? 'bg-amber-400 animate-ping' 
                          : syncStatus === 'error'
                          ? 'bg-rose-400'
                          : syncStatus === 'synced' ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                      title={
                        syncStatus === 'syncing'
                          ? 'جاري المزامنة...'
                          : syncStatus === 'error'
                          ? (syncError || 'خطأ في المزامنة')
                          : syncStatus === 'synced' ? 'اكتملت آخر محاولة مزامنة' : 'محفوظ على الجهاز؛ المزامنة غير مؤكدة'
                      }
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsUserMenuOpen(false)} 
                      />
                      <div className="absolute left-0 mt-2 w-56 rounded-2xl liquid-glass-card p-3 shadow-2xl border border-white/15 z-50 animate-in fade-in zoom-in-95 font-['Tajawal'] text-xs">
                        <div className="px-2 py-1.5 border-b border-white/10 mb-2">
                          <p className="font-bold text-white truncate">{user.user_metadata?.full_name || 'بطل الروتين'}</p>
                          <p className="text-[11px] text-slate-400 truncate" dir="ltr">{user.email}</p>
                        </div>

                        <div role="status" className="px-2 py-2 text-[11px] leading-relaxed text-slate-300 break-words">
                          {syncError || (pendingCount > 0 ? `تعديلات لم تتزامن: ${pendingCount}` : syncStatus === 'synced' ? 'اكتملت آخر محاولة مزامنة' : 'المزامنة غير مؤكدة؛ بياناتك على الجهاز')}
                          {lastSyncedAt && <p className="text-slate-400 mt-1">آخر نجاح: {lastSyncedAt.toLocaleString('ar-EG')}</p>}
                        </div>
                        <button
                          disabled={syncStatus === 'syncing'}
                          onClick={() => {
                            triggerSync();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/5 transition-all text-right"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                          <span>مزامنة البيانات الآن</span>
                        </button>

                        <button
                          onClick={() => {
                            signOut();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-all text-right mt-1"
                        >
                          <LogOut className="w-3.5 h-3.5 text-rose-400" />
                          <span>تسجيل الخروج</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => openAuthModal('signin')}
                  title="تسجيل الدخول لمزامنة البيانات بين الأجهزة"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">مزامنة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Dock */}
      <MobileDock />
    </>
  );
};
