import React from 'react';
import { Video, Activity, BookOpen } from 'lucide-react';
import { Exercise } from '../../../../types';
import { ExerciseAnimation } from './ExerciseAnimation';
import { buildWorkoutVideoUrl } from '../../../../utils/youtube';

interface PlayerMediaProps {
  currentExercise: Exercise;
  viewMode: 'video' | 'animation';
  onSetViewMode: (mode: 'video' | 'animation') => void;
  isTvMode: boolean;
  isPaused?: boolean;
  readyCountdown?: number | null;
  onSkipReady?: () => void;
  onAddReadySeconds?: () => void;
  onOpenInstructions?: () => void;
  iframeRef: React.Ref<HTMLIFrameElement>;
  workoutVideoAutoplay?: boolean;
  workoutVideoMuted?: boolean;
  workoutVideoLoop?: boolean;
}

export const PlayerMedia: React.FC<PlayerMediaProps> = ({
  currentExercise,
  viewMode,
  onSetViewMode,
  isTvMode,
  isPaused = false,
  readyCountdown = null,
  onSkipReady,
  onAddReadySeconds,
  onOpenInstructions,
  iframeRef,
  workoutVideoAutoplay = true,
  workoutVideoMuted = true,
  workoutVideoLoop = true,
}) => {
  return (
    <div
      className={`w-full rounded-3xl liquid-glass-card relative overflow-hidden shadow-2xl flex flex-col items-center justify-center shrink-0 ${
        isTvMode ? 'h-[44vh] sm:h-[50vh]' : 'h-[36vh] sm:h-[42vh] max-h-[340px]'
      }`}
    >
      {/* Top Bar: Media Toggle Pills & Instructions Drawer Button */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none">
        {onOpenInstructions ? (
          <button
            type="button"
            onClick={onOpenInstructions}
            className="pointer-events-auto px-3 py-1.5 text-xs font-bold rounded-xl liquid-glass-pill text-emerald-300 hover:text-white flex items-center gap-1.5 shadow-md transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>شرح الحركة</span>
          </button>
        ) : (
          <span />
        )}

        <div className="pointer-events-auto flex gap-1.5 liquid-glass-pill p-1 rounded-xl shadow-md">
          <button
            type="button"
            onClick={() => onSetViewMode('animation')}
            className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'animation' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>رسم الحركة</span>
          </button>
          {currentExercise.videoUrl && (
            <button
              type="button"
              onClick={() => onSetViewMode('video')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                viewMode === 'video' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>فيديو</span>
            </button>
          )}
        </div>
      </div>

      {/* Ready Phase Overlay Banner (الاستعداد) */}
      {readyCountdown !== null && (
        <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-950/90 border border-amber-400/40 px-3.5 py-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 font-mono text-base font-black text-amber-300">
              {readyCountdown > 0 ? readyCountdown : 'ابدأ'}
            </span>
            <span className="text-xs font-bold text-amber-200">
              {isPaused ? 'الاستعداد متوقف مؤقتًا' : 'استعد لبدء التمرين...'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {onAddReadySeconds && (
              <button
                type="button"
                onClick={onAddReadySeconds}
                className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-white/20"
              >
                +3 ثوانٍ
              </button>
            )}
            {onSkipReady && (
              <button
                type="button"
                onClick={onSkipReady}
                className="rounded-lg bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950 hover:brightness-110"
              >
                بدء الآن
              </button>
            )}
          </div>
        </div>
      )}

      {viewMode === 'video' && currentExercise?.videoUrl ? (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <iframe
            ref={iframeRef}
            key={`${currentExercise.id}-${workoutVideoAutoplay}-${workoutVideoMuted}-${workoutVideoLoop}`}
            src={buildWorkoutVideoUrl(currentExercise.videoUrl, {
              autoplay: workoutVideoAutoplay,
              mute: workoutVideoMuted,
              loop: workoutVideoLoop,
            })}
            title={currentExercise.name}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <ExerciseAnimation
          slug={currentExercise.animationSlug}
          category={currentExercise.category}
          isPaused={isPaused}
          className="w-full h-full scale-95 sm:scale-100"
        />
      )}
    </div>
  );
};
