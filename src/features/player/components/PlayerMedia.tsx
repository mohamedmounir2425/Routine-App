import React from 'react';
import { Video, Activity } from 'lucide-react';
import { Exercise } from '../../../types';
import { ExerciseAnimation } from '../../../components/player/ExerciseAnimation';
import { buildWorkoutVideoUrl } from '../../../utils/youtube';

interface PlayerMediaProps {
  currentExercise: Exercise;
  viewMode: 'video' | 'animation';
  onSetViewMode: (mode: 'video' | 'animation') => void;
  isTvMode: boolean;
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
  iframeRef,
  workoutVideoAutoplay = true,
  workoutVideoMuted = true,
  workoutVideoLoop = true,
}) => {
  return (
    <div className={`w-full rounded-3xl liquid-glass-card relative overflow-hidden shadow-2xl flex items-center justify-center shrink-0 ${
      isTvMode ? 'h-[44vh] sm:h-[50vh]' : 'h-[36vh] sm:h-[42vh] max-h-[340px]'
    }`}>
      {/* Media Toggle Pills */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5 liquid-glass-pill p-1 rounded-xl shadow-md">
        {currentExercise.videoUrl && (
          <button
            onClick={() => onSetViewMode('video')}
            className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
              viewMode === 'video' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>فيديو</span>
          </button>
        )}
        <button
          onClick={() => onSetViewMode('animation')}
          className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
            viewMode === 'animation' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>رسم الحركة</span>
        </button>
      </div>

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
          className="w-full h-full scale-95 sm:scale-100"
        />
      )}
    </div>
  );
};
