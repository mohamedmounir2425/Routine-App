/**
 * Pure, deterministic Workday Time Engine.
 * 
 * Calculates available productive work time by computing the true mathematical union
 * of non-productive intervals (breaks, prayer, interruptions) against the workday window.
 * 
 * ZERO React, ZERO localStorage, ZERO database, ZERO browser APIs.
 */

export interface TimeInterval {
  start: string; // "HH:mm" (24-hour format)
  end: string;   // "HH:mm" (24-hour format)
  label?: string;
  type?: 'break' | 'prayer' | 'meeting' | 'interruption' | 'other';
}

export interface WorkdayTimeCalculationParams {
  workStart: string; // e.g. "08:30"
  workEnd: string;   // e.g. "15:00"
  nonProductiveIntervals?: TimeInterval[];
}

export interface WorkdayTimeCalculationResult {
  workStartMinutes: number;
  workEndMinutes: number;
  totalWorkdayMinutes: number;
  nonProductiveMinutes: number;
  availableProductiveMinutes: number;
  mergedNonProductiveIntervals: Array<{
    start: string;
    end: string;
    durationMinutes: number;
  }>;
}

/**
 * Converts a "HH:mm" time string into total minutes from midnight (0..1439).
 * Returns NaN if input format is invalid.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) return NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 24 || minutes < 0 || minutes >= 60) {
    return NaN;
  }
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight into normalized "HH:mm" format.
 */
export function formatMinutesToTime(totalMinutes: number): string {
  if (isNaN(totalMinutes) || totalMinutes < 0) return '00:00';
  const clamped = Math.min(1440, Math.floor(totalMinutes));
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculates available productive work time using non-overlapping interval union logic.
 * 
 * Mathematical Guarantee:
 * availableProductiveMinutes = totalWorkdayMinutes - union(nonProductiveIntervals within workday)
 */
export function calculateAvailableWorkMinutes(
  params: WorkdayTimeCalculationParams
): WorkdayTimeCalculationResult {
  const rawStart = parseTimeToMinutes(params.workStart);
  const rawEnd = parseTimeToMinutes(params.workEnd);

  // Edge case: invalid or inverted workday window
  if (isNaN(rawStart) || isNaN(rawEnd) || rawStart >= rawEnd) {
    const validStart = isNaN(rawStart) ? 0 : Math.max(0, Math.min(1440, rawStart));
    return {
      workStartMinutes: validStart,
      workEndMinutes: validStart,
      totalWorkdayMinutes: 0,
      nonProductiveMinutes: 0,
      availableProductiveMinutes: 0,
      mergedNonProductiveIntervals: [],
    };
  }

  const workStartMinutes = Math.max(0, rawStart);
  const workEndMinutes = Math.min(1440, rawEnd);
  const totalWorkdayMinutes = workEndMinutes - workStartMinutes;

  const rawIntervals = params.nonProductiveIntervals || [];

  // 1. Sanitize & clamp all intervals to the active workday window [workStartMinutes, workEndMinutes]
  const clampedIntervals: Array<{ start: number; end: number }> = [];

  for (const interval of rawIntervals) {
    if (!interval) continue;
    const startM = parseTimeToMinutes(interval.start);
    const endM = parseTimeToMinutes(interval.end);

    // Skip invalid, negative, or inverted intervals
    if (isNaN(startM) || isNaN(endM) || startM >= endM) {
      continue;
    }

    // Clamp to workday boundaries
    const effectiveStart = Math.max(workStartMinutes, startM);
    const effectiveEnd = Math.min(workEndMinutes, endM);

    // Only include if there is an actual overlap with the workday
    if (effectiveStart < effectiveEnd) {
      clampedIntervals.push({ start: effectiveStart, end: effectiveEnd });
    }
  }

  // 2. Interval Union Algorithm (merge overlapping and adjacent intervals)
  if (clampedIntervals.length === 0) {
    return {
      workStartMinutes,
      workEndMinutes,
      totalWorkdayMinutes,
      nonProductiveMinutes: 0,
      availableProductiveMinutes: totalWorkdayMinutes,
      mergedNonProductiveIntervals: [],
    };
  }

  // Sort ascending by start time
  clampedIntervals.sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Array<{ start: number; end: number }> = [];
  let current = { ...clampedIntervals[0] };

  for (let i = 1; i < clampedIntervals.length; i++) {
    const next = clampedIntervals[i];

    // Overlapping or adjacent interval (e.g. 12:00-12:30 and 12:20-12:40 or 12:30-13:00)
    if (next.start <= current.end) {
      current.end = Math.max(current.end, next.end);
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  // 3. Sum merged non-productive duration
  let nonProductiveMinutes = 0;
  const mergedFormatted = merged.map((m) => {
    const duration = m.end - m.start;
    nonProductiveMinutes += duration;
    return {
      start: formatMinutesToTime(m.start),
      end: formatMinutesToTime(m.end),
      durationMinutes: duration,
    };
  });

  const availableProductiveMinutes = Math.max(0, totalWorkdayMinutes - nonProductiveMinutes);

  return {
    workStartMinutes,
    workEndMinutes,
    totalWorkdayMinutes,
    nonProductiveMinutes,
    availableProductiveMinutes,
    mergedNonProductiveIntervals: mergedFormatted,
  };
}
