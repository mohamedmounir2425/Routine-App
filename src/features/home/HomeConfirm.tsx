import { Button, Modal, Space, Typography } from 'antd';

export function HomeConfirm({ open, title, description, confirmText, onConfirm, onCancel, busy = false }: {
  open: boolean; title: string; description: string; confirmText: string;
  onConfirm: () => void | Promise<void>; onCancel: () => void; busy?: boolean;
}) {
  return <Modal open={open} centered width={440} zIndex={1800} className="home-theme home-confirm-dialog" title={title} closable={false} maskClosable={false} onCancel={() => { if (!busy) onCancel(); }} footer={<Space wrap><Button danger loading={busy} onClick={() => void onConfirm()}>{confirmText}</Button><Button autoFocus type="primary" disabled={busy} onClick={onCancel}>متابعة الإدخال</Button></Space>}><Typography.Paragraph style={{ marginTop: 18, fontSize: 15 }}>{description}</Typography.Paragraph></Modal>;
}
