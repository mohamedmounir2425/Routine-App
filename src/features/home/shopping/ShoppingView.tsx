import React, { useEffect, useMemo, useState } from 'react';
import { liveQuery } from 'dexie';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Copy,
  Check,
  PackagePlus,
  PackageCheck,
  Sparkles,
  Archive,
  Search,
  SplitSquareVertical,
} from 'lucide-react';
import { db } from '../../../db/database';
import { getLocalDateString } from '../../../utils/dateUtils';
import { isShoppingTask } from '../homeTasks';
import { numericInput, type InventoryItem } from '../inventory/inventoryModel';
import {
  SHOPPING_CATEGORIES,
  SHOPPING_STORE_CONTEXTS,
  canReceiveShoppingItem,
  deriveShoppingState,
  emptyShoppingDraft,
  formatShoppingQuantityBadge,
  normalizeShoppingKey,
  parseShoppingTitle,
  type ShoppingPriority,
  type ShoppingStoreContext,
  type ShoppingItem,
} from './shoppingModel';
import {
  addShortagesFromInventoryToShopping,
  clearCompletedShoppingItems,
  deleteShoppingItem,
  migrateLegacyShoppingTasks,
  saveShoppingItem,
  toggleShoppingItemBought,
} from './shoppingRepository';
import { ShoppingReceiveModal } from './ShoppingReceiveModal';

type ShoppingTabFilter = 'needed' | 'pending_stock' | 'stocked' | 'all';

export const ShoppingView: React.FC = () => {
  const [titleInput, setTitleInput] = useState('');
  const [qtyNumberInput, setQtyNumberInput] = useState('');
  const [unitInput, setUnitInput] = useState('');
  const [qtyTextInput, setQtyTextInput] = useState('');
  const [storeContextInput, setStoreContextInput] = useState<ShoppingStoreContext>('supermarket');
  const [categoryInput, setCategoryInput] = useState('general');
  const [priorityInput, setPriorityInput] = useState<ShoppingPriority>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ShoppingTabFilter>('needed');
  const [storeFilter, setStoreFilter] = useState<ShoppingStoreContext | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [receivingItem, setReceivingItem] = useState<ShoppingItem | null>(null);
  const [partialEditId, setPartialEditId] = useState<string | null>(null);
  const [partialValue, setPartialValue] = useState('');

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [legacyCount, setLegacyCount] = useState(0);

  useEffect(() => {
    const sub = liveQuery(async () => {
      const [shoppingRows, inventoryRows, homeTasks] = await Promise.all([
        db.shoppingItems.toArray(),
        db.inventoryItems.toArray(),
        db.tasks.where('spaceId').equals('home').toArray(),
      ]);
      const legacyTasks = homeTasks.filter(task => isShoppingTask(task));
      return {
        shoppingItems: shoppingRows
          .filter(item => !item.archivedAt)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        inventoryItems: inventoryRows,
        legacyCount: legacyTasks.length,
      };
    }).subscribe({
      next: res => {
        setShoppingItems(res.shoppingItems);
        setInventoryItems(res.inventoryItems);
        setLegacyCount(res.legacyCount);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const counts = useMemo(() => {
    let needed = 0;
    let pendingStock = 0;
    let stocked = 0;
    for (const item of shoppingItems) {
      const state = deriveShoppingState(item);
      if (state === 'needed' || state === 'partially_bought') needed++;
      if (canReceiveShoppingItem(item)) pendingStock++;
      if (state === 'stocked') stocked++;
    }
    return { needed, pendingStock, stocked, all: shoppingItems.length };
  }, [shoppingItems]);

  const filteredItems = useMemo(() => {
    const q = normalizeShoppingKey(searchQuery);
    return shoppingItems.filter(item => {
      if (storeFilter !== 'all' && item.storeContext !== storeFilter) return false;
      if (q && !normalizeShoppingKey(`${item.title} ${item.notes} ${item.quantityText}`).includes(q)) {
        return false;
      }
      const state = deriveShoppingState(item);
      if (activeTab === 'needed') {
        return state === 'needed' || state === 'partially_bought';
      }
      if (activeTab === 'pending_stock') {
        return canReceiveShoppingItem(item);
      }
      if (activeTab === 'stocked') {
        return state === 'stocked';
      }
      return true;
    });
  }, [shoppingItems, storeFilter, searchQuery, activeTab]);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(current => (current === msg ? null : current)), 3500);
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;
    try {
      const parsed = parseShoppingTitle(titleInput, qtyTextInput);
      const parsedNumeric = numericInput(qtyNumberInput);
      await saveShoppingItem({
        ...emptyShoppingDraft(),
        title: parsed.title,
        category: categoryInput,
        storeContext: storeContextInput,
        quantityNeeded: parsedNumeric,
        unit: unitInput.trim(),
        quantityText: parsed.quantityText,
        priority: priorityInput,
        sourceType: 'manual',
      });
      setTitleInput('');
      setQtyNumberInput('');
      setUnitInput('');
      setQtyTextInput('');
      showNotice(`أُضيف «${parsed.title}» إلى قائمة المشتريات`);
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'تعذر إضافة الصنف');
    }
  };

  const handleImportShortages = async () => {
    const today = getLocalDateString();
    const res = await addShortagesFromInventoryToShopping(inventoryItems, today);
    if (res.added > 0) {
      showNotice(`تم استيراد ${res.added} صنف ناقص من الخزين إلى قائمة المشتريات`);
    } else if (res.skipped > 0) {
      showNotice('جميع نواقص الخزين موجودة بالفعل في قائمة المشتريات النشطة');
    } else {
      showNotice('لا توجد نواقص مسجلة حالياً في الخزين');
    }
  };

  const handleMigrateLegacy = async () => {
    const res = await migrateLegacyShoppingTasks();
    if (res.migrated > 0) {
      showNotice(`تم ترحيل ${res.migrated} صنف من المشتريات القديمة بنجاح`);
    }
  };

  const handleCopyList = () => {
    const neededItems = shoppingItems.filter(item => {
      const state = deriveShoppingState(item);
      return state === 'needed' || state === 'partially_bought';
    });
    if (!neededItems.length) {
      showNotice('لا توجد أصناف مطلوبة لنسخها حالياً');
      return;
    }
    const lines = neededItems.map(item => {
      const badge = formatShoppingQuantityBadge(item);
      const store = SHOPPING_STORE_CONTEXTS.find(s => s.id === item.storeContext)?.label;
      return `• ${item.title}${badge ? ` (${badge})` : ''}${store && item.storeContext !== 'any' ? ` - ${store}` : ''}`;
    });
    const text = `🛒 قائمة مشتريات البيت:\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSavePartial = async (item: ShoppingItem) => {
    try {
      const num = numericInput(partialValue);
      await toggleShoppingItemBought(item.id, { quantityPurchased: num });
      setPartialEditId(null);
      setPartialValue('');
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'كمية غير صالحة');
    }
  };

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      {/* Header & Top Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              قائمة المشتريات وإدخال المخزون
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              سجّل النواقص والمشتريات، واعتمد إدخالها الفعلي للخزين بالكمية والصلاحية
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleImportShortages}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <PackagePlus size={15} />
            <span>استيراد نواقص الخزين</span>
          </button>

          <button
            type="button"
            onClick={handleCopyList}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ القائمة'}</span>
          </button>

          {(counts.pendingStock > 0 || counts.stocked > 0) && (
            <button
              type="button"
              onClick={async () => {
                const count = await clearCompletedShoppingItems();
                if (count > 0) showNotice(`تمت أرشفة ${count} صنف مكتمل`);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
            >
              <Archive size={14} />
              <span>أرشفة المكتمل</span>
            </button>
          )}
        </div>
      </div>

      {/* Legacy Shopping Tasks Migration Banner */}
      {legacyCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles size={16} className="text-amber-600 dark:text-amber-400" />
            <span>
              يوجد {legacyCount} عنصر مشتريات قديم محفوظ كمهمة منزلية (`🛒`). يمكنك ترحيله الآن إلى نظام المشتريات المستقل دون فقدان أي بيانات.
            </span>
          </div>
          <button
            type="button"
            onClick={handleMigrateLegacy}
            className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
          >
            ترحيل المشتريات القديمة ({legacyCount})
          </button>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {/* Quick Add Form */}
      <form
        onSubmit={handleQuickAdd}
        className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              اسم الصنف *
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={e => setTitleInput(e.target.value)}
              placeholder="مثال: لبن كامل الدسم، طماطم، مسحوق غسيل..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2 md:col-span-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                الكمية (رقم)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={qtyNumberInput}
                onChange={e => setQtyNumberInput(e.target.value)}
                placeholder="مثال: 2"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                الوحدة
              </label>
              <input
                type="text"
                value={unitInput}
                onChange={e => setUnitInput(e.target.value)}
                placeholder="كجم / لتر / علبة"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="mb-1 block text-[11px] font-bold text-slate-600 dark:text-slate-400">
              أو وصف كمية حر (اختياري)
            </label>
            <input
              type="text"
              value={qtyTextInput}
              onChange={e => setQtyTextInput(e.target.value)}
              placeholder="مثال: حزمة كبيرة / عبوة عرض"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-end md:col-span-2">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-xs hover:bg-amber-700"
            >
              <Plus size={17} />
              <span>إضافة</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2.5 text-xs dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">جهة الشراء:</span>
            <select
              value={storeContextInput}
              onChange={e => setStoreContextInput(e.target.value as ShoppingStoreContext)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {SHOPPING_STORE_CONTEXTS.map(ctx => (
                <option key={ctx.id} value={ctx.id}>
                  {ctx.icon} {ctx.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">التصنيف:</span>
            <select
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {SHOPPING_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500">الأولوية:</span>
            <select
              value={priorityInput}
              onChange={e => setPriorityInput(e.target.value as ShoppingPriority)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="high">عالية (ضروري)</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
        </div>
      </form>

      {/* Filters & Status Tabs */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
            {[
              { id: 'needed' as const, label: 'المطلوب شراؤه', count: counts.needed },
              {
                id: 'pending_stock' as const,
                label: 'تم شراؤه • بانتظار الإدخال للمخزون',
                count: counts.pendingStock,
              },
              { id: 'stocked' as const, label: 'تم إدخاله للمخزون', count: counts.stocked },
              { id: 'all' as const, label: 'الكل', count: counts.all },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-slate-200/80 px-1.5 py-0.2 text-[11px] dark:bg-slate-700">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search
              size={14}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث في المشتريات..."
              className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-8 pl-3 text-xs text-slate-800 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Store Context Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStoreFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              storeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            كل الجهات
          </button>
          {SHOPPING_STORE_CONTEXTS.map(ctx => (
            <button
              key={ctx.id}
              type="button"
              onClick={() => setStoreFilter(ctx.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                storeFilter === ctx.id
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {ctx.icon} {ctx.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-10 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            لا توجد أصناف في هذا العرض حالياً
          </p>
          <p className="mt-1 text-xs text-slate-400">
            أضف صنفاً جديداً بالأعلى أو استورد النواقص مباشرة من الخزين
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map(item => {
            const state = deriveShoppingState(item);
            const qtyBadge = formatShoppingQuantityBadge(item);
            const storeInfo = SHOPPING_STORE_CONTEXTS.find(s => s.id === item.storeContext);
            const canReceive = canReceiveShoppingItem(item);

            return (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                  state === 'stocked'
                    ? 'border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/15'
                    : item.isBought
                      ? 'border-amber-200/80 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/15'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleShoppingItemBought(item.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                    title={item.isBought ? 'إلغاء علامة الشراء' : 'تحديد كمشتراة'}
                  >
                    {item.isBought || state === 'stocked' ? (
                      <CheckCircle2 size={21} className="text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle size={21} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold ${
                          state === 'stocked'
                            ? 'text-slate-500 line-through dark:text-slate-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </span>

                      {qtyBadge && (
                        <span className="rounded-lg bg-amber-100/80 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                          {qtyBadge}
                        </span>
                      )}

                      {storeInfo && item.storeContext !== 'any' && (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {storeInfo.icon} {storeInfo.label}
                        </span>
                      )}

                      {item.sourceType === 'inventory_low' && (
                        <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                          نقص خزين
                        </span>
                      )}

                      {item.sourceType === 'recipe' && (
                        <span className="rounded-lg bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                          مكون وصفة
                        </span>
                      )}

                      {state === 'partially_bought' && (
                        <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                          شراء جزئي
                        </span>
                      )}

                      {state === 'stocked' && (
                        <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          تم الإدخال للخزين ({item.quantityStocked} {item.unit})
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.notes}</p>
                    )}

                    {/* Partial purchase inline editor */}
                    {partialEditId === item.id && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={partialValue}
                          onChange={e => setPartialValue(e.target.value)}
                          placeholder={`الكمية التي اشتريتها من ${item.quantityNeeded ?? ''}`}
                          className="w-40 rounded-lg border border-slate-300 px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePartial(item)}
                          className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-700"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          onClick={() => setPartialEditId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.quantityNeeded !== null &&
                    item.quantityNeeded > 1 &&
                    state !== 'stocked' && (
                      <button
                        type="button"
                        onClick={() => {
                          setPartialEditId(partialEditId === item.id ? null : item.id);
                          setPartialValue(
                            item.quantityPurchased !== null ? String(item.quantityPurchased) : ''
                          );
                        }}
                        className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="تسجيل شراء جزئي"
                      >
                        <SplitSquareVertical size={13} />
                        <span>شراء جزئي</span>
                      </button>
                    )}

                  {canReceive && (
                    <button
                      type="button"
                      onClick={() => setReceivingItem(item)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                    >
                      <PackageCheck size={14} />
                      <span>أضف للمخزون 📦</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteShoppingItem(item)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    title="حذف الصنف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {receivingItem && (
        <ShoppingReceiveModal
          item={receivingItem}
          inventoryItems={inventoryItems}
          onClose={() => setReceivingItem(null)}
          onSuccess={msg => showNotice(msg)}
        />
      )}
    </div>
  );
};
