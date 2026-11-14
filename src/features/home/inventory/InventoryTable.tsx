import { HomeAntButton as Button } from '../components/HomeButton';
import { InventoryActions, InventoryStatus } from './InventoryItemUI';
import { formatInventoryQuantity, type InventorySort, type InventorySortDirection } from './inventoryPresentation';
import { HomeButton } from '../components/HomeButton';
import { Checkbox as HomeCheckbox } from 'antd';
import { useRef, useState, useMemo } from 'react';
import { Alert, AutoComplete, Input, Select, Collapse, Tooltip, Grid } from 'antd';
import { DataTable } from '../../../shared/ui';
import type { InputRef } from 'antd';
import { Check, X, Pencil, Plus, Trash2, Calendar, Tag as TagIcon, Sparkles } from 'lucide-react';
import { emptyInventory, INVENTORY_LOCATIONS, numericInput, inventoryFlags, type InventoryItem } from './inventoryModel';
import { saveInventoryBatch } from './inventoryRepository';

function QuantityCell({ item, onSaved }: { item: InventoryItem; onSaved: (text: string) => void }) {
  const [original, setOriginal] = useState<InventoryItem | null>(null);
  const [value, setValue] = useState('');
  const [unitVal, setUnitVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);

  const save = async () => {
    if (!original || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const quantity = numericInput(value);
      const cleanUnit = unitVal.trim() || original.unit;
      await saveInventoryBatch([{
        original,
        mode: 'count',
        draft: {
          ...original,
          quantity,
          unit: cleanUnit,
          state: quantity === null ? 'unknown' : quantity === 0 ? 'out' : 'available'
        }
      }]);
      setOriginal(null);
      onSaved(`تم تحديث كمية «${original.name}».`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر الحفظ.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  if (!original) {
    const formatted = formatInventoryQuantity(item);

    return (
      <Tooltip title="انقر لتعديل الكمية والوحدة سريعًا" mouseEnterDelay={0.5}>
        <HomeButton
          type="button"
          className="inventory-cell-button inline-flex items-center gap-[7px] bg-transparent border border-solid border-transparent rounded-[7px] p-[4px_8px] text-home-text text-[13px] cursor-pointer [transition:all_.15s] hover:bg-home-raised hover:border-home-border"
          aria-label={`تعديل كمية ${item.name}`}
          onClick={() => {
            setOriginal(item);
            setValue(item.quantity?.toString() ?? '');
            setUnitVal(item.unit || '');
            setError('');
          }}
        >
          <span className="inventory-cell-val">{formatted}</span>
          <Pencil size={12} className="inventory-cell-pencil opacity-[.4] text-home-muted [.inventory-cell-button:hover_&]:opacity-[1] [.inventory-cell-button:hover_&]:text-home-accent" />
        </HomeButton>
      </Tooltip>
    );
  }

  return (
    <div className="inventory-cell-editor flex flex-col gap-1 p-[2px_0]" dir="rtl">
      <div className="inventory-cell-inputs flex items-center gap-[5px]">
        <Input
          autoFocus
          size="small"
          aria-label={`الكمية الحالية لـ ${item.name}`}
          inputMode="decimal"
          value={value}
          disabled={busy}
          placeholder="الكمية"
          className="inventory-inline-qty !w-[75px] !text-[13px]"
          onChange={event => setValue(event.target.value)}
          onPressEnter={() => void save()}
          onKeyDown={event => {
            if (event.key === 'Escape' && !busy) setOriginal(null);
          }}
        />
        <Input
          size="small"
          aria-label="الوحدة"
          value={unitVal}
          disabled={busy}
          placeholder="الوحدة"
          className="inventory-inline-unit !w-[65px] !text-[13px]"
          onChange={event => setUnitVal(event.target.value)}
          onPressEnter={() => void save()}
          onKeyDown={event => {
            if (event.key === 'Escape' && !busy) setOriginal(null);
          }}
        />
        <Button
          size="small"
          type="primary"
          className="inventory-cell-btn-save !bg-home-button !text-home-button-text !border-home-button"
          loading={busy}
          icon={<Check size={13} />}
          onClick={() => void save()}
          aria-label="حفظ الكمية"
        />
        <Button
          size="small"
          type="text"
          className="inventory-cell-btn-cancel !text-home-muted"
          disabled={busy}
          icon={<X size={13} />}
          onClick={() => setOriginal(null)}
          aria-label="إلغاء"
        />
      </div>
      {error && <span role="alert" className="home-error-inline text-[11px] text-home-error-text">{error}</span>}
    </div>
  );
}

export function InventoryTable({
  items,
  today,
  onOpen,
  onSaved, onShopping, onMarkOut, busy: actionBusy, sort, sortDirection, onSortChange
}: {
  items: InventoryItem[];
  today: string;
  onOpen: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onMarkOut: (item: InventoryItem) => void;
  busy?: boolean;
  sort: InventorySort;
  sortDirection: InventorySortDirection;
  onSortChange: (sort: InventorySort, direction?: InventorySortDirection) => void;
  onSaved: (text: string) => void;
}) {
  const screens = Grid.useBreakpoint();
  const sortable = (key: InventorySort) => ({
    sorter: true,
    sortOrder: sort === key ? (sortDirection === 'asc' ? 'ascend' as const : 'descend' as const) : null,
  });
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [location, setLocation] = useState<string>('الثلاجة');
  const [category, setCategory] = useState<string>('');
  const [expiresOn, setExpiresOn] = useState<string>('');
  const [useFirst, setUseFirst] = useState(false);
  const [showDetailedAdd, setShowDetailedAdd] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const input = useRef<InputRef>(null);

  // Dynamic distinct lists from existing items + defaults
  const locationOptions = useMemo(() => {
    const set = new Set<string>([...INVENTORY_LOCATIONS, ...items.map(i => i.location).filter(Boolean)]);
    return Array.from(set).map(value => ({ value, label: value }));
  }, [items]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>(['ألبان', 'لحوم ودواجن', 'خضروات وفواكه', 'بقالة ومؤن', 'توابل ومشروبات', 'مجمدات', ...items.map(i => i.category).filter(Boolean)]);
    return Array.from(set).map(value => ({ value, label: value }));
  }, [items]);

  const unitOptions = useMemo(() => {
    const set = new Set<string>(['كيلو', 'جرام', 'لتر', 'كيس', 'علبة', 'قطعة', 'برطمان', ...items.map(i => i.unit).filter(Boolean)]);
    return Array.from(set).map(value => ({ value, label: value }));
  }, [items]);

  const clearForm = () => {
    setName('');
    setQuantity('');
    setUnit('');
    setCategory('');
    setExpiresOn('');
    setUseFirst(false);
    setError('');
  };

  const add = async () => {
    if (lock.current) return;
    if (!name.trim()) {
      setError('اسم الصنف مطلوب.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const amount = numericInput(quantity);
      await saveInventoryBatch([{
        mode: 'count',
        draft: {
          ...emptyInventory(),
          name: name.trim(),
          quantity: amount,
          unit: unit.trim(),
          location: location.trim() || 'غير محدد',
          category: category.trim(),
          expiresOn: expiresOn || null,
          useFirst,
          state: amount === null ? 'unknown' : amount === 0 ? 'out' : 'available'
        }
      }]);
      clearForm();
      onSaved('تم حفظ الصنف بنجاح. يمكنك إضافة الصنف التالي مباشرة.');
      requestAnimationFrame(() => input.current?.focus());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر الحفظ. بياناتك ما زالت موجودة.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="inventory-table-workspace border border-solid border-home-border rounded-home-control overflow-hidden bg-home-panel shadow-none" dir="rtl">
      <DataTable<InventoryItem>
        rowKey="id" dataSource={items}
        pagination={{ defaultPageSize: 12, showSizeChanger: true, pageSizeOptions: [12, 24, 48], hideOnSinglePage: true }}
        scroll={screens.lg ? undefined : { x: 1060 }}
        onChange={(_, __, sorter, extra) => {
          if (extra.action !== 'sort') return;
          const selected = Array.isArray(sorter) ? sorter[0] : sorter;
          if (!selected.order) { onSortChange('attention', 'asc'); return; }
          const key = selected.columnKey;
          if (key === 'name' || key === 'quantity' || key === 'location' || key === 'expiry' || key === 'attention') onSortChange(key, selected.order === 'ascend' ? 'asc' : 'desc');
        }}
        rowClassName={item => inventoryFlags(item, today).expired ? '[&>td]:bg-[var(--home-error-bg)] supports-[background:color-mix(in_oklab,red,red)]:[&>td]:bg-[color-mix(in_oklab,var(--home-error-bg)_25%,transparent)]' : ''}
        columns={[
          { title: 'الصنف', key: 'name', ...sortable('name'), width: 215, fixed: screens.md && !screens.lg ? 'right' : undefined, render: (_, item) => <div className="min-w-0">
            <Button type="text" className="pantry-table-name h-auto max-w-full whitespace-normal px-0 text-start font-bold text-home-text" onClick={() => onOpen(item)}>{item.name}</Button>
            {item.category && <p className="m-0 text-xs text-home-muted">{item.category}</p>}
          </div> },
          { title: 'الموجود الآن', key: 'quantity', ...sortable('quantity'), width: 200, render: (_, item) => <QuantityCell item={item} onSaved={onSaved} /> },
          { title: 'المكان', key: 'location', ...sortable('location'), width: 145, render: (_, item) => <div className="flex flex-col gap-1">
            <span>{item.location || 'غير محدد'}</span>
            <small className="text-home-muted">{item.lastCountedAt ? 'جرد ' + new Date(item.lastCountedAt).toLocaleDateString('ar-EG') : 'لم يُجرد بعد'}</small>
          </div> },
          { title: 'الصلاحية', key: 'expiry', ...sortable('expiry'), width: 135, render: (_, item) => item.expiresOn
            ? <span className={inventoryFlags(item, today).expired ? 'text-home-error-text' : ''}>{new Date(item.expiresOn + 'T12:00:00').toLocaleDateString('ar-EG')}</span>
            : <span className="text-home-muted">غير محددة</span> },
          { title: 'الحالة', key: 'attention', ...sortable('attention'), width: 200, render: (_, item) => <InventoryStatus item={item} today={today} /> },
          { title: 'الإجراءات', key: 'actions', width: 160, fixed: screens.md && !screens.lg ? 'left' : undefined, render: (_, item) =>
            <InventoryActions inline item={item} onOpen={onOpen} onShopping={onShopping} onMarkOut={onMarkOut} busy={actionBusy} /> },
        ]}
      />

      <div className="inventory-table-add-container border-t border-solid border-t-home-border bg-home-raised"><Collapse ghost items={[{ key: 'quick-add', label: 'إضافة سريعة داخل الجدول', children: <>
        <form
          className="inventory-inline-add flex flex-col gap-2.5 p-[14px_16px]"
          onSubmit={event => {
            event.preventDefault();
            void add();
          }}
          onKeyDown={event => {
            if (event.key === 'Escape' || (event.ctrlKey && event.key === 'Delete')) {
              event.preventDefault();
              clearForm();
            }
          }}
        >
          <div className="inventory-inline-primary-row grid grid-cols-[2fr_1fr_1fr_1.3fr_auto] gap-2.5 [align-items:end] max-[850.01px]:grid-cols-2 max-[850.01px]:gap-2 max-[600.01px]:grid-cols-1">
            <label className="inventory-inline-field flex flex-col gap-[5px] min-w-0 text-[12px] text-home-muted">
              <span>الصنف *</span>
              <Input
                ref={input}
                value={name}
                maxLength={160}
                disabled={busy}
                onChange={event => setName(event.target.value)}
                placeholder="اسم الصنف (مثل: حليب، أرز)…"
                required
              />
            </label>

            <label className="inventory-inline-field flex flex-col gap-[5px] min-w-0 text-[12px] text-home-muted">
              <span>الكمية</span>
              <Input
                value={quantity}
                inputMode="decimal"
                disabled={busy}
                onChange={event => setQuantity(event.target.value)}
                placeholder="رقم أو فارغة"
              />
            </label>

            <label className="inventory-inline-field flex flex-col gap-[5px] min-w-0 text-[12px] text-home-muted">
              <span>الوحدة</span>
              <AutoComplete
                value={unit}
                disabled={busy}
                onChange={setUnit}
                options={unitOptions}
                filterOption={(inputValue, option) =>
                  (option?.value?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                }
                placeholder="كيلو، لتر، كيس…"
              />
            </label>

            <label className="inventory-inline-field flex flex-col gap-[5px] min-w-0 text-[12px] text-home-muted">
              <span>المكان</span>
              <Select
                showSearch
                value={location}
                disabled={busy}
                onChange={setLocation}
                options={locationOptions}
                optionFilterProp="label"
                filterOption={(inputVal, option) =>
                  (option?.label?.toString() ?? '').toLowerCase().includes(inputVal.toLowerCase())
                }
                placeholder="اختر أو ابحث عن المكان"
              />
            </label>

            <div className="inventory-inline-actions flex items-center gap-1.5 max-[850.01px]:col-span-full max-[850.01px]:flex max-[850.01px]:justify-between">
              <Button type="primary" htmlType="submit" loading={busy} icon={<Plus size={16} />}>
                حفظ
              </Button>
              <Button
                type="text"
                size="small"
                onClick={() => setShowDetailedAdd(!showDetailedAdd)}
                className="inventory-toggle-details-btn !text-[12px] !text-home-accent !p-[4px_8px]"
              >
                {showDetailedAdd ? 'إخفاء التفاصيل' : '+ تفاصيل (صلاحية/تصنيف)'}
              </Button>
            </div>
          </div>

          {showDetailedAdd && (
            <div className="inventory-inline-secondary-row flex items-center gap-3 flex-wrap pt-2.5 border-t border-dashed border-t-home-border">
              <label className="inventory-inline-field flex flex-col gap-[5px] min-w-0 text-[12px] text-home-muted">
                <span className="flex items-center gap-1"><TagIcon size={12} /> التصنيف</span>
                <AutoComplete
                  value={category}
                  disabled={busy}
                  onChange={setCategory}
                  options={categoryOptions}
                  filterOption={(inputValue, option) =>
                    (option?.value?.toString() ?? '').toLowerCase().includes(inputValue.toLowerCase())
                  }
                  placeholder="ألبان، خضروات، بقالة…"
                />
              </label>

              <label className="inventory-inline-field flex flex-col gap-[5px] min-w-0 text-[12px] text-home-muted">
                <span className="flex items-center gap-1"><Calendar size={12} /> الصلاحية</span>
                <Input
                  type="date"
                  value={expiresOn}
                  disabled={busy}
                  onChange={event => setExpiresOn(event.target.value)}
                />
              </label>

              <label className="inventory-inline-checkbox flex items-center gap-1.5 text-[12px] text-home-text cursor-pointer pt-3.5">
                <HomeCheckbox

                  checked={useFirst}
                  disabled={busy}
                  onChange={event => setUseFirst(event.target.checked)}
                />
                <span className="flex items-center gap-1"><Sparkles size={12} /> استخدم أولًا</span>
              </label>

              {(name || quantity || unit || category || expiresOn) && (
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={13} />}
                  onClick={clearForm}
                  title="مسح الحقول (Esc)"
                >
                  مسح
                </Button>
              )}
            </div>
          )}
        </form>

        {error && <Alert showIcon type="error" title={error} className="inventory-table-alert m-[8px_16px]" />}
        <p className="inventory-table-hint text-[11px] text-home-muted p-[8px_16px_12px] leading-[1.7] m-0">
          الكمية هي الموجود الآن. اضغط اسم الصنف للتفاصيل الكاملة أو أيقونة القلم لتعديل الكمية سريعًا. Esc لمسح الحقول.
        </p>
      </> }]} />
      </div>
    </div>
  );
}
