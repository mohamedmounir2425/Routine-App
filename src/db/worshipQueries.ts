import { workspaceStorage } from './workspaceScope';
import { db } from './database';
import { AzkarCategoryKey, AzkarLog } from '../features/worship/types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncSingleAzkarLog } from './syncEngine';

import { getLocalDateString } from '../utils/dateUtils';

export function getTodayDateString(): string {
  return getLocalDateString();
}

export async function saveAzkarLog(log: AzkarLog): Promise<void> {
  try {
    await db.azkarLogs.put(log);
    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSingleAzkarLog(session.user.id, log);
        }
      });
    }
  } catch (error) {
    console.error('Failed to save azkar log:', error);
  }
}

export async function getTodayAzkarLogs(targetDate?: string): Promise<AzkarLog[]> {
  try {
    const date = targetDate || getLocalDateString();
    return await db.azkarLogs.where('date').equals(date).toArray();
  } catch (error) {
    console.error('Failed to get today azkar logs:', error);
    return [];
  }
}

export async function isAzkarCategoryCompletedToday(
  categoryKey: AzkarCategoryKey,
  targetDate?: string
): Promise<boolean> {
  try {
    const date = targetDate || getLocalDateString();
    const logs = await db.azkarLogs
      .where('date')
      .equals(date)
      .filter((log) => log.categoryKey === categoryKey && log.isFullyCompleted)
      .toArray();
    return logs.length > 0;
  } catch (error) {
    console.error('Failed to check category completion:', error);
    return false;
  }
}

// ==========================================
// PRAYER PERSISTENCE DOMAIN LAYER
// ==========================================
export interface DailyPrayerRecord {
  fard: boolean;
  jamaah: boolean;
  sunnah: boolean;
}

export function getDailyPrayersState(dateStr?: string): Record<string, DailyPrayerRecord> {
  const date = dateStr || getLocalDateString();
  try {
    const saved = workspaceStorage.getItem(`routine_prayers_${date}`);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function toggleDailyPrayerFard(
  prayerId: string,
  dateStr?: string
): DailyPrayerRecord {
  const date = dateStr || getLocalDateString();
  const storageKey = `routine_prayers_${date}`;
  const state = getDailyPrayersState(date);
  const current = state[prayerId] || { fard: false, jamaah: false, sunnah: false };
  const nextFard = !current.fard;

  state[prayerId] = {
    ...current,
    fard: nextFard,
    jamaah: nextFard ? current.jamaah : false,
  };

  workspaceStorage.setItem(storageKey, JSON.stringify(state));
  return state[prayerId];
}

export function updateDailyPrayerRecord(
  prayerId: string,
  updates: Partial<DailyPrayerRecord>,
  dateStr?: string
): DailyPrayerRecord {
  const date = dateStr || getLocalDateString();
  const storageKey = `routine_prayers_${date}`;
  const state = getDailyPrayersState(date);
  const current = state[prayerId] || { fard: false, jamaah: false, sunnah: false };

  state[prayerId] = {
    ...current,
    ...updates,
  };

  workspaceStorage.setItem(storageKey, JSON.stringify(state));
  return state[prayerId];
}

export function getNawafilPrayersState(dateStr?: string): Record<string, boolean> {
  const date = dateStr || getLocalDateString();
  try {
    const saved = workspaceStorage.getItem(`routine_prayers_${date}_nawafil`);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function toggleNawafilPrayer(nawafilId: string, dateStr?: string): boolean {
  const date = dateStr || getLocalDateString();
  const storageKey = `routine_prayers_${date}_nawafil`;
  const state = getNawafilPrayersState(date);
  const next = !state[nawafilId];
  state[nawafilId] = next;
  workspaceStorage.setItem(storageKey, JSON.stringify(state));
  return next;
}

// ==========================================
// QURAN DOMAIN PERSISTENCE LAYER
// ==========================================
export interface QuranDailyStatus {
  dateStr: string;
  pagesRead: number;
  targetPages: number;
  bookmarkSurah: string;
  bookmarkPage: number;
  isCompleted: boolean;
  progressPercent: number;
}

export function getQuranDailyStatus(targetDateStr?: string): QuranDailyStatus {
  const dateStr = targetDateStr || getLocalDateString();
  let pagesRead = 0;
  let targetPages = 10;
  let bookmarkSurah = 'سورة البقرة';
  let bookmarkPage = 1;

  try {
    const savedRead = workspaceStorage.getItem(`routine_quran_${dateStr}`);
    if (savedRead) pagesRead = parseInt(savedRead, 10);
    const savedTarget = workspaceStorage.getItem('routine_quran_target');
    if (savedTarget) targetPages = parseInt(savedTarget, 10);
    const savedSurah = workspaceStorage.getItem('routine_quran_bookmark_surah');
    if (savedSurah) bookmarkSurah = savedSurah;
    const savedPage = workspaceStorage.getItem('routine_quran_bookmark_page');
    if (savedPage) bookmarkPage = parseInt(savedPage, 10);
  } catch {}

  const isCompleted = pagesRead >= targetPages && targetPages > 0;
  const progressPercent = targetPages > 0 ? Math.min(100, Math.round((pagesRead / targetPages) * 100)) : 0;

  return {
    dateStr,
    pagesRead,
    targetPages,
    bookmarkSurah,
    bookmarkPage,
    isCompleted,
    progressPercent,
  };
}

export function recordQuranPageRead(amount: number = 1, targetDateStr?: string): QuranDailyStatus {
  const status = getQuranDailyStatus(targetDateStr);
  const nextRead = Math.max(0, status.pagesRead + amount);
  const nextPage = Math.min(604, Math.max(1, status.bookmarkPage + amount));

  try {
    workspaceStorage.setItem(`routine_quran_${status.dateStr}`, nextRead.toString());
    workspaceStorage.setItem('routine_quran_bookmark_page', nextPage.toString());
  } catch {}

  return getQuranDailyStatus(status.dateStr);
}

export function setQuranTargetPages(target: number): void {
  try {
    workspaceStorage.setItem('routine_quran_target', Math.max(1, target).toString());
  } catch {}
}

export function updateQuranBookmark(surah: string, page: number): void {
  try {
    workspaceStorage.setItem('routine_quran_bookmark_surah', surah);
    workspaceStorage.setItem('routine_quran_bookmark_page', Math.min(604, Math.max(1, page)).toString());
  } catch {}
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
