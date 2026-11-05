import { db, type RoutineDatabase } from './database';
import { CURRENT_WORKSPACE, workspaceStorage } from './workspaceScope';
import { transitionPauseFocus, type ActiveFocusState } from '../features/work/focus/focusEngine';
import { taskToCloud } from './cloudMappers';
import { queueMutation } from './syncQueue';
import type { FocusSessionRecord } from '../features/work/focus/focusService';

const ACTIVE_KEY = 'routine_active_focus_state';

function readFocus(storage: Storage): ActiveFocusState | null {
  const raw = storage.getItem(ACTIVE_KEY);
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as ActiveFocusState;
    if (state.focusedTaskId && state.activeSession?.id && state.activeSession.taskId === state.focusedTaskId) return state;
  } catch { /* A damaged runtime cache does not change task history. */ }
  storage.removeItem(ACTIVE_KEY);
  return null;
}

/** Close work in its original database, even after the SDK has changed accounts. */
export async function suspendFocusForWorkspace(database: RoutineDatabase, storage: Storage, ownerId: string | null, at: Date) {
  const state = readFocus(storage);
  if (!state?.activeSession || !state.focusedTaskId) return;
  const session = state.activeSession;
  const updated = await database.transaction('rw', [database.tasks, database.pendingSync], async () => {
    const task = await database.tasks.get(state.focusedTaskId!);
    if (!task) return null;
    const closed = task.focusSessions?.some(item => item.id === session.id && !!item.endedAt);
    const next = closed ? task : transitionPauseFocus(task, session, at).updatedTask;
    await database.tasks.put(next);
    if (ownerId) await queueMutation({ userId: ownerId, table: 'life_tasks', entityId: next.id,
      action: 'upsert', data: taskToCloud(ownerId, next), timestamp: next.updatedAt ?? at.toISOString() }, false, database);
    return next;
  });
  const closedSession = updated?.focusSessions?.find(item => item.id === session.id);
  if (updated && closedSession && closedSession.durationMinutes > 0) {
    const rawHistory = storage.getItem('life_focus_sessions');
    const history: FocusSessionRecord[] = rawHistory ? JSON.parse(rawHistory) : [];
    if (!Array.isArray(history)) throw new Error('تعذر قراءة سجل التركيز؛ بيانات المهمة محفوظة.');
    if (!history.some(item => item?.id === session.id)) {
      history.push({ id: session.id, date: closedSession.endedAt ?? at.toISOString(), minutes: closedSession.durationMinutes,
        taskId: updated.id, taskTitle: updated.title });
      storage.setItem('life_focus_sessions', JSON.stringify(history));
    }
  }
  // Failure is surfaced to the account gate. A retry deduplicates the session by ID.
  storage.removeItem(ACTIVE_KEY);
}

export async function reconcileWorkspaceFocus() {
  const state = readFocus(workspaceStorage);
  if (!state?.activeSession || !state.focusedTaskId) return;
  const task = await db.tasks.get(state.focusedTaskId);
  if (!task || task.focusSessions?.some(session => session.id === state.activeSession?.id && !!session.endedAt)) {
    await suspendCurrentWorkspaceFocus(new Date());
  }
}

export function suspendCurrentWorkspaceFocus(at: Date) {
  return suspendFocusForWorkspace(db, workspaceStorage, CURRENT_WORKSPACE === 'guest' ? null : CURRENT_WORKSPACE.slice(5), at);
}
