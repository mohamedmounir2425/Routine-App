import { db, type RoutineDatabase } from '../../../db/database';
import { CURRENT_WORKSPACE, workspaceGuard } from '../../../db/workspaceScope';
import { entityKey, SYNC_ENTITIES, syncFingerprint } from '../../../db/syncEntities';
import { cleanInventory, type InventoryItem, type InventoryDraft, type InventoryMode } from './inventoryModel';
const ownerId = () => CURRENT_WORKSPACE === 'guest' ? null : CURRENT_WORKSPACE.slice(5);
function guard(database: RoutineDatabase) { if (database === db && CURRENT_WORKSPACE !== 'guest') workspaceGuard.assertAccount(CURRENT_WORKSPACE.slice(5)); }
async function queue(database: RoutineDatabase, row: InventoryItem, owner: string | null, action: 'upsert' | 'delete') {
  if (!owner) return;
  const payload = SYNC_ENTITIES.find(entity => entity.cloud === 'inventory_items')!.toCloud(owner, row as unknown as Record<string, unknown>);
  const key = entityKey('inventory_items', row.id);
  if (!await database.syncBaselines.get(key)) await database.syncBaselines.put({ key, table: 'inventory_items', entityId: row.id, localKey: row.id, revision: 0, deleted: false, fingerprint: syncFingerprint(payload) });
  await database.pendingSync.where('[userId+table+entityId]').equals([owner, 'inventory_items', row.id]).delete();
  await database.pendingSync.add({ table: 'inventory_items', entityId: row.id, userId: owner, action, data: action === 'upsert' ? payload : null, timestamp: new Date().toISOString(), retryCount: 0, status: 'pending' });
}
export interface InventoryChange { draft: InventoryDraft; original?: InventoryItem; mode: InventoryMode }
export async function saveInventoryBatch(changes: InventoryChange[], database = db, owner = ownerId()) {
  if (!changes.length || changes.length > 500) throw new Error('أضف من صنف واحد إلى ٥٠٠ صنف في الدفعة.');
  const ids = changes.flatMap(change => change.original ? [change.original.id] : []);
  if (new Set(ids).size !== ids.length) throw new Error('نفس الصنف مكرر في المعاينة؛ راجع الصفوف قبل الحفظ.');
  const cleaned = changes.map(change => ({ ...change, draft: cleanInventory(change.draft) }));
  const result: InventoryItem[] = [];
  await database.transaction('rw', [database.inventoryItems, database.pendingSync, database.syncBaselines], async () => {
    guard(database);
    for (const { draft, original, mode } of cleaned) {
      if (original && syncFingerprint(await database.inventoryItems.get(original.id)) !== syncFingerprint(original)) throw new Error(`تغير الصنف «${original.name}» أثناء المراجعة. افتح أحدث نسخة قبل الحفظ.`);
      if (mode === 'purchase' && (draft.quantity === null || draft.quantity <= 0 || original && (original.quantity === null || original.unit !== draft.unit))) throw new Error('لإضافة مشتريات، يلزم مقدار موجب ووحدة مطابقة وكمية سابقة معروفة. استخدم الجرد لتحديد الموجود إذا كانت الكمية مجهولة.');
      if (mode === 'purchase' && original && (original.location !== draft.location || original.expiresOn !== draft.expiresOn)) throw new Error('أضف سجلًا مستقلًا للمشتريات ذات المكان أو الصلاحية المختلفة حتى لا تندمج دفعات مختلفة.');
      const now = new Date().toISOString();
      const quantity = mode === 'purchase' && original ? Number((original.quantity! + draft.quantity!).toFixed(6)) : draft.quantity;
      if (quantity !== null && quantity > 100000000) throw new Error('الكمية النهائية أكبر من الحد المسموح.');
      const delta = original?.quantity !== null && original?.quantity !== undefined && quantity !== null && original.unit === draft.unit ? Number((quantity - original.quantity).toFixed(6)) : null;
      const row: InventoryItem = { ...draft, quantity, state: quantity === 0 ? 'out' : quantity !== null && draft.state !== 'low' ? 'available' : draft.state, id: original?.id ?? crypto.randomUUID(), createdAt: original?.createdAt ?? now, updatedAt: now, lastCountedAt: mode === 'count' ? now : original?.lastCountedAt ?? null, history: [...(original?.history ?? []), { id: crypto.randomUUID(), at: now, kind: mode, before: original?.quantity ?? null, after: quantity, unit: draft.unit, delta, note: draft.notes }] };
      await database.inventoryItems.put(row); await queue(database, row, owner, 'upsert'); result.push(row);
    }
  });
  return result;
}
export async function deleteInventory(original: InventoryItem, database = db, owner = ownerId()) {
  await database.transaction('rw', [database.inventoryItems, database.pendingSync, database.syncBaselines], async () => { guard(database); if (syncFingerprint(await database.inventoryItems.get(original.id)) !== syncFingerprint(original)) throw new Error('تغير الصنف. افتح أحدث نسخة قبل الحذف.'); await queue(database, original, owner, 'delete'); await database.inventoryItems.delete(original.id); });
}
