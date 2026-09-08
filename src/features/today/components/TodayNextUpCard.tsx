import React from 'react';
import { 
  Zap, 
  Clock, 
  CheckCircle2, 
  Play, 
  BookOpen
} from 'lucide-react';
import { TodayItem } from '../todayTypes';

interface TodayNextUpCardProps {
  nextUp: TodayItem | null;
  onExecuteAction: (item: TodayItem) => void;
}

const SPACE_ACCENTS: Record<string, { label: string; emoji: string; gradient: string; border: string }> = {
  worship: { label: 'عبادة', emoji: '🕌', gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent', border: 'border-emerald-500/40' },
  health: { label: 'صحة', emoji: '🏋️', gradient: 'from-cyan-500/20 via-teal-500/10 to-transparent', border: 'border-cyan-500/40' },
  work: { label: 'عمل', emoji: '💼', gradient: 'from-indigo-500/20 via-blue-500/10 to-transparent', border: 'border-indigo-500/40' },
  home: { label: 'منزل', emoji: '🏠', gradient: 'from-amber-500/20 via-orange-500/10 to-transparent', border: 'border-amber-500/40' },
  plans: { label: 'خطة', emoji: '🎯', gradient: 'from-violet-500/20 via-purple-500/10 to-transparent', border: 'border-violet-500/40' },
};

export const TodayNextUpCard: React.FC<TodayNextUpCardProps> = ({
  nextUp,
  onExecuteAction,
}) => {
  if (!nextUp) {
    return (
      <div className="liquid-glass-card rounded-3xl p-6 sm:p-7 border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
          🎉
        </div>
        <h3 className="text-base sm:text-lg font-black text-white font-['Tajawal']">
          كل شيء منجز حتى الآن!
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          أتممت كافة بنود اليوم المحددة، أو لا توجد مهام عاجلة في الوقت الراهن. استمتع بيومك أو أضف مهمة جديدة.
        </p>
      </div>
    );
  }

  const spaceConfig = SPACE_ACCENTS[nextUp.space] || SPACE_ACCENTS.work;

  const renderActionButton = () => {
    switch (nextUp.actionType) {
      case 'start_workout':
        return (
          <button
            onClick={() => onExecuteAction(nextUp)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>ابدأ التمرين الآن</span>
          </button>
        );

      case 'log_prayer':
        return (
          <button
            onClick={() => onExecuteAction(nextUp)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تمت الصلاة بفضل الله</span>
          </button>
        );

      case 'open_azkar':
        return (
          <button
            onClick={() => onExecuteAction(nextUp)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <BookOpen className="w-4 h-4" />
            <span>قراءة الأذكار</span>
          </button>
        );

      case 'complete_project_step':
        return (
          <button
            onClick={() => onExecuteAction(nextUp)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>إنجاز هذه الخطوة</span>
          </button>
        );

      case 'open_quran':
        return (
          <button
            onClick={() => onExecuteAction(nextUp)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <BookOpen className="w-4 h-4" />
            <span>فتح الورد القرآني</span>
          </button>
        );

      default:
        return (
          <button
            onClick={() => onExecuteAction(nextUp)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>إتمام المهمة الآن</span>
          </button>
        );
    }
  };

  return (
    <div className={`liquid-glass-card rounded-3xl p-5 sm:p-6 border ${spaceConfig.border} bg-gradient-to-br ${spaceConfig.gradient} relative overflow-hidden transition-all duration-300`}>
      {/* Decorative Glow Blob */}
      <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
        <div className="space-y-2.5">
          {/* Top Tag: NEXT UP Label */}
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
              ما التالي؟ · الخطوة القادمة
            </span>

            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
              <span>{spaceConfig.emoji}</span>
              <span>{spaceConfig.label}</span>
            </span>

            {nextUp.scheduledTime && (
              <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/5 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {nextUp.scheduledTime}
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white font-['Tajawal'] tracking-tight">
              {nextUp.title}
            </h2>
            {nextUp.subtitle && (
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                {nextUp.subtitle}
              </p>
            )}
          </div>

          {/* Meta details */}
          <div className="flex items-center gap-3 text-xs text-slate-400 pt-0.5">
            {nextUp.estimatedMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>المدة المتوقعة: {nextUp.estimatedMinutes} دقيقة</span>
              </span>
            )}
            {nextUp.categoryLabel && (
              <span className="text-slate-400">
                · {nextUp.categoryLabel}
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="shrink-0 pt-2 sm:pt-0">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};
