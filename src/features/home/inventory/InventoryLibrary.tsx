import { Segmented, Grid, Tooltip, Dropdown } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, ClipboardList, Ellipsis, SlidersHorizontal, Pencil, Plus, ShoppingBasket } from 'lucide-react';
import { db } from '../../../db/database';
import { saveTask } from '../../../db/taskQueries';
import { getLocalDateString } from '../../../utils/dateUtils';
import { normalizeFoodText } from '../recipes/recipeModel';
import { inventoryFlags, type InventoryItem } from './inventoryModel';
import { saveInventoryBatch } from './inventoryRepository';
import { InventoryDialog } from './InventoryDialog';
import { InventoryBulkDialog } from './InventoryBulkDialog';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { HomeSearchInput, HomeSelect } from '../components/HomeInputs';
import './inventory.css';
import { PantryReview } from './PantryReview';
import { InventoryTable } from './InventoryTable';

type StockFilter = 'all' | 'first' | 'expiring' | 'low' | 'out';

export function InventoryLibrary() {
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const [preferredView, setView] = useState<'list' | 'cards' | 'table' | null>(null);
  const view = preferredView ?? (screens.md ? 'table' : 'list');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const compact = !screens.md;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [place, setPlace] = useState('all');
  const [category, setCategory] = useState('all');
  const [params, setParams] = useSearchParams();
  const requested = params.get('filter');
  const filter: StockFilter = requested === 'first' || requested === 'expiring' || requested === 'low' || requested === 'out' ? requested : 'all';
  const setFilter = (next: StockFilter) => setParams(current => {
    const updated = new URLSearchParams(current);
    if (next === 'all') updated.delete('filter'); else updated.set('filter', next);
    return updated;
  }, { replace: true });
  const [review, setReview] = useState(false);
  const [selection, setSelection] = useState<InventoryItem | 'new' | null>(null);
  const [bulk, setBulk] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
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
        setError('تعذر تحميل خزين البيت. أعد فتح الصفحة.');
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (selection || bulk || review || showShortcuts) return;
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
      } else if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setSelection('new');
      } else if (event.key === '[' || event.key === ']') {
        event.preventDefault();
        navigate('/home/recipes');
      } else if (event.key === '?') {
        event.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selection, bulk, review, showShortcuts, navigate]);

  const scopedItems = useMemo(() => {
    const term = normalizeFoodText(query.trim());
    return items.filter(item =>
      (place === 'all' || item.location === place) &&
      (category === 'all' || item.category === category) &&
      (!term || normalizeFoodText([item.name, item.location, item.notes, item.category].join(' ')).includes(term))
    );
  }, [items, place, category, query]);
  const needsAttention = (flags: ReturnType<typeof inventoryFlags>) => flags.useFirst || flags.expired || flags.expiring;
  const filterCounts = useMemo(() => {
    let first = 0;
    let expiring = 0;
    let low = 0;
    let out = 0;
    for (const item of scopedItems) {
      const flags = inventoryFlags(item, today);
      if (needsAttention(flags)) first++;
      if (flags.expiring || flags.expired) expiring++;
      if (flags.low) low++;
      if (flags.out) out++;
    }
    return { all: scopedItems.length, first, expiring, low, out };
  }, [scopedItems, today]);

  const visible = useMemo(
    () =>
      scopedItems
        .filter(item => {
          const flags = inventoryFlags(item, today);
          return (
            (filter === 'all' ||
              (filter === 'first' && needsAttention(flags)) ||
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
    [scopedItems, filter, today]
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

  const markOut = (item: InventoryItem) => run(async () => {
    await saveInventoryBatch([{ original: item, mode: 'count', draft: { ...item, quantity: 0, state: 'out' } }]);
    setMessage('تم تسجيل نفاد «' + item.name + '» مع الحفاظ على سجله.');
  });

  const saved = (text: string) => {
    setMessage(text);
    setError('');
  };

  const addAllShortagesToShopping = () =>
    run(async () => {
      const shortages = scopedItems.filter(item => {
        const flags = inventoryFlags(item, today);
        return flags.out || flags.low;
      });
      if (shortages.length === 0) {
        setMessage('لا توجد أصناف ناقصة أو منتهية حاليًا.');
        return;
      }
      const currentTasks = await db.tasks.where('spaceId').equals('home').toArray();
      const known = new Set(currentTasks.filter(task => !task.isCompleted).map(task => normalizeFoodText(task.title)));
      let added = 0;
      for (const item of shortages) {
        const title = '🛒 ' + item.name;
        const key = normalizeFoodText(title);
        if (!known.has(key)) {
          await saveTask({
            id: crypto.randomUUID(),
            spaceId: 'home',
            title,
            isCompleted: false,
            priority: 'medium',
            createdAt: new Date().toISOString()
          });
          known.add(key);
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
      <header className="kitchen-unified-header">
        <div className="kitchen-header-right">
          <span className="kitchen-eyebrow">
            <Archive size={15} /> المطبخ
          </span>
          <div className="kitchen-segmented-switch" role="tablist" aria-label="أقسام المطبخ">
            <NavLink
              to="/home/recipes"
              className={({ isActive }) => `kitchen-switch-btn ${isActive ? 'is-active' : ''}`}
            >
              <span className="switch-full">🍲 أكلات البيت</span>
              <span className="switch-short">🍲 أكلات</span>
            </NavLink>
            <NavLink
              to="/home/inventory"
              className={({ isActive }) => `kitchen-switch-btn ${isActive ? 'is-active' : ''}`}
            >
              <span className="switch-full">🧊 خزين البيت</span>
              <span className="switch-short">🧊 خزين</span>
            </NavLink>
          </div>
        </div>

        <div className="kitchen-header-left">
          {!compact && (filterCounts.low > 0 || filterCounts.out > 0) && (
            <Tooltip title="إضافة كل الأصناف المنتهية والناقصة إلى قائمة المشتريات">
              <button
                type="button"
                className="kitchen-action-btn secondary text-amber-500"
                onClick={() => void addAllShortagesToShopping()}
                disabled={busy}
              >
                <ShoppingBasket size={15} />
                <span className="hidden-sm">النواقص للمشتريات</span>
              </button>
            </Tooltip>
          )}
          {items.length > 0 && <Tooltip title="مراجعة أصناف مكان">
            <button
              type="button"
              className="kitchen-action-btn secondary"
              onClick={() => setReview(true)}
            >
              <ClipboardList size={15} />
              <span>جرد مكان</span>
            </button>
          </Tooltip>}
          {!compact && items.length > 0 && <button className="kitchen-action-btn secondary" onClick={() => setBulk(true)}>إدخال جماعي</button>}
          {items.length > 0 && <button
            type="button"
            className="kitchen-action-btn primary"
            onClick={() => setSelection('new')}
            title="إضافة صنف جديد (N)"
            aria-keyshortcuts="N"
          >
            <Plus size={16} />
            <span>إضافة صنف</span>
          </button>}
          {compact && items.length > 0 && <Dropdown trigger={['click']} menu={{ items: [
            { key: 'bulk', label: 'إدخال جماعي / Excel', onClick: () => setBulk(true) },
            ...(filterCounts.low + filterCounts.out > 0 ? [{ key: 'shopping', label: 'النواقص للمشتريات', disabled: busy, onClick: () => void addAllShortagesToShopping() }] : [])
          ] }}>
            <button className="kitchen-action-btn secondary" aria-label="إجراءات الخزين"><Ellipsis size={18} /></button>
          </Dropdown>}
          <button
            type="button"
            className="kitchen-action-btn secondary kitchen-shortcuts-btn"
            onClick={() => setShowShortcuts(true)}
            title="اختصارات لوحة المفاتيح (?)"
            aria-label="اختصارات لوحة المفاتيح"
          >
            <kbd style={{ fontSize: 11, padding: '2px 5px', borderRadius: 4, background: 'var(--home-kbd-bg, rgba(0,0,0,0.06))' }}>?</kbd>
          </button>
        </div>
      </header>

      {items.length > 0 && <>
      <div className={"home-list-toolbar inventory-filters" + (filtersOpen ? " pantry-filters-open" : "")}>
        <HomeSearchInput
          ref={search}
          value={query}
          onChange={event => setQuery(event.target.value)}
          aria-label="البحث في خزين البيت"
          placeholder="ابحث بالاسم، المكان، أو التصنيف…"
          className="flex-1 min-w-[200px]"
        />
        {compact && <button className="pantry-filter-toggle home-secondary-button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}>
          <SlidersHorizontal size={16} /> فلترة{place !== 'all' || category !== 'all' ? ' •' : ''}
        </button>}
        <HomeSelect
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
        <HomeSelect
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
      <div className="inventory-view-toolbar">

        <Segmented
          aria-label="طريقة عرض المخزون"
          value={view}
          onChange={value => setView(value as typeof view)}
          options={[
            { value: 'table', label: 'جدول' },
            { value: 'list', label: 'قائمة' },
            { value: 'cards', label: 'بطاقات' }
          ]}
        />
      </div>
      </div>

      <div className="home-list-filters" aria-label="فلاتر حالة المخزون">
        {(
          [
            { id: 'all', label: 'الكل', count: filterCounts.all },
            { id: 'first', label: 'يحتاج انتباه', count: filterCounts.first },
            { id: 'expiring', label: 'الصلاحية', count: filterCounts.expiring },
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



      </>}
      {message && <p role="status" className="inventory-success">{message}</p>}
      {error && <p role="alert" className="home-error">{error}</p>}

      {loading ? (
        <p className="home-empty" role="status">
          جارٍ تحميل المخزون…
        </p>
      ) : items.length === 0 ? (
        <div className="home-panel pantry-start">
          <Archive size={30} /><h2>ابدأ خزين البيت</h2>
          <p>سجّل صنف بالاسم والمكان، أو انسخ الجرد من Excel مرة واحدة.</p>
          <div><button className="home-primary-button" onClick={() => setSelection('new')}>إضافة صنف</button>
          <button className="home-secondary-button" onClick={() => setBulk(true)}>لصق من Excel</button></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="home-empty"><h3>لا توجد أصناف تطابق البحث</h3>
          <button className="home-secondary-button" onClick={() => { setQuery(''); setPlace('all'); setCategory('all'); setFilter('all'); }}>مسح الفلاتر</button>
        </div>
      ) : view === 'table' ? (
        <InventoryTable items={visible} today={today} onOpen={setSelection} onSaved={saved} />
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
                    <h3><button className="pantry-item-name" onClick={() => setSelection(item)}>{item.name}</button></h3>
                    <p>
                      {item.location}
                      {item.category ? ` · ${item.category}` : ''}
                      {view === 'list' && item.packageSize !== null && ` · العبوة ${item.packageSize} ${item.packageUnit}`}
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

                {view === 'cards' && <div className="inventory-row-meta">
                  <span>
                    آخر جرد: {item.lastCountedAt ? new Date(item.lastCountedAt).toLocaleDateString('ar-EG') : 'لم يُسجل'}
                  </span>
                  {item.expiresOn && <span>الصلاحية: {item.expiresOn}</span>}
                  {item.packageSize !== null && (
                    <span>العبوة: {item.packageSize} {item.packageUnit}</span>
                  )}
                </div>}

                {compact ? <Dropdown trigger={['click']} menu={{ items: [
                  { key: 'edit', label: 'تعديل وسجل الجرد', onClick: () => setSelection(item) },
                  { key: 'shopping', label: 'إضافة للمشتريات', disabled: busy, onClick: () => void shopping(item) },
                  ...(!flags.out ? [{ key: 'out', label: 'تسجيل النفاد', disabled: busy, onClick: () => void markOut(item) }] : [])
                ] }}>
                  <button type="button" className="pantry-row-more" aria-label={'إجراءات ' + item.name}><Ellipsis size={18} /></button>
                </Dropdown> : (
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
                      onClick={() => void markOut(item)}
                    >
                      تسجيل النفاد
                    </button>
                  )}
                </div>
                )}
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
      {review && <PantryReview items={items} initialPlace={place} onClose={() => setReview(false)} onSaved={saved} />}
      {bulk && <InventoryBulkDialog initialTab={items.length ? 'grid' : 'paste'} items={items} onClose={() => setBulk(false)} onSaved={saved} />}

      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </section>
  );
}
