import React from 'react';
import { Play, Clock } from 'lucide-react';
import { Routine, Exercise } from '../../../types';
import { TodayPlanStatus, StreakStats } from '../../../db';
import { useTranslation } from '../../../i18n';

interface Props {
  routine: Routine;
  planStatus: TodayPlanStatus | null;
  streakStats: StreakStats;
  exercises: Exercise[];
  onStartRoutine: (routine: Routine) => void;
}

export const TodayHeroCard: React.FC<Props> = ({
  routine,
  planStatus,
  streakStats,
  exercises,
  onStartRoutine,
}) => {
  const { t, language } = useTranslation();

  return (
    <div className="liquid-glass-card rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/15 to-teal-500/0 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {planStatus?.weekNumber && planStatus.sessionCode ? (
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black font-['Tajawal']">
                {language === 'ar' 
                  ? `الأسبوع ${planStatus.weekNumber} • الجلسة ${planStatus.sessionCode}` 
                  : `Week ${planStatus.weekNumber} • Session ${planStatus.sessionCode}`}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-emerald-400 text-xs font-bold">
                {t('todayWorkout')}
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">
              {routine.tag}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{routine.totalEstimatedMinutes} {t('minutes')}</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-xs font-semibold text-slate-300">
              {routine.exerciseIds.length} {t('exercisesCount')}
            </span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] tracking-tight">
            {routine.name}
          </h3>
        </div>

        {/* Exercise Chips Preview */}
        {planStatus?.session?.prescriptions && planStatus.session.prescriptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {planStatus.session.prescriptions.map((presc, pIdx) => {
              const ex = exercises.find(e => e.id === presc.exerciseId);
              const name = ex ? (language === 'en' ? ex.name : ex.arabicName) : presc.exerciseId;
              return (
                <span 
                  key={pIdx} 
                  className="px-2.5 py-1 rounded-xl liquid-glass-pill text-[11px] text-slate-300 font-medium flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{name}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Start Button */}
        <button
          type="button"
          onClick={() => onStartRoutine(routine)}
          className="w-full py-4 sm:py-4.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer select-none liquid-button"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center">
            <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
          </div>
          <span className="font-['Tajawal'] tracking-tight">
            {streakStats.hasWorkedOutToday ? `${t('restart')} ${t('todayWorkout')}` : `${t('start')} ${t('todayWorkout')}`}
          </span>
        </button>
      </div>
    </div>
  );
};
