export interface FocusSessionRecord {
  id: string;
  date: string; // ISO string
  minutes: number;
  taskId?: string;
  taskTitle?: string;
}

export interface FocusStats {
  completedSessions: number;
  totalFocusMinutes: number;
  todaySessions: number;
  todayMinutes: number;
  history: FocusSessionRecord[];
}

const STORAGE_KEY = 'life_focus_sessions';

export function getFocusHistory(): FocusSessionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((session): session is FocusSessionRecord => !!session && typeof session === 'object' && typeof session.id === 'string' && typeof session.date === 'string' && Number.isFinite(new Date(session.date).getTime()) && typeof session.minutes === 'number' && Number.isFinite(session.minutes) && session.minutes >= 0) : [];
  } catch {
    return [];
  }
}

export function getFocusStats(): FocusStats {
  const history = getFocusHistory();
  const todayStr = new Date().toISOString().split('T')[0];

  let totalMinutes = 0;
  let todaySessions = 0;
  let todayMinutes = 0;

  for (const session of history) {
    totalMinutes += session.minutes || 0;
    if (session.date && session.date.startsWith(todayStr)) {
      todaySessions += 1;
      todayMinutes += session.minutes || 0;
    }
  }

  return {
    completedSessions: history.length,
    totalFocusMinutes: totalMinutes,
    todaySessions,
    todayMinutes,
    history: history.slice(-50).reverse(), // Most recent 50
  };
}

export function recordCompletedFocusSession(
  minutes: number,
  taskId?: string,
  taskTitle?: string
): FocusSessionRecord {
  const history = getFocusHistory();
  const newRecord: FocusSessionRecord = {
    id: `focus_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date: new Date().toISOString(),
    minutes,
    taskId,
    taskTitle,
  };

  history.push(newRecord);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    window.dispatchEvent(new CustomEvent('focus_session_completed', { detail: newRecord }));
  } catch (err) {
    console.error('Failed to save focus session:', err);
  }

  return newRecord;
}
