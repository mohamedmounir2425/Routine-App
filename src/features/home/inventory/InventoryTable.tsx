import { useRef, useState } from 'react';
import { Alert, AutoComplete, Button, Input, Select, Space, Table, Tag } from 'antd';
import type { InputRef } from 'antd';
import { emptyInventory, INVENTORY_LOCATIONS, numericInput, inventoryFlags, type InventoryItem } from './inventoryModel';
import { saveInventoryBatch } from './inventoryRepository';

function QuantityCell({ item, onSaved }: { item: InventoryItem; onSaved: (text: string) => void }) {
  const [original, setOriginal] = useState<InventoryItem | null>(null);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const save = async () => {
    if (!original || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const quantity = numericInput(value);
      await saveInventoryBatch([{ original, mode: 'count', draft: { ...original, quantity, state: quantity === null ? 'unknown' : quantity === 0 ? 'out' : 'available' } }]);
      setOriginal(null); onSaved('تم حفظ كمية «' + original.name + '» على الجهاز وتسجيل الجرد.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر الحفظ.'); }
    finally { lock.current = false; setBusy(false); }
  };
  if (!original) return <Button type="text" className="inventory-cell-button" aria-label={'تعديل كمية ' + item.name} onClick={() => { setOriginal(item); setValue(item.quantity?.toString() ?? ''); setError(''); }}>{item.quantity === null ? item.state === 'low' ? 'قليل' : item.state === 'available' ? 'موجود' : 'غير معروف' : `${item.approximate ? '≈ ' : ''}${item.quantity}`} {item.unit}</Button>;
  return <div className="inventory-cell-editor"><Input autoFocus aria-label={'الكمية الحالية لـ' + item.name} inputMode="decimal" value={value} disabled={busy} onChange={event => setValue(event.target.value)} onPressEnter={() => void save()} onKeyDown={event => { if (event.key === 'Escape' && !busy) setOriginal(null); }} /><Space><Button size="small" loading={busy} onClick={() => void save()}>حفظ</Button><Button size="small" type="text" disabled={busy} onClick={() => setOriginal(null)}>إلغاء</Button></Space>{error && <span role="alert" className="home-error">{error}</span>}<small>الموجود الآن · {original.unit || 'حدد الوحدة من تفاصيل الصنف'}</small></div>;
}

export function InventoryTable({ items, today, onOpen, onSaved }: { items: InventoryItem[]; today: string; onOpen: (item: InventoryItem) => void; onSaved: (text: string) => void }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState<string>('غير محدد');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const input = useRef<InputRef>(null);
  const add = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const amount = numericInput(quantity);
      await saveInventoryBatch([{ mode: 'count', draft: { ...emptyInventory(), name, quantity: amount, unit, location, state: amount === null ? 'unknown' : amount === 0 ? 'out' : 'available' } }]);
      setName(''); setQuantity(''); onSaved('تم حفظ الصنف على الجهاز. يمكنك إضافة التالي.');
      requestAnimationFrame(() => input.current?.focus());
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر الحفظ. بياناتك ما زالت موجودة.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <div className="inventory-table-workspace"><Table<InventoryItem> rowKey="id" dataSource={items} size="small" pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }} scroll={{ x: 760 }} columns={[
    { title: 'الصنف', key: 'name', width: 230, render: (_, item) => <Button type="link" className="inventory-name-button" onClick={() => onOpen(item)}>{item.name}</Button> },
    { title: 'الكمية', key: 'quantity', width: 200, render: (_, item) => <QuantityCell item={item} onSaved={onSaved} /> },
    { title: 'المكان', dataIndex: 'location', width: 140 },
    { title: 'التصنيف', dataIndex: 'category', render: value => value || '—' },
    { title: 'الصلاحية', dataIndex: 'expiresOn', width: 130, render: value => value || 'غير محددة' },
    { title: 'الحالة', key: 'state', width: 180, render: (_, item) => { const flags = inventoryFlags(item, today); return <Space wrap size={4}>{flags.out ? <Tag>نفد</Tag> : <>{flags.low && <Tag color="orange">قليل</Tag>}{flags.expired ? <Tag color="red">تجاوز الصلاحية</Tag> : flags.expiring && <Tag color="orange">صلاحية قريبة</Tag>}{flags.useFirst && <Tag color="gold">استخدم أولًا</Tag>}{!flags.low && !flags.expired && !flags.expiring && !flags.useFirst && <Tag>{item.quantity === null && item.state === 'unknown' ? 'غير معروف' : 'متاح'}</Tag>}</>}</Space>; } },
  ]} />
    <form className="inventory-inline-add" onSubmit={event => { event.preventDefault(); void add(); }}>
      <label>الصنف<Input ref={input} value={name} maxLength={160} disabled={busy} onChange={event => setName(event.target.value)} placeholder="إضافة صنف…" required /></label>
      <label>الكمية<Input value={quantity} inputMode="decimal" disabled={busy} onChange={event => setQuantity(event.target.value)} placeholder="غير معروفة" /></label>
      <label>الوحدة<AutoComplete value={unit} disabled={busy} onChange={setUnit} options={['كيلو', 'جرام', 'لتر', 'كيس', 'قطعة', 'علبة', 'برطمان'].map(value => ({ value }))} placeholder="اختر أو اكتب" /></label>
      <label>المكان<Select value={location} disabled={busy} onChange={setLocation} options={INVENTORY_LOCATIONS.map(value => ({ value, label: value }))} /></label>
      <Button type="primary" htmlType="submit" loading={busy}>حفظ وإضافة التالي</Button>
    </form>
    {error && <Alert showIcon type="error" title={error} />}
    <p className="inventory-table-hint">الكمية هي الموجود الآن، وليست مشتريات إضافية. اضغط اسم الصنف لفتح التفاصيل. Tab للتنقل بين حقول الإضافة.</p>
  </div>;
}
