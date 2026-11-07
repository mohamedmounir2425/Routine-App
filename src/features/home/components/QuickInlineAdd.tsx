import { HomeButton } from './HomeButton';
import { HomeInput as HomeTextField } from './HomeInputs';
import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';

export interface QuickInlineAddProps {
  placeholder?: string;
  buttonText?: string;
  maxLength?: number;
  loading?: boolean;
  onAdd: (value: string) => Promise<void> | void;
  className?: string;
  autoFocus?: boolean;
}

export function QuickInlineAdd({
  placeholder = 'أضف عنصراً سريعاً…',
  buttonText = 'إضافة',
  maxLength = 150,
  loading = false,
  onAdd,
  className = '',
  autoFocus = false
}: QuickInlineAddProps) {
  const [value, setValue] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    setValue('');
    await onAdd(trimmed);
  };

  return (
    <form
      className={`home-quick-inline-form flex items-center gap-1.5 mb-3 bg-home-input border border-solid border-home-border rounded-home-control p-[3px_5px] min-h-9.5 [box-sizing:border-box] overflow-hidden ![outline:none] !shadow-none [transition:border-color_.15s_ease] focus-within:border-home-accent focus-within:![outline:none] focus-within:!shadow-none max-[600.01px]:!min-h-9 max-[600.01px]:!p-[2px_4px] max-[600.01px]:!rounded-[10px] ${className}`.trim()}
      onSubmit={handleSubmit}
    >
      <HomeTextField
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={loading}
        autoFocus={autoFocus}
        className="w-full"
        aria-label={placeholder}
      />
      <HomeButton variant="primary"
        type="submit"
        className="home-quick-inline-btn inline-flex items-center justify-center gap-1 p-[6px_14px] rounded-[8px] bg-home-button text-home-button-text [border:0] text-[12px] font-bold cursor-pointer shrink-0 ![outline:none] !shadow-none [transition:all_.15s_ease] [&:focus]:![outline:none] [&:focus]:!shadow-none focus-visible:![outline:none] focus-visible:!shadow-none [&:hover:not(:disabled)]:bg-home-button-hover disabled:opacity-[0.5] disabled:cursor-not-allowed"
        disabled={!value.trim() || loading}
      >
        <Plus size={14} />
        <span>{buttonText}</span>
      </HomeButton>
    </form>
  );
}
