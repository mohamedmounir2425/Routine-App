import { type RoutineDatabase, type SyncBaseline, type SyncConflict } from './database';
import { SYNC_ENTITIES, entityKey, syncFingerprint, type SyncEntity, type SyncRow } from './syncEntities';
import { DEFAULT_USER_SETTINGS, INITIAL_WEEKLY_SCHEDULE } from './seedData';

export interface RemoteVersion { entity_table: string; entity_id: string; revision: number; deleted: boolean; last_operation_id?: string | null }
export interface CloudSnapshot { tables: Record<string, SyncRow[]>; versions: RemoteVersion[] }
export interface MutationReply { status: 'applied' | 'conflict'; revision: number; deleted: boolean; row: SyncRow | null }
export interface MutationRequest { table: string; id: string; action: 'upsert' | 'delete'; data: SyncRow | null; expectedRevision: number; operationId: string }
export interface VersionedTransport { snapshot(): Promise<CloudSnapshot>; mutate(request: MutationRequest): Promise<MutationReply> }

const operationId = () => globalThis.crypto.randomUUID();
const stores = (database: RoutineDatabase) => [...SYNC_ENTITIES.map(entity => database.table(entity.local)), database.syncBaselines, database.syncConflicts, database.pendingSync];
const payloadFingerprint = (row: SyncRow | null) => row ? syncFingerprint(row) : null;
export async function captureUnversionedRows(database: RoutineDatabase, uid: string) {
  await database.transaction('rw', stores(database), async () => {
    for (const entity of SYNC_ENTITIES) for (const row of await database.table(entity.local).toArray() as SyncRow[]) {
      if (entity.include && !entity.include(row)) continue;
      const payload = entity.toCloud(uid, row);
      const key = entityKey(entity.cloud, String(payload.id));
      if (!await database.syncBaselines.get(key)) await database.syncBaselines.put({ key, table: entity.cloud,
        entityId: String(payload.id), localKey: entity.localKey(row), revision: 0, deleted: false, fingerprint: syncFingerprint(payload) });
    }
  });
}
export async function countUnresolvedChanges(database: RoutineDatabase, uid: string) {
  return database.transaction('r', stores(database), async () => {
    const dirty = new Set((await database.pendingSync.where('userId').equals(uid).toArray()).map(item => entityKey(item.table, item.entityId)));
    for (const item of await database.syncConflicts.toArray()) dirty.add(item.key);
    const baselines = new Map((await database.syncBaselines.toArray()).map(item => [item.key, item]));
    const present = new Set<string>();
    for (const entity of SYNC_ENTITIES) for (const row of await database.table(entity.local).toArray() as SyncRow[]) {
      if (entity.include && !entity.include(row)) continue;
      const payload = entity.toCloud(uid, row), key = entityKey(entity.cloud, String(payload.id));
      present.add(key);
      const baseline = baselines.get(key);
      if (!baseline || baseline.revision === 0 || syncFingerprint(payload) !== baseline.fingerprint) dirty.add(key);
    }
    for (const baseline of baselines.values()) if (!baseline.deleted && baseline.fingerprint !== null && !present.has(baseline.key)) dirty.add(baseline.key);
    return dirty.size;
  });
}
function keyFor(entity: SyncEntity, id: string, local: SyncRow | undefined, remote: SyncRow | undefined, baseline?: SyncBaseline): string | number | undefined {
  if (local) return entity.localKey(local);
  if (remote) return entity.localKey(entity.fromCloud(remote));
  if (baseline?.localKey !== undefined) return baseline.localKey;
  if (entity.cloud === 'profiles') return 'current_settings';
  if (entity.cloud === 'weekly_schedule') return /_day_([0-6])$/.test(id) ? Number(id.slice(-1)) : undefined;
  if (entity.cloud === 'day_plans') return id.match(/_date_(\d{4}-\d{2}-\d{2})$/)?.[1];
  return id;
}
function pristineSeed(entity: SyncEntity, value: SyncRow, uid: string) {
  if (entity.cloud === 'profiles') return syncFingerprint(entity.toCloud(uid, value)) === syncFingerprint(entity.toCloud(uid, DEFAULT_USER_SETTINGS as unknown as SyncRow));
  if (entity.cloud === 'weekly_schedule') {
    const initial = INITIAL_WEEKLY_SCHEDULE.find(item => item.dayOfWeek === value.dayOfWeek);
    return !!initial && syncFingerprint(entity.toCloud(uid, value)) === syncFingerprint(entity.toCloud(uid, initial as unknown as SyncRow));
  }
  return false;
}

/** Full three-way reconciliation. Never pull over a changed local record. */
export async function synchronizeVersioned(database: RoutineDatabase, uid: string, transport: VersionedTransport) {
  let changedDuringSync = false;
  const failures: string[] = [];
  const local = await database.transaction('r', stores(database), async () => ({
    rows: Object.fromEntries(await Promise.all(SYNC_ENTITIES.map(async entity => [entity.cloud, await database.table(entity.local).toArray()] as const))),
    baselines: new Map((await database.syncBaselines.toArray()).map(item => [item.key, item])),
    pending: new Map((await database.pendingSync.where('userId').equals(uid).toArray()).map(item => [entityKey(item.table, item.entityId), item])),
  }));
  const snapshot = await transport.snapshot();
  if (!snapshot || !Array.isArray(snapshot.versions)) throw new Error('الخادم يحتاج تحديث بروتوكول المزامنة.');
  const versions = new Map(snapshot.versions.map(item => [entityKey(item.entity_table, item.entity_id), { ...item, revision: Number(item.revision) }]));
  for (const entity of SYNC_ENTITIES) if (!Array.isArray(snapshot.tables[entity.cloud])) throw new Error('استجابة ناقصة من ' + entity.cloud);
  // Parents before milestones/tasks. Deletion cascades are acknowledged safely by the server.
  const order = ['profiles','custom_routines','weekly_schedule','workout_logs','azkar_logs','projects','plans','plan_milestones','life_tasks','workout_schedules','day_plans'];
  for (const name of order) {
    const entity = SYNC_ENTITIES.find(item => item.cloud === name)!;
    const localRows = new Map<string, SyncRow>((local.rows[name] as SyncRow[]).filter(row => !entity.include || entity.include(row)).map(row => [String(entity.toCloud(uid, row).id), row]));
    const remoteRows = new Map(snapshot.tables[name].map(row => [String(row.id), row]));
    const ids = new Set([...localRows.keys(), ...remoteRows.keys(), ...[...local.baselines.values()].filter(item => item.table === name).map(item => item.entityId), ...snapshot.versions.filter(item => item.entity_table === name).map(item => item.entity_id), ...[...local.pending.values()].filter(item => item.table === name).map(item => item.entityId)]);
    for (const id of ids) {
      const key = entityKey(name, id);
      const localRow = localRows.get(id);
      const localPayload = localRow ? entity.toCloud(uid, localRow) : null;
      const localFp = payloadFingerprint(localPayload);
      const remoteRow = remoteRows.get(id);
      const version = versions.get(key);
      let baseline = local.baselines.get(key);
      if (remoteRow && (!version || version.deleted) || !version && baseline && baseline.revision > 0) throw new Error('بيانات النسخ غير متسقة؛ لم نستبدل نسخ الجهاز.');
      const remoteRevision = version?.revision ?? 0;
      const remoteDeleted = version?.deleted ?? !remoteRow;
      const remotePayload = remoteRow ? entity.toCloud(uid, entity.fromCloud(remoteRow, localRow)) : null;
      const remoteFp = payloadFingerprint(remotePayload);
      const pending = local.pending.get(key);
      // Recover a lost acknowledgement before considering later local edits a conflict.
      if (pending?.operationId && version?.last_operation_id === pending.operationId) baseline = { key, table: name, entityId: id, revision: remoteRevision, deleted: remoteDeleted, fingerprint: remoteFp };
      const localKey = keyFor(entity, id, localRow, remoteRow, baseline);
      const latestFingerprint = async () => {
        const current = localKey === undefined ? undefined : await database.table(entity.local).get(localKey) as SyncRow | undefined;
        return current && (!entity.include || entity.include(current)) ? syncFingerprint(entity.toCloud(uid, current)) : null;
      };
      const saveAlignment = async (reply: MutationReply, overwrite: boolean, sentFp = localFp) => {
        await database.transaction('rw', stores(database), async () => {
          const currentFp = await latestFingerprint();
          if (overwrite && currentFp !== localFp) { changedDuringSync = true; return; }
          if (overwrite && localKey !== undefined) {
            if (reply.deleted || !reply.row) await database.table(entity.local).delete(localKey);
            else await database.table(entity.local).put(entity.fromCloud(reply.row, localRow));
          }
          const alignedFp = overwrite && reply.row ? syncFingerprint(entity.toCloud(uid, entity.fromCloud(reply.row, localRow))) : sentFp;
          await database.syncBaselines.put({ key, table: name, entityId: id, localKey,
            revision: reply.revision, deleted: reply.deleted, fingerprint: reply.deleted ? null : alignedFp });
          const queued = await database.pendingSync.where('[userId+table+entityId]').equals([uid, name, id]).toArray();
          for (const item of queued) {
            if (currentFp === sentFp || pending?.operationId && item.operationId === pending.operationId) await database.pendingSync.delete(item.id!);
          }
          if (currentFp === localFp) await database.syncConflicts.delete(key);
          else changedDuringSync = true;
        });
      };
      const conflict = async (reply: MutationReply) => {
        await database.transaction('rw', stores(database), async () => {
          const current = localKey === undefined ? undefined : await database.table(entity.local).get(localKey) as SyncRow | undefined;
          await database.syncConflicts.put({ key, table: name, entityId: id,
            local: current ? entity.toCloud(uid, current) : null, remote: reply.row,
            remoteRevision: reply.revision, remoteDeleted: reply.deleted, detectedAt: new Date().toISOString() });
        });
      };
      if (localPayload && baseline?.deleted && !baseline.allowRestore) {
        await conflict({ status: 'conflict', revision: remoteRevision, deleted: remoteDeleted, row: remoteRow ?? null });
        continue;
      }
      if (localFp === remoteFp && !(localFp === null && !version && (pending || baseline?.fingerprint))) {
        // Upgrade legacy task metadata using CAS rather than silently losing local-only fields.
        if (!(localPayload && (name === 'life_tasks' && Number(remoteRow?.client_data_version ?? 0) < 1 || name === 'profiles' && remoteRow?.today_preferences === null && localPayload.today_preferences !== null))) {
          await saveAlignment({ status: 'applied', revision: remoteRevision, deleted: remoteDeleted, row: remoteRow ?? null }, false);
          continue;
        }
      } else {
        const unknown = !baseline || baseline.revision === 0;
        const localDirty = !baseline || localFp !== baseline.fingerprint;
        const remoteDirty = !baseline || remoteRevision !== baseline.revision;
        if ((!localDirty && !unknown) || unknown && !pending && (!localRow && !baseline || localRow && pristineSeed(entity, localRow, uid) && !!version)) {
          await saveAlignment({ status: 'applied', revision: remoteRevision, deleted: remoteDeleted, row: remoteRow ?? null }, true);
          continue;
        }
        if (remoteDirty && (remoteRow || version?.deleted) && (unknown || localDirty)) {
          await conflict({ status: 'conflict', revision: remoteRevision, deleted: remoteDeleted, row: remoteRow ?? null });
          continue;
        }
      }
      if (!localPayload && !pending && !baseline && !version) continue;
      const request: MutationRequest = { table: name, id, action: localPayload ? 'upsert' : 'delete', data: localPayload,
        expectedRevision: baseline && baseline.revision > 0 ? baseline.revision : remoteRevision,
        operationId: pending?.operationId && payloadFingerprint(pending.data) === localFp && pending.expectedRevision === (baseline?.revision ?? remoteRevision) ? pending.operationId : operationId() };
      let queuedId: number | undefined;
      await database.transaction('rw', stores(database), async () => {
        if (await latestFingerprint() !== localFp) { changedDuringSync = true; return; }
        const current = await database.pendingSync.where('[userId+table+entityId]').equals([uid, name, id]).first();
        queuedId = await database.pendingSync.put({ ...current, userId: uid, table: name as import('./database').PendingSyncItem['table'], entityId: id,
          action: request.action, data: request.data, expectedRevision: request.expectedRevision, operationId: request.operationId,
          timestamp: new Date().toISOString(), status: 'pending', retryCount: current?.retryCount ?? 0 });
      });
      if (queuedId === undefined) continue;
      try {
        const reply = await transport.mutate(request);
        if (reply.status === 'conflict') await conflict(reply);
        else {
          // Server acknowledgement is a new baseline, even if the user edited again in-flight.
          await database.transaction('rw', stores(database), async () => {
            const currentFp = await latestFingerprint();
            await database.syncBaselines.put({ key, table: name, entityId: id, localKey, revision: Number(reply.revision), deleted: reply.deleted, fingerprint: reply.deleted ? null : localFp });
            const queued = await database.pendingSync.get(queuedId!);
            if (queued?.operationId === request.operationId) await database.pendingSync.delete(queuedId!);
            if (currentFp === localFp) {
              if (reply.row && localKey !== undefined) await database.table(entity.local).put(entity.fromCloud(reply.row, localRow));
              await database.syncConflicts.delete(key);
            } else changedDuringSync = true;
          });
        }
      } catch (error) {
        failures.push(error instanceof Error ? error.message : 'تعذر رفع تعديل');
        await database.transaction('rw', database.pendingSync, async () => {
          const current = await database.pendingSync.get(queuedId!);
          if (current?.operationId === request.operationId) await database.pendingSync.put({ ...current, status: 'failed', retryCount: current.retryCount + 1, lastError: failures[failures.length - 1] });
        });
      }
    }
  }
  const conflicts = await database.syncConflicts.count();
  const queued = await countUnresolvedChanges(database, uid);
  return { success: !conflicts && !queued && !failures.length && !changedDuringSync,
    error: conflicts ? 'يوجد ' + conflicts + ' تعارض. راجع النسختين من الإعدادات.' : failures[0] ?? (queued || changedDuringSync ? 'توجد تعديلات جديدة لم تكتمل مزامنتها؛ أعد المحاولة.' : undefined) };
}

export async function resolveSyncConflict(database: RoutineDatabase, uid: string, key: string, choice: 'local' | 'remote') {
  await database.transaction('rw', stores(database), async () => {
    const conflict: SyncConflict | undefined = await database.syncConflicts.get(key);
    if (!conflict) return;
    const entity = SYNC_ENTITIES.find(item => item.cloud === conflict.table)!;
    const baseline = await database.syncBaselines.get(key);
    const localKey = keyFor(entity, conflict.entityId, conflict.local ? entity.fromCloud(conflict.local) : undefined, conflict.remote ?? undefined, baseline);
    const current = localKey === undefined ? undefined : await database.table(entity.local).get(localKey) as SyncRow | undefined;
    if (payloadFingerprint(current ? entity.toCloud(uid, current) : null) !== payloadFingerprint(conflict.local)) throw new Error('اتعدلت نسخة الجهاز بعد عرض التعارض. اعمل مزامنة وراجع النسخة الجديدة.');
    const remoteLocal = conflict.remote ? entity.fromCloud(conflict.remote, current) : null;
    if (choice === 'remote' && localKey !== undefined) {
      if (remoteLocal) await database.table(entity.local).put(remoteLocal);
      else await database.table(entity.local).delete(localKey);
    }
    await database.syncBaselines.put({ key, table: conflict.table, entityId: conflict.entityId, localKey,
      revision: conflict.remoteRevision, deleted: conflict.remoteDeleted,
      allowRestore: choice === 'local' && conflict.remoteDeleted,
      fingerprint: remoteLocal ? syncFingerprint(entity.toCloud(uid, remoteLocal)) : null });
    const pending = await database.pendingSync.where('[userId+table+entityId]').equals([uid, conflict.table, conflict.entityId]).toArray();
    for (const item of pending) await database.pendingSync.delete(item.id!);
    await database.syncConflicts.delete(key);
  });
}
