import { X, Keyboard } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

export interface ShortcutItem {
  keys: string[];
  description: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  shortcuts?: ShortcutItem[];
}

const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  { keys: ['/'], description: 'البحث السريع' },
  { keys: ['N'], description: 'إضافة أكلة / صنف جديد' },
  { keys: ['[', ']'], description: 'التبديل بين أكلات البيت وخزين البيت' },
  { keys: ['F'], description: 'تفعيل / إلغاء فلتر المفضلة' },
  { keys: ['R'], description: 'اقتراح أكلة عشوائية 🎲' },
  { keys: ['Ctrl', 'Enter'], description: 'حفظ النموذج فوراً' },
  { keys: ['Esc'], description: 'إغلاق أي نافذة مفتوحة' },
  { keys: ['?'], description: 'عرض دليل الاختصارات' }
];

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts = DEFAULT_SHORTCUTS }: Props) {
  if (!isOpen) return null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={open => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="home-shortcuts-overlay" />
        <Dialog.Content dir="rtl" className="home-shortcuts-dialog home-theme">
          <header className="home-shortcuts-header">
            <div className="home-shortcuts-title-wrap">
              <Keyboard size={18} className="text-amber-500" />
              <Dialog.Title>اختصارات لوحة المفاتيح</Dialog.Title>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="home-icon-button"
              aria-label="إغلاق"
            >
              <X size={18} />
            </button>
          </header>

          <div className="home-shortcuts-body">
            <ul className="home-shortcuts-list">
              {shortcuts.map((sc, i) => (
                <li key={i} className="home-shortcuts-row">
                  <span className="home-shortcuts-desc">{sc.description}</span>
                  <div className="home-shortcuts-keys">
                    {sc.keys.map((k, ki) => (
                      <kbd key={ki} className="home-shortcuts-kbd">{k}</kbd>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <footer className="home-shortcuts-footer">
            <small>يمكنك الضغط على <strong>Esc</strong> للإغلاق في أي وقت.</small>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

