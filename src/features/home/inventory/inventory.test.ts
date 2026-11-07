import { RoutineDatabase, db } from '../../../db/database';
import { exportCompleteBackup, importCompleteBackup } from '../../../db/backup';
import { SYNC_ENTITIES, syncFingerprint } from '../../../db/syncEntities';
import { emptyInventory, inventoryFlags, inventoryIdentity, numericInput, cleanInventory, validateInventoryRecord } from './inventoryModel';
import { saveInventoryBatch, deleteInventory } from './inventoryRepository';
import { inventoryRows, inventoryDraftsToCells, parseDelimited } from './inventoryImport';
import { formatInventoryQuantity, inventoryNeedsAttention, matchesInventorySearch, sortInventory } from './inventoryPresentation';

export async function runInventoryTests() {
  const results: Array<{ name: string; passed: boolean }> = [];
  const check = (name: string, passed: boolean) => results.push({ name, passed });
  const rejects = (callback: () => unknown) => { try { callback(); return false; } catch { return true; } };
  const database = new RoutineDatabase('inventory-feature-tests'); await database.open();
  try {
    check('Inventory parses Arabic decimal quantities without treating unknown as zero', numericInput('٣٫٥') === 3.5 && numericInput('') === null && numericInput('۰') === 0 && rejects(() => numericInput('-2')));
    check('Inventory validation rejects impossible expiry dates and quantities without units', rejects(() => cleanInventory({ ...emptyInventory(), name: 'Milk', expiresOn: '2026-02-30' })) && rejects(() => cleanInventory({ ...emptyInventory(), name: 'Milk', quantity: 2 })));
    const [unknown] = await saveInventoryBatch([{ draft: { ...emptyInventory(), name: 'Cheese' }, mode: 'count' }], database, 'owner');
    check('Name-only audit preserves unknown quantity with a dated history entry', unknown.quantity === null && unknown.state === 'unknown' && unknown.history.length === 1 && !!unknown.lastCountedAt);
    const [milk] = await saveInventoryBatch([{ draft: { ...emptyInventory(), name: 'Milk', location: 'الثلاجة', quantity: 9, unit: 'كيس', packageSize: 0.5, packageUnit: 'كيلو', expiresOn: '2026-11-06' }, mode: 'count' }], database, 'owner');
    const arabicItem = { ...milk, name: 'أَرُز', category: 'بقالة', notes: 'للأسبوع' };
    check('Inventory search normalizes Arabic and respects the selected search field', matchesInventorySearch(arabicItem, 'ارز', 'name') && matchesInventorySearch(arabicItem, 'الثلاجة', 'location') && !matchesInventorySearch(arabicItem, 'الثلاجة', 'name') && matchesInventorySearch(arabicItem, 'للاسبوع', 'all'));
    const outItem = { ...unknown, id: 'out-item', quantity: 0, state: 'out' as const };
    check('Attention filter includes shortages and empty stock without flagging unknown quantity', inventoryNeedsAttention(inventoryFlags(outItem, '2026-11-01')) && inventoryNeedsAttention(inventoryFlags({ ...unknown, state: 'low' }, '2026-11-01')) && !inventoryNeedsAttention(inventoryFlags(unknown, '2026-11-01')));
    const expiryItems = [unknown, milk];
    check('Inventory expiry order puts recorded dates before unknown dates without mutating input', sortInventory(expiryItems, 'expiry', '2026-11-01')[0].id === milk.id && expiryItems[0].id === unknown.id);
    check('Inventory attention order prioritizes expiry and recent order uses update time', sortInventory([outItem, milk], 'attention', '2026-11-01')[0].id === milk.id && sortInventory([{ ...milk, updatedAt: '2026-10-01T00:00:00Z' }, { ...unknown, updatedAt: '2026-11-01T00:00:00Z' }], 'recent', '2026-11-01')[0].id === unknown.id);
    check('Inventory presentation keeps unknown quantity distinct from recorded zero', formatInventoryQuantity(unknown) === 'غير معروف' && formatInventoryQuantity(outItem) === '0' && formatInventoryQuantity({ ...milk, approximate: true }).startsWith('≈ '));
    check('Inventory quantity sorting supports both directions and keeps unknown quantities last', sortInventory([unknown, milk, outItem], 'quantity', '2026-11-01').map(item => item.id).join() === [outItem, milk, unknown].map(item => item.id).join() && sortInventory([unknown, milk, outItem], 'quantity', '2026-11-01', 'desc').map(item => item.id).join() === [milk, outItem, unknown].map(item => item.id).join());
    check('Descending expiry sorting keeps undated stock last and location sorting is reversible', sortInventory([unknown, milk], 'expiry', '2026-11-01', 'desc')[1].id === unknown.id && sortInventory([{ ...milk, location: 'A' }, { ...unknown, location: 'B' }], 'location', '2026-11-01', 'desc')[0].id === unknown.id);
    const [counted] = await saveInventoryBatch([{ original: milk, draft: { ...milk, quantity: 6 }, mode: 'count' }], database, 'owner');
    check('A recount replaces stock rather than adding to it and records a three-unit decrease', counted.quantity === 6 && counted.history[1].delta === -3 && counted.packageSize === 0.5);
    const [purchased] = await saveInventoryBatch([{ original: counted, draft: { ...counted, quantity: 2 }, mode: 'purchase' }], database, 'owner');
    check('Purchases add to known stock and preserve the last physical audit timestamp', purchased.quantity === 8 && purchased.lastCountedAt === counted.lastCountedAt && purchased.history[2].kind === 'purchase' && purchased.history[2].delta === 2);
    let unknownPurchase = false, unitMismatch = false;
    try { await saveInventoryBatch([{ original: unknown, draft: { ...unknown, quantity: 2, unit: 'قطعة' }, mode: 'purchase' }], database, 'owner'); } catch { unknownPurchase = true; }
    try { await saveInventoryBatch([{ original: purchased, draft: { ...purchased, quantity: 1, unit: 'لتر' }, mode: 'purchase' }], database, 'owner'); } catch { unitMismatch = true; }
    check('Purchases cannot invent a baseline or add incompatible units', unknownPurchase && unitMismatch);
    let atomic = false;
    try { await saveInventoryBatch([{ original: unknown, draft: { ...unknown, quantity: 1, unit: 'قطعة' }, mode: 'count' }, { original: milk, draft: { ...milk, quantity: 10 }, mode: 'count' }], database, 'owner'); } catch { atomic = true; }
    check('A stale item rejects the whole local batch without partially overwriting other rows', atomic && (await database.inventoryItems.get(unknown.id))?.quantity === null && (await database.inventoryItems.get(milk.id))?.quantity === 8);
    const current = await database.inventoryItems.get(milk.id);
    check('Expiry and low-stock flags use recorded values without fabricating dates', inventoryFlags({ ...current!, lowThreshold: 8 }, '2026-11-01').expiring && inventoryFlags({ ...current!, lowThreshold: 8 }, '2026-11-01').low && !inventoryFlags(unknown, '2026-11-01').expired);
    check('Different expiry dates remain distinct batches of the same ingredient', inventoryIdentity(milk) !== inventoryIdentity({ ...milk, expiresOn: '2026-12-01' }));
    const imported = inventoryRows(parseDelimited('المكان\tالتصنيف\tالصنف\tالكمية\tملاحظات\nالديب فريزر\tلحوم\tبانيه\t٣٫٥ كيلو\tأولوية استخدام\nالثلاجة\tألبان\tجبنة\tغير محدد\t'));
    check('Excel paste recognizes reordered headers, combined quantities and unknown stock', imported.length === 2 && imported[0].quantity === 3.5 && imported[0].unit === 'كيلو' && imported[0].useFirst && imported[1].quantity === null);
    const pastedStates = inventoryRows(inventoryDraftsToCells(inventoryRows([['جبنة', 'قليل'], ['أرز', 'موجود'], ['ملح', '0']]), 'التموين'));
    check('Direct Excel paste preserves low, available-unknown and zero states through the editable grid', pastedStates[0].state === 'low' && pastedStates[0].quantity === null && pastedStates[1].state === 'available' && pastedStates[1].quantity === null && pastedStates[2].quantity === 0 && pastedStates[0].location === 'التموين');
    check('CSV parser preserves quoted commas and multiline notes', parseDelimited('الصنف,الكمية,الوحدة,المكان,التصنيف,الصلاحية,ملاحظات\n"فلفل, ألوان",2,قطعة,الثلاجة,,,"سطر أول\nسطر ثان"')[1][6] === 'سطر أول\nسطر ثان');
    check('Malformed imports fail before writes', rejects(() => inventoryRows([['صنف', '-2', 'كيلو']])) && rejects(() => parseDelimited('"unclosed')));
    const entity = SYNC_ENTITIES.find(item => item.cloud === 'inventory_items')!;
    const payload = entity.toCloud('owner', unknown as unknown as Record<string, unknown>);
    check('Inventory cloud codec preserves nullable quantities, history and optional fields', syncFingerprint(payload) === syncFingerprint(entity.toCloud('owner', entity.fromCloud(payload))));
    await db.inventoryItems.put(purchased); const backup = await exportCompleteBackup(); await db.inventoryItems.delete(purchased.id); const restored = await importCompleteBackup(backup);
    check('JSON backup restores inventory with complete audit history', restored.success && (await db.inventoryItems.get(purchased.id))?.history.length === 3);
    check('Backup validator rejects stock-state mismatches and malformed history', rejects(() => validateInventoryRecord({ ...purchased, state: 'out' })) && rejects(() => validateInventoryRecord({ ...purchased, history: [{ id: 'bad' }] })));
    await db.inventoryItems.delete(purchased.id);
    await deleteInventory(unknown, database, 'owner');
    check('Deleting an unsynced inventory row retains a durable deletion intention', !await database.inventoryItems.get(unknown.id) && (await database.pendingSync.where('[userId+table+entityId]').equals(['owner', 'inventory_items', unknown.id]).first())?.action === 'delete');
  } finally { database.close(); await database.delete(); }
  return results;
}
