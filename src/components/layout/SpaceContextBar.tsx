import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LIFE_SPACES_CONFIG } from '../../config/spacesConfig';
import { useTranslation } from '../../i18n';
import { 
  Compass, 
  BookOpen, 
  CircleDot, 
  Clock, 
  BookMarked, 
  Activity, 
  Dumbbell, 
  Calendar, 
  BarChart2, 
  CheckSquare, 
  Timer, 
  ListChecks, 
  Target, 
  Milestone,
  ArrowRight
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Compass,
  BookOpen,
  CircleDot,
  Clock,
  BookMarked,
  Activity,
  Dumbbell,
  Calendar,
  BarChart2,
  CheckSquare,
  Timer,
  ListChecks,
  Target,
  Milestone,
};

export const SpaceContextBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentPath = location.pathname;

  // Find if currentPath matches any active space
  const activeSpace = LIFE_SPACES_CONFIG.find((space) =>
    currentPath === space.route || currentPath.startsWith(`${space.route}/`)
  );

  if (!activeSpace) {
    return null;
  }

  return (
    <div className="w-full border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-14 sm:top-16 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        {/* Space Title & Return Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/spaces')}
            title="العودة لجميع المساحات"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl liquid-glass-pill text-xs text-slate-300 hover:text-white transition-all group"
          >
            <ArrowRight className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="font-bold hidden sm:inline">المساحات</span>
          </button>
          
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-200">
            <span>{activeSpace.icon}</span>
            <span className="hidden md:inline font-['Tajawal']">{t(activeSpace.titleKey as any)}</span>
          </div>
        </div>

        {/* Sub-Nav Items */}
        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0 overflow-x-auto py-0.5">
          {activeSpace.navigation.map((item) => {
            const IconComponent = ICON_MAP[item.iconName] || Compass;
            const isExactActive = currentPath === item.path;
            const isChildActive = item.path !== activeSpace.route && currentPath.startsWith(item.path);
            const isActive = isExactActive || isChildActive;

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/25 to-teal-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }`}
              >
                <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{t(item.labelKey as any)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
