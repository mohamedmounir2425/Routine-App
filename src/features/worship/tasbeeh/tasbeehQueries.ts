/**
 * Dedicated persistence layer for Tasbeeh / Sebha.
 * Stores daily tap counter independently from Azkar logs.
 */

export function getTodayTasbeehCount(): number {
  try {
    const saved = localStorage.getItem('routine_tasbeeh_today');
    return saved ? parseInt(saved, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveTodayTasbeehCount(count: number): void {
  try {
    localStorage.setItem('routine_tasbeeh_today', count.toString());
  } catch {}
}

export function resetTodayTasbeehCount(): void {
  saveTodayTasbeehCount(0);
}
