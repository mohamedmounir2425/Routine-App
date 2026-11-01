import { createServer } from 'vite';
import 'fake-indexeddb/auto';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key),
  clear: () => storage.clear(),
  key: index => [...storage.keys()][index] ?? null,
  get length() { return storage.size; },
};
globalThis.window = { dispatchEvent: () => true, addEventListener() {}, removeEventListener() {} };

// Reuse Vite's installed TypeScript pipeline. Tests use only an in-memory database.
const server = await createServer({
  configFile: false,
  envFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  define: { 'import.meta.env.VITE_SUPABASE_URL': '""', 'import.meta.env.VITE_SUPABASE_ANON_KEY': '""' },
});
try {
  const today = await server.ssrLoadModule('/src/features/today/todayScenarios.test.ts');
  const results = await today.runAllDeterministicScenarios();
  const time = await server.ssrLoadModule('/src/features/work/time/workdayTimeEngine.test.ts');
  const focus = await server.ssrLoadModule('/src/features/work/focus/focusEngine.test.ts');
  const workResults = [...time.runWorkdayTimeEngineTests(), ...focus.runFocusEngineTests()];
  const reliability = await server.ssrLoadModule('/src/db/reliability.test.ts');
  const decisions = await server.ssrLoadModule('/src/features/today/todayDecisionEngine.test.ts');
  const spaces = await server.ssrLoadModule('/src/features/today/spaceTaskService.test.ts');
  const syncSafety = await server.ssrLoadModule('/src/db/syncSafety.test.ts');
  const extraResults = [...workResults, ...await reliability.runReliabilityTests(), ...await decisions.runTodayDecisionTests(), ...await spaces.runSpaceTaskTests(), ...await syncSafety.runSyncSafetyTests()];
  for (const result of extraResults) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}`);
  if ([...results, ...extraResults].some(result => !result.passed)) process.exitCode = 1;
  console.log(`Checked ${results.length + extraResults.length} scenarios.`);
} finally {
  await server.close();
}
