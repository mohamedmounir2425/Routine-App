import { lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';
import { ArrowRight, House, CookingPot, ShoppingBasket, LayoutList } from 'lucide-react';
import { HomeOverview } from './HomeOverview';
import { HomeTasksView } from './tasks/HomeTasksView';
import { HomeProjectsView } from './projects/HomeProjectsView';
import { HomeRoutinesView } from './routines/HomeRoutinesView';
import { HomeMaintenanceView } from './maintenance/HomeMaintenanceView';
import { HomeUIProvider } from './HomeUIProvider';
import './home.css';

const RecipeLibrary = lazy(() => import('./recipes/RecipeLibrary').then(module => ({ default: module.RecipeLibrary })));
const InventoryLibrary = lazy(() => import('./inventory/InventoryLibrary').then(module => ({ default: module.InventoryLibrary })));
const management = [
  { to: '/home/tasks', label: 'المهام' }, { to: '/home/routines', label: 'الروتين المنزلي' },
  { to: '/home/maintenance', label: 'الصيانة' }, { to: '/home/projects', label: 'مشاريع المنزل' },
];

function HomeNavItem({ to, active, children }: { to: string; active: boolean; children: ReactNode }) {
  return <Link to={to} aria-current={active ? 'page' : undefined}
    className={'flex min-h-[49px] items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold no-underline transition-colors max-[600px]:min-h-[52px] max-[600px]:flex-col max-[600px]:gap-1 max-[600px]:px-1 max-[600px]:text-[11px] ' +
      (active ? 'border-home-border bg-home-selection text-home-selection-text' : 'border-transparent text-home-muted hover:bg-home-raised hover:text-home-text')}>
    {children}
  </Link>;
}

export function HomeSpace() {
  const { pathname } = useLocation();
  const isManagement = management.some(item => pathname.startsWith(item.to));
  return <HomeUIProvider>
    <div className="home-space home-theme min-w-0 overflow-clip rounded-[26px] border border-home-border bg-home-bg max-[600px]:rounded-[20px]" dir="rtl">
      <header className="home-header flex items-center justify-between gap-5 !bg-home-bg px-5 py-3 !shadow-none !backdrop-filter-none max-[600px]:px-3 max-[600px]:py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/spaces" aria-label="العودة إلى المساحات" className="grid size-11 shrink-0 place-items-center rounded-home-control text-home-muted hover:bg-home-raised"><ArrowRight size={19} /></Link>
          <div className="grid size-9 shrink-0 place-items-center rounded-[10px] border border-home-border bg-home-raised text-home-accent"><House size={25} /></div>
          <h1 className="text-xl font-black max-[600px]:text-lg">المنزل والأسرة</h1>
        </div>
      </header>
      <nav aria-label="أقسام المنزل والأسرة" className="sticky top-14 z-25 grid grid-cols-4 gap-1.5 border-b border-home-border bg-home-bg px-7 pt-3 pb-4 max-[767px]:top-13 max-[600px]:gap-1 max-[600px]:px-2.5 max-[600px]:pt-2 max-[600px]:pb-3">
        <HomeNavItem to="/home" active={pathname === '/home'}><House size={19} /><span>الرئيسية</span></HomeNavItem>
        <HomeNavItem to="/home/recipes" active={/\/home\/(recipes|inventory)/.test(pathname)}><CookingPot size={19} /><span>المطبخ</span></HomeNavItem>
        <HomeNavItem to="/home/shopping" active={pathname.startsWith('/home/shopping')}><ShoppingBasket size={19} /><span>المشتريات</span></HomeNavItem>
        <HomeNavItem to="/home/tasks" active={isManagement}><LayoutList size={19} /><span>إدارة المنزل</span></HomeNavItem>
      </nav>
      {isManagement && <nav aria-label="أقسام إدارة المنزل" className="flex gap-2 overflow-x-auto px-7 pt-3.5 [scrollbar-width:none] max-[600px]:px-3">
        {management.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => 'inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold no-underline ' + (isActive ? 'border-home-accent bg-home-selection text-home-selection-text' : 'border-home-border bg-home-panel text-home-muted hover:text-home-text')}>{item.label}</NavLink>)}
      </nav>}
      <div className="px-6 pt-6.5 pb-7.5 max-[767px]:pt-4 max-[600px]:px-3 max-[600px]:pb-6">
        <Routes>
          <Route index element={<HomeOverview />} />
          <Route path="tasks" element={<HomeTasksView />} />
          <Route path="shopping" element={<HomeTasksView key="shopping" shopping />} />
          <Route path="projects" element={<HomeProjectsView />} />
          <Route path="routines" element={<HomeRoutinesView />} />
          <Route path="maintenance" element={<HomeMaintenanceView />} />
          <Route path="recipes" element={<Suspense fallback={<p role="status" className="p-6 text-center text-home-muted">جارٍ تحميل أكلات البيت…</p>}><RecipeLibrary /></Suspense>} />
          <Route path="inventory" element={<Suspense fallback={<p role="status" className="p-6 text-center text-home-muted">جارٍ تحميل خزين البيت…</p>}><InventoryLibrary /></Suspense>} />
          <Route path="kitchen" element={<Navigate to="/home/recipes" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </div>
  </HomeUIProvider>;
}
