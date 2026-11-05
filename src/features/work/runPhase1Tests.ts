/**
 * Master Test Runner for Phase 1: Core Work Engine
 * Runs both the Workday Time Engine and Focus Engine suites.
 */

// In-memory test environment polyfills for Node.js
class PolyfillHeaders {
  private map: Record<string, string> = {};
  append(k: string, v: string) { this.map[k.toLowerCase()] = v; }
  get(k: string) { return this.map[k.toLowerCase()] || null; }
  has(k: string) { return k.toLowerCase() in this.map; }
  set(k: string, v: string) { this.map[k.toLowerCase()] = v; }
}
(global as any).Headers = PolyfillHeaders;
(globalThis as any).Headers = PolyfillHeaders;

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: 0,
  } as any;
}

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, params?: any) {
      this.type = type;
      this.detail = params?.detail;
    }
  };
}

import { runWorkdayTimeEngineTests } from './time/workdayTimeEngine.test';
import { runFocusEngineTests } from './focus/focusEngine.test';

export function runAllPhase1Tests(): boolean {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 1 CORE WORK ENGINE TESTS');
  console.log('======================================================\n');

  console.log('--- 1. Workday Time Engine Tests ---');
  const timeResults = runWorkdayTimeEngineTests();
  let timePassed = true;
  for (const r of timeResults) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${r.name}`);
    if (!r.passed) {
      console.log(`       Expected:`, r.expected);
      console.log(`       Actual:  `, r.actual);
      timePassed = false;
    }
  }

  console.log('\n--- 2. Focus Engine Tests ---');
  const focusResults = runFocusEngineTests();
  let focusPassed = true;
  for (const r of focusResults) {
    const icon = r.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} | ${r.name}`);
    if (!r.passed) {
      console.log(`       Expected:`, r.expected);
      console.log(`       Actual:  `, r.actual);
      focusPassed = false;
    }
  }

  const allPassed = timePassed && focusPassed;
  const total = timeResults.length + focusResults.length;

  console.log('\n======================================================');
  console.log(`📊 SUMMARY: ${total} Total Tests | ALL PASSED: ${allPassed ? 'YES ✅' : 'NO ❌'}`);
  console.log('======================================================\n');

  return allPassed;
}

// Self-executing
if (typeof process !== 'undefined') {
  const passed = runAllPhase1Tests();
  if (!passed) {
    process.exit(1);
  }
}
