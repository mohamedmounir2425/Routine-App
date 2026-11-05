import { Input, Select, Segmented, Grid, Tooltip } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { Archive, ClipboardList, Pencil, Plus, Search, ShoppingBasket } from 'lucide-react';
import { db } from '../../../db/database';
import { saveTask } from '../../../db/taskQueries';
import { getLocalDateString } from '../../../utils/dateUtils';
import { normalizeFoodText } from '../recipes/recipeModel';
import { inventoryFlags, type InventoryItem } from './inventoryModel';
import { saveInventoryBatch } from './inventoryRepository';
import { InventoryDialog } from './InventoryDialog';
import { InventoryBulkDialog } from './InventoryBulkDialog';
import './inventory.css';
import { InventoryTable } from './InventoryTable';

type StockFilter = 'all' | 'first' | 'expiring' | 'low' | 'out';

export function InventoryLibrary() {
  const screens = Grid.useBreakpoint();
  const [preferredView, setView] = useState<'list' | 'cards' | 'table' | null>(null);
  const view = preferredView ?? (screens.md ? 'table' : 'list');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState('all');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState<StockFilter>('all');
  const [selection, setSelection] = useState<InventoryItem | 'new' | null>(null);
  const [bulk, setBulk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const search = useRef<import('antd').InputRef>(null);
  const today = getLocalDateString();

  useEffect(() => {
    const subscription = liveQuery(() => db.inventoryItems.toArray()).subscribe({
      next: rows => {
        setItems(rows);
        setLoading(false);
      },
      error: () => {
        setError('تعذر تحميل المخزون. أعد فتح الصفحة.');
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (selection || bulk) return;
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        target.closest('input,textarea,select,[role="dialog"],[contenteditable=true]')
      )
        return;
      if (event.key === '/') {
        event.preventDefault();
        search.current?.focus();
      }
      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setSelection('new');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selection, bulk]);

  // Compute filter counts
  const filterCounts = useMemo(() => {
    let first = 0;
    let expiring = 0;
    let low = 0;
    let out = 0;
    for (const item of items) {
      const flags = inventoryFlags(item, today);
      if (flags.useFirst) first++;
      if (flags.expiring || flags.expired) expiring++;
      if (flags.low) low++;
      if (flags.out) out++;
    }
    return { all: items.length, first, expiring, low, out };
  }, [items, today]);

  const visible = useMemo(
    () =>
      items
        .filter(item => {
          const flags = inventoryFlags(item, today);
          return (
            (place === 'all' || item.location === place) &&
            (category === 'all' || item.category === category) &&
            (!query.trim() ||
              normalizeFoodText([item.name, item.notes, item.category].join(' ')).includes(
                normalizeFoodText(query)
              )) &&
            (filter === 'all' ||
              (filter === 'first' && flags.useFirst) ||
              (filter === 'expiring' && (flags.expiring || flags.expired)) ||
              (filter === 'low' && flags.low) ||
              (filter === 'out' && flags.out))
          );
        })
        .sort(
          (a, b) =>
            Number(inventoryFlags(a, today).out) - Number(inventoryFlags(b, today).out) ||
            Number(inventoryFlags(b, today).useFirst) - Number(inventoryFlags(a, today).useFirst) ||
            (a.expiresOn ?? '9999').localeCompare(b.expiresOn ?? '9999') ||
            a.name.localeCompare(b.name, 'ar')
        ),
    [items, query, place, category, filter, today]
  );

  const run = async (callback: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await callback();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر حفظ التغيير.');
    } finally {
      setBusy(false);
    }
  };

  const shopping = (item: InventoryItem) =>
    run(async () => {
      const title = '🛒 ' + item.name;
      const currentTasks = await db.tasks.where('spaceId').equals('home').toArray();
      const exists = currentTasks.some(
        task => !task.isCompleted && normalizeFoodText(task.title) === normalizeFoodText(title)
      );
      if (!exists) {
        await saveTask({
          id: crypto.randomUUID(),
          spaceId: 'home',
          title,
          isCompleted: false,
          priority: 'medium',
          createdAt: new Date().toISOString()
        });
      }
      setMessage(exists ? 'الصنف موجود بالفعل في المشتريات.' : `أُضيف «${item.name}» إلى قائمة المشتريات.`);
    });

  const saved = (text: string) => {
    setMessage(text);
    setError('');
  };

  const addAllShortagesToShopping = () =>
    run(async () => {
      const shortages = items.filter(item => {
        const flags = inventoryFlags(item, today);
        return flags.out || flags.low;
      });
      if (shortages.length === 0) {
        setMessage('لا توجد أصناف ناقصة أو منتهية حاليًا.');
        return;
      }
      const currentTasks = await db.tasks.where('spaceId').equals('home').toArray();
      let added = 0;
      for (const item of shortages) {
        const title = '🛒 ' + item.name;
        const exists = currentTasks.some(
          task => !task.isCompleted && normalizeFoodText(task.title) === normalizeFoodText(title)
        );
        if (!exists) {
          await saveTask({
            id: crypto.randomUUID(),
            spaceId: 'home',
            title,
            isCompleted: false,
            priority: 'medium',
            createdAt: new Date().toISOString()
          });
          added++;
        }
      }
      setMessage(
        added > 0
          ? `تمت إضافة ${added} أصناف ناقصة إلى قائمة المشتريات بنجاح.`
          : 'جميع الأصناف الناقصة موجودة بالفعل في قائمة المشتريات.'
      );
    });

  return (
    <section className="inventory-library" dir="rtl">
      <header className="home-section-heading">
        <div>
          <p className="home-eyebrow">
            <Archive size={16} /> المطبخ
          </p>
          <h2>المخزون والجرد</h2>
          <p>اعرف المتاح في البيت، وحدّث الجرد وقتما يناسبك دون تسجيل إجباري لكل استهلاك.</p>
        </div>
        <div className="inventory-heading-actions">
          <button type="button" className="home-primary-button" onClick={() => setSelection('new')}>
            <Plus size={18} /> إضافة صنف
          </button>
          <button type="button" className="home-secondary-button" onClick={() => setBulk(true)}>
            <ClipboardList size={18} /> بدء جرد دوري
          </button>
          {(filterCounts.low > 0 || filterCounts.out > 0) && (
            <Tooltip title="إضافة كل الأصناف المنتهية والناقصة إلى قائمة المشتريات بضغطة زر">
              <button
                type="button"
                className="home-secondary-button text-amber-300"
                onClick={() => void addAllShortagesToShopping()}
                disabled={busy}
              >
                <ShoppingBasket size={17} /> إضافة النواقص للمشتريات ({filterCounts.low + filterCounts.out})
              </button>
            </Tooltip>
          )}
        </div>
      </header>

      <div className="inventory-info">
        <strong>{items.length} صنف مسجل في المخزون</strong>
        <span>الكميات تعبر عن آخر تسجيل فعلي؛ وعدم تحديد الكمية لا يعني نفاد الصنف.</span>
      </div>

      <div className="home-list-toolbar inventory-filters">
        <Input
          type="search"
          ref={search}
          value={query}
          onChange={event => setQuery(event.target.value)}
          prefix={<Search size={17} />}
          allowClear
          className="home-antd-search"
          aria-label="البحث في المخزون"
          placeholder="ابحث بالاسم، المكان، أو التصنيف…"
        />
        <Select
          showSearch
          aria-label="مكان التخزين"
          value={place}
          onChange={setPlace}
          optionFilterProp="label"
          filterOption={(inputVal, option) =>
            (option?.label?.toString() ?? '').toLowerCase().includes(inputVal.toLowerCase())
          }
          options={[
            { value: 'all', label: 'كل الأماكن' },
            ...Array.from(new Set(items.map(item => item.location).filter(Boolean))).map(value => ({
              value,
              label: value
            }))
          ]}
          style={{ minWidth: 150 }}
        />
        <Select
          showSearch
          aria-label="التصنيف"
          value={category}
          onChange={setCategory}
          optionFilterProp="label"
          filterOption={(inputVal, option) =>
            (option?.label?.toString() ?? '').toLowerCase().includes(inputVal.toLowerCase())
          }
          options={[
            { value: 'all', label: 'كل التصنيفات' },
            ...Array.from(new Set(items.map(item => item.category).filter(Boolean))).map(value => ({
              value,
              label: value
            }))
          ]}
          style={{ minWidth: 150 }}
        />
      </div>

      <div className="home-list-filters" aria-label="فلاتر حالة المخزون">
        {(
          [
            { id: 'all', label: 'الكل', count: filterCounts.all },
            { id: 'first', label: 'استخدم أولًا', count: filterCounts.first },
            { id: 'expiring', label: 'الصلاحية قريبة / تجاوزت', count: filterCounts.expiring },
            { id: 'low', label: 'قليل', count: filterCounts.low },
            { id: 'out', label: 'نفد', count: filterCounts.out }
          ] as const
        ).map(item => (
          <button
            type="button"
            key={item.id}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
            className="inventory-filter-pill"
          >
            <span>{item.label}</span>
            <span className="inventory-filter-badge">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="inventory-view-toolbar">
        <span>{visible.length} صنف مطابق</span>
        <Segmented
          aria-label="طريقة عرض المخزون"
          value={view}
          onChange={value => setView(value as typeof view)}
          options={[
            { value: 'table', label: 'جدول تفاعلي' },
            { value: 'list', label: 'قائمة مدمجة' },
            { value: 'cards', label: 'بطاقات' }
          ]}
        />
      </div>

      {message && <p role="status" className="inventory-success">{message}</p>}
      {error && <p role="alert" className="home-error">{error}</p>}

      {loading ? (
        <p className="home-empty" role="status">
          جارٍ تحميل المخزون…
        </p>
      ) : view === 'table' ? (
        <InventoryTable items={visible} today={today} onOpen={setSelection} onSaved={saved} />
      ) : visible.length === 0 ? (
        <div className="home-empty home-panel">
          <Archive size={34} />
          <h3>{items.length ? 'لا توجد أصناف تطابق البحث' : 'ابدأ بما تعرفه عن مخزونك'}</h3>
          <p>
            {items.length
              ? 'جرّب تغيير البحث أو الفلاتر لعرض أصناف أخرى.'
              : 'سجّل الاسم والمكان حتى لو لم تكن متأكدًا من الكمية أو الصلاحية.'}
          </p>
          {items.length > 0 ? (
            <button
              type="button"
              className="home-secondary-button"
              onClick={() => {
                setQuery('');
                setPlace('all');
                setCategory('all');
                setFilter('all');
              }}
            >
              مسح الفلاتر
            </button>
          ) : (
            <button type="button" className="home-primary-button" onClick={() => setBulk(true)}>
              إدخال أول جرد
            </button>
          )}
        </div>
      ) : (
        <ul className={`inventory-list inventory-view-${view}`}>
          {visible.map(item => {
            const flags = inventoryFlags(item, today);
            const formattedQty =
              item.quantity === null
                ? item.state === 'low'
                  ? 'قليل'
                  : item.state === 'available'
                  ? 'موجود'
                  : item.state === 'out'
                  ? 'نفد'
                  : 'غير معروف'
                : `${item.approximate ? '≈ ' : ''}${item.quantity} ${item.unit}`.trim();

            return (
              <li key={item.id}>
                <div className="inventory-row-main">
                  <div>
                    <h3>{item.name}</h3>
                    <p>
                      {item.location}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                  </div>
                  <strong className="inventory-quantity">{formattedQty}</strong>
                </div>

                <div className="inventory-tags">
                  {flags.out && <span>نفد</span>}
                  {flags.low && <span>كمية قليلة</span>}
                  {flags.useFirst && <span>استخدم أولًا</span>}
                  {flags.expired && <span className="inventory-warning">تجاوز تاريخ الصلاحية</span>}
                  {flags.expiring && (
                    <span className="inventory-warning">
                      {flags.days === 0 ? 'الصلاحية تنتهي اليوم' : `الصلاحية خلال ${flags.days} أيام`}
                    </span>
                  )}
                </div>

                <div className="inventory-row-meta">
                  <span>
                    آخر جرد: {item.lastCountedAt ? new Date(item.lastCountedAt).toLocaleDateString('ar-EG') : 'لم يُسجل'}
                  </span>
                  {item.expiresOn && <span>الصلاحية: {item.expiresOn}</span>}
                  {item.packageSize !== null && (
                    <span>العبوة: {item.packageSize} {item.packageUnit}</span>
                  )}
                </div>

                <div className="inventory-row-actions">
                  <button type="button" className="home-secondary-button" onClick={() => setSelection(item)}>
                    <Pencil size={15} /> تعديل / سجل الجرد
                  </button>
                  <button
                    type="button"
                    className="home-secondary-button"
                    disabled={busy}
                    onClick={() => void shopping(item)}
                  >
                    <ShoppingBasket size={15} /> للمشتريات
                  </button>
                  {!flags.out && (
                    <button
                      type="button"
                      className="home-secondary-button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await saveInventoryBatch([
                            { original: item, mode: 'count', draft: { ...item, quantity: 0, state: 'out' } }
                          ]);
                          saved(`تم تسجيل نفاد «${item.name}» مع الحفاظ على سجله.`);
                        })
                      }
                    >
                      تسجيل النفاد
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selection && (
        <InventoryDialog
          key={selection === 'new' ? 'new' : selection.id}
          original={selection === 'new' ? undefined : selection}
          onClose={() => setSelection(null)}
          onSaved={saved}
        />
      )}
      {bulk && <InventoryBulkDialog items={items} onClose={() => setBulk(false)} onSaved={saved} />}
    </section>
  );
}
