'use client';

import { RefreshCw, ChevronDown, Database } from 'lucide-react';
import { useTiuStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { servers, activeServerId, setActiveServer, dataMode, setDataMode } = useTiuStore();
  const queryClient = useQueryClient();
  const [showDropdown, setShowDropdown] = useState(false);

  function handleRefresh() {
    queryClient.invalidateQueries();
  }

  return (
    <header style={{
      height: 48,
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 12,
      background: 'var(--bg-surface)',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Page title */}
      <div style={{ marginRight: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border-default)', flexShrink: 0 }} />

      {/* Server switcher */}
      <div style={{ display: 'flex', gap: 6 }}>
        {servers.map(server => {
          const active = server.id === activeServerId;
          return (
            <button
              key={server.id}
              onClick={() => setActiveServer(server.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6,
                border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border-default)'}`,
                background: active ? 'var(--accent-bg)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: active ? 'var(--success)' : 'var(--text-muted)',
                flexShrink: 0,
              }} className={active ? 'pulse' : ''} />
              {server.name}
              {server.location && (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  ({server.location})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Data mode badge */}
      <button
        onClick={() => {
          setDataMode(dataMode === 'mock' ? 'live' : 'mock');
          queryClient.invalidateQueries();
        }}
        title={`Switch to ${dataMode === 'mock' ? 'LIVE' : 'MOCK'} mode`}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 4,
          background: dataMode === 'mock' ? 'var(--warning-bg)' : 'var(--success-bg)',
          border: `1px solid ${dataMode === 'mock' ? 'rgba(245,158,11,0.2)' : 'rgba(57,211,83,0.2)'}`,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <Database size={11} color={dataMode === 'mock' ? 'var(--warning)' : 'var(--success)'} />
        <span style={{
          fontSize: 10, fontWeight: 600,
          color: dataMode === 'mock' ? 'var(--warning)' : 'var(--success)',
          letterSpacing: '0.04em',
        }}>
          {dataMode === 'mock' ? 'MOCK' : 'LIVE'}
        </span>
      </button>

      {/* Refresh button */}
      <button
        onClick={handleRefresh}
        title="Refresh semua data"
        style={{
          width: 30, height: 30, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-default)',
          background: 'transparent',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <RefreshCw size={13} />
      </button>
    </header>
  );
}
