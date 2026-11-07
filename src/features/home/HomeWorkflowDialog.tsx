import type { ReactNode } from 'react';
import { HomeModal } from './components/HomeModal';

export function HomeWorkflowDialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return <HomeModal open={open} onClose={onClose} title={title} className="overflow-y-auto">{children}</HomeModal>;
}
