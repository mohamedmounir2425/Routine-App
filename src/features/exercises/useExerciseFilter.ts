import { useState, useMemo } from 'react';
import { Exercise } from '../../types';

export function useExerciseFilter(exercises: Exercise[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch = !query || 
        ex.arabicName.toLowerCase().includes(query) ||
        ex.name.toLowerCase().includes(query) ||
        ex.targetMuscles.some(m => m.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'favorites') return !!ex.isFavorite;
      return ex.category === selectedCategory;
    });
  }, [exercises, searchTerm, selectedCategory]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredExercises,
  };
}
