import { db } from './database';
import { LifeTask, LifeSpaceId } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncSingleTask, syncSingleTaskDelete } from './syncEngine';
import { getLocalDateString } from '../utils/dateUtils';

export async function saveTask(task: LifeTask): Promise<void> {
  try {
    const updated: LifeTask = { ...task };
    if (!updated.status) {
      updated.status = updated.isCompleted ? 'DONE' : 'TODO';
    } else {
      updated.isCompleted = updated.status === 'DONE';
    }
    if (Array.isArray(updated.focusSessions)) {
      updated.actualMinutes = updated.focusSessions.reduce(
        (sum, s) => sum + (typeof s.durationMinutes === 'number' ? s.durationMinutes : 0),
        0
      );
    }
    await db.tasks.put(updated);
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleTask(session.user.id, updated);
        }
      });
    }
  } catch (error) {
    console.error('Failed to save task:', error);
  }
}

export async function getTasksBySpace(spaceId: LifeSpaceId): Promise<LifeTask[]> {
  try {
    return await db.tasks.where('spaceId').equals(spaceId).toArray();
  } catch (error) {
    console.error(`Failed to get tasks for space ${spaceId}:`, error);
    return [];
  }
}

export async function getTasksByProject(projectId: string): Promise<LifeTask[]> {
  try {
    return await db.tasks.where('projectId').equals(projectId).toArray();
  } catch (error) {
    console.error(`Failed to get tasks for project ${projectId}:`, error);
    return [];
  }
}

export async function getAllTasks(): Promise<LifeTask[]> {
  try {
    return await db.tasks.toArray();
  } catch (error) {
    console.error('Failed to get all tasks:', error);
    return [];
  }
}

export async function toggleTaskCompletion(id: string, targetDateStr?: string): Promise<LifeTask | null> {
  try {
    const task = await db.tasks.get(id);
    if (!task) return null;

    let updated: LifeTask;

    if (task.isRecurring) {
      const today = targetDateStr || getLocalDateString();
      const dates = Array.isArray(task.recurringCompletionDates) ? task.recurringCompletionDates : [];
      const isAlreadyCompletedToday = dates.includes(today);

      let updatedDates: string[];
      if (isAlreadyCompletedToday) {
        updatedDates = dates.filter((d) => d !== today);
      } else {
        updatedDates = [...dates, today];
      }

      updated = {
        ...task,
        recurringCompletionDates: updatedDates,
        isCompleted: false, // keep false so it remains active for recurring schedule
      };
    } else {
      const isCompleted = !task.isCompleted;
      updated = {
        ...task,
        isCompleted,
        status: isCompleted ? 'DONE' : 'TODO',
        completedAt: isCompleted ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };
    }

    if (Array.isArray(updated.focusSessions)) {
      updated.actualMinutes = updated.focusSessions.reduce(
        (sum, s) => sum + (typeof s.durationMinutes === 'number' ? s.durationMinutes : 0),
        0
      );
    }

    await db.tasks.put(updated);
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleTask(session.user.id, updated);
        }
      });
    }
    return updated;
  } catch (error) {
    console.error('Failed to toggle task:', error);
    return null;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await db.tasks.delete(id);
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleTaskDelete(session.user.id, id);
        }
      });
    }
  } catch (error) {
    console.error('Failed to delete task:', error);
  }
}
