import { useRef, type KeyboardEventHandler, type ReactNode } from 'react';
import { Modal } from 'antd';

/** Common focus management, RTL portal theme and responsive dialog surface. */
export function HomeModal({ open, onClose, title, children, width = 540, className = '', onKeyDown, keyboard = true }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
  width?: number; className?: string; onKeyDown?: KeyboardEventHandler<HTMLDivElement>; keyboard?: boolean;
}) {
  const content = useRef<HTMLDivElement>(null);
  return <Modal open={open} onCancel={onClose} footer={null} closable={false}
    title={<span className="sr-only">{title}</span>}
    className="home-modal" rootClassName="home-theme" width={width}
    centered mask={{ closable: false }} keyboard={keyboard}
    classNames={{ header: 'sr-only', body: 'flex min-h-0 flex-col', container: 'overflow-hidden' }}
    styles={{ container: { padding: 0 } }}
    afterOpenChange={visible => {
      if (visible) {
        const field = content.current?.querySelector<HTMLElement>('input:not([type="checkbox"]):not(:disabled), textarea:not(:disabled)');
        (field ?? content.current?.querySelector<HTMLElement>('button:not(:disabled)'))?.focus();
      }
    }}
  ><div ref={content} dir="rtl" className={`home-modal-content flex min-h-0 max-h-[calc(100dvh_-_48px)] flex-col [&>header]:shrink-0 [&>footer]:shrink-0 [&>form]:min-h-0 max-[639.01px]:max-h-[92dvh] ${className}`} onKeyDown={onKeyDown}>{children}</div></Modal>;
}
