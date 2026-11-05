/**
 * Deterministic Test Suite for Workday Time Engine
 */

import {
  calculateAvailableWorkMinutes,
} from './workdayTimeEngine';

interface TestResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
}

export function runWorkdayTimeEngineTests(): TestResult[] {
  const results: TestResult[] = [];

  function assert(name: string, condition: boolean, expected: any, actual: any) {
    results.push({ name, passed: condition, expected, actual });
  }

  // 1. Normal Workday with Standard Breaks
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '08:30',
      workEnd: '15:00',
      nonProductiveIntervals: [
        { start: '08:30', end: '09:00', label: 'Morning transition' },
        { start: '12:00', end: '12:30', label: 'Midday break' },
      ],
    });
    // 390 total - 60 breaks = 330
    assert(
      '1. Normal workday with 2 distinct breaks',
      res.totalWorkdayMinutes === 390 && res.nonProductiveMinutes === 60 && res.availableProductiveMinutes === 330,
      { total: 390, nonProd: 60, avail: 330 },
      { total: res.totalWorkdayMinutes, nonProd: res.nonProductiveMinutes, avail: res.availableProductiveMinutes }
    );
  }

  // 2. Prayer outside breaks
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '08:30',
      workEnd: '15:00',
      nonProductiveIntervals: [
        { start: '08:30', end: '09:00', label: 'Morning' },
        { start: '12:00', end: '12:30', label: 'Break' },
        { start: '13:10', end: '13:30', label: 'Prayer' }, // 20m
      ],
    });
    // 390 - (30 + 30 + 20) = 310 (5h 10m)
    assert(
      '2. Prayer outside breaks (exact 5h 10m specification)',
      res.totalWorkdayMinutes === 390 && res.nonProductiveMinutes === 80 && res.availableProductiveMinutes === 310,
      { total: 390, nonProd: 80, avail: 310 },
      { total: res.totalWorkdayMinutes, nonProd: res.nonProductiveMinutes, avail: res.availableProductiveMinutes }
    );
  }

  // 3. Prayer overlapping break (Interval Union Check)
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '08:30',
      workEnd: '15:00',
      nonProductiveIntervals: [
        { start: '08:30', end: '09:00' }, // 30m
        { start: '12:00', end: '12:30' }, // 30m
        { start: '12:20', end: '12:40' }, // 20m, overlapping by 10m
      ],
    });
    // 12:00-12:30 and 12:20-12:40 union is 12:00-12:40 = 40m. Total nonProd = 30 + 40 = 70m (NOT 80m!).
    // Available = 390 - 70 = 320m.
    assert(
      '3. Prayer overlapping break correctly merged without double-counting',
      res.nonProductiveMinutes === 70 && res.availableProductiveMinutes === 320,
      { nonProd: 70, avail: 320 },
      { nonProd: res.nonProductiveMinutes, avail: res.availableProductiveMinutes }
    );
  }

  // 4. Multiple overlapping & adjacent intervals
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '08:00',
      workEnd: '14:00', // 360m
      nonProductiveIntervals: [
        { start: '10:00', end: '10:20' },
        { start: '10:15', end: '10:45' },
        { start: '10:45', end: '11:00' }, // adjacent
      ],
    });
    // Merges into one continuous 10:00-11:00 = 60m
    assert(
      '4. Multiple overlapping and adjacent intervals merged into single block',
      res.nonProductiveMinutes === 60 && res.mergedNonProductiveIntervals.length === 1 && res.availableProductiveMinutes === 300,
      { nonProd: 60, mergedCount: 1, avail: 300 },
      { nonProd: res.nonProductiveMinutes, mergedCount: res.mergedNonProductiveIntervals.length, avail: res.availableProductiveMinutes }
    );
  }

  // 5. Intervals partially or completely outside workday
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '08:30',
      workEnd: '15:00', // 390m
      nonProductiveIntervals: [
        { start: '07:00', end: '08:45' }, // Overlaps 08:30-08:45 (15m clamped)
        { start: '14:45', end: '16:00' }, // Overlaps 14:45-15:00 (15m clamped)
        { start: '16:00', end: '17:00' }, // Completely outside (0m)
        { start: '05:00', end: '06:00' }, // Completely outside (0m)
      ],
    });
    // Clamped downtime = 15 + 15 = 30m. Available = 360m.
    assert(
      '5. Intervals partially and completely outside workday properly clamped',
      res.nonProductiveMinutes === 30 && res.availableProductiveMinutes === 360,
      { nonProd: 30, avail: 360 },
      { nonProd: res.nonProductiveMinutes, avail: res.availableProductiveMinutes }
    );
  }

  // 6. Zero breaks / empty intervals
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '09:00',
      workEnd: '17:00', // 480m
      nonProductiveIntervals: [],
    });
    assert(
      '6. No non-productive intervals yields 100% available time',
      res.totalWorkdayMinutes === 480 && res.nonProductiveMinutes === 0 && res.availableProductiveMinutes === 480,
      { total: 480, nonProd: 0, avail: 480 },
      { total: res.totalWorkdayMinutes, nonProd: res.nonProductiveMinutes, avail: res.availableProductiveMinutes }
    );
  }

  // 7. Invalid, inverted, and zero-length intervals
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '08:30',
      workEnd: '15:00',
      nonProductiveIntervals: [
        { start: '10:00', end: '10:00' }, // zero length
        { start: '11:30', end: '11:00' }, // inverted
        { start: 'invalid', end: '12:00' }, // malformed
        { start: '12:00', end: '12:30' }, // valid (30m)
      ],
    });
    assert(
      '7. Malformed, inverted and zero-length intervals safely ignored',
      res.nonProductiveMinutes === 30 && res.availableProductiveMinutes === 360,
      { nonProd: 30, avail: 360 },
      { nonProd: res.nonProductiveMinutes, avail: res.availableProductiveMinutes }
    );
  }

  // 8. Inverted / Invalid Workday Window
  {
    const res = calculateAvailableWorkMinutes({
      workStart: '15:00',
      workEnd: '08:30', // inverted start >= end
    });
    assert(
      '8. Inverted workday window safely clamps to 0 (never negative, never NaN)',
      res.totalWorkdayMinutes === 0 && res.availableProductiveMinutes === 0 && !isNaN(res.availableProductiveMinutes),
      { total: 0, avail: 0 },
      { total: res.totalWorkdayMinutes, avail: res.availableProductiveMinutes }
    );
  }

  return results;
}
