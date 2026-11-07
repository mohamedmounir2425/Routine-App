import { normalizeFoodText } from '../recipes/recipeModel';
import { inventoryFlags, type InventoryItem } from './inventoryModel';

export type InventorySearchMode = 'all' | 'name' | 'location' | 'category';
export type InventorySort = 'attention' | 'name' | 'expiry' | 'recent' | 'quantity' | 'location';
export type InventorySortDirection = 'asc' | 'desc';

export function matchesInventorySearch(item: InventoryItem, query: string, mode: InventorySearchMode) {
  const term = normalizeFoodText(query.trim());
  const text = mode === 'all' ? [item.name, item.location, item.category, item.notes].join(' ') : item[mode];
  return !term || normalizeFoodText(text).includes(term);
}

export function inventoryNeedsAttention(flags: ReturnType<typeof inventoryFlags>) {
  return flags.useFirst || flags.expired || flags.expiring || flags.low || flags.out;
}

export function formatInventoryQuantity(item: InventoryItem) {
  if (item.quantity !== null) return `${item.approximate ? '≈ ' : ''}${item.quantity} ${item.unit}`.trim();
  return { low: 'قليل', available: 'موجود', out: 'نفد', unknown: 'غير معروف' }[item.state];
}

export function sortInventory(items: InventoryItem[], sort: InventorySort, today: string, direction: InventorySortDirection = 'asc') {
  const rank = (item: InventoryItem) => {
    const f = inventoryFlags(item, today);
    return f.expired ? 0 : f.expiring ? 1 : f.useFirst ? 2 : f.out ? 3 : f.low ? 4 : 5;
  };
  return [...items].sort((a, b) => {
    const name = a.name.localeCompare(b.name, 'ar');
    const sign = direction === 'asc' ? 1 : -1;
    if (sort === 'name') return sign * name;
    if (sort === 'location') return sign * (a.location.localeCompare(b.location, 'ar') || name);
    if (sort === 'quantity') {
      if (a.quantity === null || b.quantity === null) return a.quantity === b.quantity ? name : a.quantity === null ? 1 : -1;
      return sign * (a.quantity - b.quantity || name);
    }
    if (sort === 'recent') return sign * (b.updatedAt.localeCompare(a.updatedAt) || name);
    if (sort === 'expiry' && (!a.expiresOn || !b.expiresOn)) return a.expiresOn === b.expiresOn ? name : !a.expiresOn ? 1 : -1;
    const expiry = (a.expiresOn ?? '9999').localeCompare(b.expiresOn ?? '9999');
    return sign * ((sort === 'attention' ? rank(a) - rank(b) : 0) || expiry || name);
  });
}
