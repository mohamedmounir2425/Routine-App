import { useRef, useState } from 'react';
import { Alert, Button, Checkbox, Input, Modal, Select } from 'antd';
import { HomeConfirm } from '../HomeConfirm';
import { numericInput, type InventoryItem } from './inventoryModel';
import { saveInventoryBatch, type InventoryChange } from './inventoryRepository';

interface Props {
  items: InventoryItem[];
  initialPlace: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function PantryReview({ items, initialPlace, onClose, onSaved }: Props) {
  // Keep the quantities seen at the start so concurrent changes are detected on save.
  const [snapshot] = useState(() => [...items].sort((a, b) => a.name.localeCompare(b.name, 'ar')));
  const places = [...new Set(snapshot.map(item => item.location))];
  const [place, setPlace] = useState(places.includes(initialPlace) ? initialPlace : places[0]);
  const [reviewed, setReviewed] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [discard, setDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const count = Object.keys(reviewed).length;
  const rows = snapshot.filter(item => item.location === place);
  const close = () => {
    if (lock.current) return;
    if (count) setDiscard(true); else onClose();
  };
  const mark = (id: string, value?: string) => {
    setReviewed(previous => {
      const next = { ...previous };
      if (value === undefined) delete next[id]; else next[id] = value;
      return next;
    });
    setError('');
  };
  const save = async () => {
    if (lock.current || !count) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const changes: InventoryChange[] = rows.filter(item => item.id in reviewed).map(original => {
        const quantity = numericInput(reviewed[original.id]);
        const state = quantity === original.quantity ? original.state : quantity === null ? 'unknown' : quantity === 0 ? 'out' : 'available';
        const unit = original.unit || units[original.id]?.trim() || '';
        if (quantity !== null && quantity > 0 && !unit) throw new Error('حدد وحدة «' + original.name + '» قبل الحفظ.');
        return { original, mode: 'count', draft: { ...original, quantity, unit, state } };
      });
      await saveInventoryBatch(changes);
      onSaved('تم حفظ جرد ' + place + ' · ' + count + ' صنف.');
      onClose();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'تعذر حفظ الجرد.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    <Modal open centered title="جرد مكان" className="home-theme" onCancel={close} maskClosable={false}
      footer={<Button type="primary" loading={busy} disabled={!count} onClick={() => void save()}>حفظ الجرد ({count})</Button>}>
      <div className="pantry-review">
        <label>مكان الجرد<Select value={place} disabled={busy || count > 0} options={places.map(value => ({ value, label: value }))} onChange={setPlace} /></label>
        <p>علّم الصنف لو الكمية زي ما هي، أو اكتب الموجود دلوقتي. الحفظ للأصناف المحددة فقط.</p>
        {rows.map(item => <div className="pantry-review-row" key={item.id}>
          <Checkbox disabled={busy} checked={item.id in reviewed} onChange={event => mark(item.id, event.target.checked ? String(item.quantity ?? '') : undefined)}>
            <strong>{item.name}</strong><small>{item.expiresOn && 'صلاحية ' + item.expiresOn + ' · '}آخر كمية: {item.quantity ?? 'غير معروفة'} {item.unit}</small>
          </Checkbox>
          <div className="pantry-count-input"><Input inputMode="decimal" aria-label={'الموجود الآن من ' + item.name} disabled={busy} placeholder="غير معروفة"
            value={reviewed[item.id] ?? String(item.quantity ?? '')} suffix={item.unit || undefined}
            onChange={event => mark(item.id, event.target.value)} />
            {!item.unit && item.id in reviewed && <Input aria-label={'وحدة ' + item.name} placeholder="الوحدة، مثل كيلو" value={units[item.id] ?? ''} disabled={busy} onChange={event => setUnits(previous => ({ ...previous, [item.id]: event.target.value }))} />}
          </div>
        </div>)}
        {error && <Alert type="error" showIcon title={error} />}
      </div>
    </Modal>
    <HomeConfirm open={discard} title="الجرد لم يُحفظ" description="هل تريد تجاهل الأصناف التي راجعتها؟" confirmText="تجاهل وإغلاق" onConfirm={onClose} onCancel={() => setDiscard(false)} />
  </>;
}
