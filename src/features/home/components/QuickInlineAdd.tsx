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
      className={`home-quick-inline-form ${className}`.trim()}
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={loading}
        autoFocus={autoFocus}
        className="home-quick-inline-input"
        aria-label={placeholder}
      />
      <button
        type="submit"
        className="home-quick-inline-btn"
        disabled={!value.trim() || loading}
      >
        <Plus size={14} />
        <span>{buttonText}</span>
      </button>
    </form>
  );
}

