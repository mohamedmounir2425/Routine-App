import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Check } from 'lucide-react';

interface PlayerControlsProps {
  currentIndex: number;
  isPaused: boolean;
  onPrev: () => void;
  onTogglePause: () => void;
  onComplete?: () => void;
  onNext: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentIndex,
  isPaused,
  onPrev,
  onTogglePause,
  onComplete,
  onNext,
}) => {
  return (
    <div className="w-full max-w-lg mx-auto shrink-0 flex items-center justify-center gap-2.5 sm:gap-4 py-2.5 border-t border-white/10 relative z-10">
      {/* Back / السابق button */}
      <button
        type="button"
        onClick={onPrev}
        disabled={currentIndex === 0}
        className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 flex items-center gap-1.5 shadow-lg liquid-button"
        title="التمرين السابق"
      >
        <SkipForward className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-bold font-['Tajawal']">السابق</span>
      </button>

      {/* Play / Pause */}
      <button
        type="button"
        onClick={onTogglePause}
        aria-label={isPaused ? 'استئناف' : 'إيقاف مؤقت'}
        className={`px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl font-bold text-slate-950 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 liquid-button ${
          isPaused
            ? 'bg-gradient-to-tr from-amber-500 to-amber-300 shadow-amber-400/30'
            : 'bg-white/90 text-slate-950 hover:bg-white'
        }`}
        title={isPaused ? 'استئناف المؤقت' : 'إيقاف كل المؤقتات مؤقتًا'}
      >
        {isPaused ? (
          <>
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
            <span className="text-xs sm:text-sm font-black font-['Tajawal']">استئناف</span>
          </>
        ) : (
          <>
            <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950" />
            <span className="text-xs sm:text-sm font-black font-['Tajawal']">إيقاف مؤقت</span>
          </>
        )}
      </button>

      {/* Complete / تم ✓ button */}
      {onComplete && (
        <button
          type="button"
          onClick={onComplete}
          className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-400 text-slate-950 font-black shadow-xl shadow-emerald-500/25 transition-all active:scale-95 flex items-center gap-1.5 liquid-button"
          title="إتمام التمرين الحالي والانتقال للتالي"
        >
          <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          <span className="text-xs sm:text-sm font-black font-['Tajawal']">تم</span>
        </button>
      )}

      {/* Skip / تخطي button */}
      <button
        type="button"
        onClick={onNext}
        className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl liquid-glass-pill text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 shadow-lg liquid-button"
        title="تخطي التمرين دون احتسابه مكتملًا"
      >
        <span className="text-xs font-bold font-['Tajawal']">تخطي</span>
        <SkipBack className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};
