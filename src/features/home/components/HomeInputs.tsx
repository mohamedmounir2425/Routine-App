import { HomeAntButton as Button } from './HomeButton';
import React, { forwardRef } from 'react';
import { Input, Select, type InputProps, type InputRef, type SelectProps } from 'antd';
import type { TextAreaProps } from 'antd/es/input';
import type { TextAreaRef } from 'antd/es/input/TextArea';
import { Plus, Search } from 'lucide-react';

/* =========================================================================
   1. HomeInput: Base unified text input with Ant Design & Tailwind styling
   ========================================================================= */

export type HomeInputProps = InputProps;

export const HomeInput = forwardRef<InputRef, HomeInputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        className={`home-unified-input min-w-0 ${className}`.trim()}
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
        prefix={prefix ?? <Search size={15} className="text-home-muted shrink-0 me-1" />}
        placeholder={defaultPlaceholder}
        aria-keyshortcuts={shortcut}
        className={`home-search-input [.inventory-library_.inventory-filters_&_input]:!bg-transparent ${className}`.trim()}
        {...props}
      />
    );
  }
);
HomeSearchInput.displayName = 'HomeSearchInput';

/* =========================================================================
   3. HomeCompactSearch: responsive input + select + optional add action
   ========================================================================= */

export interface HomeCompactSearchProps<T extends string = string> {
  mode: T;
  onModeChange: (mode: T) => void;
  modeOptions: { value: T; label: React.ReactNode }[];
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
  mobileCompact?: boolean;
}

export const HomeCompactSearch = <T extends string,>({
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
  modeLabel,
  mobileCompact = false
}: HomeCompactSearchProps<T>) => {
  const submit = () => {
    if (value.trim() && !loading) onAdd?.(value.trim());
  };
  return (
    <div className={`home-compact-search w-full min-w-0 items-center gap-2 [.pantry-search-row_&]:flex-1 ${mobileCompact ? 'max-sm:gap-1.5' : ''} ${addButton ? 'grid grid-cols-[minmax(0,1fr)_auto] sm:flex' : 'flex'} ${className}`.trim()}>
      <Select<T>
        aria-label={modeLabel}
        value={mode}
        onChange={onModeChange}
        options={modeOptions}
        popupMatchSelectWidth={false}
        style={{ width: selectWidth }}
        className={`home-compact-select shrink-0 ${mobileCompact ? 'max-sm:!w-[104px] max-sm:min-h-11 max-sm:text-sm' : ''} ${addButton ? 'max-sm:col-span-full max-sm:w-full!' : ''}`}
      />
      <Input
        ref={inputRef}
        type={addButton ? 'text' : 'search'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={shortcut ? `${placeholder ?? ''} (${shortcut})` : placeholder}
        prefix={!addButton && <Search size={15} className="text-home-muted shrink-0 me-1" />}
        aria-label={placeholder}
        disabled={loading}
        maxLength={maxLength}
        onPressEnter={e => {
          if (addButton && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        allowClear
        aria-keyshortcuts={shortcut}
        className={`home-compact-input min-w-0 flex-1 ${mobileCompact ? 'max-sm:min-h-11 max-sm:px-2 max-sm:[&_input]:text-base' : ''}`}
      />
      {addButton && (
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
      )}
    </div>
  );
};

/* =========================================================================
   4. HomeSelect: Unified dropdown styled with Ant Design & Tailwind
   ========================================================================= */

export type HomeSelectProps<T = string> = SelectProps<T>;

export const HomeSelect = <T,>({ className = '', style, ...props }: HomeSelectProps<T>) => {
  return (
    <Select<T>
      className={`home-unified-select min-w-0 ${className}`.trim()}
      style={style}
      popupMatchSelectWidth={false}
      {...props}
    />
  );
};

/* =========================================================================
   5. HomeTextArea: Multiline unified input
   ========================================================================= */

export const HomeTextArea = forwardRef<TextAreaRef, TextAreaProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <Input.TextArea
        ref={ref}
        className={`home-unified-textarea min-w-0 ${className}`.trim()}
        {...props}
      />
    );
  }
);
HomeTextArea.displayName = 'HomeTextArea';
