import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Exercise } from '../../../types';
import { ExerciseAnimation } from '../../../components/player/ExerciseAnimation';

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
  return (
    <div
      onClick={() => onSelect(exercise)}
      className="group relative liquid-glass-card rounded-3xl p-5 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Card visual / badge row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold liquid-glass-pill text-slate-300">
            {exercise.category === 'back' ? 'علاج الظهر' : exercise.category === 'core' ? 'تقوية الجذع' : 'مرونة وإطالة'}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(exercise.id, !exercise.isFavorite);
            }}
            className="p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <Star className={`w-4 h-4 ${exercise.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
          </button>
        </div>

        {/* Animation mini preview */}
        <div className="w-full h-28 liquid-glass-pill rounded-2xl mb-3 flex items-center justify-center overflow-hidden">
          <ExerciseAnimation slug={exercise.animationSlug} category={exercise.category} className="scale-75" />
        </div>

        <h3 className="text-base font-bold text-white font-['Tajawal'] group-hover:text-emerald-400 transition-colors">
          {exercise.arabicName}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">{exercise.name}</p>

        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {exercise.description}
        </p>
      </div>

      {/* Bottom info row */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          {exercise.durationSeconds} ثانية
        </span>
        <span className="text-[11px] text-emerald-400 font-semibold group-hover:underline">
          عرض التفاصيل ←
        </span>
      </div>
    </div>
  );
};
