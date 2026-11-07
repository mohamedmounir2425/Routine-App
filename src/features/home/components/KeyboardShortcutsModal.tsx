import { HomeButton } from './HomeButton';
import { X, Keyboard } from 'lucide-react';
import { HomeModal } from './HomeModal';

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



        <HomeModal open={isOpen} onClose={onClose} title={'اختصارات لوحة المفاتيح'} width={540} className="home-shortcuts-dialog bg-home-panel border border-solid border-home-border [box-shadow:0_20px_60px_rgba(0,_0,_0,_0.3)] flex flex-col overflow-hidden">
          <header className="home-shortcuts-header flex items-center justify-between p-[14px_18px] border-b border-solid border-b-home-border">
            <div className="home-shortcuts-title-wrap flex items-center gap-2 text-[15px] font-extrabold text-home-text">
              <Keyboard size={18} className="text-amber-500" />
              <h2>اختصارات لوحة المفاتيح</h2>
            </div>
            <HomeButton icon={<X size={18} />}
              type="button"
              onClick={onClose}
              className="home-icon-button w-11 h-11 grid place-items-center bg-transparent border border-solid border-transparent rounded-home-control text-home-muted hover:bg-home-raised hover:text-home-text"
              aria-label="إغلاق"
            >

            </HomeButton>
          </header>

          <div className="home-shortcuts-body p-[14px_18px] max-h-[60vh] overflow-y-auto">
            <ul className="home-shortcuts-list list-none p-0 m-0 flex flex-col gap-2">
              {shortcuts.map((sc, i) => (
                <li key={i} className="home-shortcuts-row flex items-center justify-between gap-3 p-[6px_0] border-b border-dashed border-b-home-border [&:last-child]:[border-bottom:0]">
                  <span className="home-shortcuts-desc text-[13px] text-home-text font-semibold">{sc.description}</span>
                  <div className="home-shortcuts-keys flex items-center gap-1">
                    {sc.keys.map((k, ki) => (
                      <kbd key={ki} className="home-shortcuts-kbd inline-flex items-center justify-center p-[2px_7px] min-w-6 h-6 font-[inherit] text-[11px] font-bold rounded-[6px] bg-home-raised border border-solid border-home-border [box-shadow:0_1px_0_var(--home-border)] text-home-accent">{k}</kbd>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <footer className="home-shortcuts-footer p-[10px_18px] border-t border-solid border-t-home-border bg-home-raised text-center text-[11.5px] text-home-muted">
            <small>يمكنك الضغط على <strong>Esc</strong> للإغلاق في أي وقت.</small>
          </footer>
        </HomeModal>


  );
}
