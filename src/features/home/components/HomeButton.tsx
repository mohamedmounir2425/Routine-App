import { forwardRef, type ComponentRef } from 'react';
import { Button, type ButtonProps } from 'antd';

export type HomeButtonProps = Omit<ButtonProps, 'type' | 'variant'> & {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'text' | 'danger';
};

/** Household sizing for controls that use Ant's native button API. */
export const HomeAntButton = forwardRef<ComponentRef<typeof Button>, ButtonProps>(
  ({ className = '', children, icon, ...props }, ref) => {
    const iconOnly = Boolean(icon) && !children;
    return (
    <Button ref={ref}
      icon={icon}
      className={`home-button min-h-home-control h-auto whitespace-normal [&_svg]:shrink-0 max-[600px]:!h-auto max-[600px]:!min-h-[33px] max-[600px]:!rounded-lg max-[600px]:!px-2 max-[600px]:!py-[5px] max-[600px]:!text-[11px] max-[600px]:!leading-5 max-[600px]:!gap-1.5 max-[600px]:[&_svg]:!size-3.5 ${iconOnly ? 'home-icon-action !h-home-control !w-home-control !min-w-home-control shrink-0 !p-0 max-[600px]:!h-[33px] max-[600px]:!w-[33px] max-[600px]:!min-w-[33px] max-[600px]:!p-0' : 'max-[600px]:min-w-0 max-[600px]:max-w-full'} ${className}`.trim()} {...props}
    >{children}</Button>
    );
  },
);
HomeAntButton.displayName = 'HomeAntButton';

/** Preserve HTML form submission behavior while sharing Ant button sizing. */
export const HomeButton = forwardRef<ComponentRef<typeof Button>, HomeButtonProps>(
  ({ type = 'button', variant = 'text', ...props }, ref) => (
    <HomeAntButton ref={ref} htmlType={type}
      type={variant === 'primary' ? 'primary' : variant === 'text' ? 'text' : 'default'}
      danger={variant === 'danger'} {...props} />
  ),
);
HomeButton.displayName = 'HomeButton';
