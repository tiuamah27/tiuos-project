'use client';

import { useTiuStore } from '@/store';
import { Cpu, Settings } from 'lucide-react';

export function Sidebar() {
  const dataMode = useTiuStore(s => s.dataMode);

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: 2,
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 12, padding: '4px 0' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: 'var(--accent-bg)',
          border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Cpu size={15} color="var(--accent)" />
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Data mode indicator */}
      <div
        title={dataMode === 'mock' ? 'Mode: Mock Data' : 'Mode: Live'}
        style={{
          width: 8, height: 8, borderRadius: '50%', marginBottom: 8,
          background: dataMode === 'live' ? 'var(--success)' : 'var(--warning)',
          boxShadow: dataMode === 'live'
            ? '0 0 6px var(--success)'
            : '0 0 6px var(--warning)',
        }}
        className={dataMode === 'live' ? 'pulse' : ''}
      />

      {/* Settings */}
      <button
        title="Pengaturan"
        style={{
          width: 36, height: 36, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)',
          border: '1px solid transparent',
          background: 'transparent',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s',
        }}
      >
        <Settings size={16} />
      </button>
    </aside>
  );
}
