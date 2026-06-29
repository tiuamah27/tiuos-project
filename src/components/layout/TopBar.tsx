'use client';

import { RefreshCw, Database, Moon, Sun } from 'lucide-react';
import { useTiuStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { servers, activeServerId, setActiveServer, dataMode, setDataMode } = useTiuStore();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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
      <div className="hide-on-mobile" style={{ marginRight: 8, display: 'flex', flexDirection: 'column', justifyContent: 'center', flexShrink: 0 }}>
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
      <div className="hide-on-mobile" style={{ width: 1, height: 20, background: 'var(--border-default)', flexShrink: 0 }} />

      {/* Server switcher */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2, flex: 1, alignItems: 'center' }}>
        {servers.map(server => {
          const active = server.id === activeServerId;
          return (
            <button
              key={server.id}
              onClick={() => setActiveServer(server.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 6, flexShrink: 0,
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
                <span className="hide-on-mobile" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                  ({server.location})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Spacer is replaced by flex: 1 on the server switcher container for better mobile layout, 
          but we still need a gap if it doesn't take full width on desktop */}
      <div className="hide-on-mobile" style={{ flex: 1 }} />

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

      {/* Theme toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
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
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      )}

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
