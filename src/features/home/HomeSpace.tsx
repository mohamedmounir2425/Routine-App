import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, NavLink, Link, useLocation } from 'react-router-dom';
import { ArrowRight, House, CookingPot, ShoppingBasket, LayoutList } from 'lucide-react';
import { HomeOverview } from './HomeOverview';
import { HomeTasksView } from './tasks/HomeTasksView';
import { HomeProjectsView } from './projects/HomeProjectsView';
import { HomeRoutinesView } from './routines/HomeRoutinesView';
import { HomeMaintenanceView } from './maintenance/HomeMaintenanceView';
import './home.css';
import { HomeUIProvider } from './HomeUIProvider';
const RecipeLibrary = lazy(() => import('./recipes/RecipeLibrary').then(module => ({ default: module.RecipeLibrary })));
const InventoryLibrary = lazy(() => import('./inventory/InventoryLibrary').then(module => ({ default: module.InventoryLibrary })));
const management = [{ to: '/home/tasks', label: 'المهام' }, { to: '/home/routines', label: 'الروتين المنزلي' }, { to: '/home/maintenance', label: 'الصيانة' }, { to: '/home/projects', label: 'مشاريع المنزل' }];
export function HomeSpace() {
  const { pathname } = useLocation();
  const isManagement = management.some(item => pathname.startsWith(item.to));
  return <HomeUIProvider><div className="home-space home-theme" dir="rtl">
    <header className="home-header"><div className="home-identity"><Link to="/spaces" className="home-back" aria-label="العودة إلى المساحات"><ArrowRight size={19} /></Link><div className="home-symbol"><House size={25} /></div><div><h1>المنزل والأسرة</h1></div></div></header>
    <nav className="home-primary-nav" aria-label="أقسام المنزل والأسرة"><NavLink to="/home" end><House size={19} /><span>الرئيسية</span></NavLink><Link to="/home/recipes" aria-current={/\/home\/(recipes|inventory)/.test(pathname) ? 'page' : undefined}><CookingPot size={19} /><span>المطبخ</span></Link><NavLink to="/home/shopping"><ShoppingBasket size={19} /><span>المشتريات</span></NavLink><Link to="/home/tasks" aria-current={isManagement ? 'page' : undefined}><LayoutList size={19} /><span>إدارة المنزل</span></Link></nav>
    {isManagement && <nav className="home-secondary-nav" aria-label="أقسام إدارة المنزل">{management.map(item => <NavLink key={item.to} to={item.to}>{item.label}</NavLink>)}</nav>}
    <div className="home-content"><Routes><Route index element={<HomeOverview />} /><Route path="tasks" element={<HomeTasksView />} /><Route path="shopping" element={<HomeTasksView key="shopping" shopping />} /><Route path="projects" element={<HomeProjectsView />} /><Route path="routines" element={<HomeRoutinesView />} /><Route path="maintenance" element={<HomeMaintenanceView />} /><Route path="recipes" element={<Suspense fallback={<p role="status" className="home-empty">جارٍ تحميل أكلات البيت…</p>}><RecipeLibrary /></Suspense>} /><Route path="inventory" element={<Suspense fallback={<p role="status" className="home-empty">جارٍ تحميل خزين البيت…</p>}><InventoryLibrary /></Suspense>} /><Route path="kitchen" element={<Navigate to="/home/recipes" replace />} /><Route path="*" element={<Navigate to="/home" replace />} /></Routes></div>
  </div></HomeUIProvider>;
}
