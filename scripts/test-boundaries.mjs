import assert from 'node:assert/strict';
import { boundaryError, stylesheetError } from './space-boundaries.mjs';

const allowed = [
  ['src/features/home/inventory/InventoryTable.tsx', 'src/shared/ui/DataTable.tsx'],
  ['src/features/home/HomeSpace.tsx', 'src/features/home/inventory/InventoryTable.tsx'],
  ['src/features/today/TodayPage.tsx', 'src/features/work/public.ts'],
  ['src/App.tsx', 'src/features/health/index.ts'],
  ['src/shared/ui/DataTable.tsx', 'node_modules/antd/es/index.d.ts'],
];
const blocked = [
  ['src/features/home/HomeSpace.tsx', 'src/features/health/player/WorkoutPlayer.tsx'],
  ['src/features/health/HealthSpace.tsx', 'src/features/home/home.css'],
  ['src/shared/ui/DataTable.tsx', 'src/features/home/public.ts'],
  ['src/shared/ui/DataTable.tsx', 'src/db/database.ts'],
  ['src/features/work/WorkSpace.tsx', 'src/app/useAppController.ts'],
  ['src/App.tsx', 'src/features/health/hooks/useHealthController.ts'],
  ['src/app/useAppController.ts', 'src/features/health/public.ts'],
  ['C:\\repo\\src\\features\\home\\HomeSpace.tsx', 'C:\\repo\\src\\features\\health\\player\\WorkoutPlayer.tsx'],
  ['src/features/home/HomeSpace.tsx', 'src/features/work/public.ts'],
  ['src/features/work/WorkSpace.tsx', 'src/features/today/public.ts'],
  ['src/features/today/TodayPage.tsx', 'src/features/home/index.ts'],
];
for (const [from, to] of allowed) assert.equal(boundaryError(from, to), null, `${from} -> ${to}`);
for (const [from, to] of blocked) assert.ok(boundaryError(from, to), `${from} -> ${to}`);
assert.equal(stylesheetError('src/features/health/health.tokens.css', ':root { --health-accent: green; }'), null);
assert.ok(stylesheetError('src/features/health/health.module.css', '.card { padding: 4px; }'));
assert.ok(stylesheetError('src/shared/ui/table.css', '.table { border: 0; }'));
assert.ok(stylesheetError('src/features/health/health.tokens.css', '.card { @apply p-4; }'));
assert.ok(stylesheetError('src/features/health/health.tokens.css', '.card { padding: 4px; }'));
console.log(`Boundary/style policy tests passed (${allowed.length + blocked.length + 5} cases).`);
