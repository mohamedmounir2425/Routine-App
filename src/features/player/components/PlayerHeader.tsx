import React from 'react';
import { X, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';
import { Exercise } from '../../../types';

interface PlayerHeaderProps {
  routineName: string;
  currentIndex: number;
  totalExercises: number;
  progressPercent: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isTvMode: boolean;
  onToggleTvMode: () => void;
  onOpenExitConfirm: () => void;
  sessionExercises: Exercise[];
  currentExerciseDuration: number;
  timeLeft: number;
  phase: 'exercise' | 'rest' | 'completed';
}

export const PlayerHeader: React.FC<PlayerHeaderProps> = ({
  routineName,
  currentIndex,
  totalExercises,
  progressPercent,
  isMuted,
  onToggleMute,
  isTvMode,
  onToggleTvMode,
  onOpenExitConfirm,
  sessionExercises,
  currentExerciseDuration,
  timeLeft,
  phase,
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto shrink-0 pb-2 border-b border-white/10 relative z-10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenExitConfirm}
            className="p-1.5 sm:p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
            title="إنهاء الجلسة والخروج"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full liquid-glass-pill text-emerald-400 font-['Tajawal']">
              {routineName}
            </span>
            <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-medium">
              التمرين {currentIndex + 1} من {totalExercises}
            </div>
          </div>
        </div>

        {/* Action icons & Percentage Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Live Progress Percentage Badge */}
          <span className="px-2.5 py-1 rounded-xl liquid-glass-pill text-emerald-400 font-mono text-xs font-black shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{Math.round(progressPercent)}%</span>
          </span>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
              isMuted ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' : 'liquid-glass-pill text-slate-300 hover:text-white'
            }`}
            title={isMuted ? 'تشغيل الصوت والتوجيه' : 'كتم الصوت'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* TV / Big Screen Toggle */}
          <button
            onClick={onToggleTvMode}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
              isTvMode ? 'bg-sky-500 text-white border-sky-400' : 'liquid-glass-pill text-slate-300 hover:text-white'
            }`}
            title={isTvMode ? 'تصغير الشاشة' : 'وضع الشاشة الكبيرة (TV)'}
          >
            {isTvMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Segmented Progress Tracker */}
      <div 
        className="w-full flex items-center gap-1.5 sm:gap-2 mt-2.5"
        title={`إنجاز الجلسة: ${Math.round(progressPercent)}%`}
      >
        {sessionExercises.map((_, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const currentPercent = isCurrent 
            ? phase === 'exercise'
              ? ((currentExerciseDuration - timeLeft) / (currentExerciseDuration || 60)) * 100
              : 100
            : 0;

          return (
            <div 
              key={idx}
              className="flex-1 h-2 sm:h-2.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative shadow-inner"
            >
              {isCompleted && (
                <div className="w-full h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
              )}
              {isCurrent && (
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 shadow-[0_0_14px_rgba(52,211,153,0.9)] transition-all duration-300 relative rounded-full"
                  style={{ width: `${Math.max(6, currentPercent)}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-2 bg-white rounded-full animate-pulse shadow-sm" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
