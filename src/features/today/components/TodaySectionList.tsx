import React, { useState } from 'react';
import { 
  Zap, 
  AlertCircle, 
  Clock, 
  Flame, 
  CheckCircle2, 
  Target, 
  FolderGit2, 
  CheckSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TodaySection, TodayItem, TodaySectionId } from '../todayTypes';
import { TodayItemCard } from './TodayItemCard';

interface TodaySectionListProps {
  sections: TodaySection[];
  onExecuteAction: (item: TodayItem) => void;
  onAddQuranPage?: (amount: number) => void;
  onEditTask?: (item: TodayItem) => void;
  expandCompleted?: boolean;
}

const SECTION_ICONS: Record<TodaySectionId, { icon: React.FC<{ className?: string }>; color: string; badgeBg: string }> = {
  now: { icon: Zap, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  overdue: { icon: AlertCircle, color: 'text-rose-400', badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/25' },
  scheduled: { icon: Clock, color: 'text-cyan-400', badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25' },
  high_priority: { icon: Flame, color: 'text-amber-400', badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  next_actions: { icon: FolderGit2, color: 'text-blue-400', badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
  tasks: { icon: CheckSquare, color: 'text-slate-300', badgeBg: 'bg-white/10 text-slate-300 border-white/15' },
  plans: { icon: Target, color: 'text-violet-400', badgeBg: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
};

export const TodaySectionList: React.FC<TodaySectionListProps> = ({
  sections,
  onExecuteAction,
  onAddQuranPage,
  onEditTask,
  expandCompleted = false,
}) => {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const config = SECTION_ICONS[section.id] || SECTION_ICONS.tasks;
        const IconComponent = config.icon;
        const isCompletedSection = section.id === 'completed';

        return (
          <div key={section.id} className="space-y-3 animate-in fade-in duration-200">
            {/* Section Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <IconComponent className={`w-4 h-4 ${config.color}`} />
                <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal'] tracking-tight">
                  {section.title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${config.badgeBg}`}>
                  {section.badgeCount || section.items.length}
                </span>
              </div>

              {/* Collapsible toggle for Completed section */}
              {isCompletedSection && !expandCompleted && (
                <button
                  onClick={() => setIsCompletedExpanded((prev) => !prev)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-all"
                >
                  <span>{isCompletedExpanded ? 'طي المكتمل' : 'عرض المكتمل'}</span>
                  {isCompletedExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* Section Items */}
            {(!isCompletedSection || isCompletedExpanded || expandCompleted) && (
              <div className="space-y-2.5">
                {section.items.map((item) => (
                  <TodayItemCard
                    key={item.id}
                    item={item}
                    onExecuteAction={onExecuteAction}
                    onAddQuranPage={onAddQuranPage}
                    onEditTask={onEditTask}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
