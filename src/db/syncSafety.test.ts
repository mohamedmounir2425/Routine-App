import type { SupabaseClient } from '@supabase/supabase-js';
import { db, type PendingSyncItem } from './database';
import { CLOUD_SYNC_TABLES, fetchCloudSnapshot } from './cloudSyncChecks';
import { queueMutation, processSyncQueue, pendingMutationCount, retryFailedMutations } from './syncQueue';
import { pullUserDataFromCloud, pushLocalDataToCloud } from './syncEngine';
import type { LifeTask } from '../types';

type Row = Record<string, unknown>;
function fakeClient(rows: Record<string, Row[]>, failure?: string, onRead?: (table: string) => Promise<void>) {
  const writes: string[] = [];
  const reads: string[] = [];
  const client = { from(table: string) {
    const query = {
      select() { return query; }, eq() { return query; }, order() { return query; },
      async range(start: number, end: number) {
        reads.push(table);
        await onRead?.(table);
        return { data: (rows[table] || []).slice(start, end + 1), error: table === failure ? { message: 'Simulated server rejection' } : null };
      },
      upsert() { writes.push(table); return query; },
      async throwOnError() {
        if (table === failure) throw new Error('Simulated write rejection');
        return { data: null, error: null };
      },
    };
    return query;
  } } as unknown as SupabaseClient;
  return { client, writes, reads };
}

export async function runSyncSafetyTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  await db.transaction('rw', db.tables, async () => { for (const table of db.tables) await table.clear(); });
  const mutation = (userId: string, title: string): Omit<PendingSyncItem, 'id' | 'status' | 'retryCount'> => ({
    userId, table: 'life_tasks', entityId: 'shared-id', action: 'upsert', data: { title }, timestamp: '2026-11-01T10:00:00Z',
  });
  await Promise.all([queueMutation(mutation('account-a', 'A')), queueMutation(mutation('account-b', 'B'))]);
  check('Queue indexes support per-account reads without losing another account mutation', await pendingMutationCount('account-a') === 1 && await pendingMutationCount('account-b') === 1);
  await queueMutation(mutation('account-a', 'A2'));
  check('Atomic squashing updates only the matching account and entity', (await db.pendingSync.toArray()).length === 2 && (await db.pendingSync.where('userId').equals('account-b').first())?.data?.title === 'B');
  const sent: string[] = [];
  await processSyncQueue('account-a', async item => { sent.push(item.userId); });
  check('Flushing one account never sends or deletes another account data', sent.join() === 'account-a' && await pendingMutationCount('account-a') === 0 && await pendingMutationCount('account-b') === 1);
  await processSyncQueue('account-b', async () => { await queueMutation(mutation('account-b', 'Edited during upload')); });
  check('An in-flight acknowledgement cannot remove a newer local edit', await pendingMutationCount('account-b') === 1 && (await db.pendingSync.where('userId').equals('account-b').first())?.data?.title === 'Edited during upload');
  await processSyncQueue('account-b', async () => { await queueMutation(mutation('account-b', 'Newer edit despite old failure')); throw new Error('Old request failed'); });
  check('An old failed upload cannot replace newer queued data', (await db.pendingSync.where('userId').equals('account-b').first())?.retryCount === 0);
  for (let i = 0; i < 3; i++) await processSyncQueue('account-b', async () => { throw new Error('Offline'); }, Date.now() + i * 100000);
  check('Failed mutations remain visible as unsynced after max retries', await pendingMutationCount('account-b') === 1 && (await db.pendingSync.where('userId').equals('account-b').first())?.status === 'failed');
  await retryFailedMutations('account-b');
  check('Manual retry reactivates failed mutations without discarding payloads', (await db.pendingSync.where('userId').equals('account-b').first())?.status === 'pending');
  await db.pendingSync.clear();
  await queueMutation({ ...mutation('account-a', 'Created'), isCreatedOffline: true });
  await queueMutation({ ...mutation('account-a', ''), action: 'delete', data: null });
  check('Create-then-delete retains a deletion intent instead of risking resurrection', (await db.pendingSync.toArray())[0]?.action === 'delete');

  await db.pendingSync.clear();
  const task: LifeTask = { id: 'local-task', title: 'Keep local', spaceId: 'home', priority: 'medium', isCompleted: false, createdAt: '2026-11-01T10:00:00Z' };
  await db.tasks.put(task);
  const remoteTask = { id: task.id, title: 'Remote value', space_id: 'home', priority: 'medium', is_completed: false, created_at: task.createdAt };
  const missing = fakeClient({ life_tasks: [remoteTask] }, 'projects');
  const rejected = await pullUserDataFromCloud('account-a', missing.client);
  check('Missing required remote table reports failure before changing any local record', !rejected.success && rejected.error?.includes('projects') === true && (await db.tasks.get(task.id))?.title === 'Keep local');
  const invalid = fakeClient({ life_tasks: [remoteTask], projects: [{ title: 'Missing primary key', steps: [] }] });
  const rolledBack = await pullUserDataFromCloud('account-a', invalid.client);
  check('A malformed later dataset rolls back all earlier local pull writes', !rolledBack.success && (await db.tasks.get(task.id))?.title === 'Keep local');
  await queueMutation(mutation('account-a', 'Unsent local'));
  const blockedClient = fakeClient({ life_tasks: [remoteTask] });
  const blocked = await pullUserDataFromCloud('account-a', blockedClient.client);
  check('Outstanding local mutations block pull before any cloud reads', !blocked.success && blockedClient.reads.length === 0 && (await db.tasks.get(task.id))?.title === 'Keep local');
  await db.pendingSync.clear();
  const duringRead = fakeClient({ life_tasks: [remoteTask] }, undefined, async table => {
    if (table === 'life_tasks') await db.tasks.update(task.id, { title: 'Edited during read' });
  });
  const concurrentPull = await pullUserDataFromCloud('account-a', duringRead.client);
  check('Edits made during the cloud read are retained and force a retry', !concurrentPull.success && (await db.tasks.get(task.id))?.title === 'Edited during read');
  const failedPush = fakeClient({}, 'life_tasks');
  const pushed = await pushLocalDataToCloud('account-a', failedPush.client);
  check('Rejected bulk uploads cannot report successful synchronization', !pushed.success && failedPush.writes.includes('life_tasks'));
  const failedProjects = fakeClient({}, 'projects');
  await db.projects.put({ id: 'project', title: 'Project', status: 'backlog', steps: [], createdAt: task.createdAt });
  const projectsResult = await pushLocalDataToCloud('account-a', failedProjects.client);
  check('Project upload errors are propagated instead of swallowed', !projectsResult.success);
  const full = fakeClient({ life_tasks: Array.from({ length: 1001 }, (_, i) => ({ id: String(i) })) });
  const snapshot = await fetchCloudSnapshot(full.client, 'account-a');
  check('Paged cloud reads include more than the default thousand-row limit', snapshot.life_tasks.length === 1001 && full.reads.filter(name => name === 'life_tasks').length === 3);
  check('Preflight checks every required cloud table', CLOUD_SYNC_TABLES.every(table => full.reads.includes(table)));
  return results;
}
