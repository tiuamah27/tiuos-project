'use client';

import { ReactNode } from 'react';

// ── StatusBadge ───────────────────────────────────────────────
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  success: { bg: 'var(--success-bg)', color: 'var(--success)' },
  warning: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  danger:  { bg: 'var(--danger-bg)',  color: 'var(--danger)'  },
  info:    { bg: 'var(--info-bg)',    color: 'var(--info)'    },
  muted:   { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' },
};

export function StatusBadge({ variant, children }: { variant: BadgeVariant; children: ReactNode }) {
  const s = BADGE_STYLES[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 20,
      background: s.bg, color: s.color,
      fontSize: 11, fontWeight: 500,
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: s.color, flexShrink: 0,
      }} />
      {children}
    </span>
  );
}

// ── ProgressBar ───────────────────────────────────────────────
export function ProgressBar({ value, color = 'var(--accent)' }: { value: number; color?: string }) {
  return (
    <div style={{
      height: 3, borderRadius: 2, background: 'var(--bg-elevated)',
      overflow: 'hidden', marginTop: 6,
    }}>
      <div style={{
        height: '100%', borderRadius: 2,
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────
export function Card({
  children, style, onClick, hoverable, title
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
  title?: string;
}) {
  return (
    <div
      title={title}
      onClick={onClick}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
        padding: 16,
        cursor: onClick ? 'pointer' : undefined,
        transition: hoverable ? 'border-color 0.15s, background 0.15s' : undefined,
        ...style,
      }}
      onMouseEnter={e => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
        }
      }}
      onMouseLeave={e => {
        if (hoverable) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)';
        }
      }}
    >
      {children}
    </div>
  );
}

// ── SectionLabel ──────────────────────────────────────────────
export function SectionLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
      letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────
export function Skeleton({ width = '100%', height = 16 }: { width?: number | string; height?: number | string }) {
  return <div className="skeleton" style={{ width, height }} />;
}

// ── CopyButton ────────────────────────────────────────────────
export function CopyBox({ value, label }: { value: string; label?: string }) {
  function copy() {
    navigator.clipboard.writeText(value).catch(() => {});
  }
  return (
    <div>
      {label && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-base)', border: '1px solid var(--border-default)',
        borderRadius: 6, padding: '7px 10px',
      }}>
        <code style={{
          flex: 1, fontSize: 11, color: 'var(--text-secondary)',
          fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre', overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {value}
        </code>
        <button
          onClick={copy}
          style={{
            flexShrink: 0, fontSize: 11, color: 'var(--accent)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: 'inherit',
          }}
        >
          copy
        </button>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────
export function EmptyState({ icon, message }: { icon?: string; message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 8,
      color: 'var(--text-muted)',
    }}>
      {icon && <span style={{ fontSize: 28 }}>{icon}</span>}
      <span style={{ fontSize: 13 }}>{message}</span>
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────
export function ErrorState({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
      background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 8, fontSize: 12, color: 'var(--danger)',
    }}>
      ⚠ {message}
    </div>
  );
}

export * from './ConfirmDialog';
export * from './LogViewerModal';
export * from './TerminalClient';
