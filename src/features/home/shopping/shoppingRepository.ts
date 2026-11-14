import { db, type RoutineDatabase } from '../../../db/database';
import { SYNC_ENTITIES, entityKey } from '../../../db/syncEntities';
import { CURRENT_WORKSPACE } from '../../../db/workspaceScope';
import type { LifeTask } from '../../../types';
import { isShoppingTask } from '../homeTasks';
import {
  cleanInventory,
  emptyInventory,
  inventoryFlags,
  type InventoryEntry,
  type InventoryItem,
} from '../inventory/inventoryModel';
import type { Recipe } from '../recipes/recipeModel';
import {
  cleanShoppingDraft,
  deriveShoppingState,
  emptyShoppingDraft,
  normalizeShoppingKey,
  parseShoppingTitle,
  validateStockReceiptRecord,
  type ShoppingDraft,
  type ShoppingItem,
  type StockReceipt,
} from './shoppingModel';

const shoppingSyncEntity = SYNC_ENTITIES.find(item => item.cloud === 'shopping_items')!;
const receiptSyncEntity = SYNC_ENTITIES.find(item => item.cloud === 'stock_receipts')!;
const inventorySyncEntity = SYNC_ENTITIES.find(item => item.cloud === 'inventory_items')!;

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `shop_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const ownerId = () => (CURRENT_WORKSPACE.startsWith('user:') ? CURRENT_WORKSPACE.slice(5) : '');

async function queueEntityUpsert(
  database: RoutineDatabase,
  table: 'shopping_items' | 'stock_receipts' | 'inventory_items',
  entity: typeof shoppingSyncEntity,
  id: string,
  row: Record<string, unknown>,
  owner: string,
  now: string,
  isNew: boolean
) {
  if (!owner) return;
  const existing = await database.pendingSync
    .where('[userId+table+entityId]')
    .equals([owner, table, id])
    .first();
  const baseline = await database.syncBaselines.get(entityKey(table, id));
  const payload = entity.toCloud(owner, row);
  const item = {
    table,
    entityId: id,
    action: 'upsert' as const,
    data: payload,
    userId: owner,
    timestamp: now,
    retryCount: 0,
    status: 'pending' as const,
    isCreatedOffline: existing?.isCreatedOffline ?? isNew,
    operationId: existing?.operationId || makeId(),
    expectedRevision: existing?.expectedRevision ?? baseline?.revision ?? 0,
  };
  if (existing?.id !== undefined) {
    await database.pendingSync.update(existing.id, item);
  } else {
    await database.pendingSync.add(item);
  }
}

async function queueEntityDelete(
  database: RoutineDatabase,
  table: 'shopping_items' | 'life_tasks',
  id: string,
  owner: string,
  now: string
) {
  if (!owner) return;
  const existing = await database.pendingSync
    .where('[userId+table+entityId]')
    .equals([owner, table, id])
    .first();
  if (existing?.isCreatedOffline) {
    if (existing.id !== undefined) await database.pendingSync.delete(existing.id);
    return;
  }
  const baseline = await database.syncBaselines.get(entityKey(table, id));
  const item = {
    table,
    entityId: id,
    action: 'delete' as const,
    data: null,
    userId: owner,
    timestamp: now,
    retryCount: 0,
    status: 'pending' as const,
    operationId: makeId(),
    expectedRevision: existing?.expectedRevision ?? baseline?.revision ?? 0,
  };
  if (existing?.id !== undefined) {
    await database.pendingSync.update(existing.id, item);
  } else {
    await database.pendingSync.add(item);
  }
}

export async function saveShoppingItem(
  draft: ShoppingDraft,
  original?: ShoppingItem,
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<ShoppingItem> {
  const cleaned = cleanShoppingDraft(draft);
  const now = new Date().toISOString();
  const item: ShoppingItem = {
    ...cleaned,
    id: original?.id ?? makeId(),
    quantityStocked: original?.quantityStocked ?? 0,
    boughtAt: cleaned.isBought ? original?.boughtAt ?? now : null,
    archivedAt: original?.archivedAt ?? null,
    createdAt: original?.createdAt ?? now,
    updatedAt: now,
  };

  await database.transaction(
    'rw',
    [database.shoppingItems, database.pendingSync, database.syncBaselines],
    async () => {
      await database.shoppingItems.put(item);
      await queueEntityUpsert(
        database,
        'shopping_items',
        shoppingSyncEntity,
        item.id,
        item as unknown as Record<string, unknown>,
        owner,
        now,
        !original
      );
    }
  );
  return item;
}

export async function toggleShoppingItemBought(
  id: string,
  options?: { isBought?: boolean; quantityPurchased?: number | null },
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<ShoppingItem> {
  const existing = await database.shoppingItems.get(id);
  if (!existing) throw new Error('صنف المشتريات غير موجود');

  const now = new Date().toISOString();
  let nextQuantityPurchased =
    options && 'quantityPurchased' in options
      ? options.quantityPurchased ?? null
      : existing.quantityPurchased;

  let nextIsBought: boolean;
  if (options && typeof options.isBought === 'boolean') {
    nextIsBought = options.isBought;
  } else if (
    options &&
    'quantityPurchased' in options &&
    nextQuantityPurchased !== null &&
    existing.quantityNeeded !== null
  ) {
    nextIsBought = nextQuantityPurchased >= existing.quantityNeeded;
  } else {
    nextIsBought = !existing.isBought;
  }

  if (nextIsBought && nextQuantityPurchased === null && existing.quantityNeeded !== null) {
    nextQuantityPurchased = existing.quantityNeeded;
  } else if (!nextIsBought && (!options || !('quantityPurchased' in options))) {
    nextQuantityPurchased = null;
  }

  // Unchecking isBought after stock receipt NEVER subtracts from quantityStocked or inventoryItems.
  const updated: ShoppingItem = {
    ...existing,
    isBought: nextIsBought,
    quantityPurchased: nextQuantityPurchased,
    boughtAt: nextIsBought ? existing.boughtAt ?? now : null,
    updatedAt: now,
  };

  await database.transaction(
    'rw',
    [database.shoppingItems, database.pendingSync, database.syncBaselines],
    async () => {
      await database.shoppingItems.put(updated);
      await queueEntityUpsert(
        database,
        'shopping_items',
        shoppingSyncEntity,
        updated.id,
        updated as unknown as Record<string, unknown>,
        owner,
        now,
        false
      );
    }
  );

  return updated;
}

export async function deleteShoppingItem(
  original: ShoppingItem,
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<void> {
  const now = new Date().toISOString();
  await database.transaction(
    'rw',
    [database.shoppingItems, database.pendingSync, database.syncBaselines],
    async () => {
      await database.shoppingItems.delete(original.id);
      await queueEntityDelete(database, 'shopping_items', original.id, owner, now);
    }
  );
}

export async function clearCompletedShoppingItems(
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<number> {
  const now = new Date().toISOString();
  const all = await database.shoppingItems.toArray();
  const completed = all.filter(
    item => !item.archivedAt && (item.isBought || deriveShoppingState(item) === 'stocked')
  );
  if (!completed.length) return 0;

  await database.transaction(
    'rw',
    [database.shoppingItems, database.pendingSync, database.syncBaselines],
    async () => {
      for (const item of completed) {
        const archived: ShoppingItem = {
          ...item,
          archivedAt: now,
          updatedAt: now,
        };
        await database.shoppingItems.put(archived);
        await queueEntityUpsert(
          database,
          'shopping_items',
          shoppingSyncEntity,
          archived.id,
          archived as unknown as Record<string, unknown>,
          owner,
          now,
          false
        );
      }
    }
  );
  return completed.length;
}

export async function addShortagesFromInventoryToShopping(
  items: InventoryItem[],
  today: string,
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<{ added: number; skipped: number }> {
  const activeShopping = (await database.shoppingItems.toArray()).filter(
    item => !item.archivedAt && deriveShoppingState(item) !== 'stocked'
  );
  const existingSourceIds = new Set(
    activeShopping.map(item => item.sourceInventoryItemId).filter((id): id is string => Boolean(id))
  );
  const existingNames = new Set(activeShopping.map(item => normalizeShoppingKey(item.title)));

  let added = 0;
  let skipped = 0;

  for (const inv of items) {
    const flags = inventoryFlags(inv, today);
    if (!flags.out && !flags.low) continue;

    const normalizedName = normalizeShoppingKey(inv.name);
    if (existingSourceIds.has(inv.id) || existingNames.has(normalizedName)) {
      skipped++;
      continue;
    }

    let quantityNeeded: number | null = null;
    if (inv.lowThreshold !== null && inv.lowThreshold > 0) {
      const currentQty = inv.quantity ?? 0;
      const deficit = Math.round((inv.lowThreshold - currentQty) * 1000) / 1000;
      quantityNeeded = deficit > 0 ? deficit : inv.lowThreshold;
    }

    await saveShoppingItem(
      {
        ...emptyShoppingDraft(),
        title: inv.name,
        category: inv.category || 'pantry',
        storeContext: 'supermarket',
        quantityNeeded,
        unit: inv.unit || '',
        quantityText:
          quantityNeeded === null && inv.packageSize && inv.packageUnit
            ? `عبوة ${inv.packageSize} ${inv.packageUnit}`
            : '',
        priority: flags.out ? 'high' : 'medium',
        sourceType: 'inventory_low',
        sourceInventoryItemId: inv.id,
        notes: `نقص في ${inv.location}`,
      },
      undefined,
      database,
      owner
    );

    existingSourceIds.add(inv.id);
    existingNames.add(normalizedName);
    added++;
  }

  return { added, skipped };
}

export async function addRecipeIngredientsToShopping(
  recipe: Recipe,
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<{ added: number; skipped: number }> {
  const activeShopping = (await database.shoppingItems.toArray()).filter(
    item => !item.archivedAt && deriveShoppingState(item) !== 'stocked'
  );
  const existingNames = new Set(activeShopping.map(item => normalizeShoppingKey(item.title)));

  let added = 0;
  let skipped = 0;

  for (const ingredient of recipe.ingredients) {
    const title = ingredient.name.trim();
    if (!title) continue;
    const key = normalizeShoppingKey(title);
    if (existingNames.has(key)) {
      skipped++;
      continue;
    }
    await saveShoppingItem(
      {
        ...emptyShoppingDraft(),
        title,
        category: 'general',
        storeContext: 'supermarket',
        quantityNeeded: null,
        unit: '',
        quantityText: ingredient.quantity.trim(),
        priority: 'medium',
        sourceType: 'recipe',
        notes: `لوصفة: ${recipe.title}`,
      },
      undefined,
      database,
      owner
    );
    existingNames.add(key);
    added++;
  }

  return { added, skipped };
}

export interface ReceiveShoppingToInventoryInput {
  shoppingItemId: string;
  operationId: string;
  quantityAdded: number;
  unit: string;
  location: string;
  expiresOn?: string | null;
  targetInventoryItemId?: string | null;
  createNewBatch?: boolean;
  note?: string;
}

export interface ReceiveShoppingToInventoryResult {
  receipt: StockReceipt;
  inventoryItem: InventoryItem;
  shoppingItem: ShoppingItem;
  deduplicated: boolean;
}

export async function receiveShoppingToInventory(
  input: ReceiveShoppingToInventoryInput,
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<ReceiveShoppingToInventoryResult> {
  const operationId = input.operationId.trim();
  if (!operationId || operationId.length > 128) {
    throw new Error('معرّف عملية إدخال المخزون مطلوب');
  }
  if (!Number.isFinite(input.quantityAdded) || input.quantityAdded <= 0 || input.quantityAdded > 100_000_000) {
    throw new Error('الكمية المضافة للمخزون يجب أن تكون أكبر من صفر');
  }
  const unit = input.unit.trim();
  if (!unit) {
    throw new Error('حدد وحدة الكمية قبل الإدخال إلى المخزون');
  }
  const location = input.location.trim() || 'غير محدد';
  const expiresOn = input.expiresOn?.trim() ? input.expiresOn.trim() : null;
  const roundedAdded = Math.round(input.quantityAdded * 1000) / 1000;

  return database.transaction(
    'rw',
    [
      database.shoppingItems,
      database.inventoryItems,
      database.stockReceipts,
      database.pendingSync,
      database.syncBaselines,
    ],
    async () => {
      const existingReceipt = await database.stockReceipts
        .where('operationId')
        .equals(operationId)
        .first();
      if (existingReceipt) {
        const existingShopping = await database.shoppingItems.get(existingReceipt.shoppingItemId);
        const existingInventory = await database.inventoryItems.get(existingReceipt.inventoryItemId);
        if (existingShopping && existingInventory) {
          return {
            receipt: existingReceipt,
            inventoryItem: existingInventory,
            shoppingItem: existingShopping,
            deduplicated: true,
          };
        }
      }

      const shoppingItem = await database.shoppingItems.get(input.shoppingItemId);
      if (!shoppingItem) {
        throw new Error('صنف المشتريات غير موجود');
      }

      const now = new Date().toISOString();
      const candidateTargetId =
        input.createNewBatch
          ? null
          : input.targetInventoryItemId !== undefined
            ? input.targetInventoryItemId
            : shoppingItem.sourceInventoryItemId;

      const candidateTarget = candidateTargetId
        ? await database.inventoryItems.get(candidateTargetId)
        : undefined;

      // Batch separation rule: if location or expiry date differs, create a new independent batch!
      const canMergeIntoTarget =
        Boolean(candidateTarget) &&
        !input.createNewBatch &&
        candidateTarget!.location.trim() === location &&
        (candidateTarget!.expiresOn ?? null) === expiresOn;

      let savedInventory: InventoryItem;

      if (candidateTarget && canMergeIntoTarget) {
        if (candidateTarget.quantity === null) {
          throw new Error(
            'الدفعة الحالية في الخزين بكمية غير محددة؛ اختر إنشاء دفعة جديدة أو حدّد كميتها من الجرد أولاً.'
          );
        }
        if (
          candidateTarget.unit.trim() &&
          normalizeShoppingKey(candidateTarget.unit) !== normalizeShoppingKey(unit)
        ) {
          throw new Error(
            `وحدة الشراء (${unit}) تختلف عن وحدة الدفعة الحالية في الخزين (${candidateTarget.unit})؛ اختر إنشاء دفعة جديدة أو وحّد الوحدة.`
          );
        }

        const nextQty = Math.round((candidateTarget.quantity + roundedAdded) * 1000) / 1000;
        const entry: InventoryEntry = {
          id: makeId(),
          at: now,
          kind: 'purchase',
          before: candidateTarget.quantity,
          after: nextQty,
          delta: roundedAdded,
          unit,
          note: input.note?.trim() || 'إدخال من قائمة المشتريات',
        };
        const cleaned = cleanInventory({
          ...candidateTarget,
          quantity: nextQty,
          unit,
          location,
          expiresOn,
          state: 'available',
          approximate: false,
        });
        savedInventory = {
          ...cleaned,
          id: candidateTarget.id,
          lastCountedAt: now,
          history: [entry, ...candidateTarget.history].slice(0, 40),
          createdAt: candidateTarget.createdAt,
          updatedAt: now,
        };
        await database.inventoryItems.put(savedInventory);
        await queueEntityUpsert(
          database,
          'inventory_items',
          inventorySyncEntity,
          savedInventory.id,
          savedInventory as unknown as Record<string, unknown>,
          owner,
          now,
          false
        );
      } else {
        const entry: InventoryEntry = {
          id: makeId(),
          at: now,
          kind: 'purchase',
          before: null,
          after: roundedAdded,
          delta: roundedAdded,
          unit,
          note: input.note?.trim() || 'دفعة جديدة من قائمة المشتريات',
        };
        const cleaned = cleanInventory({
          ...emptyInventory(),
          name: candidateTarget?.name ?? shoppingItem.title,
          category: candidateTarget?.category || shoppingItem.category || '',
          location,
          quantity: roundedAdded,
          unit,
          state: 'available',
          approximate: false,
          packageSize: candidateTarget?.packageSize ?? null,
          packageUnit: candidateTarget?.packageUnit ?? '',
          expiresOn,
          useFirst: false,
          lowThreshold: candidateTarget?.lowThreshold ?? null,
          notes: '',
        });
        savedInventory = {
          ...cleaned,
          id: makeId(),
          lastCountedAt: now,
          history: [entry],
          createdAt: now,
          updatedAt: now,
        };
        await database.inventoryItems.put(savedInventory);
        await queueEntityUpsert(
          database,
          'inventory_items',
          inventorySyncEntity,
          savedInventory.id,
          savedInventory as unknown as Record<string, unknown>,
          owner,
          now,
          true
        );
      }

      const nextStocked = Math.round((shoppingItem.quantityStocked + roundedAdded) * 1000) / 1000;
      const nextPurchased =
        shoppingItem.quantityPurchased !== null
          ? Math.max(shoppingItem.quantityPurchased, nextStocked)
          : shoppingItem.quantityNeeded !== null
            ? Math.max(shoppingItem.quantityNeeded, nextStocked)
            : roundedAdded;

      const updatedShopping: ShoppingItem = {
        ...shoppingItem,
        unit: shoppingItem.unit || unit,
        quantityPurchased: nextPurchased,
        quantityStocked: nextStocked,
        isBought: true,
        boughtAt: shoppingItem.boughtAt ?? now,
        sourceInventoryItemId: shoppingItem.sourceInventoryItemId ?? savedInventory.id,
        updatedAt: now,
      };

      const receipt: StockReceipt = {
        id: makeId(),
        operationId,
        shoppingItemId: updatedShopping.id,
        inventoryItemId: savedInventory.id,
        quantityAdded: roundedAdded,
        unit,
        location,
        expiresOn,
        createdAt: now,
      };
      validateStockReceiptRecord(receipt);

      await database.shoppingItems.put(updatedShopping);
      await database.stockReceipts.put(receipt);

      await queueEntityUpsert(
        database,
        'shopping_items',
        shoppingSyncEntity,
        updatedShopping.id,
        updatedShopping as unknown as Record<string, unknown>,
        owner,
        now,
        false
      );
      await queueEntityUpsert(
        database,
        'stock_receipts',
        receiptSyncEntity,
        receipt.id,
        receipt as unknown as Record<string, unknown>,
        owner,
        now,
        true
      );

      return {
        receipt,
        inventoryItem: savedInventory,
        shoppingItem: updatedShopping,
        deduplicated: false,
      };
    }
  );
}

export async function previewLegacyShoppingTasks(
  database: RoutineDatabase = db
): Promise<LifeTask[]> {
  const homeTasks = await database.tasks.where('spaceId').equals('home').toArray();
  return homeTasks.filter(task => isShoppingTask(task));
}

export async function migrateLegacyShoppingTasks(
  database: RoutineDatabase = db,
  owner = ownerId()
): Promise<{ migrated: number; skipped: number }> {
  const legacyTasks = await previewLegacyShoppingTasks(database);
  if (!legacyTasks.length) return { migrated: 0, skipped: 0 };

  let migrated = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  await database.transaction(
    'rw',
    [database.tasks, database.shoppingItems, database.pendingSync, database.syncBaselines],
    async () => {
      for (const task of legacyTasks) {
        const existing = await database.shoppingItems
          .where('legacyTaskId')
          .equals(task.id)
          .first();
        if (existing) {
          await database.tasks.delete(task.id);
          await queueEntityDelete(database, 'life_tasks', task.id, owner, now);
          skipped++;
          continue;
        }

        const parsed = parseShoppingTitle(task.title);
        if (!parsed.title) {
          skipped++;
          continue;
        }

        const cleaned = cleanShoppingDraft({
          ...emptyShoppingDraft(),
          title: parsed.title,
          category: 'general',
          storeContext: 'any',
          quantityNeeded: null,
          unit: '',
          quantityText: parsed.quantityText,
          quantityPurchased: null,
          isBought: Boolean(task.isCompleted),
          priority: task.priority,
          sourceType: 'legacy_task',
          sourceInventoryItemId: null,
          legacyTaskId: task.id,
          notes: (task.description ?? '').replace(/^مشتريات\s*[-—:]?\s*/, '').trim(),
        });

        const item: ShoppingItem = {
          ...cleaned,
          id: makeId(),
          quantityStocked: 0,
          boughtAt: task.isCompleted ? task.completedAt ?? now : null,
          archivedAt: null,
          createdAt: task.createdAt || now,
          updatedAt: now,
        };

        await database.shoppingItems.put(item);
        await queueEntityUpsert(
          database,
          'shopping_items',
          shoppingSyncEntity,
          item.id,
          item as unknown as Record<string, unknown>,
          owner,
          now,
          true
        );
        await database.tasks.delete(task.id);
        await queueEntityDelete(database, 'life_tasks', task.id, owner, now);
        migrated++;
      }
    }
  );

  return { migrated, skipped };
}
