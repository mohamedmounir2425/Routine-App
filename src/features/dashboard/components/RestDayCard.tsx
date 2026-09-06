import React from 'react';
import { Clock } from 'lucide-react';
import { Routine } from '../../../types';
import { TodayPlanStatus } from '../../../db';
import { useTranslation } from '../../../i18n';

interface Props {
  planStatus: TodayPlanStatus | null;
  miniRescueRoutine: Routine | null;
  onStartRoutine: (routine: Routine) => void;
  onNavigatePlanner: () => void;
}

export const RestDayCard: React.FC<Props> = ({
  planStatus,
  miniRescueRoutine,
  onStartRoutine,
  onNavigatePlanner,
}) => {
  const { t } = useTranslation();

  return (
    <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 shadow-xl text-center space-y-4">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-2xl shadow-md">
        🌿
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
          {t('restDayTitle')}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
          {t('restDayDesc')}
        </p>
      </div>

      {planStatus?.nextSession && (
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl liquid-glass-pill text-xs text-slate-300">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>{t('nextSession')}</span>
          <strong className="text-white font-bold font-['Tajawal']">
            {planStatus.nextSession.dayNameAr} ({planStatus.nextSession.title})
          </strong>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
        {miniRescueRoutine && (
          <button
            type="button"
            onClick={() => onStartRoutine(miniRescueRoutine)}
            className="px-4 py-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:text-white hover:bg-teal-500/30 text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
          >
            {t('lightStretch5m')}
          </button>
        )}
        <button
          type="button"
          onClick={onNavigatePlanner}
          className="px-4 py-2.5 rounded-xl liquid-glass-pill text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer select-none active:scale-95"
        >
          {t('viewPlan')}
        </button>
      </div>
    </div>
  );
};
