import { emptyInventory, cleanInventory, numericInput, type InventoryDraft } from './inventoryModel';
import { normalizeFoodText } from '../recipes/recipeModel';
// Same column order is used by paste, CSV and XLSX previews. No data is written here.
export const INVENTORY_COLUMNS = ['الصنف', 'الكمية', 'الوحدة', 'المكان', 'التصنيف', 'الصلاحية', 'ملاحظات'];
export function inventoryDraftsToCells(drafts: InventoryDraft[], location = 'غير محدد') {
  return drafts.map(item => [item.name, item.quantity === null ? item.state === 'low' ? 'قليل' : item.state === 'available' ? 'موجود' : '' : String(item.quantity), item.unit, item.location === 'غير محدد' ? location : item.location, item.category, item.expiresOn ?? '', item.notes]);
}
export function parseDelimited(text: string): string[][] {
  const delimiter = text.includes('\t') ? '\t' : ',';
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false;
  const input = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  for (let i = 0; i < input.length; i++) { const char = input[i]; if (char === '"') { if (quoted && input[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; } else if (!quoted && (char === delimiter || char === '\n')) { row.push(cell); cell = ''; if (char === '\n') { rows.push(row); row = []; } } else cell += char; }
  if (quoted) throw new Error('علامات التنصيص غير مكتملة في الملف.');
  row.push(cell); rows.push(row);
  return rows.filter(cells => cells.some(value => value.trim()));
}
export function inventoryRows(rows: unknown[][]): InventoryDraft[] {
  if (!rows.length) throw new Error('لا توجد صفوف للمعاينة.');
  const source = rows.map(row => row.map(cell => cell instanceof Date ? cell.toISOString().slice(0, 10) : cell === null || cell === undefined ? '' : String(cell).trim())).filter(row => row.some(cell => cell.trim()));
  if (!source.length) throw new Error('الجدول فارغ.');
  const aliases = [['الصنف','اسم الصنف','الاسم','name','item'],['الكمية','quantity'],['الوحدة','unit'],['المكان','مكان التخزين','location'],['التصنيف','category'],['الصلاحية','تاريخ الصلاحية','expiry'],['ملاحظات','الملاحظات','notes']];
  const header = source[0].map(normalizeFoodText);
  const columns = aliases.map(names => header.findIndex(cell => names.map(normalizeFoodText).includes(cell)));
  const hasHeader = columns[0] >= 0;
  const data = hasHeader ? source.slice(1).map(cells => columns.map(index => index < 0 ? '' : cells[index] ?? '')) : source;
  if (!data.length || data.length > 500) throw new Error('الدفعة يجب أن تحتوي من صف واحد إلى ٥٠٠ صف.');
  return data.map((cells, i) => {
    try {
      const [name = '', rawQuantity = '', rawUnit = '', location = '', category = '', expiresOn = '', notes = ''] = cells;
      let quantityText = rawQuantity, unit = rawUnit;
      const combined = rawQuantity.match(/^([0-9٠-٩۰-۹]+(?:[.٫,][0-9٠-٩۰-۹]+)?|نصف|ربع)\s+(.+)$/);
      if (combined && !unit) { quantityText = combined[1] === 'نصف' ? '0.5' : combined[1] === 'ربع' ? '0.25' : combined[1]; unit = combined[2]; }
      const unknown = !quantityText || ['غير محدد', 'غير معروف', 'موجود', 'قليل', 'خلص'].includes(quantityText);
      const quantity = unknown ? quantityText === 'خلص' ? 0 : null : numericInput(quantityText);
      return cleanInventory({ ...emptyInventory(), name, quantity, unit, location, category, expiresOn: expiresOn || null, notes, useFirst: /أولوية استخدام|استخدم أول|قرب يبوظ/.test(notes), state: quantityText === 'قليل' ? 'low' : quantity === 0 ? 'out' : unknown ? quantityText === 'موجود' ? 'available' : 'unknown' : 'available' });
    } catch (reason) { throw new Error(`الصف ${i + 1}: ${reason instanceof Error ? reason.message : 'راجع البيانات'}`); }
  });
}
