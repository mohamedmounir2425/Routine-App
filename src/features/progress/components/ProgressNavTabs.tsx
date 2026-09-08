import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle2, 
  TrendingUp, 
  PieChart, 
  Target 
} from 'lucide-react';

interface TabItem {
  path: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const TABS: TabItem[] = [
  { path: '/progress', label: 'نظرة عامة', icon: BarChart3 },
  { path: '/progress/today', label: 'أداء اليوم', icon: CheckCircle2 },
  { path: '/progress/week', label: 'الاتجاه الأسبوعي', icon: TrendingUp },
  { path: '/progress/spaces', label: 'توزيع النشاط', icon: PieChart },
  { path: '/progress/plans', label: 'الخطط الاستراتيجية', icon: Target },
];

export const ProgressNavTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  return (
    <div className="w-full flex items-center justify-center sm:justify-start overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 p-1 rounded-2xl liquid-glass-dock border border-white/10 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.path === '/progress' 
            ? currentPath === '/progress'
            : currentPath === tab.path || currentPath.startsWith(`${tab.path}/`);

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
