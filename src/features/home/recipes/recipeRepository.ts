import { db, type RoutineDatabase } from '../../../db/database';
import { CURRENT_WORKSPACE, workspaceGuard } from '../../../db/workspaceScope';
import { SYNC_ENTITIES, entityKey, syncFingerprint } from '../../../db/syncEntities';
import { cleanRecipeDraft, type Recipe, type RecipeDraft } from './recipeModel';

function assertCurrent(database: RoutineDatabase) {
  if (database === db && CURRENT_WORKSPACE !== 'guest') workspaceGuard.assertAccount(CURRENT_WORKSPACE.slice(5));
}
async function queue(database: RoutineDatabase, row: Recipe, action: 'upsert' | 'delete', owner: string | null) {
  if (!owner) return;
  const payload = SYNC_ENTITIES.find(entity => entity.cloud === 'recipes')!.toCloud(owner, row as unknown as Record<string, unknown>);
  const key = entityKey('recipes', row.id);
  if (!await database.syncBaselines.get(key)) await database.syncBaselines.put({ key, table: 'recipes', entityId: row.id, localKey: row.id, revision: 0, deleted: false, fingerprint: syncFingerprint(payload) });
  await database.pendingSync.where('[userId+table+entityId]').equals([owner, 'recipes', row.id]).delete();
  await database.pendingSync.add({ table: 'recipes', entityId: row.id, userId: owner, action, data: action === 'upsert' ? payload : null, timestamp: new Date().toISOString(), retryCount: 0, status: 'pending' });
}
const ownerId = () => CURRENT_WORKSPACE === 'guest' ? null : CURRENT_WORKSPACE.slice(5);
export async function saveRecipe(draft: RecipeDraft, original?: Recipe, database = db, owner = ownerId()): Promise<Recipe> {
  const cleaned = cleanRecipeDraft(draft);
  const now = new Date().toISOString();
  const row: Recipe = { ...cleaned, id: original?.id ?? crypto.randomUUID(), createdAt: original?.createdAt ?? now, updatedAt: now };
  await database.transaction('rw', [database.recipes, database.pendingSync, database.syncBaselines], async () => {
    assertCurrent(database);
    if (original && syncFingerprint(await database.recipes.get(original.id)) !== syncFingerprint(original)) throw new Error('الأكلة اتعدلت أو اتحذفت أثناء فتحها. احتفظ بتعديلاتك وافتح أحدث نسخة قبل الحفظ.');
    await database.recipes.put(row);
    await queue(database, row, 'upsert', owner);
  });
  return row;
}
export async function deleteRecipe(original: Recipe, database = db, owner = ownerId()) {
  await database.transaction('rw', [database.recipes, database.pendingSync, database.syncBaselines], async () => {
    assertCurrent(database);
    if (syncFingerprint(await database.recipes.get(original.id)) !== syncFingerprint(original)) throw new Error('الأكلة اتغيرت. افتح أحدث نسخة قبل الحذف.');
    await queue(database, original, 'delete', owner);
    await database.recipes.delete(original.id);
  });
}
export async function toggleRecipeFavorite(id: string, database = db, owner = ownerId()) {
  await database.transaction('rw', [database.recipes, database.pendingSync, database.syncBaselines], async () => {
    assertCurrent(database);
    const original = await database.recipes.get(id);
    if (!original) throw new Error('الأكلة لم تعد موجودة.');
    const row = { ...original, isFavorite: !original.isFavorite, updatedAt: new Date().toISOString() };
    await database.recipes.put(row);
    await queue(database, row, 'upsert', owner);
  });
}
