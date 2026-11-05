import { workspaceStorage } from '../../../db/workspaceScope';
/**
 * Focus Engine for Developer Work OS.
 * 
 * Rules:
 * 1. Multiple tasks can have status 'IN_PROGRESS' (on the radar).
 * 2. Exactly ONE task can be actively 'FOCUSED' (with a running session timer) at any time.
 * 3. Actual task duration is derived strictly from completed focus sessions.
 * 4. Switching focus from Task A to Task B is atomic:
 *    - Ends Task A's session and logs its duration.
 *    - Starts Task B's session and marks Task B as the focused task.
 */

import { LifeTask, TaskFocusSession, TaskStatus, TaskWaitingContext, TaskInterruptionContext } from '../../../types';
import { db } from '../../../db/database';
import { saveTask } from '../../../db/taskQueries';
import { recordCompletedFocusSession } from './focusService';

export interface ActiveFocusState {
  focusedTaskId: string | null;
  activeSession: TaskFocusSession | null;
}

const ACTIVE_FOCUS_STORAGE_KEY = 'routine_active_focus_state';

// ============================================================================
// PURE SESSION CALCULATIONS (Source of Truth)
// ============================================================================

/**
 * Calculates elapsed duration in minutes between two ISO timestamps.
 * Minimum 1 minute if elapsed >= 30 seconds, otherwise 0 minutes.
 */
export function calculateSessionDurationMinutes(startedAt: string, endedAt: string): number {
  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(endedAt).getTime();
  if (isNaN(startMs) || isNaN(endMs) || endMs <= startMs) {
    return 0;
  }
  const diffSeconds = Math.round((endMs - startMs) / 1000);
  if (diffSeconds < 30) return 0;
  return Math.max(1, Math.round(diffSeconds / 60));
}

/**
 * Derives total actual minutes by strictly summing all completed sessions.
 */
export function deriveActualMinutesFromSessions(sessions?: TaskFocusSession[]): number {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return 0;
  }
  return sessions.reduce((acc, s) => acc + (typeof s.durationMinutes === 'number' ? s.durationMinutes : 0), 0);
}

/**
 * Creates a new open focus session for a task.
 */
export function createOpenFocusSession(taskId: string, now: Date = new Date()): TaskFocusSession {
  const isoNow = now.toISOString();
  return {
    id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    taskId,
    startedAt: isoNow,
    durationMinutes: 0,
    createdAt: isoNow,
  };
}

/**
 * Closes an active focus session and computes its duration.
 */
export function closeFocusSession(session: TaskFocusSession, now: Date = new Date()): TaskFocusSession {
  const isoNow = now.toISOString();
  const duration = calculateSessionDurationMinutes(session.startedAt, isoNow);
  return {
    ...session,
    endedAt: isoNow,
    durationMinutes: duration,
  };
}

/**
 * Normalizes a task's status while preserving backward compatibility with isCompleted.
 */
export function normalizeTaskStatus(task: LifeTask): TaskStatus {
  if (task.isCompleted) return 'DONE';
  if (task.status) return task.status;
  return 'TODO';
}

// ============================================================================
// ACTIVE FOCUS STATE PERSISTENCE (Survives Browser Reloads)
// ============================================================================

export function getPersistedActiveFocusState(): ActiveFocusState {
  if (typeof window === 'undefined') {
    return { focusedTaskId: null, activeSession: null };
  }
  try {
    const raw = workspaceStorage.getItem(ACTIVE_FOCUS_STORAGE_KEY);
    if (!raw) return { focusedTaskId: null, activeSession: null };
    return JSON.parse(raw);
  } catch {
    return { focusedTaskId: null, activeSession: null };
  }
}

export function persistActiveFocusState(state: ActiveFocusState): void {
  if (typeof window === 'undefined') return;
  try {
    if (state.focusedTaskId && state.activeSession) {
      workspaceStorage.setItem(ACTIVE_FOCUS_STORAGE_KEY, JSON.stringify(state));
    } else {
      workspaceStorage.removeItem(ACTIVE_FOCUS_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('work_focus_state_changed', { detail: state }));
  } catch (err) {
    console.error('Failed to persist active focus state:', err);
  }
}

// ============================================================================
// PURE ATOMIC TRANSITIONS
// ============================================================================

/**
 * Pure transition: Pauses current active focus on a task.
 */
export function transitionPauseFocus(
  task: LifeTask,
  activeSession: TaskFocusSession,
  now: Date = new Date()
): { updatedTask: LifeTask } {
  const closedSession = closeFocusSession(activeSession, now);
  const existingSessions = Array.isArray(task.focusSessions) ? [...task.focusSessions] : [];
  
  // Only append session if it has positive duration (or is a valid record)
  const updatedSessions = [...existingSessions, closedSession];
  const actualMinutes = deriveActualMinutesFromSessions(updatedSessions);

  const updatedTask: LifeTask = {
    ...task,
    status: task.status === 'DONE' ? 'DONE' : 'IN_PROGRESS',
    focusSessions: updatedSessions,
    actualMinutes,
    updatedAt: now.toISOString(),
  };

  return { updatedTask };
}

/**
 * Pure transition: Starts or switches focus from previousTask to nextTask.
 */
export function transitionStartFocus(
  nextTask: LifeTask,
  previousTask: LifeTask | null,
  activeSession: TaskFocusSession | null,
  now: Date = new Date()
): {
  updatedPreviousTask: LifeTask | null;
  updatedNextTask: LifeTask;
  newActiveSession: TaskFocusSession;
} {
  let updatedPreviousTask: LifeTask | null = null;

  // 1. If a previous task had an active session, close it atomically
  if (previousTask && activeSession && previousTask.id === activeSession.taskId) {
    const pauseResult = transitionPauseFocus(previousTask, activeSession, now);
    updatedPreviousTask = pauseResult.updatedTask;
  }

  // 2. Open new session for next task
  const newActiveSession = createOpenFocusSession(nextTask.id, now);
  const nextStatus: TaskStatus = nextTask.status === 'DONE' ? 'DONE' : 'IN_PROGRESS';

  const updatedNextTask: LifeTask = {
    ...nextTask,
    status: nextStatus,
    isCompleted: false,
    updatedAt: now.toISOString(),
  };

  return {
    updatedPreviousTask,
    updatedNextTask,
    newActiveSession,
  };
}

/**
 * Pure transition: Completes a task, cleanly closing any running session.
 */
export function transitionCompleteTask(
  task: LifeTask,
  activeSession: TaskFocusSession | null,
  now: Date = new Date()
): { updatedTask: LifeTask; wasActiveFocus: boolean } {
  const isoNow = now.toISOString();
  const wasActiveFocus = !!(activeSession && activeSession.taskId === task.id);

  let updatedSessions = Array.isArray(task.focusSessions) ? [...task.focusSessions] : [];

  if (wasActiveFocus && activeSession) {
    const closed = closeFocusSession(activeSession, now);
    updatedSessions.push(closed);
  }

  const actualMinutes = deriveActualMinutesFromSessions(updatedSessions);

  const updatedTask: LifeTask = {
    ...task,
    status: 'DONE',
    isCompleted: true,
    completedAt: isoNow,
    focusSessions: updatedSessions,
    actualMinutes,
    updatedAt: isoNow,
  };

  return { updatedTask, wasActiveFocus };
}

/**
 * Pure transition: Places a task in WAITING state.
 */
export function transitionSetWaiting(
  task: LifeTask,
  waiting: TaskWaitingContext,
  activeSession: TaskFocusSession | null,
  now: Date = new Date()
): { updatedTask: LifeTask; wasActiveFocus: boolean } {
  const isoNow = now.toISOString();
  const wasActiveFocus = !!(activeSession && activeSession.taskId === task.id);

  let updatedSessions = Array.isArray(task.focusSessions) ? [...task.focusSessions] : [];
  if (wasActiveFocus && activeSession) {
    const closed = closeFocusSession(activeSession, now);
    updatedSessions.push(closed);
  }

  const actualMinutes = deriveActualMinutesFromSessions(updatedSessions);

  const updatedTask: LifeTask = {
    ...task,
    status: 'WAITING',
    isCompleted: false,
    waitingContext: {
      ...waiting,
      blockedSince: waiting.blockedSince || isoNow,
    },
    focusSessions: updatedSessions,
    actualMinutes,
    updatedAt: isoNow,
  };

  return { updatedTask, wasActiveFocus };
}

/**
 * Pure transition: Captures an ad-hoc interruption and links it to the previously focused task.
 */
export function transitionCaptureInterruption(
  interruptionTaskData: Omit<LifeTask, 'id' | 'createdAt'> & { id?: string },
  currentFocusedTask: LifeTask | null,
  activeSession: TaskFocusSession | null,
  reason?: string,
  source?: string,
  now: Date = new Date()
): {
  parkedTask: LifeTask | null;
  interruptionTask: LifeTask;
  newActiveSession: TaskFocusSession;
} {
  const isoNow = now.toISOString();
  let parkedTask: LifeTask | null = null;

  if (currentFocusedTask && activeSession && currentFocusedTask.id === activeSession.taskId) {
    const pauseRes = transitionPauseFocus(currentFocusedTask, activeSession, now);
    parkedTask = pauseRes.updatedTask;
  }

  const interruptionId = interruptionTaskData.id || `task_interruption_${Date.now()}`;
  const interruptionContext: TaskInterruptionContext = {
    interruptedAt: isoNow,
    interruptionReason: reason,
    interruptedBy: source,
    previousFocusedTaskId: currentFocusedTask?.id,
  };

  const interruptionTask: LifeTask = {
    ...interruptionTaskData,
    id: interruptionId,
    spaceId: 'work',
    status: 'IN_PROGRESS',
    isCompleted: false,
    interruptionContext,
    focusSessions: [],
    actualMinutes: 0,
    createdAt: isoNow,
    updatedAt: isoNow,
  };

  const newActiveSession = createOpenFocusSession(interruptionId, now);

  return {
    parkedTask,
    interruptionTask,
    newActiveSession,
  };
}

// ============================================================================
// ASYNC ORCHESTRATION LAYER (Dexie + Backward Compatibility)
// ============================================================================

/**
 * Starts focus on a target task. Atomically ends any currently active focus session.
 */
export async function startTaskFocus(taskId: string): Promise<LifeTask | null> {
  const targetTask = await db.tasks.get(taskId);
  if (!targetTask) return null;

  const state = getPersistedActiveFocusState();
  const now = new Date();

  let previousTask: LifeTask | null = null;
  if (state.focusedTaskId && state.activeSession && state.focusedTaskId !== taskId) {
    previousTask = (await db.tasks.get(state.focusedTaskId)) || null;
  }

  const transition = transitionStartFocus(targetTask, previousTask, state.activeSession, now);

  // Save previous task if it was closed
  if (transition.updatedPreviousTask) {
    await saveTask(transition.updatedPreviousTask);
    // Backward compatibility: log to legacy focus history if session completed
    const lastSession = transition.updatedPreviousTask.focusSessions?.slice(-1)[0];
    if (lastSession && lastSession.durationMinutes > 0) {
      recordCompletedFocusSession(
        lastSession.durationMinutes,
        transition.updatedPreviousTask.id,
        transition.updatedPreviousTask.title
      );
    }
  }

  // Save next task
  await saveTask(transition.updatedNextTask);

  // Update persisted state
  persistActiveFocusState({
    focusedTaskId: targetTask.id,
    activeSession: transition.newActiveSession,
  });

  return transition.updatedNextTask;
}

/**
 * Pauses active focus if any task is currently running.
 */
export async function pauseActiveFocus(): Promise<LifeTask | null> {
  const state = getPersistedActiveFocusState();
  if (!state.focusedTaskId || !state.activeSession) {
    return null;
  }

  const task = await db.tasks.get(state.focusedTaskId);
  if (!task) {
    persistActiveFocusState({ focusedTaskId: null, activeSession: null });
    return null;
  }

  const { updatedTask } = transitionPauseFocus(task, state.activeSession, new Date());
  await saveTask(updatedTask);

  // Backward compatibility: log session to legacy storage
  const lastSession = updatedTask.focusSessions?.slice(-1)[0];
  if (lastSession && lastSession.durationMinutes > 0) {
    recordCompletedFocusSession(lastSession.durationMinutes, updatedTask.id, updatedTask.title);
  }

  persistActiveFocusState({ focusedTaskId: null, activeSession: null });
  return updatedTask;
}

/**
 * Completes a task. Closes its focus session if it was active.
 */
export async function completeTaskWithFocus(taskId: string): Promise<LifeTask | null> {
  const task = await db.tasks.get(taskId);
  if (!task) return null;

  const state = getPersistedActiveFocusState();
  const activeSessionForTask = state.focusedTaskId === taskId ? state.activeSession : null;

  const { updatedTask, wasActiveFocus } = transitionCompleteTask(task, activeSessionForTask, new Date());
  await saveTask(updatedTask);

  if (wasActiveFocus) {
    const lastSession = updatedTask.focusSessions?.slice(-1)[0];
    if (lastSession && lastSession.durationMinutes > 0) {
      recordCompletedFocusSession(lastSession.durationMinutes, updatedTask.id, updatedTask.title);
    }
    persistActiveFocusState({ focusedTaskId: null, activeSession: null });
  }

  return updatedTask;
}

/**
 * Marks a task as WAITING and pauses focus if it was active.
 */
export async function setTaskWaitingState(
  taskId: string,
  waiting: TaskWaitingContext
): Promise<LifeTask | null> {
  const task = await db.tasks.get(taskId);
  if (!task) return null;

  const state = getPersistedActiveFocusState();
  const activeSessionForTask = state.focusedTaskId === taskId ? state.activeSession : null;

  const { updatedTask, wasActiveFocus } = transitionSetWaiting(task, waiting, activeSessionForTask, new Date());
  await saveTask(updatedTask);

  if (wasActiveFocus) {
    persistActiveFocusState({ focusedTaskId: null, activeSession: null });
  }

  return updatedTask;
}

/**
 * Records an interruption and starts focus on it immediately.
 */
export async function captureAndStartInterruption(
  interruptionData: Omit<LifeTask, 'id' | 'createdAt'> & { id?: string },
  reason?: string,
  source?: string
): Promise<{ parkedTask: LifeTask | null; interruptionTask: LifeTask }> {
  const state = getPersistedActiveFocusState();
  let currentTask: LifeTask | null = null;
  if (state.focusedTaskId && state.activeSession) {
    currentTask = (await db.tasks.get(state.focusedTaskId)) || null;
  }

  const result = transitionCaptureInterruption(
    interruptionData,
    currentTask,
    state.activeSession,
    reason,
    source,
    new Date()
  );

  if (result.parkedTask) {
    await saveTask(result.parkedTask);
  }
  await saveTask(result.interruptionTask);

  persistActiveFocusState({
    focusedTaskId: result.interruptionTask.id,
    activeSession: result.newActiveSession,
  });

  return {
    parkedTask: result.parkedTask,
    interruptionTask: result.interruptionTask,
  };
}
