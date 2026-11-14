import React, { useMemo, useState } from 'react';
import { PackageCheck, X, AlertCircle, Layers } from 'lucide-react';
import {
  INVENTORY_LOCATIONS,
  numericInput,
  type InventoryItem,
} from '../inventory/inventoryModel';
import {
  normalizeShoppingKey,
  pendingStockQuantity,
  type ShoppingItem,
} from './shoppingModel';
import { receiveShoppingToInventory } from './shoppingRepository';

interface ShoppingReceiveModalProps {
  item: ShoppingItem;
  inventoryItems: InventoryItem[];
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const makeOperationId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const ShoppingReceiveModal: React.FC<ShoppingReceiveModalProps> = ({
  item,
  inventoryItems,
  onClose,
  onSuccess,
}) => {
  const linkedBatch = useMemo(() => {
    if (item.sourceInventoryItemId) {
      const byId = inventoryItems.find(inv => inv.id === item.sourceInventoryItemId);
      if (byId) return byId;
    }
    const key = normalizeShoppingKey(item.title);
    return inventoryItems.find(inv => normalizeShoppingKey(inv.name) === key) ?? null;
  }, [item, inventoryItems]);

  const defaultQty = useMemo(() => {
    const pending = pendingStockQuantity(item);
    if (pending !== null && pending > 0) return String(pending);
    return '1';
  }, [item]);

  const [operationId] = useState(makeOperationId);
  const [quantityInput, setQuantityInput] = useState(defaultQty);
  const [unit, setUnit] = useState(item.unit || linkedBatch?.unit || 'قطعة');
  const [location, setLocation] = useState(linkedBatch?.location || 'التموين');
  const [expiresOn, setExpiresOn] = useState(linkedBatch?.expiresOn || '');
  const [createNewBatch, setCreateNewBatch] = useState(
    !linkedBatch || linkedBatch.quantity === null
  );
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const batchWillSplitAutomatically = useMemo(() => {
    if (!linkedBatch || createNewBatch) return false;
    const normExp = expiresOn.trim() || null;
    return (
      linkedBatch.location.trim() !== location.trim() ||
      (linkedBatch.expiresOn ?? null) !== normExp
    );
  }, [linkedBatch, createNewBatch, location, expiresOn]);

  const batchHasUnknownBaseline = Boolean(linkedBatch && linkedBatch.quantity === null);
  const batchHasUnitMismatch = Boolean(
    linkedBatch &&
      linkedBatch.unit.trim() &&
      unit.trim() &&
      normalizeShoppingKey(linkedBatch.unit) !== normalizeShoppingKey(unit)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const parsedQty = numericInput(quantityInput);
      if (parsedQty === null || parsedQty <= 0) {
        setError('أدخل كمية رقمية موجبة لإدخالها للمخزون.');
        return;
      }
      if (!unit.trim()) {
        setError('حدد وحدة الكمية (مثل: كجم، لتر، عبوة، قطعة).');
        return;
      }
      setSubmitting(true);
      const result = await receiveShoppingToInventory({
        shoppingItemId: item.id,
        operationId,
        quantityAdded: parsedQty,
        unit: unit.trim(),
        location: location.trim() || 'غير محدد',
        expiresOn: expiresOn.trim() || null,
        targetInventoryItemId: linkedBatch?.id ?? null,
        createNewBatch:
          createNewBatch || batchHasUnknownBaseline || batchHasUnitMismatch,
        note: note.trim() || undefined,
      });
      onSuccess?.(
        `تم إدخال ${result.receipt.quantityAdded} ${result.receipt.unit} من «${item.title}» إلى ${result.inventoryItem.location}`
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر إدخال الصنف للمخزون');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      dir="rtl"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <PackageCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                إدخال للمخزون: {item.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مراجعة الكمية الفعلية ومكان التخزين وتاريخ الصلاحية قبل تحديث الخزين
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {linkedBatch ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-200">
                <span>دفعة موجودة في الخزين: {linkedBatch.name}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] dark:bg-slate-700">
                  {linkedBatch.location}
                </span>
              </div>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                الرصيد الحالي:{' '}
                {linkedBatch.quantity === null
                  ? 'غير محدد (سيتم إنشاء دفعة جديدة بأرقام مؤكدة)'
                  : `${linkedBatch.quantity} ${linkedBatch.unit}`}
                {linkedBatch.expiresOn ? ` • صلاحية: ${linkedBatch.expiresOn}` : ''}
              </p>
              {batchWillSplitAutomatically && (
                <p className="mt-1.5 flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                  <Layers size={13} />
                  نظراً لاختلاف المكان أو تاريخ الصلاحية، سيتم إنشاء دفعة مستقلة تلقائياً.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
              سيتم إنشاء دفعة جديدة لهذا الصنف في الخزين وتسجيل إيصال استلام (`StockReceipt`).
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                الكمية المشتراة للمخزون *
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={quantityInput}
                onChange={e => setQuantityInput(e.target.value)}
                placeholder="مثال: 2"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                الوحدة *
              </label>
              <input
                type="text"
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder="كجم / لتر / علبة / كيس"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                مكان التخزين
              </label>
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {INVENTORY_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                تاريخ الصلاحية (اختياري)
              </label>
              <input
                type="date"
                value={expiresOn}
                onChange={e => setExpiresOn(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {linkedBatch && !batchHasUnknownBaseline && !batchHasUnitMismatch && (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={createNewBatch}
                onChange={e => setCreateNewBatch(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>إنشاء دفعة منفصلة في الخزين بدلاً من الإضافة للدفعة الحالية</span>
            </label>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              ملاحظة الجرد (اختياري)
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="مثال: عبوة عرض العيلة"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              <PackageCheck size={15} />
              <span>{submitting ? 'جارٍ الإدخال...' : 'تأكيد الإدخال للمخزون'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
