import React from 'react';
import { Target, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ActivePlanSummary } from '../todayTypes';

interface TodayActivePlansWidgetProps {
  plans: ActivePlanSummary[];
}

export const TodayActivePlansWidget: React.FC<TodayActivePlansWidgetProps> = ({ plans }) => {
  const navigate = useNavigate();

  if (!plans || plans.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal'] tracking-tight">
            الخطط الاستراتيجية النشطة
          </h3>
        </div>

        <button
          onClick={() => navigate('/plans')}
          className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-bold cursor-pointer transition-colors"
        >
          <span>عرض كل الخطط</span>
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => navigate(`/plans`)}
            className="liquid-glass-card rounded-2xl p-4 border border-violet-500/20 hover:border-violet-500/40 cursor-pointer space-y-3 transition-all hover:scale-[1.01]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate font-['Tajawal']">
                  {plan.title}
                </h4>
                {plan.nextMilestoneTitle && (
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    المرحلة القادمة: {plan.nextMilestoneTitle}
                  </p>
                )}
              </div>

              <span className="text-sm font-black font-mono text-violet-400 shrink-0">
                {plan.progressPercent}%
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400 transition-all duration-300"
                style={{ width: `${plan.progressPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
