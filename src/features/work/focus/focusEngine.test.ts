/**
 * Deterministic Test Suite for Focus Engine
 * 
 * Verifies:
 * 1. Session duration timestamp calculation
 * 2. Actual task time derived strictly from sum of focus sessions
 * 3. Atomic focus switching: Task A focused -> Task B focused ends A, starts B, only B is focused
 * 4. Focus -> Pause: closes active session, logs duration, leaves no focused task
 * 5. Complete focused task: ends session, sets actualMinutes, marks task DONE, clears focus
 * 6. Task in WAITING: pauses focus, sets waitingContext, removes from active focus
 * 7. Interruption capture: parks current focused task, starts focus on interruption, links previousFocusedTaskId
 */

import {
  calculateSessionDurationMinutes,
  deriveActualMinutesFromSessions,
  transitionPauseFocus,
  transitionStartFocus,
  transitionCompleteTask,
  transitionSetWaiting,
  transitionCaptureInterruption,
} from './focusEngine';
import { LifeTask, TaskFocusSession } from '../../../types';

interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
}

export function runFocusEngineTests(): TestResult[] {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, expected: any, actual: any) {
    results.push({ name, passed: condition, expected, actual });
  }

  // 1. Session duration calculation
  {
    const start = '2026-09-14T09:00:00.000Z';
    const end25m = '2026-09-14T09:25:00.000Z';
    const end10s = '2026-09-14T09:00:10.000Z'; // <30s should be 0m

    const dur25 = calculateSessionDurationMinutes(start, end25m);
    const dur0 = calculateSessionDurationMinutes(start, end10s);

    assert(
      '1. Session duration calculates accurate minutes and ignores <30s blips',
      dur25 === 25 && dur0 === 0,
      { dur25: 25, dur0: 0 },
      { dur25, dur0 }
    );
  }

  // 2. Actual task duration derived strictly from sessions
  {
    const sessions: TaskFocusSession[] = [
      { id: 's1', taskId: 't1', startedAt: '2026-09-14T09:00:00Z', endedAt: '2026-09-14T09:18:00Z', durationMinutes: 18, createdAt: '2026-09-14T09:00:00Z' },
      { id: 's2', taskId: 't1', startedAt: '2026-09-14T09:42:00Z', endedAt: '2026-09-14T10:05:00Z', durationMinutes: 23, createdAt: '2026-09-14T09:42:00Z' },
    ];
    // 18 + 23 = 41
    const total = deriveActualMinutesFromSessions(sessions);
    assert(
      '2. Actual task duration is derived strictly from sum of sessions (18m + 23m = 41m)',
      total === 41,
      41,
      total
    );
  }

  // 3. Atomic focus switching: Task A focused -> Task B focused
  {
    const taskA: LifeTask = {
      id: 'task-A',
      spaceId: 'work',
      title: 'Task A (Fix Pagination)',
      priority: 'high',
      isCompleted: false,
      status: 'IN_PROGRESS',
      focusSessions: [],
      actualMinutes: 0,
      createdAt: '2026-09-14T09:00:00Z',
    };

    const taskB: LifeTask = {
      id: 'task-B',
      spaceId: 'work',
      title: 'Task B (Test Permissions)',
      priority: 'medium',
      isCompleted: false,
      status: 'TODO',
      focusSessions: [],
      actualMinutes: 0,
      createdAt: '2026-09-14T09:00:00Z',
    };

    // Task A started at 09:10
    const activeSessionA: TaskFocusSession = {
      id: 'sess-A',
      taskId: 'task-A',
      startedAt: '2026-09-14T09:10:00.000Z',
      durationMinutes: 0,
      createdAt: '2026-09-14T09:10:00.000Z',
    };

    // User switches to Task B at 09:35 (25m later)
    const switchTime = new Date('2026-09-14T09:35:00.000Z');
    const res = transitionStartFocus(taskB, taskA, activeSessionA, switchTime);

    const taskAPaused = res.updatedPreviousTask;
    const taskBFocused = res.updatedNextTask;
    const newSessionB = res.newActiveSession;

    const aSessionLogged = taskAPaused?.focusSessions?.length === 1 && taskAPaused.focusSessions[0].durationMinutes === 25;
    const bSessionStarted = newSessionB.taskId === 'task-B' && newSessionB.startedAt === switchTime.toISOString();
    const bStatusUpdated = taskBFocused.status === 'IN_PROGRESS';

    assert(
      '3. Focus switch atomically closes Task A (25m logged) and starts Task B',
      aSessionLogged && bSessionStarted && bStatusUpdated,
      { aMinutes: 25, bStatus: 'IN_PROGRESS', newSessTaskId: 'task-B' },
      { aMinutes: taskAPaused?.actualMinutes, bStatus: taskBFocused.status, newSessTaskId: newSessionB.taskId }
    );
  }

  // 4. Focus -> Pause
  {
    const task: LifeTask = {
      id: 'task-1',
      spaceId: 'work',
      title: 'Task 1',
      priority: 'high',
      isCompleted: false,
      status: 'IN_PROGRESS',
      focusSessions: [],
      actualMinutes: 0,
      createdAt: '2026-09-14T09:00:00Z',
    };

    const session: TaskFocusSession = {
      id: 'sess-1',
      taskId: 'task-1',
      startedAt: '2026-09-14T10:00:00.000Z',
      durationMinutes: 0,
      createdAt: '2026-09-14T10:00:00.000Z',
    };

    // Pauses at 10:30 (30m later)
    const pauseTime = new Date('2026-09-14T10:30:00.000Z');
    const { updatedTask } = transitionPauseFocus(task, session, pauseTime);

    assert(
      '4. Focus -> Pause closes active session, stores 30m, leaves task IN_PROGRESS',
      updatedTask.actualMinutes === 30 && updatedTask.focusSessions?.length === 1 && updatedTask.status === 'IN_PROGRESS',
      { actualMinutes: 30, count: 1, status: 'IN_PROGRESS' },
      { actualMinutes: updatedTask.actualMinutes, count: updatedTask.focusSessions?.length, status: updatedTask.status }
    );
  }

  // 5. Complete focused task
  {
    const task: LifeTask = {
      id: 'task-1',
      spaceId: 'work',
      title: 'Task 1',
      priority: 'high',
      isCompleted: false,
      status: 'IN_PROGRESS',
      focusSessions: [],
      actualMinutes: 0,
      createdAt: '2026-09-14T09:00:00Z',
    };

    const session: TaskFocusSession = {
      id: 'sess-1',
      taskId: 'task-1',
      startedAt: '2026-09-14T10:00:00.000Z',
      durationMinutes: 0,
      createdAt: '2026-09-14T10:00:00.000Z',
    };

    const doneTime = new Date('2026-09-14T10:45:00.000Z');
    const { updatedTask, wasActiveFocus } = transitionCompleteTask(task, session, doneTime);

    assert(
      '5. Complete focused task marks DONE, isCompleted=true, and locks in session duration',
      wasActiveFocus && updatedTask.status === 'DONE' && updatedTask.isCompleted === true && updatedTask.actualMinutes === 45,
      { status: 'DONE', isCompleted: true, actualMinutes: 45 },
      { status: updatedTask.status, isCompleted: updatedTask.isCompleted, actualMinutes: updatedTask.actualMinutes }
    );
  }

  // 6. Set task WAITING
  {
    const task: LifeTask = {
      id: 'task-api',
      spaceId: 'work',
      title: 'Fix API integration',
      priority: 'high',
      isCompleted: false,
      status: 'IN_PROGRESS',
      focusSessions: [],
      actualMinutes: 0,
      createdAt: '2026-09-14T09:00:00Z',
    };

    const session: TaskFocusSession = {
      id: 'sess-api',
      taskId: 'task-api',
      startedAt: '2026-09-14T11:00:00.000Z',
      durationMinutes: 0,
      createdAt: '2026-09-14T11:00:00.000Z',
    };

    const waitTime = new Date('2026-09-14T11:20:00.000Z'); // 20m later
    const { updatedTask, wasActiveFocus } = transitionSetWaiting(
      task,
      {
        waitingOn: 'Backend Team',
        waitingReason: 'Endpoint 500 error',
        followUpDate: '2026-09-15',
        alternativeTaskId: 'task-test',
      },
      session,
      waitTime
    );

    assert(
      '6. Set task WAITING pauses running session and captures waiting context',
      wasActiveFocus &&
        updatedTask.status === 'WAITING' &&
        updatedTask.actualMinutes === 20 &&
        updatedTask.waitingContext?.waitingOn === 'Backend Team',
      { status: 'WAITING', actualMinutes: 20, waitingOn: 'Backend Team' },
      { status: updatedTask.status, actualMinutes: updatedTask.actualMinutes, waitingOn: updatedTask.waitingContext?.waitingOn }
    );
  }

  // 7. Interruption capture
  {
    const currentTask: LifeTask = {
      id: 'task-curr',
      spaceId: 'work',
      title: 'Fix Pagination',
      priority: 'high',
      isCompleted: false,
      status: 'IN_PROGRESS',
      focusSessions: [],
      actualMinutes: 0,
      createdAt: '2026-09-14T09:00:00Z',
    };

    const session: TaskFocusSession = {
      id: 'sess-curr',
      taskId: 'task-curr',
      startedAt: '2026-09-14T09:00:00.000Z',
      durationMinutes: 0,
      createdAt: '2026-09-14T09:00:00.000Z',
    };

    const interruptTime = new Date('2026-09-14T09:20:00.000Z'); // 20m later
    const res = transitionCaptureInterruption(
      {
        spaceId: 'work',
        title: 'Manager urgent request',
        priority: 'high',
        isCompleted: false,
      },
      currentTask,
      session,
      'Manager requested staging credentials check',
      'Manager',
      interruptTime
    );

    const parked = res.parkedTask;
    const interruption = res.interruptionTask;
    const newSession = res.newActiveSession;

    assert(
      '7. Interruption capture parks previous task and links previousFocusedTaskId',
      parked?.actualMinutes === 20 &&
        interruption.status === 'IN_PROGRESS' &&
        interruption.interruptionContext?.previousFocusedTaskId === 'task-curr' &&
        newSession.taskId === interruption.id,
      { parkedMinutes: 20, linkedPrev: 'task-curr' },
      { parkedMinutes: parked?.actualMinutes, linkedPrev: interruption.interruptionContext?.previousFocusedTaskId }
    );
  }

  return results;
}
