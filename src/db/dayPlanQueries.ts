import { db } from './database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncSingleDayPlan } from './syncEngine';
import { DayPlan, DayPlanSelectedItem } from '../types';
import { getLocalDateString, parseLocalDate } from '../utils/dateUtils';

export type DayPlanSelectedItemInput =
  | {
      refKey: string;
      sourceType: 'task';
      taskId: string;
      isEssential?: boolean;
    }
  | {
      refKey: string;
      sourceType: 'project_step';
      projectId: string;
      stepId: string;
      isEssential?: boolean;
    }
  | {
      refKey: string;
      sourceType: 'routine_occurrence';
      taskId: string;
      occurrenceDate: string;
      isEssential?: boolean;
    };

export function buildTaskRefKey(taskId: string): string {
  return `task:${taskId}`;
}

export function buildProjectStepRefKey(projectId: string, stepId: string): string {
  return `project_step:${projectId}:${stepId}`;
}

export function buildRoutineOccurrenceRefKey(taskId: string, occurrenceDate: string): string {
  return `routine_occurrence:${taskId}:${occurrenceDate}`;
}

function validateDayPlanDate(date: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || getLocalDateString(parseLocalDate(date)) !== date) {
    throw new Error('Invalid day plan date');
  }
}

export function normalizeDayPlan(plan: DayPlan): DayPlan {
  const nowIso = plan.updatedAt || new Date().toISOString();
  const essentialSet = new Set(
    Array.isArray(plan.essentialTaskIds)
      ? plan.essentialTaskIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
      : []
  );

  const rawItems = Array.isArray(plan.selectedItems) ? [...plan.selectedItems] : [];
  rawItems.sort((a, b) => (Number.isFinite(a.position) ? a.position : 0) - (Number.isFinite(b.position) ? b.position : 0));

  const byRefKey = new Map<string, DayPlanSelectedItem>();
  for (const item of rawItems) {
    if (!item || typeof item.refKey !== 'string' || !item.refKey.trim()) continue;
    const isTaskEssential =
      (item.sourceType === 'task' || item.sourceType === 'routine_occurrence') &&
      (Boolean(item.isEssential) || essentialSet.has(item.taskId));
    if (isTaskEssential && (item.sourceType === 'task' || item.sourceType === 'routine_occurrence')) {
      essentialSet.add(item.taskId);
    }
    const existing = byRefKey.get(item.refKey);
    if (!existing) {
      byRefKey.set(item.refKey, {
        ...item,
        ...(isTaskEssential ? { isEssential: true } : item.isEssential !== undefined ? { isEssential: Boolean(item.isEssential) } : {}),
        addedAt: typeof item.addedAt === 'string' && item.addedAt ? item.addedAt : nowIso,
        position: byRefKey.size,
      });
    } else if (isTaskEssential || item.isEssential) {
      byRefKey.set(item.refKey, { ...existing, isEssential: true });
    }
  }

  for (const taskId of essentialSet) {
    const taskRef = buildTaskRefKey(taskId);
    const routineRef = buildRoutineOccurrenceRefKey(taskId, plan.date);
    if (!byRefKey.has(taskRef) && !byRefKey.has(routineRef)) {
      byRefKey.set(taskRef, {
        refKey: taskRef,
        sourceType: 'task',
        taskId,
        position: byRefKey.size,
        isEssential: true,
        addedAt: nowIso,
      });
    }
  }

  const selectedItems = Array.from(byRefKey.values()).map((item, idx) => ({
    ...item,
    position: idx,
  }));

  return {
    ...plan,
    essentialTaskIds: Array.from(essentialSet),
    selectedItems,
    updatedAt: nowIso,
  };
}

export function isItemSelectedForDay(plan: DayPlan | undefined, refKey: string): boolean {
  if (!plan || !refKey) return false;
  const normalized = normalizeDayPlan(plan);
  return (normalized.selectedItems || []).some((item) => item.refKey === refKey);
}

export async function getDayPlan(date = getLocalDateString()): Promise<DayPlan | undefined> {
  const existing = await db.dayPlans.get(date);
  return existing ? normalizeDayPlan(existing) : undefined;
}

function syncDayPlanInBackground(plan: DayPlan): void {
  if (!isSupabaseConfigured()) return;
  void supabase.auth
    .getSession()
    .then(async ({ data: { session } }) => {
      if (session?.user) await syncSingleDayPlan(session.user.id, plan);
    })
    .catch((error) => console.warn('Day plan sync could not start:', error));
}

export async function saveDayPlan(plan: DayPlan): Promise<DayPlan> {
  validateDayPlanDate(plan.date);
  if (
    !Number.isInteger(plan.availableMinutes) ||
    plan.availableMinutes < 0 ||
    plan.availableMinutes > 1440 ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.endTime)
  ) {
    throw new Error('Invalid day plan');
  }

  const existing = plan.selectedItems === undefined ? await db.dayPlans.get(plan.date) : undefined;
  const newEssentials = new Set(plan.essentialTaskIds || []);
  let mergedSelectedItems = plan.selectedItems;

  if (mergedSelectedItems === undefined && existing?.selectedItems) {
    mergedSelectedItems = existing.selectedItems
      .filter((item) => {
        if ((item.sourceType === 'task' || item.sourceType === 'routine_occurrence') && item.isEssential && !newEssentials.has(item.taskId)) {
          return false;
        }
        return true;
      })
      .map((item) => {
        if (item.sourceType === 'task' || item.sourceType === 'routine_occurrence') {
          return { ...item, isEssential: newEssentials.has(item.taskId) };
        }
        return item;
      });
  }

  const normalized = normalizeDayPlan({
    ...plan,
    selectedItems: mergedSelectedItems,
    updatedAt: new Date().toISOString(),
  });

  await db.dayPlans.put(normalized);
  syncDayPlanInBackground(normalized);
  return normalized;
}

export async function addItemToDayPlan(
  date: string,
  item: DayPlanSelectedItemInput
): Promise<DayPlan> {
  validateDayPlanDate(date);
  if (item.sourceType === 'task' && item.refKey !== buildTaskRefKey(item.taskId)) {
    throw new Error('Invalid task refKey');
  }
  if (item.sourceType === 'project_step' && item.refKey !== buildProjectStepRefKey(item.projectId, item.stepId)) {
    throw new Error('Invalid project_step refKey');
  }
  if (
    item.sourceType === 'routine_occurrence' &&
    (item.occurrenceDate !== date || item.refKey !== buildRoutineOccurrenceRefKey(item.taskId, item.occurrenceDate))
  ) {
    throw new Error('Invalid routine_occurrence refKey');
  }

  const existingRaw = await db.dayPlans.get(date);
  const basePlan: DayPlan = existingRaw
    ? normalizeDayPlan(existingRaw)
    : {
        date,
        availableMinutes: 120,
        endTime: '22:00',
        essentialTaskIds: [],
        selectedItems: [],
        updatedAt: new Date().toISOString(),
      };

  const nowIso = new Date().toISOString();
  const currentItems = [...(basePlan.selectedItems || [])];
  const existingIdx = currentItems.findIndex((entry) => entry.refKey === item.refKey);

  if (existingIdx >= 0) {
    if (item.isEssential !== undefined) {
      currentItems[existingIdx] = { ...currentItems[existingIdx], isEssential: item.isEssential };
    }
  } else {
    currentItems.push({
      ...item,
      position: currentItems.length,
      addedAt: nowIso,
    } as DayPlanSelectedItem);
  }

  const essentialTaskIds = new Set(basePlan.essentialTaskIds);
  if (item.isEssential && (item.sourceType === 'task' || item.sourceType === 'routine_occurrence')) {
    essentialTaskIds.add(item.taskId);
  }

  return saveDayPlan({
    ...basePlan,
    essentialTaskIds: Array.from(essentialTaskIds),
    selectedItems: currentItems,
    updatedAt: nowIso,
  });
}

export async function removeItemFromDayPlan(date: string, refKey: string): Promise<DayPlan> {
  validateDayPlanDate(date);
  const existingRaw = await db.dayPlans.get(date);
  const basePlan: DayPlan = existingRaw
    ? normalizeDayPlan(existingRaw)
    : {
        date,
        availableMinutes: 120,
        endTime: '22:00',
        essentialTaskIds: [],
        selectedItems: [],
        updatedAt: new Date().toISOString(),
      };

  const target = (basePlan.selectedItems || []).find((entry) => entry.refKey === refKey);
  const removedTaskId =
    target && (target.sourceType === 'task' || target.sourceType === 'routine_occurrence')
      ? target.taskId
      : refKey.startsWith('task:')
        ? refKey.slice('task:'.length)
        : undefined;

  const remainingItems = (basePlan.selectedItems || [])
    .filter((entry) => entry.refKey !== refKey)
    .map((entry, idx) => ({ ...entry, position: idx }));

  const remainingEssentials = (basePlan.essentialTaskIds || []).filter((id) => id !== removedTaskId);

  return saveDayPlan({
    ...basePlan,
    essentialTaskIds: remainingEssentials,
    selectedItems: remainingItems,
    updatedAt: new Date().toISOString(),
  });
}

export async function reorderDayPlanItems(date: string, orderedRefKeys: string[]): Promise<DayPlan> {
  validateDayPlanDate(date);
  const existingRaw = await db.dayPlans.get(date);
  const basePlan: DayPlan = existingRaw
    ? normalizeDayPlan(existingRaw)
    : {
        date,
        availableMinutes: 120,
        endTime: '22:00',
        essentialTaskIds: [],
        selectedItems: [],
        updatedAt: new Date().toISOString(),
      };

  const currentItems = [...(basePlan.selectedItems || [])];
  const byKey = new Map(currentItems.map((item) => [item.refKey, item]));
  const reordered: DayPlanSelectedItem[] = [];
  const seen = new Set<string>();

  for (const key of orderedRefKeys) {
    const found = byKey.get(key);
    if (found && !seen.has(key)) {
      reordered.push(found);
      seen.add(key);
    }
  }

  for (const item of currentItems) {
    if (!seen.has(item.refKey)) {
      reordered.push(item);
      seen.add(item.refKey);
    }
  }

  return saveDayPlan({
    ...basePlan,
    selectedItems: reordered.map((item, idx) => ({ ...item, position: idx })),
    updatedAt: new Date().toISOString(),
  });
}
