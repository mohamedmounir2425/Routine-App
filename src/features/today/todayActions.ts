import { db } from '../../db/database';
import { LifeTask, HomeProject, WorkoutLog } from '../../types';
import { AzkarCategoryKey, AzkarLog } from '../worship/types';
import { toggleTaskCompletion } from '../../db/taskQueries';
import { completeProjectStep } from '../../db/projectQueries';
import { 
  saveAzkarLog, 
  toggleDailyPrayerFard, 
  recordQuranPageRead, 
  DailyPrayerRecord 
} from '../../db/worshipQueries';
import { syncSingleTask, syncSingleWorkoutLog } from '../../db/syncEngine';
import { getLocalDateString } from '../../utils/dateUtils';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

/**
 * Executes a task completion from the Today Execution Center.
 * Preserves recurring definition by modifying recurringCompletionDates for today
 * instead of mutating the source recurrence rule or history of past days.
 */
export async function executeToggleTask(
  taskId: string,
  targetDateStr?: string
): Promise<LifeTask | null> {
  const today = targetDateStr || getLocalDateString();

  try {
    const task = await db.tasks.get(taskId);
    if (!task) return null;

    // 1. Recurring task handling
    if (task.isRecurring) {
      const dates = Array.isArray(task.recurringCompletionDates) ? task.recurringCompletionDates : [];
      const isAlreadyCompletedToday = dates.includes(today);

      let updatedDates: string[];
      if (isAlreadyCompletedToday) {
        updatedDates = dates.filter((d) => d !== today);
      } else {
        updatedDates = [...dates, today];
      }

      const updatedTask: LifeTask = {
        ...task,
        recurringCompletionDates: updatedDates,
        // Keep main isCompleted false so the recurring definition stays active for future days
        isCompleted: false,
      };

      await db.tasks.put(updatedTask);

      if (isSupabaseConfigured()) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            syncSingleTask(session.user.id, updatedTask);
          }
        });
      }

      return updatedTask;
    }

    // 2. Non-recurring task handling
    return await toggleTaskCompletion(taskId);
  } catch (error) {
    console.error(`Failed to execute toggle for task ${taskId}:`, error);
    return null;
  }
}


/**
 * Toggles the Fard prayer completion state for today.
 * Delegates directly to the existing domain prayer persistence layer.
 */
export function executeTogglePrayer(
  prayerId: string,
  targetDateStr?: string
): DailyPrayerRecord {
  return toggleDailyPrayerFard(prayerId, targetDateStr);
}

/**
 * Completes the active step of a home project, advancing to the next step.
 */
export async function executeCompleteProjectAction(
  projectId: string,
  stepId: string
): Promise<HomeProject | null> {
  return await completeProjectStep(projectId, stepId);
}

/**
 * Records an incremental page read for today's Quran target.
 * Delegates directly to the existing domain Quran persistence layer.
 */
export function executeAddQuranPage(
  amount: number = 1,
  targetDateStr?: string
): number {
  const status = recordQuranPageRead(amount, targetDateStr);
  return status.pagesRead;
}

/**
 * Explicit helper to log a completed workout from the Today Player launcher.
 */
export async function executeLogWorkout(
  log: WorkoutLog,
  userId?: string
): Promise<void> {
  try {
    await db.workoutLogs.put(log);
    if (userId && isSupabaseConfigured()) {
      syncSingleWorkoutLog(userId, log);
    }
  } catch (error) {
    console.error('Failed to log workout session:', error);
  }
}

/**
 * Marks an Azkar session (morning/evening) fully completed for today.
 */
export async function executeCompleteAzkar(
  categoryKey: AzkarCategoryKey,
  targetDateStr?: string
): Promise<void> {
  const date = targetDateStr || getLocalDateString();
  const categoryArabic = categoryKey === 'morning' ? 'أذكار الصباح' : categoryKey === 'evening' ? 'أذكار المساء' : 'أذكار اليوم';
  const log: AzkarLog = {
    id: `azkar_${categoryKey}_${date}`,
    categoryKey,
    categoryArabic,
    totalDhikr: 10,
    completedDhikr: 10,
    durationSeconds: 300,
    date,
    completedAt: new Date().toISOString(),
    isFullyCompleted: true,
  };
  await saveAzkarLog(log);
}

