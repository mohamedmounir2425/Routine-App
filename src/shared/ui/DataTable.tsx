import { Table, type TableProps } from 'antd';

export type DataTableProps<RecordType extends object> = TableProps<RecordType>;

/** Shared presentation only. Columns, data, sorting and mutations belong to callers.
 * Colors come from the nearest Ant ConfigProvider, including each space's theme.
 * Ant's native props (including semantic classNames) remain available unchanged.
 */
export function DataTable<RecordType extends object>({
  className = '',
  classNames,
  size = 'middle',
  ...props
}: DataTableProps<RecordType>) {
  return (
    <Table<RecordType>
      {...props}
      size={size}
      className={`min-w-0 ${className}`.trim()}
      classNames={info => {
        const supplied = typeof classNames === 'function' ? classNames(info) : classNames;
        return { ...supplied, body: { ...supplied?.body,
          cell: `[&_.ant-tag]:me-0 [&_.ant-tag]:whitespace-normal ${supplied?.body?.cell ?? ''}`.trim(),
        } };
      }}
    />
  );
}
