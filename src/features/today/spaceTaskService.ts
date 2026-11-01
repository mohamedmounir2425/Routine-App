import { db } from '../../db/database';
import { saveTask } from '../../db/taskQueries';
import { LIFE_SPACES_CONFIG } from '../../config/spacesConfig';
import { LifeTask } from '../../types';
import { parseLocalDate } from '../../utils/dateUtils';

/** One calendar policy for manual tasks, regardless of which space created them. */
export function isSpaceTaskDue(task: LifeTask, date: string): boolean {
  if (task.dueDate && task.dueDate > date) return false;
  if (!task.isRecurring) return true;
  const day = parseLocalDate(date).getDay();
  if (task.recurrenceRule === 'weekdays') return day >= 1 && day <= 5;
  if (task.recurrenceRule === 'weekly') {
    const anchor = task.dueDate || task.createdAt?.split('T')[0];
    return !!anchor && parseLocalDate(anchor).getDay() === day;
  }
  return true;
}

export async function saveSpaceTask(task: LifeTask): Promise<LifeTask> {
  if (!LIFE_SPACES_CONFIG.some(space => space.id === task.spaceId)) throw new Error('اختر مساحة صحيحة للمهمة.');
  if (!task.title.trim()) throw new Error('اكتب عنوان المهمة.');
  if (task.estimatedMinutes !== undefined && (!Number.isFinite(task.estimatedMinutes) || task.estimatedMinutes < 1 || task.estimatedMinutes > 1440)) throw new Error('المدة لازم تكون بين دقيقة و١٤٤٠ دقيقة.');
  if (task.dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) || `${parseLocalDate(task.dueDate).getFullYear()}-${String(parseLocalDate(task.dueDate).getMonth() + 1).padStart(2, '0')}-${String(parseLocalDate(task.dueDate).getDate()).padStart(2, '0')}` !== task.dueDate)) throw new Error('اختار تاريخ صحيح.');
  if (task.scheduledTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.scheduledTime)) throw new Error('اختار وقت صحيح.');
  if (task.deadlineAt && !Number.isFinite(new Date(task.deadlineAt).getTime())) throw new Error('موعد التسليم غير صحيح.');
  if (task.planId && !await db.plans.get(task.planId)) throw new Error('الخطة المرتبطة لم تعد موجودة.');
  if (task.projectId) {
    const project = await db.projects.get(task.projectId);
    if (!project || (project.spaceId || 'home') !== task.spaceId) throw new Error('اختار مشروع تابع لنفس مساحة المهمة.');
  }
  const tasks = new Map((await db.tasks.toArray()).map(item => [item.id, item]));
  const visited = new Set<string>();
  const reachesSelf = (id: string): boolean => {
    if (id === task.id) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return (tasks.get(id)?.dependsOnTaskIds || []).some(reachesSelf);
  };
  if ((task.dependsOnTaskIds || []).some(reachesSelf)) throw new Error('المهام مرتبطة في دائرة؛ عدّل المهام السابقة أولاً.');
  const updated = { ...task, title: task.title.trim(), sourceType: task.sourceType || 'manual' as const };
  await saveTask(updated);
  return updated;
}
