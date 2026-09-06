import React, { useState } from 'react';
import { X, Play, Star, AlertTriangle } from 'lucide-react';
import { Exercise } from '../../../types';
import { ExerciseAnimation } from '../../../components/player/ExerciseAnimation';
import { buildWorkoutVideoUrl } from '../../../utils/youtube';

interface ExerciseDetailsModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onPreviewExerciseInPlayer?: (exercise: Exercise) => void;
}

export const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({
  exercise,
  onClose,
  onToggleFavorite,
  onPreviewExerciseInPlayer,
}) => {
  const [modalViewMode, setModalViewMode] = useState<'video' | 'animation'>('video');

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl liquid-glass rounded-3xl p-5 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto my-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2 rounded-xl liquid-glass-pill text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 text-right">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {exercise.category === 'back' ? 'علاج الظهر' : exercise.category === 'core' ? 'تقوية الجذع' : 'مرونة وإطالة'}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white font-['Tajawal'] mt-1">
            {exercise.arabicName}
          </h3>
          <p className="text-xs text-slate-400">{exercise.name}</p>
        </div>

        {/* Media switcher pills & direct link */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {exercise.videoUrl && (
              <button
                onClick={() => setModalViewMode('video')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  modalViewMode === 'video' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                فيديو يوتيوب
              </button>
            )}
            <button
              onClick={() => setModalViewMode('animation')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                modalViewMode === 'animation' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              رسم توضيحي
            </button>
          </div>

          {exercise.youtubeUrl && (
            <a
              href={exercise.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold underline underline-offset-4"
            >
              <span>فتح في YouTube</span>
              <span>↗</span>
            </a>
          )}
        </div>

        {/* Visual presentation */}
        <div className="w-full h-48 sm:h-56 bg-slate-950 border border-slate-800 rounded-2xl mb-4 overflow-hidden flex items-center justify-center">
          {modalViewMode === 'video' && exercise.videoUrl ? (
            <iframe
              src={buildWorkoutVideoUrl(exercise.videoUrl, { autoplay: false, mute: true, loop: true })}
              title={exercise.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <ExerciseAnimation slug={exercise.animationSlug} category={exercise.category} />
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4 text-right">
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              خطوات التنفيذ السليمة:
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {exercise.instructions.map((inst, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{inst}</span>
                </li>
              ))}
            </ul>
          </div>

          {exercise.precautions && exercise.precautions.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <div>
                <strong className="block text-[11px] text-amber-400 mb-0.5">تنبيه لمرضى الظهر:</strong>
                {exercise.precautions[0]}
              </div>
            </div>
          )}

          {/* Muscles */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2">
            <span className="text-xs text-slate-400">العضلات المستهدفة:</span>
            {exercise.targetMuscles.map(m => (
              <span key={m} className="px-2 py-0.5 rounded-lg bg-slate-800 text-[11px] text-slate-300">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex gap-3">
          <button
            onClick={() => {
              onClose();
              if (onPreviewExerciseInPlayer) onPreviewExerciseInPlayer(exercise);
            }}
            className="flex-1 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>بدء التمرين الفردي الآن</span>
          </button>

          <button
            onClick={() => {
              onToggleFavorite(exercise.id, !exercise.isFavorite);
            }}
            className={`p-3 rounded-2xl border transition-colors ${
              exercise.isFavorite
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="إضافة للمفضلة"
          >
            <Star className={`w-4 h-4 ${exercise.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
