import { db } from './database';
import { AzkarCategoryKey, AzkarLog } from '../features/worship/types';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function saveAzkarLog(log: AzkarLog): Promise<void> {
  try {
    await db.azkarLogs.put(log);
  } catch (error) {
    console.error('Failed to save azkar log:', error);
  }
}

export async function getTodayAzkarLogs(): Promise<AzkarLog[]> {
  try {
    const today = getTodayDateString();
    return await db.azkarLogs.where('date').equals(today).toArray();
  } catch (error) {
    console.error('Failed to get today azkar logs:', error);
    return [];
  }
}

export async function isAzkarCategoryCompletedToday(categoryKey: AzkarCategoryKey): Promise<boolean> {
  try {
    const today = getTodayDateString();
    const logs = await db.azkarLogs
      .where('date')
      .equals(today)
      .filter((log) => log.categoryKey === categoryKey && log.isFullyCompleted)
      .toArray();
    return logs.length > 0;
  } catch (error) {
    console.error('Failed to check category completion:', error);
    return false;
  }
}

export async function getAllAzkarLogs(): Promise<AzkarLog[]> {
  try {
    return await db.azkarLogs.orderBy('completedAt').reverse().toArray();
  } catch (error) {
    console.error('Failed to get all azkar logs:', error);
    return [];
  }
}

export async function getAzkarStreak(): Promise<{ currentStreak: number; totalCompleted: number }> {
  try {
    const logs = await db.azkarLogs.filter((l) => l.isFullyCompleted).toArray();
    const uniqueDays = Array.from(new Set(logs.map((l) => l.date))).sort().reverse();

    let currentStreak = 0;
    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (uniqueDays.length > 0) {
      if (uniqueDays[0] === today || uniqueDays[0] === yesterdayStr) {
        let checkDate = new Date(uniqueDays[0]);
        for (const day of uniqueDays) {
          const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (day === expected) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    return {
      currentStreak,
      totalCompleted: logs.length,
    };
  } catch (error) {
    console.error('Failed to calculate azkar streak:', error);
    return { currentStreak: 0, totalCompleted: 0 };
  }
}
