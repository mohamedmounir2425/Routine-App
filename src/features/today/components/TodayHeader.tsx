import React from 'react';
import { SlidersHorizontal, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatArabicDate } from '../../../utils/dateUtils';
import { LifeSpaceId } from '../../../types';

interface TodayHeaderProps {
  totalCount: number;
  completedCount: number;
  completionRate: number;
  spaceBreakdown: Record<LifeSpaceId, { total: number; completed: number }>;
  onOpenQuickAdd: () => void;
  onOpenPreferences: () => void;
}

const SPACE_META: Record<LifeSpaceId, { name: string; emoji: string; color: string }> = {
  worship: { name: 'العبادة', emoji: '🕌', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  health: { name: 'الصحة', emoji: '🏋️', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  work: { name: 'العمل', emoji: '💼', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  home: { name: 'المنزل', emoji: '🏠', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  plans: { name: 'الخطط', emoji: '🎯', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
};

export const TodayHeader: React.FC<TodayHeaderProps> = ({
  totalCount,
  completedCount,
  completionRate,
  spaceBreakdown,
  onOpenQuickAdd,
  onOpenPreferences,
}) => {
  const arabicDateStr = formatArabicDate();

  return (
    <div className="space-y-4">
      {/* Top Bar: Title, Date, Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
              اليوم
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              مركز التنفيذ اليومي
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            {arabicDateStr}
          </p>
        </div>

        {/* Action Buttons: Quick Add & Preferences */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سريعة</span>
          </button>

          <button
            onClick={onOpenPreferences}
            title="تخصيص مساحات اليوم"
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 cursor-pointer transition-all"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & Space Summary Card */}
      {totalCount > 0 && (
        <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 border border-white/10 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold text-white">
                تقدم مهام اليوم:
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {completedCount} من {totalCount} منجز
              </span>
            </div>

            <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
              {completionRate}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 shadow-sm"
              style={{ width: `${completionRate}%` }}
            />
          </div>

          {/* Active Spaces Breakdown Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none pt-1">
            {(Object.keys(spaceBreakdown) as LifeSpaceId[]).map((spaceId) => {
              const info = spaceBreakdown[spaceId];
              if (!info || info.total === 0) return null;
              const meta = SPACE_META[spaceId];
              const isAllDone = info.completed >= info.total;

              return (
                <div
                  key={spaceId}
                  className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-colors ${
                    isAllDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : meta.color
                  }`}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.name}</span>
                  <span className="font-mono text-[10px] opacity-80">
                    ({info.completed}/{info.total})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
