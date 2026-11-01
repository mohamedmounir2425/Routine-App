import Dexie from 'dexie';
import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { db, RoutineDatabase } from './database';
import { exportCompleteBackup, importCompleteBackup } from './backup';
import { ACTIVE_WORKSPACE_KEY, LEGACY_DATABASE_NAME, createWorkspaceStorage, createWorkspaceGuard, scopeForUser, workspaceDatabaseName } from './workspaceScope';
import { prepareLegacyWorkspace, readLegacyBackup } from './workspaceMigration';
import type { LifeTask } from '../types';
import { suspendFocusForWorkspace } from './workspaceFocus';
import { canOpenCachedWorkspace } from './workspaceOffline';

/** The runner supplies fake-indexeddb; these tests never open real browser databases. */
export async function runWorkspaceIsolationTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  const raw = localStorage;
  raw.clear();
  const a = scopeForUser('isolation-a');
  const b = scopeForUser('isolation-b');
  const storageA = createWorkspaceStorage(a, raw);
  const storageB = createWorkspaceStorage(b, raw);
  const guestStorage = createWorkspaceStorage('guest', raw);
  storageA.setItem('routine_quran_target', '10');
  storageB.setItem('routine_quran_target', '20');
  guestStorage.setItem('routine_quran_target', '5');
  raw.setItem('sb-auth-token', 'credential');
  check('Account and Guest preferences use independent namespaces', storageA.getItem('routine_quran_target') === '10' && storageB.getItem('routine_quran_target') === '20' && guestStorage.getItem('routine_quran_target') === '5');
  check('Scoped storage enumeration excludes other accounts and auth credentials', storageA.length === 1 && storageA.key(0) === 'routine_quran_target' && storageA.getItem('sb-auth-token') === null);
  storageA.clear();
  check('Clearing one workspace preserves other workspaces and the SDK session', storageB.getItem('routine_quran_target') === '20' && guestStorage.getItem('routine_quran_target') === '5' && raw.getItem('sb-auth-token') === 'credential');
  raw.setItem(ACTIVE_WORKSPACE_KEY, a);
  const guard = createWorkspaceGuard(a, raw);
  guard.bindSession('isolation-a');
  let ownAllowed = true;
  try { guard.assertAccount('isolation-a'); } catch { ownAllowed = false; }
  let otherBlocked = false;
  try { guard.assertAccount('isolation-b'); } catch { otherBlocked = true; }
  check('Sync identity allows only the authenticated owner of the current workspace', ownAllowed && otherBlocked);
  raw.setItem(ACTIVE_WORKSPACE_KEY, b);
  let lateBlocked = false;
  try { guard.assertAccount('isolation-a'); } catch { lateBlocked = true; }
  check('An old tab cannot sync after another tab switches the workspace', lateBlocked);
  raw.setItem(ACTIVE_WORKSPACE_KEY, a);
  guard.bindSession(null);
  let signedOutBlocked = false;
  try { guard.assertAccount('isolation-a'); } catch { signedOutBlocked = true; }
  check('Sign-out blocks old work before the reload completes', signedOutBlocked);

  const databaseA = new RoutineDatabase(workspaceDatabaseName(a));
  const databaseB = new RoutineDatabase(workspaceDatabaseName(b));
  const task: LifeTask = { id: 'same-id', title: 'Private A', spaceId: 'work', priority: 'medium', isCompleted: false, createdAt: '2026-11-01T10:00:00Z' };
  await databaseA.tasks.put(task);
  await databaseB.tasks.put({ ...task, title: 'Private B' });
  await databaseA.tasks.clear();
  check('Separate account databases isolate identical record IDs and deletes', databaseA.name !== databaseB.name && await databaseA.tasks.count() === 0 && (await databaseB.tasks.get(task.id))?.title === 'Private B');
  await databaseA.pendingSync.add({ userId: 'isolation-a', table: 'life_tasks', entityId: task.id, action: 'delete', data: null, timestamp: task.createdAt, retryCount: 0, status: 'pending' });
  check('Offline queues are physically separate for each account', await databaseA.pendingSync.count() === 1 && await databaseB.pendingSync.count() === 0);
  const networkError = new AuthRetryableFetchError('Network unavailable', 503);
  check('A retryable auth outage permits an existing last-selected local cache without authenticating cloud access', await canOpenCachedWorkspace(networkError, a));
  check('Invalid auth errors and Guest do not activate another account offline cache', !await canOpenCachedWorkspace(new Error('Invalid session'), a) && !await canOpenCachedWorkspace(networkError, 'guest'));
  raw.setItem(ACTIVE_WORKSPACE_KEY, b);
  check('Offline fallback refuses a stale tab cache after the selected account changes', !await canOpenCachedWorkspace(networkError, a));

  await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear(); });
  raw.clear();
  const legacy = new Dexie(LEGACY_DATABASE_NAME);
  legacy.version(1).stores({ tasks: 'id', pendingSync: '++id', settings: 'id' });
  await legacy.table('tasks').put({ ...task, id: 'legacy-only', title: 'Legacy data' });
  await legacy.table('tasks').put({ ...task, id: 'collision', title: 'Archived collision' });
  await legacy.table('pendingSync').add({ userId: 'isolation-a', table: 'life_tasks', entityId: 'deleted-before-upgrade', action: 'delete', data: null });
  raw.setItem('routine_prayers_2026-11-01', '{"fajr":{"fard":true}}');
  raw.setItem('sb-auth-token', 'do-not-copy');
  await db.tasks.put({ ...task, id: 'collision', title: 'New Guest data' });
  const originalSetItem = raw.setItem.bind(raw);
  raw.setItem = (key, value) => {
    if (key === 'lifeos_workspace/guest/routine_prayers_2026-11-01') throw new Error('Simulated quota failure');
    originalSetItem(key, value);
  };
  let migrationFailed = false;
  try { await prepareLegacyWorkspace(); } catch { migrationFailed = true; }
  raw.setItem = originalSetItem;
  const recovery = await readLegacyBackup();
  check('Migration persists a recovery archive before copying and fails safely on storage errors', migrationFailed && !!recovery.backup && await legacy.table('tasks').count() === 2 && !await db.tasks.get('legacy-only'));
  await prepareLegacyWorkspace();
  check('Retry migrates legacy records into Guest without overwriting existing Guest edits', (await db.tasks.get('legacy-only'))?.title === 'Legacy data' && (await db.tasks.get('collision'))?.title === 'New Guest data');
  check('Legacy migration does not upgrade, delete or replay the original database queue', legacy.verno === 1 && await legacy.table('tasks').count() === 2 && await legacy.table('pendingSync').count() === 1 && await db.pendingSync.count() === 0);
  check('Legacy prayer data is copied only to Guest and auth tokens are excluded', guestStorage.getItem('routine_prayers_2026-11-01') !== null && storageB.getItem('routine_prayers_2026-11-01') === null && guestStorage.getItem('sb-auth-token') === null && !recovery.backup?.includes('do-not-copy'));
  const archived = JSON.parse(recovery.backup!);
  check('Downloadable legacy backup retains records that collided during the safe Guest merge', archived.data.tasks.some((record: LifeTask) => record.id === 'collision' && record.title === 'Archived collision') && !('pendingSync' in archived.data));
  await db.tasks.update('legacy-only', { title: 'Edited after migration' });
  await prepareLegacyWorkspace();
  check('Completed legacy migration is idempotent and never reverts subsequent edits', (await db.tasks.get('legacy-only'))?.title === 'Edited after migration');
  check('Legacy data is not assigned to either authenticated account automatically', await databaseA.tasks.count() === 0 && (await databaseB.tasks.get(task.id))?.title === 'Private B' && !await databaseB.tasks.get('legacy-only'));
  const guestBackup = await exportCompleteBackup();
  check('Current workspace backup cannot include another account database or raw SDK credentials', guestBackup.includes('Edited after migration') && !guestBackup.includes('Private B') && !guestBackup.includes('do-not-copy'));
  await databaseA.tasks.put({ ...task, status: 'IN_PROGRESS', focusSessions: [] });
  storageA.setItem('routine_active_focus_state', JSON.stringify({ focusedTaskId: task.id,
    activeSession: { id: 'account-switch-session', taskId: task.id, startedAt: task.createdAt, durationMinutes: 0, createdAt: task.createdAt } }));
  const originalRemoveItem = raw.removeItem.bind(raw);
  raw.removeItem = key => {
    if (key === 'lifeos_workspace/' + a + '/routine_active_focus_state') throw new Error('Cannot clear runtime yet');
    originalRemoveItem(key);
  };
  let closeFailed = false;
  try { await suspendFocusForWorkspace(databaseA, storageA, 'isolation-a', new Date('2026-11-01T10:15:00Z')); } catch { closeFailed = true; }
  raw.removeItem = originalRemoveItem;
  check('Account switching atomically saves focused time and queues it for the original owner before clearing runtime', closeFailed && (await databaseA.tasks.get(task.id))?.actualMinutes === 15 && (await databaseA.pendingSync.toArray())[0]?.data?.user_id === 'isolation-a' && (await databaseB.tasks.get(task.id))?.title === 'Private B');
  await suspendFocusForWorkspace(databaseA, storageA, 'isolation-a', new Date('2026-11-01T11:00:00Z'));
  check('Retrying account-switch focus cleanup never counts the other account time or duplicates sessions', (await databaseA.tasks.get(task.id))?.actualMinutes === 15 && (await databaseA.tasks.get(task.id))?.focusSessions?.length === 1 && JSON.parse(storageA.getItem('life_focus_sessions')!).length === 1 && storageA.getItem('routine_active_focus_state') === null);
  raw.setItem(ACTIVE_WORKSPACE_KEY, 'guest');
  const malicious = await importCompleteBackup(JSON.stringify({ version: 3, workspace: b, data: { tasks: [{ ...task, title: 'Wrong workspace' }] }, localData: { [ACTIVE_WORKSPACE_KEY]: b } }));
  check('A JSON import cannot switch the active account through its metadata or local data', !malicious.success && raw.getItem(ACTIVE_WORKSPACE_KEY) === 'guest' && !await db.tasks.get(task.id));
  legacy.close(); databaseA.close(); databaseB.close();
  return results;
}
