import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { StreakStats } from '../../../db';
import { useTranslation } from '../../../i18n';

interface Props {
  streakStats: StreakStats;
}

export const DashboardStatsWidget: React.FC<Props> = ({ streakStats }) => {
  const navigate = useNavigate();
  const { t, isRTL } = useTranslation();
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <h3 className="text-xs font-bold text-white font-['Tajawal'] flex items-center gap-2">
          <span>📊</span>
          <span>{t('navStats')}</span>
        </h3>
        <button
          type="button"
          onClick={() => navigate('/health/progress')}
          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>{isRTL ? 'التفاصيل' : 'Details'}</span>
          <ArrowIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Streak */}
        <div className="p-2.5 rounded-2xl liquid-glass-pill flex flex-col items-center justify-center">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400 mb-1" />
          <span className="text-base font-black text-amber-400 font-mono">
            {streakStats.currentStreak}
          </span>
          <span className="text-[10px] text-slate-400">{t('days')}</span>
        </div>

        {/* Workouts */}
        <div className="p-2.5 rounded-2xl liquid-glass-pill flex flex-col items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
          <span className="text-base font-black text-white font-mono">
            {streakStats.totalWorkouts}
          </span>
          <span className="text-[10px] text-slate-400">{t('completed')}</span>
        </div>

        {/* Minutes */}
        <div className="p-2.5 rounded-2xl liquid-glass-pill flex flex-col items-center justify-center">
          <Clock className="w-4 h-4 text-sky-400 mb-1" />
          <span className="text-base font-black text-sky-400 font-mono">
            {streakStats.totalMinutes}
          </span>
          <span className="text-[10px] text-slate-400">{t('minutes')}</span>
        </div>
      </div>
    </div>
  );
};
