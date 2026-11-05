import { useRef, useState, useMemo } from 'react';
import { Alert, AutoComplete, Button, Input, Select, Space, Table, Tag, Tooltip } from 'antd';
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
    const formatted = item.quantity === null
      ? (item.state === 'low' ? 'قليل' : item.state === 'available' ? 'موجود' : item.state === 'out' ? 'نفد' : 'غير معروف')
      : `${item.approximate ? '≈ ' : ''}${item.quantity} ${item.unit}`.trim();

    return (
      <Tooltip title="انقر لتعديل الكمية والوحدة سريعًا" mouseEnterDelay={0.5}>
        <button
          type="button"
          className="inventory-cell-button"
          aria-label={`تعديل كمية ${item.name}`}
          onClick={() => {
            setOriginal(item);
            setValue(item.quantity?.toString() ?? '');
            setUnitVal(item.unit || '');
            setError('');
          }}
        >
          <span className="inventory-cell-val">{formatted}</span>
          <Pencil size={12} className="inventory-cell-pencil" />
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="inventory-cell-editor" dir="rtl">
      <div className="inventory-cell-inputs">
        <Input
          autoFocus
          size="small"
          aria-label={`الكمية الحالية لـ ${item.name}`}
          inputMode="decimal"
          value={value}
          disabled={busy}
          placeholder="الكمية"
          className="inventory-inline-qty"
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
          className="inventory-inline-unit"
          onChange={event => setUnitVal(event.target.value)}
          onPressEnter={() => void save()}
          onKeyDown={event => {
            if (event.key === 'Escape' && !busy) setOriginal(null);
          }}
        />
        <Button
          size="small"
          type="primary"
          className="inventory-cell-btn-save"
          loading={busy}
          icon={<Check size={13} />}
          onClick={() => void save()}
          aria-label="حفظ الكمية"
        />
        <Button
          size="small"
          type="text"
          className="inventory-cell-btn-cancel"
          disabled={busy}
          icon={<X size={13} />}
          onClick={() => setOriginal(null)}
          aria-label="إلغاء"
        />
      </div>
      {error && <span role="alert" className="home-error-inline">{error}</span>}
    </div>
  );
}

export function InventoryTable({
  items,
  today,
  onOpen,
  onSaved
}: {
  items: InventoryItem[];
  today: string;
  onOpen: (item: InventoryItem) => void;
  onSaved: (text: string) => void;
}) {
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
    <div className="inventory-table-workspace" dir="rtl">
      <Table<InventoryItem>
        rowKey="id"
        dataSource={items}
        size="small"
        pagination={{ defaultPageSize: 20, showSizeChanger: true, pageSizeOptions: [20, 50, 100] }}
        scroll={{ x: 760 }}
        columns={[
          {
            title: 'الصنف',
            key: 'name',
            width: 220,
            sorter: (a, b) => a.name.localeCompare(b.name, 'ar'),
            render: (_, item) => (
              <Button type="link" className="inventory-name-button" onClick={() => onOpen(item)}>
                {item.name}
              </Button>
            )
          },
          {
            title: 'الكمية',
            key: 'quantity',
            width: 200,
            sorter: (a, b) => (a.quantity ?? -1) - (b.quantity ?? -1),
            render: (_, item) => <QuantityCell item={item} onSaved={onSaved} />
          },
          {
            title: 'المكان',
            dataIndex: 'location',
            width: 140,
            sorter: (a, b) => a.location.localeCompare(b.location, 'ar'),
            render: val => <span className="inventory-col-location">{val || 'غير محدد'}</span>
          },
          {
            title: 'التصنيف',
            dataIndex: 'category',
            width: 140,
            sorter: (a, b) => (a.category || '').localeCompare(b.category || '', 'ar'),
            render: value => value ? <span className="inventory-col-category">{value}</span> : <span className="inventory-col-dash">—</span>
          },
          {
            title: 'الصلاحية',
            dataIndex: 'expiresOn',
            width: 130,
            sorter: (a, b) => (a.expiresOn || '9999').localeCompare(b.expiresOn || '9999'),
            render: value => value || <span className="inventory-col-dash">غير محددة</span>
          },
          {
            title: 'الحالة',
            key: 'state',
            width: 180,
            sorter: (a, b) => {
              const fa = inventoryFlags(a, today);
              const fb = inventoryFlags(b, today);
              return Number(fb.out) - Number(fa.out) || Number(fb.useFirst) - Number(fa.useFirst) || Number(fb.expired) - Number(fa.expired);
            },
            render: (_, item) => {
              const flags = inventoryFlags(item, today);
              return (
                <Space wrap size={4}>
                  {flags.out ? (
                    <Tag color="default">نفد</Tag>
                  ) : (
                    <>
                      {flags.low && <Tag color="warning">قليل</Tag>}
                      {flags.expired ? (
                        <Tag color="error">تجاوز الصلاحية</Tag>
                      ) : (
                        flags.expiring && <Tag color="warning">صلاحية قريبة</Tag>
                      )}
                      {flags.useFirst && <Tag color="gold">استخدم أولًا</Tag>}
                      {!flags.low && !flags.expired && !flags.expiring && !flags.useFirst && (
                        <Tag color={item.quantity === null && item.state === 'unknown' ? 'default' : 'success'}>{item.quantity === null && item.state === 'unknown' ? 'غير معروف' : 'متاح'}</Tag>
                      )}
                    </>
                  )}
                </Space>
              );
            }
          }
        ]}
      />

      <div className="inventory-table-add-container">
        <form
          className="inventory-inline-add"
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
          <div className="inventory-inline-primary-row">
            <label className="inventory-inline-field">
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

            <label className="inventory-inline-field">
              <span>الكمية</span>
              <Input
                value={quantity}
                inputMode="decimal"
                disabled={busy}
                onChange={event => setQuantity(event.target.value)}
                placeholder="رقم أو فارغة"
              />
            </label>

            <label className="inventory-inline-field">
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

            <label className="inventory-inline-field">
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

            <div className="inventory-inline-actions">
              <Button type="primary" htmlType="submit" loading={busy} icon={<Plus size={16} />}>
                حفظ
              </Button>
              <Button
                type="text"
                size="small"
                onClick={() => setShowDetailedAdd(!showDetailedAdd)}
                className="inventory-toggle-details-btn"
              >
                {showDetailedAdd ? 'إخفاء التفاصيل' : '+ تفاصيل (صلاحية/تصنيف)'}
              </Button>
            </div>
          </div>

          {showDetailedAdd && (
            <div className="inventory-inline-secondary-row">
              <label className="inventory-inline-field">
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

              <label className="inventory-inline-field">
                <span className="flex items-center gap-1"><Calendar size={12} /> الصلاحية</span>
                <Input
                  type="date"
                  value={expiresOn}
                  disabled={busy}
                  onChange={event => setExpiresOn(event.target.value)}
                />
              </label>

              <label className="inventory-inline-checkbox">
                <input
                  type="checkbox"
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

        {error && <Alert showIcon type="error" title={error} className="inventory-table-alert" />}
        <p className="inventory-table-hint">
          الكمية هي الموجود الآن. اضغط اسم الصنف للتفاصيل الكاملة أو أيقونة القلم لتعديل الكمية سريعًا. Esc لمسح الحقول.
        </p>
      </div>
    </div>
  );
}
