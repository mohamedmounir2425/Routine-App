import { db } from './database';
import { WorkoutScheduleEntry } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncSingleWorkoutSchedule, syncSingleWorkoutScheduleDelete } from './syncEngine';

/**
 * Create a new scheduled workout entry.
 */
export async function createSchedule(
  entryData: Omit<WorkoutScheduleEntry, 'id'> & { id?: string }
): Promise<WorkoutScheduleEntry> {
  const id = entryData.id || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const entry: WorkoutScheduleEntry = {
    ...entryData,
    id,
    isEnabled: entryData.isEnabled !== undefined ? entryData.isEnabled : true,
  };

  try {
    await db.workoutSchedules.put(entry);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleWorkoutSchedule(session.user.id, entry);
        }
      });
    }

    return entry;
  } catch (error) {
    console.error('Failed to create workout schedule:', error);
    return entry;
  }
}

/**
 * Update an existing workout schedule.
 */
export async function updateSchedule(
  id: string,
  partial: Partial<WorkoutScheduleEntry>
): Promise<WorkoutScheduleEntry | null> {
  try {
    const existing = await db.workoutSchedules.get(id);
    if (!existing) return null;

    const updated: WorkoutScheduleEntry = {
      ...existing,
      ...partial,
      id,
    };

    await db.workoutSchedules.put(updated);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleWorkoutSchedule(session.user.id, updated);
        }
      });
    }

    return updated;
  } catch (error) {
    console.error('Failed to update workout schedule:', error);
    return null;
  }
}

/**
 * Delete a workout schedule entry.
 */
export async function deleteSchedule(id: string): Promise<void> {
  try {
    await db.workoutSchedules.delete(id);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleWorkoutScheduleDelete(session.user.id, id);
        }
      });
    }
  } catch (error) {
    console.error('Failed to delete workout schedule:', error);
  }
}

/**
 * Get all active workout schedules for a specific day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 * Sorted chronologically by scheduledTime.
 */
export async function getSchedulesForDay(dayOfWeek: number): Promise<WorkoutScheduleEntry[]> {
  try {
    const entries = await db.workoutSchedules
      .where('dayOfWeek')
      .equals(dayOfWeek)
      .filter((s) => s.isEnabled)
      .toArray();

    return entries.sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));
  } catch (error) {
    console.error(`Failed to get workout schedules for day ${dayOfWeek}:`, error);
    return [];
  }
}

/**
 * Get all configured workout schedules across the week.
 */
export async function getWeeklySchedules(): Promise<WorkoutScheduleEntry[]> {
  try {
    return await db.workoutSchedules.toArray();
  } catch (error) {
    console.error('Failed to get weekly schedules:', error);
    return [];
  }
}

/**
 * Toggle the enabled/disabled status of a workout schedule entry.
 */
export async function toggleSchedule(id: string): Promise<WorkoutScheduleEntry | null> {
  try {
    const existing = await db.workoutSchedules.get(id);
    if (!existing) return null;

    const updated: WorkoutScheduleEntry = {
      ...existing,
      isEnabled: !existing.isEnabled,
    };

    await db.workoutSchedules.put(updated);

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleWorkoutSchedule(session.user.id, updated);
        }
      });
    }

    return updated;
  } catch (error) {
    console.error('Failed to toggle workout schedule:', error);
    return null;
  }
}
