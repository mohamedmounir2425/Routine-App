import React from 'react';
import { Star, Clock, Repeat } from 'lucide-react';
import { Exercise } from '../../../../types';
import { ExerciseAnimation } from '../../player/components/ExerciseAnimation';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect: (ex: Exercise) => void;
  onToggleFavorite: (id: string, isFav: boolean) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onSelect,
  onToggleFavorite,
}) => {
  const categoryLabel =
    exercise.category === 'back'
      ? 'علاج الظهر'
      : exercise.category === 'core'
        ? 'تثبيت الجذع'
        : exercise.category === 'neck'
          ? 'أعلى الظهر والرقبة'
          : 'مرونة وإطالة';

  return (
    <div
      onClick={() => onSelect(exercise)}
      className="group relative liquid-glass-card rounded-3xl p-4 cursor-pointer flex flex-col justify-between transition-all hover:border-emerald-500/40"
    >
      <div>
        {/* Static Thumbnail + Favorite Button */}
        <div className="relative w-full h-28 liquid-glass-pill rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
          <span className="absolute top-2 right-2 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-slate-300 border border-white/10">
            {categoryLabel}
          </span>
          <button
            type="button"
            aria-label={exercise.isFavorite ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            onClick={e => {
              e.stopPropagation();
              onToggleFavorite(exercise.id, !exercise.isFavorite);
            }}
            className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                exercise.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
              }`}
            />
          </button>

          <ExerciseAnimation
            slug={exercise.animationSlug}
            category={exercise.category}
            thumbnail
            className="w-full h-full max-w-[180px]"
          />
        </div>

        {/* Exercise Name */}
        <h3 className="text-base font-bold text-white font-['Tajawal'] group-hover:text-emerald-400 transition-colors line-clamp-1">
          {exercise.arabicName}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{exercise.name}</p>
      </div>

      {/* Reps or Seconds Summary Row */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
        {exercise.reps ? (
          <span className="flex items-center gap-1.5 font-semibold">
            <Repeat className="w-3.5 h-3.5 text-teal-400" />
            <span>{exercise.reps} تكرار</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{exercise.durationSeconds} ثانية</span>
          </span>
        )}
        <span className="text-[11px] text-emerald-400 font-semibold group-hover:underline">
          التفاصيل ←
        </span>
      </div>
    </div>
  );
};
