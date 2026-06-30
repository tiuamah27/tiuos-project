import { ReactNode } from 'react';

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Ya',
  cancelText = 'Batal',
  isLoading = false,
  variant = 'danger'
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'primary';
}) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 12, padding: 20, width: '100%', maxWidth: 360,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px 0', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} disabled={isLoading} style={{
            padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}>{cancelText}</button>
          <button onClick={onConfirm} disabled={isLoading} style={{
            padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
            background: variant === 'danger' ? 'var(--danger)' : variant === 'warning' ? 'var(--warning)' : 'var(--accent)', 
            border: 'none', color: '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}>{isLoading ? 'Tunggu...' : confirmText}</button>
        </div>
      </div>
    </div>
  );
}
