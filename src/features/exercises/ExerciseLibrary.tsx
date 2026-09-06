import React, { useState } from 'react';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { Exercise } from '../../types';
import { SlidingTabs } from '../../components/common/SlidingTabs';
import { useExerciseFilter } from './useExerciseFilter';
import { SafetyTipsAccordion } from './components/SafetyTipsAccordion';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseDetailsModal } from './components/ExerciseDetailsModal';
import { AddExerciseModal } from './components/AddExerciseModal';

interface Props {
  exercises: Exercise[];
  onToggleFavorite: (id: string, isFav: boolean) => void;
  onAddExercise: (newEx: Omit<Exercise, 'id' | 'createdAt'>) => void;
  onPreviewExerciseInPlayer?: (exercise: Exercise) => void;
}

export const ExerciseLibrary: React.FC<Props> = ({
  exercises,
  onToggleFavorite,
  onAddExercise,
  onPreviewExerciseInPlayer,
}) => {
  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
  } = useExerciseFilter(exercises);

  const [activeExercise, setActiveExercise] = useState<Exercise | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-['Tajawal'] tracking-tight">
            مكتبة التمارين العلاجية 🏋️
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            تمارين آمنة ومعتمدة في التأهيل والعلاج الطبيعي لتقوية الظهر وتليين العمود الفقري.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة تمرين خاص</span>
        </button>
      </div>

      {/* Safety Tips Accordion */}
      <SafetyTipsAccordion />

      {/* Search & Categories */}
      <div className="space-y-3">
        {/* Search Box */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="ابحث باسم التمرين أو العضلة المستهدفة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full liquid-glass-pill rounded-2xl pr-10 pl-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Badges with Smooth Swipe */}
        <div className="overflow-x-auto pb-1 no-scrollbar">
          <SlidingTabs
            tabs={[
              { id: 'all', label: 'الكل' },
              { id: 'favorites', label: '⭐ المفضلة' },
              { id: 'back', label: 'علاج الظهر' },
              { id: 'core', label: 'تثبيت الجذع' },
              { id: 'mobility', label: 'المرونة والاستطالة' },
              { id: 'neck', label: 'أعلى الظهر والرقبة' },
            ]}
            activeTab={selectedCategory}
            onChange={setSelectedCategory}
            size="sm"
            className="w-max min-w-full sm:min-w-0"
          />
        </div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map(ex => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            onSelect={setActiveExercise}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-16 liquid-glass rounded-3xl">
          <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">لا توجد تمارين تطابق هذا البحث أو التصنيف.</p>
        </div>
      )}

      {/* Exercise Detail Modal */}
      <ExerciseDetailsModal
        exercise={activeExercise}
        onClose={() => setActiveExercise(null)}
        onToggleFavorite={onToggleFavorite}
        onPreviewExerciseInPlayer={onPreviewExerciseInPlayer}
      />

      {/* Add Custom Exercise Modal */}
      <AddExerciseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddExercise={onAddExercise}
      />
    </div>
  );
};
