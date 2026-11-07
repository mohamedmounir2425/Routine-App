import { KitchenHeader, KitchenActionButton } from '../components/KitchenHeader';
import { InventoryActions, InventoryStatus } from './InventoryItemUI';
import { formatInventoryQuantity, inventoryNeedsAttention, matchesInventorySearch, sortInventory, type InventorySearchMode, type InventorySort, type InventorySortDirection } from './inventoryPresentation';
import { HomeButton } from '../components/HomeButton';
import { Segmented, Grid, Dropdown, Pagination, Tag } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { liveQuery } from 'dexie';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, ClipboardList, Ellipsis, ArrowDownUp, Plus, ShoppingBasket, LayoutGrid, List, Table2, X } from 'lucide-react';
import { db } from '../../../db/database';
import { saveTask } from '../../../db/taskQueries';
import { getLocalDateString } from '../../../utils/dateUtils';
import { normalizeFoodText } from '../recipes/recipeModel';
import { inventoryFlags, type InventoryItem } from './inventoryModel';
import { saveInventoryBatch } from './inventoryRepository';
import { InventoryDialog } from './InventoryDialog';
import { InventoryBulkDialog } from './InventoryBulkDialog';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { HomeCompactSearch, HomeSelect } from '../components/HomeInputs';
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
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<InventorySearchMode>('all');
  const [sort, setSort] = useState<InventorySort>('attention');
  const [sortDirection, setSortDirection] = useState<InventorySortDirection>('asc');
  const changeSort = (next: InventorySort, direction: InventorySortDirection = 'asc') => { setSort(next); setSortDirection(direction); };
  const [page, setPage] = useState(1);
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
    return items.filter(item =>
      (place === 'all' || item.location === place) &&
      (category === 'all' || item.category === category) &&
      matchesInventorySearch(item, query, searchMode)
    );
  }, [items, place, category, query, searchMode]);
  const filterCounts = useMemo(() => {
    let first = 0;
    let expiring = 0;
    let low = 0;
    let out = 0;
    for (const item of scopedItems) {
      const flags = inventoryFlags(item, today);
      if (inventoryNeedsAttention(flags)) first++;
      if (flags.expiring || flags.expired) expiring++;
      if (flags.low) low++;
      if (flags.out) out++;
    }
    return { all: scopedItems.length, first, expiring, low, out };
  }, [scopedItems, today]);

  const visible = useMemo(
    () =>
      sortInventory(scopedItems
        .filter(item => {
          const flags = inventoryFlags(item, today);
          return (
            (filter === 'all' ||
              (filter === 'first' && inventoryNeedsAttention(flags)) ||
              (filter === 'expiring' && (flags.expiring || flags.expired)) ||
              (filter === 'low' && flags.low) ||
              (filter === 'out' && flags.out))
          );
        }), sort, today, sortDirection),
    [scopedItems, filter, today, sort, sortDirection]
  );
  useEffect(() => { setPage(1); }, [query, searchMode, place, category, filter, sort, sortDirection, view]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(visible.length / 12)));
  const pagedItems = visible.slice((currentPage - 1) * 12, currentPage * 12);
  const resetFilters = () => { setQuery(''); setPlace('all'); setCategory('all'); setFilter('all'); };

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
    <section className="inventory-library min-w-0 text-home-text" dir="rtl">
      <KitchenHeader>
        <KitchenActionButton variant="primary"  onClick={() => setSelection('new')} aria-keyshortcuts="N" title="إضافة صنف (N)">
          <Plus size={16} /><span>إضافة صنف</span>
        </KitchenActionButton>
        <Dropdown trigger={['click']} menu={{ items: [
          { key: 'review', icon: <ClipboardList size={16} />, label: 'جرد مكان', disabled: !items.length, onClick: () => setReview(true) },
          { key: 'bulk', label: 'إدخال جماعي / Excel', onClick: () => setBulk(true) },
          { key: 'shopping', icon: <ShoppingBasket size={16} />, label: 'النواقص للمشتريات', disabled: busy || filterCounts.low + filterCounts.out === 0, onClick: () => void addAllShortagesToShopping() },
          { type: 'divider' },
          { key: 'shortcuts', label: 'اختصارات لوحة المفاتيح', onClick: () => setShowShortcuts(true) },
        ] }}>
          <KitchenActionButton variant="secondary"  aria-label="إجراءات الخزين" icon={<Ellipsis size={18} />} />
        </Dropdown>
      </KitchenHeader>

      {items.length > 0 && <section className="pantry-search-panel mb-3 flex min-w-0 flex-col gap-3 rounded-home-panel border border-home-border bg-home-panel p-3" aria-label="البحث والفلترة">
        <div className="pantry-search-row grid min-w-0 grid-cols-1 items-end gap-3 lg:grid-cols-[minmax(280px,1.5fr)_minmax(0,1fr)]">
          <HomeCompactSearch
            mobileCompact
            inputRef={search} mode={searchMode} onModeChange={setSearchMode}
            modeLabel="البحث في المخزون حسب"
            modeOptions={[
              { value: 'all', label: 'الكل' }, { value: 'name', label: 'بالاسم' },
              { value: 'location', label: 'بالمكان' }, { value: 'category', label: 'بالتصنيف' },
            ]}
            value={query} onChange={setQuery} placeholder="ابحث في الخزين…" selectWidth={115}
          />
        <div className="pantry-visible-filters grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm text-home-muted max-sm:gap-1 max-sm:text-xs">مكان التخزين
            <HomeSelect aria-label="مكان التخزين" value={place} onChange={setPlace} showSearch optionFilterProp="label" className="w-full max-sm:min-h-11 max-sm:text-sm max-sm:[&_input]:text-base"
              options={[{ value: 'all', label: 'كل الأماكن' }, ...[...new Set(items.map(item => item.location).filter(Boolean))].map(value => ({ value, label: value }))]} />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-sm text-home-muted max-sm:gap-1 max-sm:text-xs">التصنيف
            <HomeSelect aria-label="التصنيف" value={category} onChange={setCategory} showSearch optionFilterProp="label" className="w-full max-sm:min-h-11 max-sm:text-sm max-sm:[&_input]:text-base"
              options={[{ value: 'all', label: 'كل التصنيفات' }, ...[...new Set(items.map(item => item.category).filter(Boolean))].map(value => ({ value, label: value }))]} />
          </label>
        </div>
        </div>
        <div className="flex min-w-0 items-center gap-2">
        <div className="pantry-status-filters flex-1 flex min-w-0 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="فلاتر حالة المخزون">
          {([
            { id: 'all', label: 'الكل', count: filterCounts.all },
            { id: 'first', label: 'يحتاج انتباه', count: filterCounts.first },
            { id: 'expiring', label: 'الصلاحية', count: filterCounts.expiring },
            { id: 'low', label: 'قليل', count: filterCounts.low },
            { id: 'out', label: 'نفد', count: filterCounts.out },
          ] as const).map(item => <HomeButton key={item.id} className="pantry-status-pill shrink-0 whitespace-nowrap rounded-full border border-home-border bg-home-input px-3 text-sm text-home-muted aria-pressed:border-home-accent aria-pressed:bg-home-selection aria-pressed:text-home-selection-text" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>
            <span>{item.label}</span><span className="pantry-filter-count text-xs opacity-80">{item.count}</span>
          </HomeButton>)}
        </div>
        </div>
        {(place !== 'all' || category !== 'all' || query || filter !== 'all') && <div className="pantry-active-filters flex flex-wrap items-center gap-1.5 border-t border-home-border pt-2">
          {place !== 'all' && <Tag closable onClose={() => setPlace('all')}>المكان: {place}</Tag>}
          {category !== 'all' && <Tag closable onClose={() => setCategory('all')}>التصنيف: {category}</Tag>}
          <HomeButton onClick={resetFilters} icon={<X size={14} />}>مسح الفلاتر</HomeButton>
        </div>}
      </section>}
      {items.length > 0 && <div className="pantry-results-toolbar mb-3 flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="m-0 text-sm text-home-muted"><strong className="text-home-text">{visible.length}</strong> من {items.length} صنف</p>
        <div className="pantry-display-controls grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 sm:flex sm:w-auto">
          <HomeSelect aria-label="ترتيب المخزون" value={sort} onChange={value => changeSort(value)} className="pantry-sort-select min-w-0 sm:w-48" options={[
            { value: 'attention', label: 'الأكثر احتياجًا للانتباه' }, { value: 'name', label: 'الاسم أبجديًا' },
            { value: 'expiry', label: 'الأقرب صلاحية' }, { value: 'recent', label: 'آخر تعديل' },
            { value: 'quantity', label: 'الكمية' }, { value: 'location', label: 'المكان' },
          ]} />
          <HomeButton icon={<ArrowDownUp size={17} />} aria-label={sortDirection === 'asc' ? 'عكس الترتيب إلى تنازلي' : 'عكس الترتيب إلى تصاعدي'} title={sortDirection === 'asc' ? 'عكس الترتيب إلى تنازلي' : 'عكس الترتيب إلى تصاعدي'} onClick={() => setSortDirection(value => value === 'asc' ? 'desc' : 'asc')} />
          <Segmented aria-label="طريقة عرض المخزون" value={view} onChange={value => setView(value as typeof view)} options={[
            { value: 'table', label: <span aria-label="جدول" title="جدول"><Table2 size={17} /></span> },
            { value: 'list', label: <span aria-label="قائمة" title="قائمة"><List size={17} /></span> },
            { value: 'cards', label: <span aria-label="بطاقات" title="بطاقات"><LayoutGrid size={17} /></span> },
          ]} />
        </div>
      </div>}

      {message && <p role="status" className="inventory-success p-[12px_16px] border border-solid border-home-green-border rounded-home-control bg-home-green-bg text-home-green-text mb-3.5">{message}</p>}
      {error && <p role="alert" className="home-error p-[12px_16px] border border-solid border-home-border rounded-home-control bg-home-error-bg text-home-error-text text-[14px]">{error}</p>}

      {loading ? (
        <p className="home-empty flex flex-col items-center gap-2.5 p-[28px_14px] text-home-muted text-[14px] text-center [&>svg]:text-home-green [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-home-text" role="status">
          جارٍ تحميل المخزون…
        </p>
      ) : items.length === 0 ? (
        <div className="home-panel pantry-start max-[600.01px]:p-[17px_14px] max-[600.01px]:rounded-[16px] [.home-space_&]:rounded-home-panel [.home-space_&]:p-4.5 max-[600.01px]:[.home-space_&]:p-3.5 grid justify-items-center text-center gap-3 mt-4 !py-[clamp(32px,5vw,64px)] [&>svg]:text-home-accent [&_h2]:text-[22px] [&_h2]:font-[750] [&_p]:text-home-muted [&>div]:flex [&>div]:gap-2.5 [&>div]:flex-wrap [&>div]:justify-center">
          <Archive size={30} /><h2>ابدأ خزين البيت</h2>
          <p>سجّل صنف بالاسم والمكان، أو انسخ الجرد من Excel مرة واحدة.</p>
          <div><HomeButton variant="primary" className="home-primary-button inline-flex items-center justify-center gap-2 min-h-11.5 p-[10px_17px] rounded-home-control text-[14px] font-bold no-underline whitespace-nowrap bg-home-button border border-solid border-home-button text-home-button-text hover:bg-home-button-hover [.home-quick-add_&]:min-h-9 [.home-quick-add_&]:p-[6px_14px] [.home-quick-add_&]:rounded-[10px] [.home-quick-add_&]:text-[13px] max-[600.01px]:[.home-inline-empty_&]:w-full max-[600.01px]:[.home-quick-add_&]:p-[10px_12px]" onClick={() => setSelection('new')}>إضافة صنف</HomeButton>
          <HomeButton variant="secondary" className="home-secondary-button inline-flex items-center justify-center gap-2 min-h-11.5 p-[10px_17px] rounded-home-control text-[14px] font-bold no-underline whitespace-nowrap bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px]" onClick={() => setBulk(true)}>لصق من Excel</HomeButton></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="home-empty flex flex-col items-center gap-2.5 p-[28px_14px] text-home-muted text-[14px] text-center [&>svg]:text-home-green [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-home-text"><h3>لا توجد أصناف تطابق البحث</h3>
          <HomeButton variant="secondary" className="home-secondary-button inline-flex items-center justify-center gap-2 min-h-11.5 p-[10px_17px] rounded-home-control text-[14px] font-bold no-underline whitespace-nowrap bg-home-raised border border-solid border-home-border text-home-text max-[600.01px]:[.home-list-toolbar_&]:text-[13px]" onClick={() => { setQuery(''); setPlace('all'); setCategory('all'); setFilter('all'); }}>مسح الفلاتر</HomeButton>
        </div>
      ) : view === 'table' ? (
        <InventoryTable items={visible} today={today} sort={sort} sortDirection={sortDirection} onSortChange={changeSort} onOpen={setSelection} onSaved={saved} onShopping={item => void shopping(item)} onMarkOut={item => void markOut(item)} busy={busy} />
      ) : (
        <div>
          <ul className={"pantry-items pantry-items- m-0 grid min-w-0 list-none p-0 [&.pantry-items-list]:overflow-hidden [&.pantry-items-list]:rounded-home-panel [&.pantry-items-list]:border [&.pantry-items-list]:border-home-border [&.pantry-items-list]:bg-home-panel [&.pantry-items-cards]:gap-3 [&.pantry-items-cards]:sm:grid-cols-2 [&.pantry-items-cards]:xl:grid-cols-3" + view}>
            {pagedItems.map(item => <li key={item.id} className="pantry-item grid min-w-0 gap-2 p-4 [.pantry-items-list_&]:border-b [.pantry-items-list_&]:border-home-border [.pantry-items-list_&]:last:border-b-0 [.pantry-items-cards_&]:rounded-home-panel [.pantry-items-cards_&]:border [.pantry-items-cards_&]:border-home-border [.pantry-items-cards_&]:bg-home-panel min-[900px]:[.pantry-items-list_&]:grid-cols-[minmax(0,1fr)_minmax(100px,.4fr)_minmax(180px,.7fr)] min-[900px]:[.pantry-items-list_&]:items-center min-[900px]:[.pantry-items-list_&]:gap-x-5">
              <div className="pantry-item-heading flex min-w-0 items-start gap-2">
                <div className="min-w-0 flex-1">
                  <HomeButton className="pantry-item-title h-auto max-w-full whitespace-normal px-0 text-start font-bold text-home-text" onClick={() => setSelection(item)}>{item.name}</HomeButton>
                  <p className="m-0 text-sm text-home-muted">{item.location || 'غير محدد'}{item.category ? ' · ' + item.category : ''}</p>
                </div>
                <InventoryActions item={item} onOpen={setSelection} onShopping={item => void shopping(item)} onMarkOut={item => void markOut(item)} busy={busy} />
              </div>
              <strong className="pantry-item-quantity text-xl font-extrabold text-home-accent">{formatInventoryQuantity(item)}</strong>
              <InventoryStatus item={item} today={today} />
              <div className="pantry-item-footnote flex flex-wrap gap-x-4 gap-y-1 text-xs text-home-muted min-[900px]:[.pantry-items-list_&]:col-span-full">
                <span>آخر جرد: {item.lastCountedAt ? new Date(item.lastCountedAt).toLocaleDateString('ar-EG') : 'لم يُسجل'}</span>
                {item.expiresOn && <span>الصلاحية: {new Date(item.expiresOn + 'T12:00:00').toLocaleDateString('ar-EG')}</span>}
                {view === 'cards' && item.packageSize !== null && <span>العبوة: {item.packageSize} {item.packageUnit}</span>}
              </div>
            </li>)}
          </ul>
          {visible.length > 12 && <Pagination className="mt-4" current={currentPage} pageSize={12} total={visible.length} onChange={setPage} showSizeChanger={false} simple={compact} />}
        </div>
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
