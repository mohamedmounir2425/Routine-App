import { useState } from 'react';
import { Routine } from '../types';
import { saveCustomRoutine, deleteCustomRoutine } from '../db';

export function useCustomRoutines(onRefresh: () => Promise<void>) {
  const [isRoutineBuilderOpen, setIsRoutineBuilderOpen] = useState<boolean>(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  const handleOpenCreateRoutine = () => {
    setEditingRoutine(null);
    setIsRoutineBuilderOpen(true);
  };

  const handleOpenEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setIsRoutineBuilderOpen(true);
  };

  const handleSaveCustomRoutine = async (routine: Routine) => {
    await saveCustomRoutine(routine);
    await onRefresh();
    setIsRoutineBuilderOpen(false);
    setEditingRoutine(null);
  };

  const handleDeleteCustomRoutine = async (routineId: string) => {
    await deleteCustomRoutine(routineId);
    await onRefresh();
  };

  return {
    isRoutineBuilderOpen,
    setIsRoutineBuilderOpen,
    editingRoutine,
    setEditingRoutine,
    handleOpenCreateRoutine,
    handleOpenEditRoutine,
    handleSaveCustomRoutine,
    handleDeleteCustomRoutine,
  };
}
