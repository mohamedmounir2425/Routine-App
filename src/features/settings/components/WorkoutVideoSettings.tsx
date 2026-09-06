import React from 'react';
import { Video, PlayCircle, VolumeX, Repeat, Sparkles } from 'lucide-react';
import { UserSettings } from '../../../types';

interface WorkoutVideoSettingsProps {
  settings: UserSettings;
  onToggle: (key: keyof UserSettings, val: any) => void;
}

export const WorkoutVideoSettings: React.FC<WorkoutVideoSettingsProps> = ({
  settings,
  onToggle,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white font-['Tajawal'] flex items-center gap-2">
              <span>مشغل التمارين وعرض الفيديو</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                YouTube & Video
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              التحكم في تشغيل فيديوهات التمارين، كتم الصوت، وتكرار العرض تلقائياً
            </p>
          </div>
        </div>
      </div>

      {/* 1. Autoplay Video */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="space-y-0.5 pr-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <PlayCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>تشغيل فيديو التمرين تلقائياً (Autoplay)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            بدء تشغيل فيديو YouTube فور فتح المشغل وعند الانتقال التلقائي بين التمارين
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.workoutVideoAutoplay ?? true}
          onChange={(e) => onToggle('workoutVideoAutoplay', e.target.checked)}
          className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
        />
      </div>

      {/* 2. Mute Video Audio */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="space-y-0.5 pr-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <VolumeX className="w-3.5 h-3.5 text-amber-400" />
            <span>كتم صوت فيديو اليوتيوب (Mute Video Audio)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            كتم صوت الفيديو لمنع تداخله مع التوجيه الصوتي والعد التنازلي، وضمان التشغيل التلقائي المباشر في المتصفحات
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.workoutVideoMuted ?? true}
          onChange={(e) => onToggle('workoutVideoMuted', e.target.checked)}
          className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
        />
      </div>

      {/* 3. Loop / Repeat Video */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
        <div className="space-y-0.5 pr-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <Repeat className="w-3.5 h-3.5 text-teal-400" />
            <span>تكرار تشغيل الفيديو تلقائياً (Loop / Repeat)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            إعادة تشغيل الفيديو بشكل متكرر فور انتهائه حتى ينتهي وقت أداء التمرين
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.workoutVideoLoop ?? true}
          onChange={(e) => onToggle('workoutVideoLoop', e.target.checked)}
          className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0"
        />
      </div>

      {/* 4. Default View Mode in Player */}
      <div className="py-2">
        <div className="text-xs font-bold text-slate-200 mb-1">
          طريقة العرض الافتراضية للتمرين في المشغل
        </div>
        <div className="text-[11px] text-slate-400 mb-2.5">
          اختر العرض الذي يبدأ به مشغل التمارين أولاً عند تشغيل أي روتين
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onToggle('workoutDefaultViewMode', 'video')}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
              (settings.workoutDefaultViewMode ?? 'video') === 'video'
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-400 shadow-sm ring-1 ring-rose-500/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>فيديو يوتيوب الشارح 🎥</span>
          </button>
          <button
            type="button"
            onClick={() => onToggle('workoutDefaultViewMode', 'animation')}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
              settings.workoutDefaultViewMode === 'animation'
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-400 shadow-sm ring-1 ring-sky-500/30'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>رسم الحركة التوضيحي 🏃</span>
          </button>
        </div>
      </div>
    </div>
  );
};
