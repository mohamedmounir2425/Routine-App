import React from 'react';
import { Calendar, Check } from 'lucide-react';
import { TodayPlanStatus } from '../../../db';
import { useTranslation } from '../../../i18n';

interface Props {
  planStatus: TodayPlanStatus | null;
  weeklyCompletion?: { [dayOfWeek: number]: boolean };
}

export const WeeklyTracker: React.FC<Props> = ({ planStatus, weeklyCompletion = {} }) => {
  const { t, language } = useTranslation();

  const daysList = [
    { num: 6, short: language === 'ar' ? 'سبت' : 'Sat' },
    { num: 0, short: language === 'ar' ? 'أحد' : 'Sun' },
    { num: 1, short: language === 'ar' ? 'إثنين' : 'Mon' },
    { num: 2, short: language === 'ar' ? 'ثلاثاء' : 'Tue' },
    { num: 3, short: language === 'ar' ? 'أربعاء' : 'Wed' },
    { num: 4, short: language === 'ar' ? 'خميس' : 'Thu' },
    { num: 5, short: language === 'ar' ? 'جمعة' : 'Fri' },
  ];

  const completedCount = Object.values(weeklyCompletion).filter(Boolean).length;

  return (
    <div className="liquid-glass-card rounded-3xl p-3.5 sm:p-4 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <h3 className="text-xs font-bold text-white font-['Tajawal']">
            {t('weeklyProgressTitle')} {planStatus ? `(${language === 'ar' ? `الأسبوع ${planStatus.weekNumber}` : `Week ${planStatus.weekNumber}`})` : ''}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold">
          {completedCount}/7 {t('completed')}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
        {daysList.map(day => {
          const todayDay = new Date().getDay();
          const isToday = day.num === todayDay;
          const isDone = !!weeklyCompletion[day.num];

          return (
            <div
              key={day.num}
              className={`flex flex-col items-center py-2 px-1 rounded-2xl transition-all ${
                isToday 
                  ? 'liquid-glass-pill ring-2 ring-emerald-500/40 shadow-sm' 
                  : isDone
                  ? 'bg-emerald-500/10'
                  : 'opacity-70'
              }`}
            >
              <span className={`text-[10px] sm:text-xs mb-1 font-bold ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                {day.short}
              </span>
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30'
                    : isToday
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px]'
                    : 'liquid-glass-pill text-slate-500'
                }`}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                ) : isToday ? (
                  t('today')
                ) : (
                  '○'
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
