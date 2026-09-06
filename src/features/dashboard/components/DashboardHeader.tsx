import React from 'react';
import { Flame } from 'lucide-react';
import { StreakStats } from '../../../db';
import { useTranslation } from '../../../i18n';

interface Props {
  isEffectiveRestDay: boolean;
  streakStats: StreakStats;
  onNavigateStats: () => void;
}

export const DashboardHeader: React.FC<Props> = ({
  isEffectiveRestDay,
  streakStats,
  onNavigateStats,
}) => {
  const { t, language } = useTranslation();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 
    ? t('greetingMorning') 
    : currentHour < 17 
    ? t('greetingAfternoon') 
    : t('greetingEvening');

  const streakDaysText = streakStats.currentStreak === 1
    ? t('day')
    : streakStats.currentStreak === 2
    ? t('twoDays')
    : streakStats.currentStreak <= 10
    ? t('days')
    : language === 'ar' ? 'يوماً' : 'Days';

  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
          {greeting}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isEffectiveRestDay ? t('heroRestDesc') : t('heroActiveDesc')}
        </p>
      </div>

      <div 
        onClick={onNavigateStats}
        className="flex items-center gap-2.5 liquid-glass-pill rounded-2xl py-2 px-3.5 cursor-pointer hover:bg-white/10 transition-colors shrink-0 select-none active:scale-95"
        title={t('navStats')}
      >
        <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
        <div className="text-right">
          <span className="text-xs font-black text-amber-400 font-mono">
            {streakStats.currentStreak} {streakDaysText}
          </span>
          <span className="text-[10px] text-slate-400 block font-medium">{t('streakConsecutive')}</span>
        </div>
      </div>
    </div>
  );
};
