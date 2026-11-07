import { Checkbox, type CheckboxProps } from 'antd';

/** One accessible completion control for household tasks and shopping. */
export function HomeCompletion({ className = '', ...props }: Omit<CheckboxProps, 'children'>) {
  return <Checkbox className={`home-task-checkbox !flex min-h-home-control min-w-home-control items-center justify-center ${className}`.trim()} {...props} />;
}
