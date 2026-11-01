import { RoutineDatabase } from './database';
import { SYNC_ENTITIES, entityKey, type SyncRow } from './syncEntities';
import { captureUnversionedRows, resolveSyncConflict, synchronizeVersioned, type VersionedTransport, type MutationRequest, type MutationReply } from './versionedSync';
import type { LifeTask } from '../types';
import { emptyRecipe } from '../features/home/recipes/recipeModel';
import { saveRecipe, deleteRecipe } from '../features/home/recipes/recipeRepository';

function fakeCloud() {
  const records = new Map<string, { row: SyncRow | null; revision: number; deleted: boolean; last_operation_id: string }>();
  let before: ((request: MutationRequest) => Promise<void>) | undefined;
  let after: (() => Promise<void>) | undefined;
  let failAcknowledgement = false;
  let writes = 0;
  const transport: VersionedTransport = {
    async snapshot() {
      const tables = Object.fromEntries(SYNC_ENTITIES.map(entity => [entity.cloud, [] as SyncRow[]]));
      const versions = [...records].map(([key, item]) => {
        const split = key.indexOf(':');
        const table = key.slice(0, split), id = key.slice(split + 1);
        if (item.row) tables[table].push(structuredClone(item.row));
        return { entity_table: table, entity_id: id, revision: item.revision, deleted: item.deleted, last_operation_id: item.last_operation_id };
      });
      return { tables, versions };
    },
    async mutate(request) {
      const intercept = before; before = undefined; if (intercept) await intercept(request);
      const key = entityKey(request.table, request.id), current = records.get(key);
      const reply = (status: MutationReply['status']): MutationReply => ({ status, revision: records.get(key)?.revision ?? 0, deleted: records.get(key)?.deleted ?? true, row: structuredClone(records.get(key)?.row ?? null) });
      if (current?.last_operation_id === request.operationId || request.action === 'delete' && current?.deleted) return reply('applied');
      if ((current?.revision ?? 0) !== request.expectedRevision) return reply('conflict');
      writes++;
      records.set(key, { row: request.data ? structuredClone(request.data) : null, revision: (current?.revision ?? 0) + 1, deleted: request.action === 'delete', last_operation_id: request.operationId });
      if (request.action === 'delete' && ['projects', 'plans'].includes(request.table)) {
        for (const [childKey, child] of records) if (child.row && (request.table === 'projects' ? child.row.project_id === request.id : child.row.plan_id === request.id)) records.set(childKey, { row: null, deleted: true, revision: child.revision + 1, last_operation_id: request.operationId });
      }
      const callback = after; after = undefined; if (callback) await callback();
      if (failAcknowledgement) { failAcknowledgement = false; throw new Error('Acknowledgement lost'); }
      return reply('applied');
    },
  };
  return { transport, records, before: (hook: typeof before) => { before = hook; }, after: (hook: typeof after) => { after = hook; }, loseAck: () => { failAcknowledgement = true; }, writes: () => writes };
}

export async function runVersionedSyncTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  let serial = 0;
  const fixture = async () => {
    const a = new RoutineDatabase('version-test-a-' + serial), b = new RoutineDatabase('version-test-b-' + serial++);
    await a.open(); await b.open();
    const cloud = fakeCloud();
    return { a, b, cloud, syncA: () => synchronizeVersioned(a, 'owner', cloud.transport), syncB: () => synchronizeVersioned(b, 'owner', cloud.transport) };
  };
  const task: LifeTask = { id: 'task', title: 'Original', spaceId: 'work', priority: 'medium', isCompleted: false, createdAt: '2026-11-01T10:00:00Z' };
  const key = entityKey('life_tasks', task.id);
  {
    const f = await fixture();
    await f.a.tasks.put(task);
    const up = await f.syncA(); const down = await f.syncB();
    check('Versioned sync creates a record once and a second device reads it', up.success && down.success && (await f.b.tasks.get(task.id))?.title === 'Original' && f.cloud.writes() === 1);
    await f.a.tasks.update(task.id, { title: 'Offline A' });
    await f.b.tasks.update(task.id, { title: 'Offline B' });
    await f.syncA(); const conflict = await f.syncB();
    check('Offline edits made without a session callback are discovered and conflicting copies are preserved', !conflict.success && (await f.b.tasks.get(task.id))?.title === 'Offline B' && f.cloud.records.get(key)?.row?.title === 'Offline A' && (await f.b.syncConflicts.get(key))?.remote?.title === 'Offline A');
    await resolveSyncConflict(f.b, 'owner', key, 'local'); await f.syncB();
    check('Choosing the local copy performs an explicit version-checked overwrite', f.cloud.records.get(key)?.row?.title === 'Offline B' && await f.b.syncConflicts.count() === 0);
    await f.a.tasks.update(task.id, { title: 'Changed during review' }); await f.syncA();
    let protectedEdit = false;
    await f.a.tasks.update(task.id, { title: 'Newer than displayed conflict' });
    try { await resolveSyncConflict(f.a, 'owner', key, 'remote'); } catch { protectedEdit = true; }
    check('Conflict resolution cannot discard edits made after the comparison opened', protectedEdit && (await f.a.tasks.get(task.id))?.title === 'Newer than displayed conflict');
    f.a.close(); f.b.close();
  }
  {
    const f = await fixture(); await f.a.tasks.put(task); await f.syncA(); await f.syncB();
    await f.a.tasks.update(task.id, { title: 'A race' });
    f.cloud.before(async () => { await f.b.tasks.update(task.id, { title: 'B wins race' }); await f.syncB(); });
    const raced = await f.syncA();
    check('Server CAS catches a remote edit that arrives after the client snapshot', !raced.success && f.cloud.records.get(key)?.row?.title === 'B wins race' && (await f.a.tasks.get(task.id))?.title === 'A race');
    await resolveSyncConflict(f.a, 'owner', key, 'remote');
    check('Choosing the cloud version resolves the local copy without another cloud write', (await f.a.tasks.get(task.id))?.title === 'B wins race');
    f.a.close(); f.b.close();
  }
  {
    const f = await fixture(); await f.a.tasks.put(task); await f.syncA(); await f.syncB();
    await f.a.tasks.delete(task.id); await f.syncA(); await f.syncB();
    check('A delete is propagated and retained as a tombstone on the second device', !await f.b.tasks.get(task.id) && f.cloud.records.get(key)?.deleted === true && (await f.b.syncBaselines.get(key))?.deleted === true);
    await f.b.tasks.put(task); const stale = await f.syncB();
    check('Restoring stale data from an old backup cannot silently resurrect a deleted item', !stale.success && f.cloud.records.get(key)?.deleted === true && await f.b.syncConflicts.count() === 1);
    await resolveSyncConflict(f.b, 'owner', key, 'local'); const restored = await f.syncB();
    check('Deleted data is restored only after an explicit local-copy choice', restored.success && f.cloud.records.get(key)?.deleted === false);
    f.a.close(); f.b.close();
  }
  {
    const f = await fixture(); await f.a.tasks.put(task); await f.syncA(); await f.syncB();
    await f.a.tasks.delete(task.id); await f.b.tasks.update(task.id, { title: 'Offline work worth keeping' });
    await f.syncA(); const result = await f.syncB();
    check('Remote deletion versus an offline edit is reviewed rather than deleting the offline edit', !result.success && (await f.b.tasks.get(task.id))?.title === 'Offline work worth keeping' && (await f.b.syncConflicts.get(key))?.remoteDeleted === true);
    f.a.close(); f.b.close();
  }
  {
    const f = await fixture(); await f.a.tasks.put(task); await f.syncA();
    await f.a.tasks.update(task.id, { title: 'Sent once' });
    f.cloud.after(async () => { await f.a.tasks.update(task.id, { title: 'Edited while sending' }); });
    await f.syncA(); await f.syncA();
    check('An acknowledgement advances the baseline without overwriting a newer in-flight local edit', f.cloud.records.get(key)?.row?.title === 'Edited while sending' && (await f.a.tasks.get(task.id))?.title === 'Edited while sending');
    await f.a.tasks.update(task.id, { title: 'Applied but ack lost' }); f.cloud.loseAck(); await f.syncA();
    await f.a.tasks.update(task.id, { title: 'After lost ack' }); const recovered = await f.syncA();
    check('A lost acknowledgement is recognized by operation ID and later edits are not falsely overwritten', recovered.success && f.cloud.records.get(key)?.row?.title === 'After lost ack' && await f.a.pendingSync.count() === 0);
    f.a.close(); f.b.close();
  }
  {
    const f = await fixture(); await f.a.tasks.put(task); await f.syncA();
    await f.b.tasks.put(task); await captureUnversionedRows(f.b, 'owner'); await f.b.tasks.delete(task.id);
    const result = await f.syncB();
    check('An offline delete before the first versioned sync remains a deletion intent', !result.success && !await f.b.tasks.get(task.id) && (await f.b.syncConflicts.get(key))?.local === null);
    await resolveSyncConflict(f.b, 'owner', key, 'local'); await f.syncB();
    check('Confirming an unversioned deletion creates the server tombstone', f.cloud.records.get(key)?.deleted === true);
    f.a.close(); f.b.close();
  }
  {
    const f = await fixture();
    await f.a.projects.put({ id: 'project', title: 'Project', status: 'in_progress', steps: [], createdAt: task.createdAt });
    await f.a.tasks.put({ ...task, projectId: 'project' }); await f.syncA(); await f.syncB();
    await f.a.projects.delete('project'); await f.a.tasks.delete(task.id); await f.syncA(); await f.syncB();
    check('Parent deletion cascades to tasks and a second device cannot re-upload the deleted children', !await f.b.projects.get('project') && !await f.b.tasks.get(task.id) && f.cloud.records.get(key)?.deleted === true);
    f.a.close(); f.b.close();
  }
  {
    const f = await fixture();
    const recipe = await saveRecipe({ ...emptyRecipe(), title: 'فطار الشغل', mealTypes: ['breakfast', 'sandwich'], ingredients: [{ name: 'جبنة', quantity: 'شريحة' }], steps: ['نجهز السندوتشات'] }, undefined, f.a, 'owner');
    const up = await f.syncA(), down = await f.syncB();
    check('Recipes sync offline creation and full details to a second device', up.success && down.success && (await f.b.recipes.get(recipe.id))?.steps[0] === 'نجهز السندوتشات' && (await f.b.recipes.get(recipe.id))?.durationMinutes === null);
    await f.a.recipes.update(recipe.id, { notes: 'نسخة الجهاز الأول' });
    await f.b.recipes.update(recipe.id, { notes: 'نسخة الجهاز الثاني' });
    await f.syncA(); const conflict = await f.syncB();
    check('Concurrent recipe edits preserve both copies for explicit review', !conflict.success && (await f.b.syncConflicts.get('recipes:' + recipe.id))?.remote?.notes === 'نسخة الجهاز الأول' && (await f.b.recipes.get(recipe.id))?.notes === 'نسخة الجهاز الثاني');
    await resolveSyncConflict(f.b, 'owner', 'recipes:' + recipe.id, 'remote');
    await deleteRecipe((await f.a.recipes.get(recipe.id))!, f.a, 'owner'); await f.syncA(); await f.syncB();
    check('Recipe deletion propagates without resurrecting another device copy', !await f.b.recipes.get(recipe.id) && f.cloud.records.get('recipes:' + recipe.id)?.deleted === true);
    f.a.close(); f.b.close();
  }
  return results;
}
