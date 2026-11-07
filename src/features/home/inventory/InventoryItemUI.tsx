import { Dropdown, Tag, Tooltip } from 'antd';
import { Ellipsis, Pencil, ShoppingBasket, PackageX } from 'lucide-react';
import { HomeButton } from '../components/HomeButton';
import { inventoryFlags, type InventoryItem } from './inventoryModel';

export function InventoryStatus({ item, today }: { item: InventoryItem; today: string }) {
  const flags = inventoryFlags(item, today);
  const normal = !flags.out && !flags.low && !flags.expired && !flags.expiring && !flags.useFirst;
  return <div className="flex flex-wrap items-center gap-1" aria-label="حالة الصنف">
    {flags.out && <Tag color="default">نفد</Tag>}
    {flags.low && <Tag color="warning">كمية قليلة</Tag>}
    {flags.expired && <Tag color="error">تجاوز الصلاحية</Tag>}
    {flags.expiring && <Tag color="warning">{flags.days === 0 ? 'تنتهي اليوم' : `الصلاحية خلال ${flags.days} أيام`}</Tag>}
    {flags.useFirst && <Tag color="gold">استخدم أولًا</Tag>}
    {normal && <Tag color={item.quantity === null && item.state === 'unknown' ? 'default' : 'success'}>
      {item.quantity === null && item.state === 'unknown' ? 'الكمية غير معروفة' : 'متاح'}
    </Tag>}
  </div>;
}

export interface InventoryActionProps {
  item: InventoryItem;
  onOpen: (item: InventoryItem) => void;
  onShopping: (item: InventoryItem) => void;
  onMarkOut: (item: InventoryItem) => void;
  busy?: boolean;
  inline?: boolean;
}

export function InventoryActions({ item, onOpen, onShopping, onMarkOut, busy, inline = false }: InventoryActionProps) {
  if (inline) return <div className="flex items-center gap-1" role="group" aria-label={'إجراءات ' + item.name}>
    <Tooltip title="التفاصيل وسجل الجرد">
      <HomeButton aria-label={'تفاصيل ' + item.name} icon={<Pencil size={17} />} onClick={() => onOpen(item)} />
    </Tooltip>
    <Tooltip title="إضافة للمشتريات">
      <HomeButton aria-label={'إضافة للمشتريات: ' + item.name} icon={<ShoppingBasket size={17} />} disabled={busy} onClick={() => onShopping(item)} />
    </Tooltip>
    {item.quantity !== 0 && item.state !== 'out' && <Tooltip title="تسجيل النفاد">
      <HomeButton aria-label={'تسجيل نفاد: ' + item.name} icon={<PackageX size={17} />} disabled={busy} onClick={() => onMarkOut(item)} />
    </Tooltip>}
  </div>;
  return <Dropdown trigger={['click']} menu={{ items: [
    { key: 'edit', icon: <Pencil size={15} />, label: 'التفاصيل وسجل الجرد', onClick: () => onOpen(item) },
    { key: 'shopping', icon: <ShoppingBasket size={15} />, label: 'إضافة للمشتريات', disabled: busy, onClick: () => onShopping(item) },
    ...((item.quantity === 0 || item.state === 'out') ? [] : [{ key: 'out', label: 'تسجيل النفاد', disabled: busy, onClick: () => onMarkOut(item) }]),
  ] }}>
    <HomeButton className="shrink-0" aria-label={'إجراءات ' + item.name} icon={<Ellipsis size={18} />} />
  </Dropdown>;
}
