/**
 * Date and time utilities for local-first scheduling and Today feed.
 * Avoids toISOString() UTC offset bugs where local midnight shifts dates in Egypt / Arab timezones.
 */

/**
 * Returns YYYY-MM-DD formatted string in user's local timezone.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns HH:mm (24-hour) formatted string in user's local timezone.
 */
export function getLocalTimeString(d: Date = new Date()): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Safely parses a YYYY-MM-DD string into a local Date object (at local 00:00:00).
 * Deterministic: Never falls back to `new Date(dateStr)` to eliminate UTC midnight drift.
 */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  const cleanStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.trim();
  const parts = cleanStr.split('-').map(Number);

  if (
    parts.length === 3 &&
    !parts.some(isNaN) &&
    parts[0] > 1900 &&
    parts[1] >= 1 &&
    parts[1] <= 12 &&
    parts[2] >= 1 &&
    parts[2] <= 31
  ) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }

  const fallback = new Date();
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

/**
 * Checks if a given date string (YYYY-MM-DD) matches today's local date.
 */
export function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.trim() === getLocalDateString();
}

/**
 * Checks if a given date string (YYYY-MM-DD) is before today's local date.
 */
export function isPastDate(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return dateStr.trim() < getLocalDateString();
}

/**
 * Add or subtract days from a YYYY-MM-DD local date string.
 */
export function addDaysToLocalDate(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Day of the week in user's local time (0 = Sunday, 1 = Monday, ..., 6 = Saturday).
 */
export function getTodayDayOfWeek(d: Date = new Date()): number {
  return d.getDay();
}

/**
 * Formats date into Arabic friendly string (e.g. "الإثنين، 7 سبتمبر 2026")
 */
export function formatArabicDate(d: Date = new Date()): string {
  try {
    return d.toLocaleDateString('ar-EG', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return `${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
}
