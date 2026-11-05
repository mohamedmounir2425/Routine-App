import * as Dialog from '@radix-ui/react-dialog';
import { useRef, type ReactNode } from 'react';

export function HomeWorkflowDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  return <Dialog.Root open={open} onOpenChange={next => { if (!next) onClose(); }}><Dialog.Portal><Dialog.Overlay className="home-workflow-overlay" /><Dialog.Content ref={content} dir="rtl" className="home-workflow-dialog home-theme" aria-describedby={undefined} onOpenAutoFocus={event => { const input = content.current?.querySelector<HTMLInputElement>('input:not([type="checkbox"]),textarea'); if (input) { event.preventDefault(); input.focus(); } }} onPointerDownOutside={event => event.preventDefault()}><Dialog.Title className="home-sr-only">{title}</Dialog.Title>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
