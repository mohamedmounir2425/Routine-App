import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Routine } from '../../../types';
import { useTranslation } from '../../../i18n';

interface Props {
  miniRescueRoutine: Routine | null;
  onOpenDeskBreak: () => void;
  onStartRescue: (routine: Routine) => void;
  onNavigatePlanner: () => void;
}

export const QuickShortcuts: React.FC<Props> = ({
  miniRescueRoutine,
  onOpenDeskBreak,
  onStartRescue,
  onNavigatePlanner,
}) => {
  const { t, isRTL } = useTranslation();
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
      {/* 1. Desk Break */}
      <div 
        onClick={onOpenDeskBreak}
        className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/40 transition-all select-none group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
            🧍‍♂️
          </div>
          <div>
            <div className="text-xs font-bold text-white font-['Tajawal']">{t('deskBreakTitle')}</div>
            <div className="text-[10px] text-slate-400">{t('deskBreakDesc')}</div>
          </div>
        </div>
        <ArrowIcon className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:-translate-x-0.5 transition-all" />
      </div>

      {/* 2. 5-min Rescue */}
      {miniRescueRoutine && (
        <div 
          onClick={() => onStartRescue(miniRescueRoutine)}
          className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-teal-500/40 transition-all select-none group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/25 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div>
              <div className="text-xs font-bold text-white font-['Tajawal']">{t('quickRescueTitle')}</div>
              <div className="text-[10px] text-slate-400">{t('quickRescueDesc')}</div>
            </div>
          </div>
          <ArrowIcon className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:-translate-x-0.5 transition-all" />
        </div>
      )}

      {/* 3. Planner */}
      <div 
        onClick={onNavigatePlanner}
        className="liquid-glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-sky-500/40 transition-all select-none group active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
            📅
          </div>
          <div>
            <div className="text-xs font-bold text-white font-['Tajawal']">{t('weeksPlanTitle')}</div>
            <div className="text-[10px] text-slate-400">{t('weeksPlanDesc')}</div>
          </div>
        </div>
        <ArrowIcon className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:-translate-x-0.5 transition-all" />
      </div>
    </div>
  );
};
