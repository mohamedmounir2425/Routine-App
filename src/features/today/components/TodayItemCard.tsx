import React from 'react';
import { 
  Check, 
  Clock, 
  Play, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Flame, 
  AlertCircle, Pencil
} from 'lucide-react';
import { TodayItem } from '../todayTypes';
import { getSpaceTheme } from '../../../theme/spaceTheme';

interface TodayItemCardProps {
  item: TodayItem;
  onExecuteAction: (item: TodayItem) => void;
  onAddQuranPage?: (amount: number) => void;
  onEditTask?: (item: TodayItem) => void;
}

export const TodayItemCard: React.FC<TodayItemCardProps> = ({
  item,
  onExecuteAction,
  onAddQuranPage,
  onEditTask,
}) => {
  const space = getSpaceTheme(item.space);

  // Render Time / Status badge
  const renderStatusBadge = () => {
    if (item.isCompleted) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5" />
          مكتمل ✓
        </span>
      );
    }

    if (item.timeTag === 'now') {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
          <Clock className="w-2.5 h-2.5" />
          الآن
        </span>
      );
    }

    if (item.timeTag === 'overdue') {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
          <AlertCircle className="w-2.5 h-2.5" />
          فات الموعد
        </span>
      );
    }

    if (item.scheduledTime) {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white/5 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {item.scheduledTime}
        </span>
      );
    }

    if (item.priority === 'high') {
      return (
        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 flex items-center gap-1">
          <Flame className="w-2.5 h-2.5" />
          أولوية عالية
        </span>
      );
    }

    return null;
  };

  // Render Action Controls
  const renderActionControl = () => {
    // 1. Workout Session Launcher
    if (item.actionType === 'start_workout') {
      return (
        <button
          type="button"
          onClick={() => onExecuteAction(item)}
          disabled={item.isCompleted}
          aria-label={item.isCompleted ? `التمرين منجز: ${item.title}` : `بدء تمرين: ${item.title}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
            item.isCompleted
              ? 'bg-white/5 text-slate-400 border border-white/10 opacity-60'
              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/35 hover:scale-105 active:scale-95'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{item.isCompleted ? 'أُنجز التمرين ✓' : 'بدء التمرين'}</span>
        </button>
      );
    }

    // 2. Quran Quick Increment + Open
    if (item.actionType === 'open_quran') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAddQuranPage ? onAddQuranPage(1) : onExecuteAction(item)}
            aria-label="إضافة صفحة واحدة للورد القرآني"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <Plus className="w-3 h-3" />
            <span>صفحة</span>
          </button>

          <button
            type="button"
            onClick={() => onAddQuranPage ? onAddQuranPage(5) : onExecuteAction(item)}
            aria-label="إضافة 5 صفحات للورد القرآني"
            className="px-2 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[11px] font-bold cursor-pointer transition-all active:scale-95 hidden sm:block focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            +٥
          </button>

          <button
            type="button"
            onClick={() => onExecuteAction(item)}
            aria-label="فتح الورد القرآني في مساحة العبادة"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            title="فتح الورد القرآني"
          >
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // 3. Project Step Completion
    if (item.actionType === 'complete_project_step') {
      return (
        <button
          type="button"
          onClick={() => onExecuteAction(item)}
          aria-label={`إنجاز خطوة المشروع: ${item.title}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs cursor-pointer transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        >
          <Check className="w-3.5 h-3.5" />
          <span>إنجاز الخطوة</span>
        </button>
      );
    }

    // 4. Azkar Category Launcher
    if (item.actionType === 'open_azkar') {
      return (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onExecuteAction(item)}
            disabled={item.isCompleted}
            aria-label={`فتح وقراءة: ${item.title}`}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
              item.isCompleted
                ? 'bg-white/5 text-slate-400 border border-white/10 opacity-60'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/35 hover:scale-105 active:scale-95'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{item.isCompleted ? 'تم إتمام الأذكار ✓' : 'قراءة'}</span>
          </button>
        </div>
      );
    }

    // 5. Default Task / Prayer Checkbox Toggle
    return (
      <button
        type="button"
        onClick={() => onExecuteAction(item)}
        aria-label={item.isCompleted ? `إلغاء إكمال: ${item.title}` : `إكمال: ${item.title}`}
        className={`w-7 h-7 rounded-xl border flex items-center justify-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
          item.isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
            : 'border-white/20 bg-white/5 hover:border-emerald-500/50 text-transparent hover:text-white/40'
        }`}
      >
        <Check className={`w-4 h-4 stroke-[2.5] ${item.isCompleted ? 'text-slate-950' : 'opacity-0'}`} />
      </button>
    );
  };

  return (
    <div
      className={`liquid-glass-card rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 ${
        item.isCompleted
          ? 'bg-slate-950/30 border-white/5 opacity-60'
          : item.timeTag === 'now'
          ? 'border-emerald-500/35 bg-emerald-500/5 shadow-md shadow-emerald-500/5'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {/* Main Toggle Checkbox for tasks & prayers */}
          {(item.actionType === 'toggle_task' || item.actionType === 'log_prayer') && (
            <div className="shrink-0 pt-0.5 sm:pt-0">
              {renderActionControl()}
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-1">
            {/* Upper Chips: Space & Status */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${space.badgeBgClass} ${space.textClass} ${space.badgeBorderClass} flex items-center gap-1`}>
                <span>{space.icon}</span>
                <span>{space.label}</span>
              </span>

              {renderStatusBadge()}

              {item.categoryLabel && (
                <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                  {item.categoryLabel}
                </span>
              )}
            </div>

            {/* Title & Subtitle */}
            <div className="min-w-0">
              <h4
                className={`text-sm sm:text-base font-bold font-['Tajawal'] truncate ${
                  item.isCompleted ? 'text-slate-400 line-through' : 'text-white'
                }`}
              >
                {item.title}
              </h4>
              {item.subtitle && (
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {item.subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Control (Workout launcher, Quran pages, Project step) */}
        {item.actionType !== 'toggle_task' && item.actionType !== 'log_prayer' && (
          <div className="shrink-0">
            {renderActionControl()}
          </div>
        )}
      </div>
      {item.actionType === 'toggle_task' && onEditTask && <div className="today-task-tools"><button type="button" onClick={() => onEditTask(item)} aria-label={`تعديل: ${item.title}`}><Pencil size={13} /> تعديل الموعد والتفاصيل</button></div>}
    </div>
  );
};
