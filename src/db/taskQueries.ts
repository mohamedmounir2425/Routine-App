import { db } from './database';
import { LifeTask, LifeSpaceId } from '../types';

export async function saveTask(task: LifeTask): Promise<void> {
  try {
    await db.tasks.put(task);
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

export async function getAllTasks(): Promise<LifeTask[]> {
  try {
    return await db.tasks.toArray();
  } catch (error) {
    console.error('Failed to get all tasks:', error);
    return [];
  }
}

export async function toggleTaskCompletion(id: string): Promise<LifeTask | null> {
  try {
    const task = await db.tasks.get(id);
    if (!task) return null;
    const isCompleted = !task.isCompleted;
    const updated: LifeTask = {
      ...task,
      isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
    };
    await db.tasks.put(updated);
    return updated;
  } catch (error) {
    console.error('Failed to toggle task:', error);
    return null;
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await db.tasks.delete(id);
  } catch (error) {
    console.error('Failed to delete task:', error);
  }
}
