import { RoutineDatabase } from '../../../db/database';
import {
  deriveShoppingState,
  emptyShoppingDraft,
  parseShoppingTitle,
  remainingShoppingQuantity,
  validateShoppingRecord,
  validateStockReceiptRecord,
} from './shoppingModel';
import {
  addShortagesFromInventoryToShopping,
  clearCompletedShoppingItems,
  migrateLegacyShoppingTasks,
  receiveShoppingToInventory,
  saveShoppingItem,
  toggleShoppingItemBought,
} from './shoppingRepository';
import { emptyInventory } from '../inventory/inventoryModel';
import { saveInventoryBatch } from '../inventory/inventoryRepository';

export async function runShoppingTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  let serial = 0;

  // 1. Name-only & free-text quantity without inventing numbers
  {
    const db = new RoutineDatabase(`shopping-test-${serial++}`);
    await db.open();
    const parsed = parseShoppingTitle('🛒 عيش بلدي (٢ كيس)');
    const item = await saveShoppingItem(
      {
        ...emptyShoppingDraft(),
        title: parsed.title,
        quantityText: parsed.quantityText,
      },
      undefined,
      db,
      'owner'
    );
    check(
      'Shopping item saves name-only or free-text quantity without inventing numbers',
      item.title === 'عيش بلدي' &&
        item.quantityNeeded === null &&
        item.quantityPurchased === null &&
        item.quantityText === '٢ كيس' &&
        deriveShoppingState(item) === 'needed'
    );
    db.close();
  }

  // 2. Partial purchase state and remaining quantity
  {
    const db = new RoutineDatabase(`shopping-test-${serial++}`);
    await db.open();
    const item = await saveShoppingItem(
      {
        ...emptyShoppingDraft(),
        title: 'حليب كامل الدسم',
        quantityNeeded: 3,
        unit: 'لتر',
      },
      undefined,
      db,
      'owner'
    );
    const partial = await toggleShoppingItemBought(
      item.id,
      { quantityPurchased: 2 },
      db,
      'owner'
    );
    check(
      'Partial purchase keeps item in partially_bought state with accurate remaining quantity',
      !partial.isBought &&
        partial.quantityPurchased === 2 &&
        remainingShoppingQuantity(partial) === 1 &&
        deriveShoppingState(partial) === 'partially_bought'
    );
    db.close();
  }

  // 3. Quick buy toggle does NOT touch inventoryItems
  {
    const db = new RoutineDatabase(`shopping-test-${serial++}`);
    await db.open();
    const [inv] = await saveInventoryBatch(
      [
        {
          mode: 'count',
          draft: { ...emptyInventory(), name: 'أرز مصري', quantity: 1, unit: 'كجم', lowThreshold: 3 },
        },
      ],
      db,
      'owner'
    );
    const item = await saveShoppingItem(
      {
        ...emptyShoppingDraft(),
        title: 'أرز مصري',
        quantityNeeded: 2,
        unit: 'كجم',
        sourceType: 'inventory_low',
        sourceInventoryItemId: inv.id,
      },
      undefined,
      db,
      'owner'
    );
    const bought = await toggleShoppingItemBought(item.id, undefined, db, 'owner');
    const afterInv = await db.inventoryItems.get(inv.id);
    check(
      'Checking off a shopping item sets bought_pending_stock without mutating inventory',
      bought.isBought === true &&
        deriveShoppingState(bought) === 'bought_pending_stock' &&
        afterInv?.quantity === 1
    );

    // 4. Stock receipt transfers quantity to inventory and is idempotent on retry
    const firstReceive = await receiveShoppingToInventory(
      {
        shoppingItemId: bought.id,
        operationId: 'op-rice-1',
        quantityAdded: 2,
        unit: 'كجم',
        location: inv.location,
        expiresOn: inv.expiresOn,
      },
      db,
      'owner'
    );
    const retryReceive = await receiveShoppingToInventory(
      {
        shoppingItemId: bought.id,
        operationId: 'op-rice-1',
        quantityAdded: 2,
        unit: 'كجم',
        location: inv.location,
        expiresOn: inv.expiresOn,
      },
      db,
      'owner'
    );
    const stockedInv = await db.inventoryItems.get(inv.id);
    check(
      'receiveShoppingToInventory increments inventory once and deduplicates repeated operationId',
      !firstReceive.deduplicated &&
        retryReceive.deduplicated &&
        stockedInv?.quantity === 3 &&
        deriveShoppingState(firstReceive.shoppingItem) === 'stocked' &&
        (await db.stockReceipts.count()) === 1
    );

    // 5. Unchecking isBought after stock transfer never subtracts already-stocked inventory
    const unchecked = await toggleShoppingItemBought(
      bought.id,
      { isBought: false },
      db,
      'owner'
    );
    const afterUncheckInv = await db.inventoryItems.get(inv.id);
    check(
      'Unchecking isBought after stock receipt never subtracts already-stocked inventory',
      unchecked.quantityStocked === 2 && afterUncheckInv?.quantity === 3
    );
    db.close();
  }

  // 6. Different expiry date or location creates a separate InventoryItem batch
  {
    const db = new RoutineDatabase(`shopping-test-${serial++}`);
    await db.open();
    const [existingBatch] = await saveInventoryBatch(
      [
        {
          mode: 'count',
          draft: {
            ...emptyInventory(),
            name: 'زبادي',
            location: 'الثلاجة',
            quantity: 2,
            unit: 'علبة',
            expiresOn: '2026-11-20',
          },
        },
      ],
      db,
      'owner'
    );
    const shop = await saveShoppingItem(
      {
        ...emptyShoppingDraft(),
        title: 'زبادي',
        quantityNeeded: 4,
        unit: 'علبة',
        isBought: true,
        sourceInventoryItemId: existingBatch.id,
      },
      undefined,
      db,
      'owner'
    );
    const received = await receiveShoppingToInventory(
      {
        shoppingItemId: shop.id,
        operationId: 'op-yogurt-new-expiry',
        quantityAdded: 4,
        unit: 'علبة',
        location: 'الثلاجة',
        expiresOn: '2026-11-28',
      },
      db,
      'owner'
    );
    const oldBatchAfter = await db.inventoryItems.get(existingBatch.id);
    check(
      'Receiving a batch with a different expiry date creates a separate inventory batch instead of merging',
      received.inventoryItem.id !== existingBatch.id &&
        received.inventoryItem.quantity === 4 &&
        received.inventoryItem.expiresOn === '2026-11-28' &&
        oldBatchAfter?.quantity === 2 &&
        oldBatchAfter?.expiresOn === '2026-11-20'
    );
    db.close();
  }

  // 7. Unknown baseline quantity or unit mismatch rejects direct merge without corrupting data
  {
    const db = new RoutineDatabase(`shopping-test-${serial++}`);
    await db.open();
    const [unknownBatch] = await saveInventoryBatch(
      [
        {
          mode: 'count',
          draft: {
            ...emptyInventory(),
            name: 'عدس أصفر',
            location: 'دولاب المطبخ',
            quantity: null,
            unit: '',
            state: 'low',
          },
        },
      ],
      db,
      'owner'
    );
    const shop = await saveShoppingItem(
      {
        ...emptyShoppingDraft(),
        title: 'عدس أصفر',
        quantityNeeded: 1,
        unit: 'كجم',
        isBought: true,
        sourceInventoryItemId: unknownBatch.id,
      },
      undefined,
      db,
      'owner'
    );
    let rejectedUnknown = false;
    try {
      await receiveShoppingToInventory(
        {
          shoppingItemId: shop.id,
          operationId: 'op-lentils-fail',
          quantityAdded: 1,
          unit: 'كجم',
          location: 'دولاب المطبخ',
          expiresOn: null,
        },
        db,
        'owner'
      );
    } catch {
      rejectedUnknown = true;
    }
    const newBatchResult = await receiveShoppingToInventory(
      {
        shoppingItemId: shop.id,
        operationId: 'op-lentils-new-batch',
        quantityAdded: 1,
        unit: 'كجم',
        location: 'دولاب المطبخ',
        expiresOn: null,
        createNewBatch: true,
      },
      db,
      'owner'
    );
    check(
      'Unknown baseline quantity rejects direct merge and succeeds when creating a new batch',
      rejectedUnknown &&
        newBatchResult.inventoryItem.id !== unknownBatch.id &&
        newBatchResult.inventoryItem.quantity === 1
    );
    db.close();
  }

  // 8. Importing shortages skips items already needed or bought_pending_stock
  {
    const db = new RoutineDatabase(`shopping-test-${serial++}`);
    await db.open();
    const [inv1, inv2] = await saveInventoryBatch(
      [
        {
          mode: 'count',
          draft: { ...emptyInventory(), name: 'سكر', quantity: 0, unit: 'كجم', state: 'out', lowThreshold: 2 },
        },
        {
          mode: 'count',
          draft: { ...emptyInventory(), name: 'شاي', quantity: 0, unit: 'علبة', state: 'out', lowThreshold: 1 },
        },
      ],
      db,
      'owner'
    );
    const firstImport = await addShortagesFromInventoryToShopping([inv1, inv2], '2026-11-14', db, 'owner');
    const items = await db.shoppingItems.toArray();
    const sugar = items.find(i => i.sourceInventoryItemId === inv1.id)!;
    await toggleShoppingItemBought(sugar.id, { isBought: true }, db, 'owner');
    const secondImport = await addShortagesFromInventoryToShopping([inv1, inv2], '2026-11-14', db, 'owner');
    check(
      'Importing inventory shortages links sourceInventoryItemId and skips needed or bought_pending_stock items',
      firstImport.added === 2 &&
        firstImport.skipped === 0 &&
        sugar.quantityNeeded === 2 &&
        secondImport.added === 0 &&
        secondImport.skipped === 2
    );
    db.close();
  }

  // 9. Legacy shopping tasks migrate idempotently with legacyTaskId
  {
    const db = new RoutineDatabase(`shopping-test-${serial++}`);
    await db.open();
    await db.tasks.bulkPut([
      {
        id: 'legacy-shop-1',
        title: '🛒 طماطم (٢ كيلو)',
        description: 'مشتريات البيت',
        spaceId: 'home',
        priority: 'high',
        isCompleted: false,
        createdAt: '2026-11-10T10:00:00Z',
      },
      {
        id: 'home-maint-1',
        title: '[المطبخ] تنظيف الفلتر',
        spaceId: 'home',
        priority: 'medium',
        isCompleted: false,
        createdAt: '2026-11-10T10:00:00Z',
      },
    ]);
    const firstMigration = await migrateLegacyShoppingTasks(db, 'owner');
    const secondMigration = await migrateLegacyShoppingTasks(db, 'owner');
    const migratedItems = await db.shoppingItems.toArray();
    const remainingTasks = await db.tasks.toArray();
    check(
      'Legacy shopping tasks migrate idempotently into shoppingItems without touching normal home tasks',
      firstMigration.migrated === 1 &&
        secondMigration.migrated === 0 &&
        migratedItems.length === 1 &&
        migratedItems[0].legacyTaskId === 'legacy-shop-1' &&
        migratedItems[0].title === 'طماطم' &&
        migratedItems[0].quantityText === '٢ كيلو' &&
        migratedItems[0].quantityNeeded === null &&
        remainingTasks.length === 1 &&
        remainingTasks[0].id === 'home-maint-1'
    );

    // Validate records and archive completed
    let recordsValid = true;
    try {
      validateShoppingRecord(migratedItems[0]);
      validateStockReceiptRecord({
        id: 'rec-1',
        operationId: 'op-1',
        shoppingItemId: migratedItems[0].id,
        inventoryItemId: 'inv-1',
        quantityAdded: 2,
        unit: 'كجم',
        location: 'الثلاجة',
        expiresOn: null,
        createdAt: new Date().toISOString(),
      });
    } catch {
      recordsValid = false;
    }
    await toggleShoppingItemBought(migratedItems[0].id, { isBought: true }, db, 'owner');
    const archivedCount = await clearCompletedShoppingItems(db, 'owner');
    check(
      'Shopping and receipt validators pass and clearCompletedShoppingItems archives bought items',
      recordsValid && archivedCount === 1
    );
    db.close();
  }

  return results;
}
