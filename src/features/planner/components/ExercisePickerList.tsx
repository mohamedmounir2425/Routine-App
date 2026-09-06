import React, { useState } from 'react';
import { Search, Check, Plus } from 'lucide-react';
import { Exercise } from '../../../types';
import { SlidingTabs } from '../../../components/common/SlidingTabs';

interface ExercisePickerListProps {
  availableExercises: Exercise[];
  selectedExerciseIds: string[];
  onToggleExercise: (id: string) => void;
}

export const ExercisePickerList: React.FC<ExercisePickerListProps> = ({
  availableExercises,
  selectedExerciseIds,
  onToggleExercise,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'core' | 'back'>('all');

  const filteredExercises = availableExercises.filter(ex => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.arabicName.includes(searchQuery);
    const matchesCat =
      categoryFilter === 'all' ||
      (categoryFilter === 'core' && (ex.category === 'core' || ex.category === 'back')) ||
      ex.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-3 pt-2">
      <h4 className="text-sm font-bold text-white font-['Tajawal']">
        إضافة تمارين من المكتبة ({availableExercises.length} تمريناً متاحاً)
      </h4>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث عن تمرين..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <SlidingTabs
          tabs={[
            { id: 'all', label: 'الكل' },
            { id: 'core', label: 'البطن والجوانب' },
            { id: 'back', label: 'عضلات الظهر' },
          ]}
          activeTab={categoryFilter}
          onChange={(tab) => setCategoryFilter(tab as 'all' | 'core' | 'back')}
          size="sm"
          className="w-full sm:w-auto justify-center"
        />
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1 custom-scrollbar">
        {filteredExercises.map(ex => {
          const isSelected = selectedExerciseIds.includes(ex.id);
          return (
            <div
              key={ex.id}
              onClick={() => onToggleExercise(ex.id)}
              className={`p-3 rounded-2xl border text-right cursor-pointer transition-all flex items-center justify-between gap-2 ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                  : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold font-['Tajawal'] truncate">
                  {ex.arabicName}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{ex.name}</div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
