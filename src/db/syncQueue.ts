import { db, type PendingSyncItem } from './database';
import { syncErrorMessage } from './cloudSyncChecks';

export type PendingMutation = Omit<PendingSyncItem, 'id' | 'retryCount' | 'status'>;

/** Scope and squash atomically; never collapse two accounts' operations. */
export async function queueMutation(item: PendingMutation, isCreatedOffline = false, database = db) {
  await database.transaction('rw', database.pendingSync, async () => {
    const existing = await database.pendingSync.where('[userId+table+entityId]')
      .equals([item.userId, item.table, item.entityId]).first();
    const next = { ...item, retryCount: 0, status: 'pending' as const,
      nextRetryAt: undefined, lastError: undefined,
      isCreatedOffline: item.isCreatedOffline ?? isCreatedOffline };
    // Keep deletion intentions even if an earlier create may have reached the server.
    // Cancelling them based on navigator.onLine could resurrect remote records.
    await database.pendingSync.put({ ...next, ...(existing ? { id: existing.id } : {}) });
  });
}

export async function pendingMutationCount(userId: string) {
  // Failed and backed-off operations are still unsynced data.
  return db.pendingSync.where('userId').equals(userId).count();
}

export async function retryFailedMutations(userId: string) {
  await db.pendingSync.where('userId').equals(userId).modify(item => {
    item.status = 'pending';
    item.retryCount = 0;
    delete item.nextRetryAt;
    delete item.lastError;
  });
}

/** Transport runs outside the local transaction. Ack only the exact sent revision. */
export async function processSyncQueue(
  userId: string,
  send: (item: PendingSyncItem) => Promise<void>,
  now = Date.now(),
) {
  const queue = await db.pendingSync.where('userId').equals(userId)
    .and(item => item.status === 'pending' && (!item.nextRetryAt || item.nextRetryAt <= now)).toArray();
  let processed = 0;
  let failed = 0;
  for (const item of queue) {
    // Another tab/process may already have replaced this operation.
    const before = await db.pendingSync.get(item.id!);
    if (JSON.stringify(before) !== JSON.stringify(item)) continue;
    let error: unknown;
    let didFail = false;
    try { await send(item); } catch (cause) { error = cause; didFail = true; }
    await db.transaction('rw', db.pendingSync, async () => {
      const current = await db.pendingSync.get(item.id!);
      if (JSON.stringify(current) !== JSON.stringify(item)) return;
      if (!didFail) {
        await db.pendingSync.delete(item.id!);
        processed++;
      } else {
        const retries = item.retryCount + 1;
        await db.pendingSync.put({ ...item, retryCount: retries,
          status: retries >= 3 ? 'failed' : 'pending',
          nextRetryAt: retries >= 3 ? undefined : now + 2 ** retries * 1000,
          lastError: syncErrorMessage(error) });
        failed++;
      }
    });
  }
  return { processed, failed };
}
