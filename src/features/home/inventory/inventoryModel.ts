import { normalizeFoodText } from '../recipes/recipeModel';
export const INVENTORY_LOCATIONS = ['الثلاجة', 'الديب فريزر', 'التموين', 'غير محدد'] as const;
export type StockState = 'available' | 'low' | 'out' | 'unknown';
export type InventoryMode = 'count' | 'purchase' | 'edit';
export interface InventoryEntry { id: string; at: string; kind: InventoryMode; before: number | null; after: number | null; unit: string; delta: number | null; note: string }
export interface InventoryItem {
  id: string; name: string; category: string; location: string; quantity: number | null; unit: string; state: StockState;
  approximate: boolean; packageSize: number | null; packageUnit: string; expiresOn: string | null; useFirst: boolean; lowThreshold: number | null;
  notes: string; lastCountedAt: string | null; history: InventoryEntry[]; createdAt: string; updatedAt: string;
}
export type InventoryDraft = Omit<InventoryItem, 'id' | 'lastCountedAt' | 'history' | 'createdAt' | 'updatedAt'>;
export const emptyInventory = (): InventoryDraft => ({ name: '', category: '', location: 'غير محدد', quantity: null, unit: '', state: 'unknown', approximate: false, packageSize: null, packageUnit: '', expiresOn: null, useFirst: false, lowThreshold: null, notes: '' });
export function numericInput(value: string): number | null {
  const normalized = value.trim().replace(/[٠-٩]/g, ch => String(ch.charCodeAt(0) - 1632)).replace(/[۰-۹]/g, ch => String(ch.charCodeAt(0) - 1776)).replace(/[٫,]/g, '.');
  if (!normalized) return null;
  if (!/^\d+(\.\d+)?$/.test(normalized)) throw new Error('الكمية يجب أن تكون رقمًا موجبًا أو فارغة إذا لم تكن معروفة.');
  const result = Number(normalized);
  if (!Number.isFinite(result) || result > 100000000) throw new Error('الكمية أكبر من الحد المسموح.');
  return result;
}
export function validStockDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(value + 'T12:00:00Z'); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
export function cleanInventory(draft: InventoryDraft): InventoryDraft {
  if (typeof draft.name !== 'string' || !draft.name.trim() || draft.name.trim().length > 160) throw new Error('اسم الصنف مطلوب، بحد أقصى ١٦٠ حرف.');
  for (const key of ['category', 'location', 'unit', 'packageUnit', 'notes'] as const) if (typeof draft[key] !== 'string' || draft[key].length > (key === 'notes' ? 4000 : 120)) throw new Error('راجع بيانات الصنف.');
  for (const value of [draft.quantity, draft.packageSize, draft.lowThreshold]) if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100000000)) throw new Error('راجع الأرقام؛ الكمية المجهولة تُترك فارغة.');
  if (draft.packageSize !== null && draft.packageSize <= 0) throw new Error('حجم العبوة يجب أن يكون أكبر من صفر.');
  if (!['available', 'low', 'out', 'unknown'].includes(draft.state) || typeof draft.useFirst !== 'boolean' || typeof draft.approximate !== 'boolean') throw new Error('حالة الصنف غير صحيحة.');
  if (draft.expiresOn !== null && !validStockDate(draft.expiresOn)) throw new Error('تاريخ الصلاحية غير صحيح.');
  if (draft.quantity !== null && draft.quantity > 0 && !draft.unit.trim()) throw new Error('حدد وحدة الكمية، مثل كيلو أو كيس أو قطعة.');
  const quantity = draft.state === 'out' ? 0 : draft.quantity;
  return { ...draft, name: draft.name.trim(), category: draft.category.trim(), location: draft.location.trim() || 'غير محدد', unit: draft.unit.trim(), packageUnit: draft.packageUnit.trim(), notes: draft.notes.trim(), quantity, state: quantity === 0 ? 'out' : quantity !== null ? draft.state === 'low' ? 'low' : 'available' : draft.state };
}
export function validateInventoryRecord(value: unknown): asserts value is InventoryItem {
  if (!value || typeof value !== 'object') throw new Error('سجل مخزون غير صحيح.');
  const row = value as InventoryItem;
  const cleaned = cleanInventory(row);
  if (cleaned.quantity !== row.quantity || cleaned.state !== row.state) throw new Error('الكمية لا تطابق حالة الصنف.');
  if (typeof row.id !== 'string' || !row.id || row.id.length > 512 || !Array.isArray(row.history) || ![row.createdAt, row.updatedAt].every(at => typeof at === 'string' && Number.isFinite(Date.parse(at))) || row.lastCountedAt !== null && (typeof row.lastCountedAt !== 'string' || !Number.isFinite(Date.parse(row.lastCountedAt)))) throw new Error('سجل مخزون غير مكتمل.');
  for (const entry of row.history) if (!entry || typeof entry.id !== 'string' || !entry.id || typeof entry.at !== 'string' || !Number.isFinite(Date.parse(entry.at)) || !['count', 'purchase', 'edit'].includes(entry.kind) || typeof entry.unit !== 'string' || typeof entry.note !== 'string' || [entry.before, entry.after].some(n => n !== null && (typeof n !== 'number' || !Number.isFinite(n) || n < 0)) || entry.delta !== null && (typeof entry.delta !== 'number' || !Number.isFinite(entry.delta))) throw new Error('سجل جرد غير صحيح.');
}
export function inventoryFlags(item: InventoryItem, today: string) {
  const days = item.expiresOn ? Math.round((Date.parse(item.expiresOn + 'T12:00:00Z') - Date.parse(today + 'T12:00:00Z')) / 86400000) : null;
  const out = item.quantity === 0 || item.state === 'out';
  return { out, low: !out && (item.state === 'low' || item.quantity !== null && item.lowThreshold !== null && item.quantity <= item.lowThreshold), expired: !out && days !== null && days < 0, expiring: !out && days !== null && days >= 0 && days <= 7, useFirst: !out && item.useFirst, days };
}
export const inventoryIdentity = (item: Pick<InventoryDraft, 'name' | 'location' | 'expiresOn'>) => [normalizeFoodText(item.name), normalizeFoodText(item.location), item.expiresOn ?? ''].join('|');
