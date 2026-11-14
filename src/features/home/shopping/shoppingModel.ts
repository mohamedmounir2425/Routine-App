export const SHOPPING_STORE_CONTEXTS = [
  { id: 'any', label: 'أي مكان', icon: '🛒' },
  { id: 'supermarket', label: 'سوبرماركت', icon: '🏪' },
  { id: 'greengrocer', label: 'خضار وفاكهة', icon: '🥬' },
  { id: 'pharmacy', label: 'صيدلية', icon: '💊' },
  { id: 'family_visit', label: 'مشوار العيلة', icon: '🏠' },
] as const;

export type ShoppingStoreContext = (typeof SHOPPING_STORE_CONTEXTS)[number]['id'];

export const SHOPPING_CATEGORIES = [
  { id: 'general', label: 'عام' },
  { id: 'dairy', label: 'ألبان وجبن' },
  { id: 'produce', label: 'خضار وفاكهة' },
  { id: 'pantry', label: 'خزين وبقوليات' },
  { id: 'meat', label: 'لحوم ودواجن' },
  { id: 'bakery', label: 'مخبوزات' },
  { id: 'cleaning', label: 'منظفات وأدوات منزلية' },
  { id: 'pharmacy', label: 'صيدلية وعناية' },
] as const;

export type ShoppingCategoryId = (typeof SHOPPING_CATEGORIES)[number]['id'] | string;

export type ShoppingSourceType = 'manual' | 'inventory_low' | 'recipe' | 'legacy_task';

export type ShoppingPriority = 'high' | 'medium' | 'low';

export type ShoppingDerivedState =
  | 'needed'
  | 'partially_bought'
  | 'bought_pending_stock'
  | 'stocked';

export interface ShoppingItem {
  id: string;
  title: string;
  category: string;
  storeContext: ShoppingStoreContext;
  quantityNeeded: number | null;
  unit: string;
  quantityText: string;
  quantityPurchased: number | null;
  quantityStocked: number;
  isBought: boolean;
  boughtAt: string | null;
  priority: ShoppingPriority;
  sourceType: ShoppingSourceType;
  sourceInventoryItemId: string | null;
  legacyTaskId: string | null;
  notes: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ShoppingDraft = Omit<
  ShoppingItem,
  'id' | 'quantityStocked' | 'boughtAt' | 'archivedAt' | 'createdAt' | 'updatedAt'
>;

export interface StockReceipt {
  id: string;
  operationId: string;
  shoppingItemId: string;
  inventoryItemId: string;
  quantityAdded: number;
  unit: string;
  location: string;
  expiresOn: string | null;
  createdAt: string;
}

const STORE_CONTEXT_SET = new Set<string>(SHOPPING_STORE_CONTEXTS.map(item => item.id));
const PRIORITY_SET = new Set<string>(['high', 'medium', 'low']);
const SOURCE_TYPE_SET = new Set<string>(['manual', 'inventory_low', 'recipe', 'legacy_task']);

export function emptyShoppingDraft(): ShoppingDraft {
  return {
    title: '',
    category: 'general',
    storeContext: 'any',
    quantityNeeded: null,
    unit: '',
    quantityText: '',
    quantityPurchased: null,
    isBought: false,
    priority: 'medium',
    sourceType: 'manual',
    sourceInventoryItemId: null,
    legacyTaskId: null,
    notes: '',
  };
}

export function normalizeShoppingKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ar');
}

/**
 * Extracts title and free-text quantity from legacy `🛒 لبن (2 لتر)` or quick-add strings
 * without inventing numeric values when the user wrote free text.
 */
export function parseShoppingTitle(rawTitle: string, rawQuantityText = ''): { title: string; quantityText: string } {
  const stripped = rawTitle.replace(/^🛒\s*/, '').trim();
  const explicitQty = rawQuantityText.trim();
  const match = stripped.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (match && match[1].trim()) {
    return {
      title: match[1].trim(),
      quantityText: explicitQty || match[2].trim(),
    };
  }
  return {
    title: stripped,
    quantityText: explicitQty,
  };
}

const cleanText = (value: unknown, max: number): string => {
  if (typeof value !== 'string') throw new Error('حقل نصي غير صالح في المشتريات');
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error('النص أطول من الحد المسموح');
  return trimmed;
};

const cleanNullablePositive = (value: unknown, label: string): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > 100_000_000) {
    throw new Error(`${label} يجب أن تكون رقماً أكبر من صفر أو تُترك فارغة`);
  }
  return Math.round(num * 1000) / 1000;
};

const cleanNullableNonNegative = (value: unknown, label: string): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 100_000_000) {
    throw new Error(`${label} يجب أن تكون صفراً أو رقماً موجباً`);
  }
  return Math.round(num * 1000) / 1000;
};

export function cleanShoppingDraft(draft: ShoppingDraft): ShoppingDraft {
  const title = cleanText(draft.title, 160);
  if (!title) throw new Error('اسم الصنف مطلوب في قائمة المشتريات');
  const category = cleanText(draft.category || 'general', 120) || 'general';
  if (!STORE_CONTEXT_SET.has(draft.storeContext)) {
    throw new Error('جهة الشراء غير صالحة');
  }
  if (!PRIORITY_SET.has(draft.priority)) {
    throw new Error('أولوية الشراء غير صالحة');
  }
  if (!SOURCE_TYPE_SET.has(draft.sourceType)) {
    throw new Error('مصدر صنف المشتريات غير صالح');
  }
  const quantityNeeded = cleanNullablePositive(draft.quantityNeeded, 'الكمية المطلوبة');
  const quantityPurchased = cleanNullableNonNegative(draft.quantityPurchased, 'الكمية المشتراة');
  const unit = cleanText(draft.unit ?? '', 120);
  const quantityText = cleanText(draft.quantityText ?? '', 160);
  const notes = cleanText(draft.notes ?? '', 2000);
  const sourceInventoryItemId = draft.sourceInventoryItemId
    ? cleanText(draft.sourceInventoryItemId, 512)
    : null;
  const legacyTaskId = draft.legacyTaskId
    ? cleanText(draft.legacyTaskId, 512)
    : null;

  return {
    title,
    category,
    storeContext: draft.storeContext,
    quantityNeeded,
    unit,
    quantityText,
    quantityPurchased,
    isBought: Boolean(draft.isBought),
    priority: draft.priority,
    sourceType: draft.sourceType,
    sourceInventoryItemId: sourceInventoryItemId || null,
    legacyTaskId: legacyTaskId || null,
    notes,
  };
}

export function remainingShoppingQuantity(item: ShoppingItem): number | null {
  if (item.quantityNeeded === null) return null;
  const bought = item.quantityPurchased ?? (item.isBought ? item.quantityNeeded : 0);
  return Math.max(0, Math.round((item.quantityNeeded - bought) * 1000) / 1000);
}

export function pendingStockQuantity(item: ShoppingItem): number | null {
  const target = item.quantityPurchased ?? item.quantityNeeded;
  if (target === null) return null;
  return Math.max(0, Math.round((target - item.quantityStocked) * 1000) / 1000);
}

export function deriveShoppingState(item: ShoppingItem): ShoppingDerivedState {
  const targetForStock = item.quantityPurchased ?? item.quantityNeeded;
  if (
    item.quantityStocked > 0 &&
    (targetForStock === null || item.quantityStocked >= targetForStock)
  ) {
    return 'stocked';
  }
  if (
    item.quantityNeeded !== null &&
    item.quantityPurchased !== null &&
    item.quantityPurchased > 0 &&
    item.quantityPurchased < item.quantityNeeded
  ) {
    return 'partially_bought';
  }
  if (item.isBought || (item.quantityPurchased ?? 0) > 0) {
    return 'bought_pending_stock';
  }
  return 'needed';
}

export function canReceiveShoppingItem(item: ShoppingItem): boolean {
  const state = deriveShoppingState(item);
  if (state === 'bought_pending_stock') return true;
  if (state === 'partially_bought') {
    return (item.quantityPurchased ?? 0) > item.quantityStocked;
  }
  return false;
}

export function formatShoppingQuantityBadge(item: ShoppingItem): string {
  const unitLabel = item.unit ? ` ${item.unit}` : '';
  if (
    item.quantityNeeded !== null &&
    item.quantityPurchased !== null &&
    item.quantityPurchased > 0 &&
    item.quantityPurchased < item.quantityNeeded
  ) {
    const remaining = remainingShoppingQuantity(item);
    return `اشتريت ${item.quantityPurchased} من ${item.quantityNeeded}${unitLabel} (متبقي ${remaining}${unitLabel})`;
  }
  if (item.quantityNeeded !== null) {
    return `${item.quantityNeeded}${unitLabel}`;
  }
  if (item.quantityPurchased !== null && item.quantityPurchased > 0) {
    return `${item.quantityPurchased}${unitLabel}`;
  }
  if (item.quantityText) {
    return item.quantityText;
  }
  return '';
}

const isIsoTimestamp = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64 && !Number.isNaN(Date.parse(value));

const isIsoDate = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));

export function validateShoppingRecord(value: unknown): asserts value is ShoppingItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('بيانات صنف المشتريات غير صحيحة.');
  }
  const r = value as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim() || r.id.length > 512) {
    throw new Error('معرّف صنف المشتريات غير صحيح.');
  }
  if (
    typeof r.quantityStocked !== 'number' ||
    !Number.isFinite(r.quantityStocked) ||
    r.quantityStocked < 0 ||
    r.quantityStocked > 100_000_000
  ) {
    throw new Error('الكمية المخزنة لصنف المشتريات غير صحيحة.');
  }
  if (r.boughtAt !== null && !isIsoTimestamp(r.boughtAt)) {
    throw new Error('تاريخ شراء الصنف غير صحيح.');
  }
  if (r.archivedAt !== null && !isIsoTimestamp(r.archivedAt)) {
    throw new Error('تاريخ أرشفة الصنف غير صحيح.');
  }
  if (!isIsoTimestamp(r.createdAt) || !isIsoTimestamp(r.updatedAt)) {
    throw new Error('طوابع وقت صنف المشتريات غير صحيحة.');
  }
  if (typeof r.isBought !== 'boolean') {
    throw new Error('حالة شراء الصنف غير صحيحة.');
  }
  cleanShoppingDraft({
    title: r.title as string,
    category: r.category as string,
    storeContext: r.storeContext as ShoppingStoreContext,
    quantityNeeded: (r.quantityNeeded ?? null) as number | null,
    unit: (r.unit ?? '') as string,
    quantityText: (r.quantityText ?? '') as string,
    quantityPurchased: (r.quantityPurchased ?? null) as number | null,
    isBought: r.isBought,
    priority: r.priority as ShoppingPriority,
    sourceType: r.sourceType as ShoppingSourceType,
    sourceInventoryItemId: (r.sourceInventoryItemId ?? null) as string | null,
    legacyTaskId: (r.legacyTaskId ?? null) as string | null,
    notes: (r.notes ?? '') as string,
  });
}

export function validateStockReceiptRecord(value: unknown): asserts value is StockReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('بيانات إيصال إدخال المخزون غير صحيحة.');
  }
  const r = value as Record<string, unknown>;
  if (typeof r.id !== 'string' || !r.id.trim() || r.id.length > 512) {
    throw new Error('معرّف إيصال المخزون غير صحيح.');
  }
  if (typeof r.operationId !== 'string' || !r.operationId.trim() || r.operationId.length > 128) {
    throw new Error('معرّف عملية إدخال المخزون غير صحيح.');
  }
  if (typeof r.shoppingItemId !== 'string' || !r.shoppingItemId.trim() || r.shoppingItemId.length > 512) {
    throw new Error('معرّف صنف المشتريات المرتبط بالإيصال غير صحيح.');
  }
  if (typeof r.inventoryItemId !== 'string' || !r.inventoryItemId.trim() || r.inventoryItemId.length > 512) {
    throw new Error('معرّف دفعة المخزون المرتبطة بالإيصال غير صحيح.');
  }
  if (
    typeof r.quantityAdded !== 'number' ||
    !Number.isFinite(r.quantityAdded) ||
    r.quantityAdded <= 0 ||
    r.quantityAdded > 100_000_000
  ) {
    throw new Error('الكمية المضافة للمخزون في الإيصال غير صحيحة.');
  }
  if (typeof r.unit !== 'string' || !r.unit.trim() || r.unit.length > 120) {
    throw new Error('وحدة الكمية في الإيصال غير صحيحة.');
  }
  if (typeof r.location !== 'string' || !r.location.trim() || r.location.length > 120) {
    throw new Error('مكان التخزين في الإيصال غير صحيح.');
  }
  if (r.expiresOn !== null && !isIsoDate(r.expiresOn)) {
    throw new Error('تاريخ صلاحية الإيصال غير صحيح.');
  }
  if (!isIsoTimestamp(r.createdAt)) {
    throw new Error('وقت إنشاء الإيصال غير صحيح.');
  }
}
