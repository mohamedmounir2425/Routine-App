import * as Dialog from '@radix-ui/react-dialog';
import { ReactNode } from 'react';
import { X } from 'lucide-react';

/** Library-managed focus trap, Escape handling, accessible title and return focus. */
export function PlanningDialog({ open, onOpenChange, title, description, children }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string; children: ReactNode;
}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="planning-dialog-overlay" />
      <Dialog.Content className="planning-dialog-content" dir={document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr'}>
        <Dialog.Title className="text-xl font-bold pe-8">{title}</Dialog.Title>
        <Dialog.Description className="today-muted mt-2 mb-5">{description}</Dialog.Description>
        {children}
        <Dialog.Close className="planning-dialog-close" aria-label="إغلاق / Close"><X size={18} /></Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
