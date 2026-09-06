import React from 'react';
import { PlanWeek, PlanSession } from '../../../types';

interface PlanOverviewCardProps {
  currentWeek: PlanWeek;
  selectedWeekNum: number;
  activeWeekNumber: number;
  overallCompletedCount: number;
  weekCompletedCount: number;
  completedSessions: string[];
  fourWeekPlan: PlanWeek[];
  onSelectWeek: (weekNum: number) => void;
}

export const PlanOverviewCard: React.FC<PlanOverviewCardProps> = ({
  currentWeek,
  selectedWeekNum,
  activeWeekNumber,
  overallCompletedCount,
  weekCompletedCount,
  completedSessions,
  fourWeekPlan,
  onSelectWeek,
}) => {
  return (
    <div className="space-y-4">
      {/* Progress Overview Card */}
      <div className="liquid-glass-card rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400 font-semibold mb-1">التقدم الكلي في الخطة العلاجية</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {overallCompletedCount} <span className="text-base text-slate-400 font-normal">من 16 جلسة</span>
              </span>
              <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                {Math.round((overallCompletedCount / 16) * 100)}% مكتمل
              </span>
            </div>
          </div>

          {/* Week progress bar */}
          <div className="w-full sm:w-64 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>إنجاز الأسبوع {selectedWeekNum}:</span>
              <span className="font-bold text-emerald-400 font-mono">{weekCompletedCount} / 4 جلسات</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950/70 rounded-full overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                style={{ width: `${(weekCompletedCount / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Week Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 pt-5 border-t border-white/10">
          {fourWeekPlan.map(week => {
            const isSelected = week.weekNumber === selectedWeekNum;
            const isCurrentActive = week.weekNumber === activeWeekNumber;
            const weekCompleted = week.sessions.filter((s: PlanSession) => completedSessions.includes(s.routineId)).length;

            return (
              <button
                key={week.weekNumber}
                onClick={() => onSelectWeek(week.weekNumber)}
                className={`p-3 sm:p-4 rounded-2xl text-right transition-all border ${
                  isSelected
                    ? 'liquid-glass border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'liquid-glass-pill border-transparent hover:border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className={`text-xs font-black font-['Tajawal'] ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                    الأسبوع {week.weekNumber}
                  </span>
                  {isCurrentActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      الحالي
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {weekCompleted === 4 ? 'تم إنجازه بالكامل ✓' : `${weekCompleted} من 4 جلسات`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Week Focus Banner */}
      <div className="p-4 sm:p-5 rounded-2xl liquid-glass-pill flex items-start gap-3 border-emerald-500/20">
        <span className="text-xl shrink-0 mt-0.5">🎯</span>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-white font-['Tajawal']">
            {currentWeek.title}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
            {currentWeek.description}
          </p>
        </div>
      </div>
    </div>
  );
};
