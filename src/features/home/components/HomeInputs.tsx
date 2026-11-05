import React, { forwardRef } from 'react';
import { Button, Input, Select, Space, type InputProps, type InputRef, type SelectProps } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import { Plus, Search } from 'lucide-react';

/* =========================================================================
   1. HomeInput: Base unified text input with Ant Design & Tailwind styling
   ========================================================================= */

export interface HomeInputProps extends InputProps {
  wrapperClassName?: string;
}

export const HomeInput = forwardRef<InputRef, HomeInputProps>(
  ({ className = '', wrapperClassName = '', style, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={`home-unified-input transition-all duration-150 rounded-xl h-[40px] text-[13px] !bg-[var(--home-input)] !border-[var(--home-border)] !text-[var(--home-text)] hover:!border-[var(--home-accent)] focus:!border-[var(--home-accent)] focus:!shadow-[0_0_0_2px_rgba(227,162,123,0.18)] ${className}`.trim()}
        style={style}
        {...props}
      />
    );
  }
);
HomeInput.displayName = 'HomeInput';

/* =========================================================================
   2. HomeSearchInput: Specialized search input with search icon & clear button
   ========================================================================= */

export interface HomeSearchInputProps extends HomeInputProps {
  shortcut?: string;
}

export const HomeSearchInput = forwardRef<InputRef, HomeSearchInputProps>(
  ({ prefix, placeholder, shortcut = '/', className = '', ...props }, ref) => {
    const defaultPlaceholder = shortcut ? `${placeholder ?? 'بحث…'} (${shortcut})` : placeholder ?? 'بحث…';

    return (
      <HomeInput
        ref={ref}
        type="search"
        allowClear
        prefix={prefix ?? <Search size={15} className="text-[var(--home-muted)] shrink-0 me-1" />}
        placeholder={defaultPlaceholder}
        aria-keyshortcuts={shortcut}
        className={`home-search-input ${className}`.trim()}
        {...props}
      />
    );
  }
);
HomeSearchInput.displayName = 'HomeSearchInput';

/* =========================================================================
   3. HomeCompactSearch: Ant Design <Space.Compact> input + select group
   ========================================================================= */

export interface HomeCompactSearchProps {
  mode: string;
  onModeChange: (mode: any) => void;
  modeOptions: { value: string; label: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: React.Ref<InputRef>;
  className?: string;
  selectWidth?: number | string;
  shortcut?: string;
  addButton?: boolean | React.ReactNode;
  onAdd?: (value: string) => void;
  loading?: boolean;
  maxLength?: number;
  modeLabel?: string;
}

export const HomeCompactSearch: React.FC<HomeCompactSearchProps> = ({
  mode,
  onModeChange,
  modeOptions,
  value,
  onChange,
  placeholder,
  inputRef,
  className = '',
  selectWidth = 120,
  shortcut = '/',
  addButton = false,
  onAdd,
  loading = false,
  maxLength,
  modeLabel
}) => {
  const submit = () => {
    if (value.trim() && !loading) onAdd?.(value.trim());
  };
  return (
    <Space.Compact block className={`home-compact-search w-full flex items-center ${className}`.trim()}>
      <Select
        aria-label={modeLabel}
        value={mode}
        onChange={onModeChange}
        options={modeOptions}
        popupMatchSelectWidth={false}
        style={{ width: selectWidth }}
        className="home-compact-select shrink-0"
      />
      <Input
        ref={inputRef}
        type={addButton ? 'text' : 'search'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={shortcut ? `${placeholder ?? ''} (${shortcut})` : placeholder}
        prefix={!addButton && <Search size={15} className="text-[var(--home-muted)] shrink-0 me-1" />}
        aria-label={placeholder}
        disabled={loading}
        maxLength={maxLength}
        onPressEnter={e => {
          if (addButton && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        suffix={addButton ? (
          <Button
            type="primary"
            className="home-compact-add-button"
            icon={<Plus size={14} />}
            loading={loading}
            disabled={!value.trim() || loading || !onAdd}
            onClick={submit}
          >
            {addButton === true ? 'إضافة' : addButton}
          </Button>
        ) : undefined}
        allowClear
        aria-keyshortcuts={shortcut}
        className="home-compact-input flex-1 text-[13px]"
      />
    </Space.Compact>
  );
};

/* =========================================================================
   4. HomeSelect: Unified dropdown styled with Ant Design & Tailwind
   ========================================================================= */

export interface HomeSelectProps<T = any> extends SelectProps<T> {
  // Add any custom extensions if needed
}

export const HomeSelect = <T,>({ className = '', style, ...props }: HomeSelectProps<T>) => {
  return (
    <Select<T>
      className={`home-unified-select h-[40px] text-[12.5px] ${className}`.trim()}
      style={style}
      popupMatchSelectWidth={false}
      {...props}
    />
  );
};

/* =========================================================================
   5. HomeTextArea: Multiline unified input
   ========================================================================= */

export const HomeTextArea = forwardRef<any, TextAreaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <Input.TextArea
        ref={ref}
        className={`home-unified-textarea rounded-xl text-[13px] !bg-[var(--home-input)] !border-[var(--home-border)] !text-[var(--home-text)] hover:!border-[var(--home-accent)] focus:!border-[var(--home-accent)] focus:!shadow-[0_0_0_2px_rgba(227,162,123,0.18)] ${className}`.trim()}
        {...props}
      />
    );
  }
);
HomeTextArea.displayName = 'HomeTextArea';

