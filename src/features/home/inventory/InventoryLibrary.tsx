import { Input, Select, Segmented } from 'antd';
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
type StockFilter = 'all' | 'first' | 'expiring' | 'low' | 'out';
export function InventoryLibrary() {
  const [view, setView] = useState<'list' | 'cards'>('list');
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
  useEffect(() => { const subscription = liveQuery(() => db.inventoryItems.toArray()).subscribe({ next: rows => { setItems(rows); setLoading(false); }, error: () => { setError('تعذر تحميل المخزون. أعد فتح الصفحة.'); setLoading(false); } }); return () => subscription.unsubscribe(); }, []);
  useEffect(() => { if (selection || bulk) return; const handler = (event: KeyboardEvent) => { const target = event.target as HTMLElement; if (event.ctrlKey || event.metaKey || event.altKey || target.closest('input,textarea,select,[role="dialog"],[contenteditable=true]')) return; if (event.key === '/') { event.preventDefault(); search.current?.focus(); } if (event.key.toLowerCase() === 'n') { event.preventDefault(); setSelection('new'); } }; document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler); }, [selection, bulk]);
  const visible = useMemo(() => items.filter(item => {
    const flags = inventoryFlags(item, today);
    return (place === 'all' || item.location === place) && (category === 'all' || item.category === category) && (!query.trim() || normalizeFoodText([item.name, item.notes, item.category].join(' ')).includes(normalizeFoodText(query))) && (filter === 'all' || filter === 'first' && flags.useFirst || filter === 'expiring' && (flags.expiring || flags.expired) || filter === 'low' && flags.low || filter === 'out' && flags.out);
  }).sort((a, b) => Number(inventoryFlags(a, today).out) - Number(inventoryFlags(b, today).out) || Number(inventoryFlags(b, today).useFirst) - Number(inventoryFlags(a, today).useFirst) || (a.expiresOn ?? '9999').localeCompare(b.expiresOn ?? '9999') || a.name.localeCompare(b.name, 'ar')), [items, query, place, category, filter, today]);
  const run = async (callback: () => Promise<void>) => { if (busy) return; setBusy(true); setError(''); try { await callback(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ التغيير.'); } finally { setBusy(false); } };
  const shopping = (item: InventoryItem) => run(async () => { const title = '🛒 ' + item.name; const exists = (await db.tasks.where('spaceId').equals('home').toArray()).some(task => !task.isCompleted && normalizeFoodText(task.title) === normalizeFoodText(title)); if (!exists) await saveTask({ id: crypto.randomUUID(), spaceId: 'home', title, isCompleted: false, priority: 'medium', createdAt: new Date().toISOString() }); setMessage(exists ? 'الصنف موجود بالفعل في المشتريات.' : 'أُضيف الصنف إلى المشتريات.'); });
  const saved = (text: string) => { setMessage(text); setError(''); };
  return <section className="inventory-library"><header className="home-section-heading"><div><p className="home-eyebrow"><Archive size={16} /> المطبخ</p><h2>المخزون</h2><p>اعرف المتاح، وحدّث الجرد وقتما يناسبك دون تسجيل كل استخدام.</p></div><div className="inventory-heading-actions"><button type="button" className="home-primary-button" onClick={() => setSelection('new')}><Plus size={18} /> إضافة صنف</button><button type="button" className="home-secondary-button" onClick={() => setBulk(true)}><ClipboardList size={18} /> بدء جرد</button></div></header>
    <div className="inventory-info"><strong>{items.length} سجل مخزون</strong><span>الكميات هي آخر ما سجلته، وليست متابعة لحظية. لا تعني الكمية المجهولة نفاد الصنف.</span></div>
    <div className="home-list-toolbar inventory-filters"><Input type="search" ref={search} value={query} onChange={event => setQuery(event.target.value)} prefix={<Search size={17} />} allowClear className="home-antd-search" aria-label="البحث في المخزون" placeholder="ابحث عن صنف…" /><Select aria-label="مكان التخزين" value={place} onChange={setPlace} options={[{ value:'all',label:'كل الأماكن' }, ...[...new Set(items.map(item => item.location))].map(value => ({value,label:value}))]} style={{minWidth:150}} /><Select aria-label="التصنيف" value={category} onChange={setCategory} options={[{value:'all',label:'كل التصنيفات'}, ...[...new Set(items.map(item=>item.category).filter(Boolean))].map(value=>({value,label:value}))]} style={{minWidth:150}} /></div>
    <div className="home-list-filters">{([{ id: 'all', label: 'الكل' }, { id: 'first', label: 'استخدم أولًا' }, { id: 'expiring', label: 'الصلاحية قريبة / تجاوزت' }, { id: 'low', label: 'قليل' }, { id: 'out', label: 'نفد' }] as const).map(item => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
    <div className="inventory-view-toolbar"><span>{visible.length} صنف</span><Segmented aria-label="طريقة عرض المخزون" value={view} onChange={value => setView(value as typeof view)} options={[{ value: 'list', label: 'قائمة' }, { value: 'cards', label: 'بطاقات' }]} /></div>
    {message && <p role="status" className="inventory-success">{message}</p>}{error && <p role="alert" className="home-error">{error}</p>}
    {loading ? <p className="home-empty" role="status">جارٍ تحميل المخزون…</p> : visible.length === 0 ? <div className="home-empty home-panel"><Archive size={34} /><h3>{items.length ? 'لا توجد أصناف تطابق البحث' : 'ابدأ بما تعرفه عن مخزونك'}</h3><p>{items.length ? 'غيّر البحث أو الفلاتر لعرض أصناف أخرى.' : 'سجّل الاسم والمكان حتى لو لم تعرف الكمية أو الصلاحية.'}</p>{items.length > 0 ? <button type="button" className="home-secondary-button" onClick={() => { setQuery(''); setPlace('all'); setCategory('all'); setFilter('all'); }}>مسح الفلاتر</button> : <button type="button" className="home-primary-button" onClick={() => setBulk(true)}>إدخال أول جرد</button>}</div> : <ul className={"inventory-list inventory-view-" + view}>{visible.map(item => { const flags = inventoryFlags(item, today); return <li key={item.id}><div className="inventory-row-main"><div><h3>{item.name}</h3><p>{item.location}{item.category ? ' · ' + item.category : ''}</p></div><strong className="inventory-quantity">{item.quantity === null ? item.state === 'low' ? 'قليل' : item.state === 'available' ? 'موجود' : 'غير معروف' : `${item.approximate ? '≈ ' : ''}${item.quantity} ${item.unit}`}</strong></div><div className="inventory-tags">{flags.out && <span>نفد</span>}{flags.low && <span>كمية قليلة</span>}{flags.useFirst && <span>استخدم أولًا</span>}{flags.expired && <span className="inventory-warning">تجاوز تاريخ الصلاحية المسجل</span>}{flags.expiring && <span className="inventory-warning">{flags.days === 0 ? 'الصلاحية المسجلة اليوم' : `الصلاحية خلال ${flags.days} أيام`}</span>}</div><div className="inventory-row-meta"><span>آخر جرد: {item.lastCountedAt ? new Date(item.lastCountedAt).toLocaleDateString('ar-EG') : 'لم يُسجل'}</span>{item.expiresOn && <span>الصلاحية: {item.expiresOn}</span>}{item.packageSize !== null && <span>العبوة: {item.packageSize} {item.packageUnit}</span>}</div><div className="inventory-row-actions"><button type="button" className="home-secondary-button" onClick={() => setSelection(item)}><Pencil size={15} /> تحديث / سجل الجرد</button><button type="button" className="home-secondary-button" disabled={busy} onClick={() => void shopping(item)}><ShoppingBasket size={15} /> للمشتريات</button>{!flags.out && <button type="button" className="home-secondary-button" disabled={busy} onClick={() => void run(async () => { await saveInventoryBatch([{ original: item, mode: 'count', draft: { ...item, quantity: 0, state: 'out' } }]); saved('تم تسجيل نفاد الصنف مع الاحتفاظ بسجله.'); })}>تسجيل النفاد</button>}</div></li>; })}</ul>}
    {selection && <InventoryDialog key={selection === 'new' ? 'new' : selection.id} original={selection === 'new' ? undefined : selection} onClose={() => setSelection(null)} onSaved={saved} />}{bulk && <InventoryBulkDialog items={items} onClose={() => setBulk(false)} onSaved={saved} />}
  </section>;
}
