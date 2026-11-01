import { Children, isValidElement, type ReactNode } from 'react';
import { Select } from 'antd';

/** Keep existing home form values while using the same themed library dropdown. */
export function HomeSelect({ value, children, disabled, onChange }: {
  value?: string | number; children: ReactNode; disabled?: boolean; className?: string;
  onChange?: (event: { target: { value: string } }) => void;
}) {
  const options = Children.toArray(children).flatMap(child => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return [];
    return [{ value: String(child.props.value ?? child.props.children ?? ''), label: child.props.children, disabled: child.props.disabled }];
  });
  return <Select style={{ width: '100%' }} value={value === undefined ? undefined : String(value)} disabled={disabled} options={options} onChange={next => onChange?.({ target: { value: next } })} />;
}
