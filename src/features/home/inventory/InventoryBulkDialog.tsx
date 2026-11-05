import { HomeConfirm } from '../HomeConfirm';
import { useState } from 'react';
import { Alert, AutoComplete, Button, Card, Checkbox, Collapse, Grid, Input, Modal, Segmented, Select, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ClipboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { inventoryRows, inventoryDraftsToCells, INVENTORY_COLUMNS, parseDelimited } from './inventoryImport';
import { inventoryIdentity, INVENTORY_LOCATIONS, type InventoryItem, type InventoryDraft, type InventoryMode } from './inventoryModel';
import { saveInventoryBatch, type InventoryChange } from './inventoryRepository';

const blankRow = () => ['', '', '', 'غير محدد', '', '', ''];
export function InventoryBulkDialog({ items, initialTab = 'grid', onClose, onSaved }: { initialTab?: 'paste' | 'grid'; items: InventoryItem[]; onClose: () => void; onSaved: (text: string) => void }) {
  const screens = Grid.useBreakpoint();
  const [beforeImport, setBeforeImport] = useState<string[][] | null>(null);
  const [importHint, setImportHint] = useState('');
  const [rows, setRows] = useState<string[][]>([blankRow()]);
  const [tab, setTab] = useState<'grid' | 'paste' | 'text'>(initialTab);
  const [text, setText] = useState('');
  const [location, setLocation] = useState('غير محدد');
  const [mode, setMode] = useState<InventoryMode>('count');
  const [full, setFull] = useState(false);
  const [plan, setPlan] = useState<InventoryChange[] | null>(null);
  const [omitted, setOmitted] = useState<InventoryItem[]>([]);
  const [confirmMissing, setConfirmMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [discard, setDiscard] = useState(false);
  const close = () => { if (busy) return; if (plan || text.trim() || rows.some(row => row.some((cell, index) => index !== 3 && cell.trim()))) setDiscard(true); else onClose(); };
  const preview = (drafts: InventoryDraft[]) => {
    const identities = new Set<string>();
    const changes = drafts.map(draft => {
      const key = inventoryIdentity(draft);
      if (identities.has(key)) throw new Error(`الصنف «${draft.name}» مكرر بنفس المكان والصلاحية. ادمج الصفوف أو حدد دفعة مختلفة.`);
      identities.add(key);
      const matches = items.filter(item => inventoryIdentity(item) === key);
      if (matches.length > 1) throw new Error(`يوجد أكثر من سجل للصنف «${draft.name}»؛ حدّث كل دفعة من قائمتها لتجنب دمج غير مقصود.`);
      const original = matches[0];
      if (mode === 'purchase' && (draft.quantity === null || draft.quantity <= 0 || original && (original.quantity === null || original.unit !== draft.unit))) throw new Error(`مشتريات «${draft.name}» تحتاج كمية موجبة ووحدة مطابقة وكمية سابقة معروفة. استخدم الجرد عند عدم المعرفة.`);
      // Optional details not supplied by the sheet should not erase known metadata.
      return { draft: original ? { ...draft, category: draft.category || original.category, notes: draft.notes || original.notes, useFirst: original.useFirst, lowThreshold: original.lowThreshold, packageSize: original.packageSize, packageUnit: original.packageUnit } : draft, original, mode };
    });
    if (full && mode === 'count' && changes.some(change => change.draft.location !== location)) throw new Error('الجرد الكامل يجب أن يحتوي أصناف المكان المختار فقط.');
    setOmitted(full && mode === 'count' ? items.filter(item => item.location === location && item.state !== 'out' && !changes.some(change => change.original?.id === item.id)) : []);
    setPlan(changes); setConfirmMissing(false); setError('');
  };
  const importRows = (drafts: InventoryDraft[]) => {
    const existing = rows.filter(row => row.some((cell, index) => index !== 3 && cell.trim()));
    if (existing.length + drafts.length > 500) throw new Error('الحد الأقصى ٥٠٠ صنف. قسّم الإدخال إلى دفعات.');
    setBeforeImport(rows.map(row => [...row]));
    setRows([...existing, ...inventoryDraftsToCells(drafts, location)]);
    setTab('grid'); setText(''); setPlan(null); setError('');
    setImportHint('أُضيف ' + drafts.length + ' صنف للجدول. يمكنك تعديلها قبل الحفظ.');
  };
  const makePreview = () => {
    try {
      const source = tab === 'grid' ? rows.filter(row => row.some((value, index) => index !== 3 && value.trim())) : tab === 'paste' ? parseDelimited(text) : text.split('\n').filter(line => line.trim()).map(line => { const match = line.trim().match(/^(.+?)\s+([0-9٠-٩۰-۹]+(?:[.٫,][0-9٠-٩۰-۹]+)?)\s+(.+)$/); return match ? [match[1], match[2], match[3], location] : [line.trim(), '', '', location]; });
      if (tab === 'grid') preview(inventoryRows(source)); else importRows(inventoryRows(source));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'راجع البيانات.'); }
  };
  const file = async (upload: File) => {
    if (upload.size > 2 * 1024 * 1024) { setError('الحد الأقصى للملف ٢ ميجابايت.'); return; }
    setBusy(true); setError('');
    try {
      if (/\.xlsx$/i.test(upload.name)) { const { readSheet } = await import('read-excel-file/browser'); importRows(inventoryRows(await readSheet(upload))); }
      else if (/\.(csv|tsv)$/i.test(upload.name)) importRows(inventoryRows(parseDelimited(await upload.text())));
      else throw new Error('اختر XLSX أو CSV أو TSV. احفظ ملفات XLS القديمة بصيغة XLSX أولًا.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر قراءة الملف.'); } finally { setBusy(false); }
  };
  const save = async () => {
    if (!plan || busy || omitted.length > 0 && !confirmMissing) return;
    setBusy(true); setError('');
    try { await saveInventoryBatch([...plan, ...omitted.map(original => ({ original, mode: 'count' as const, draft: { ...original, state: 'out' as const, quantity: 0 } }))]); onSaved(`تم حفظ ${plan.length} صنف${omitted.length ? ` وتسجيل نفاد ${omitted.length} صنف` : ''}.`); onClose(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر الحفظ.'); } finally { setBusy(false); }
  };

  const updateCell = (row: number, column: number, value: string) => { setBeforeImport(null); setRows(current => current.map((cells, i) => i === row ? cells.map((cell, j) => j === column ? value : cell) : cells)); };
  const pasteGrid = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData('text/plain');
    if (!pasted.includes('\t') && !pasted.includes('\n')) return;
    event.preventDefault();
    try { const imported = inventoryRows(parseDelimited(pasted)); importRows(imported); } catch (reason) { setError(reason instanceof Error ? reason.message : 'راجع عناوين الأعمدة.'); }
  };
  const units = ['كيلو','جرام','لتر','كيس','قطعة','علبة','برطمان'].map(value => ({ value }));
  const places = [...new Set([...INVENTORY_LOCATIONS, ...items.map(item => item.location)])].map(value => ({ value, label: value }));
  const data = rows.map((cells, index) => ({ key: index, index, cells }));
  const columns: ColumnsType<typeof data[number]> = [
    { title: 'الصنف', width: 220, render: (_, row) => <Input aria-label="اسم الصنف" value={row.cells[0]} placeholder="اسم الصنف" onChange={event => updateCell(row.index, 0, event.target.value)} /> },
    { title: 'الكمية', width: 110, render: (_, row) => <Input aria-label="الكمية" inputMode="decimal" value={row.cells[1]} placeholder="غير معروف" onChange={event => updateCell(row.index, 1, event.target.value)} /> },
    { title: 'الوحدة', width: 130, render: (_, row) => <AutoComplete aria-label="الوحدة" options={units} value={row.cells[2]} placeholder="اختر أو اكتب" style={{ width: '100%' }} onChange={value => updateCell(row.index, 2, value)} /> },
    { title: 'المكان', width: 160, render: (_, row) => <Select aria-label="المكان" value={row.cells[3]} options={places} style={{ width: '100%' }} onChange={value => updateCell(row.index, 3, value)} /> },
    { title: '', width: 50, render: (_, row) => <Button type="text" aria-label="حذف الصف" icon={<X size={16} />} onClick={() => { setBeforeImport(null); setRows(current => current.filter((_, index) => index !== row.index)); }} /> },
  ];
  const extra = (row: typeof data[number]) => <div className="inventory-extra-fields">{[4, 5, 6].map(index => <label key={index}>{INVENTORY_COLUMNS[index]}<Input type={index === 5 ? 'date' : 'text'} value={row.cells[index]} onChange={event => updateCell(row.index, index, event.target.value)} /></label>)}</div>;
  return <><Modal open title="الجرد وإدخال الأصناف" width={1020} centered className="home-theme inventory-antd-modal" maskClosable={false} onCancel={close} styles={{ body: { maxHeight: '68dvh', overflowY: 'auto', padding: '16px 0' } }} footer={<Space wrap>{plan ? <><Button disabled={busy} onClick={() => setPlan(null)}>رجوع للتعديل</Button><Button type="primary" loading={busy} disabled={omitted.length > 0 && !confirmMissing} onClick={() => void save()}>تأكيد حفظ {plan.length} صنف</Button></> : <Button type="primary" loading={busy} onClick={makePreview}>{tab === 'grid' ? 'معاينة البيانات' : 'إضافة إلى الجدول'}</Button>}</Space>}>
    {!plan ? <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <div className="inventory-bulk-toolbar"><Segmented value={mode} onChange={value => { setMode(value as InventoryMode); setFull(false); }} options={[{ value: 'count', label: 'جرد الموجود' }, { value: 'purchase', label: 'إضافة مشتريات' }]} /><Select aria-label="المكان الافتراضي" value={location} options={places} style={{ minWidth: 160 }} onChange={value => { setBeforeImport(null); setLocation(value); setRows(current => current.map(row => row[3] === location || row[3] === 'غير محدد' ? row.map((cell, i) => i === 3 ? value : cell) : row)); }} /></div>
      <Typography.Text type="secondary">{mode === 'count' ? 'الكمية المدخلة تستبدل آخر مسجل. الأصناف غير المذكورة لا تتغير.' : 'الكمية المدخلة تُضاف للموجود؛ يلزم معرفة الكمية السابقة وتطابق الوحدة.'}</Typography.Text>
      <Segmented block value={tab} onChange={value => setTab(value as typeof tab)} options={[{ value: 'grid', label: 'جدول الأصناف' }, { value: 'paste', label: 'Excel / ملف' }, { value: 'text', label: 'نص سريع' }]} />
      {importHint && <Alert type="success" showIcon title={importHint} action={beforeImport && <Button size="small" onClick={() => { setRows(beforeImport); setBeforeImport(null); setImportHint('تم التراجع عن آخر استيراد.'); }}>تراجع</Button>} />}
      {tab === 'grid' ? <div onPaste={pasteGrid}><Alert type="info" showIcon title="الصق خلايا Excel في أي خانة بالجدول. انسخ العناوين معها إذا اختلف ترتيب الأعمدة." style={{ marginBottom: 12 }} />{screens.md ? <Table columns={columns} dataSource={data} pagination={false} size="small" scroll={{ x: 720 }} expandable={{ expandedRowRender: extra, columnTitle: 'تفاصيل', columnWidth: 65 }} /> : <Space orientation="vertical" style={{ width: '100%' }}>{data.map(row => <Card key={row.key} size="small" title={'صنف ' + (row.index + 1)} extra={<Button type="text" aria-label="حذف الصف" icon={<X size={16} />} onClick={() => { setBeforeImport(null); setRows(current => current.filter((_, i) => i !== row.index)); }} />}><Space orientation="vertical" style={{ width: '100%' }}>{columns.slice(0, 4).map((column, index) => <div key={index} className="inventory-mobile-field"><span>{INVENTORY_COLUMNS[index]}</span>{column.render?.(undefined, row, row.index) as React.ReactNode}</div>)}<Collapse ghost size="small" items={[{ key: 'extra', label: 'تفاصيل اختيارية', children: extra(row) }]} /></Space></Card>)}</Space>}<Button icon={<Plus size={16} />} style={{ marginTop: 12 }} disabled={rows.length >= 500} onClick={() => { setBeforeImport(null); setRows(current => [...current, ['', '', '', location, '', '', '']]); }}>إضافة صنف</Button></div> : <Space orientation="vertical" style={{ width: '100%' }}><Typography.Text>{tab === 'paste' ? 'انسخ الجدول من Excel والصقه هنا، أو اختر ملفًا.' : 'صنف في كل سطر: بانيه ٣٫٥ كيلو. ويمكن كتابة الاسم فقط.'}</Typography.Text><Input.TextArea value={text} onChange={event => setText(event.target.value)} autoSize={{ minRows: 5, maxRows: 9 }} placeholder={tab === 'paste' ? INVENTORY_COLUMNS.join('\t') : 'بانيه ٣٫٥ كيلو\nحليب ٩ أكياس'} />{tab === 'paste' && <label className="inventory-file-label">اختيار XLSX أو CSV أو TSV — الورقة الأولى، بحد أقصى ٢ ميجابايت<input type="file" accept=".xlsx,.csv,.tsv" disabled={busy} onChange={event => { const upload = event.target.files?.[0]; if (upload) void file(upload); event.target.value = ''; }} /></label>}</Space>}
      <Collapse size="small" items={[{ key: 'advanced', label: 'خيارات الجرد وطريقة النقل', children: <Space orientation="vertical">{mode === 'count' && <Checkbox checked={full} onChange={event => setFull(event.target.checked)}>جرد كامل لـ«{location}» مع مراجعة الأصناف الغائبة قبل تسجيل نفادها.</Checkbox>}<Typography.Text type="secondary">انسخ العناوين لدعم أي ترتيب. بدون عناوين: {INVENTORY_COLUMNS.join('، ')}. الكمية المجهولة فارغة، والصلاحية YYYY-MM-DD.</Typography.Text></Space> }]} />
    </Space> : <Space orientation="vertical" style={{ width: '100%' }}><Alert type="info" title="راجع آخر كمية والكمية بعد الحفظ" /><Table rowKey={(_, index) => String(index)} pagination={false} size="small" scroll={{ x: 500 }} dataSource={plan} columns={[{ title: 'الصنف', render: (_, change) => change.draft.name }, { title: 'المكان', render: (_, change) => change.draft.location }, { title: 'آخر مسجل', render: (_, change) => change.original?.quantity ?? 'غير معروف' }, { title: 'بعد الحفظ', render: (_, change) => String(mode === 'purchase' && change.original ? change.original.quantity! + change.draft.quantity! : change.draft.quantity ?? 'غير معروف') + ' ' + change.draft.unit }]} />{omitted.length > 0 && <Alert type="warning" title="أصناف غائبة عن الجرد الكامل" description={<><p>{omitted.map(item => item.name).join('، ')}</p><Checkbox checked={confirmMissing} onChange={event => setConfirmMissing(event.target.checked)}>أؤكد أنها نفدت وأريد تسجيلها صفرًا.</Checkbox></>} />}</Space>}
    {error && <Alert style={{ marginTop: 16 }} type="error" showIcon title={error} />}
  </Modal><HomeConfirm open={discard} title="الجرد لم يُحفظ بعد" description="لديك صفوف أو تعديلات غير محفوظة. هل تريد متابعة إدخال الجرد أم تجاهل البيانات وإغلاق النافذة؟" confirmText="تجاهل وإغلاق" onConfirm={onClose} onCancel={() => setDiscard(false)} /></>;
}
