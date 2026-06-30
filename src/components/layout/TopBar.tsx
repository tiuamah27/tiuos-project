'use client';

import { RefreshCw, Database, Moon, Sun, Bell, Settings, Home, Check, Trash2, X, TerminalSquare, Globe } from 'lucide-react';
import { useTiuStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { formatRelativeTime } from '@/lib/utils';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const { servers, activeServerId, setActiveServer, dataMode, setDataMode, notifications, markAsRead, markAllAsRead, clearNotifications } = useTiuStore();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

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

      {/* Notifications */}
      <div style={{ position: 'relative' }} ref={notifRef}>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          title="Notifications"
          style={{
            width: 30, height: 30, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            border: '1px solid var(--border-default)', background: 'transparent',
            color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: 'var(--danger)', color: 'white',
              fontSize: 9, fontWeight: 'bold', width: 14, height: 14,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        {showNotifications && (
          <div style={{
            position: 'absolute', top: 40, right: 0,
            width: 320, maxHeight: 400, background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)', borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', zIndex: 100,
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={markAllAsRead} title="Mark all as read" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Check size={14} /></button>
                <button onClick={clearNotifications} title="Clear all" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={14} /></button>
                <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
              {!notifications || notifications.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} onClick={() => markAsRead(n.id)} style={{
                    padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                    background: n.read ? 'transparent' : 'var(--bg-surface)',
                    borderLeft: `3px solid var(--${n.level === 'error' ? 'danger' : n.level === 'warning' ? 'warning' : 'info'})`,
                    marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 4
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatRelativeTime(n.timestamp)}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{n.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overview */}
      <button
        onClick={() => router.push('/overview')}
        title="Global Overview"
        style={{
          width: 30, height: 30, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-default)',
          background: pathname === '/overview' ? 'var(--accent-bg)' : 'transparent',
          color: pathname === '/overview' ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (pathname !== '/overview') (e.currentTarget.style.color = 'var(--text-primary)') }}
        onMouseLeave={e => { if (pathname !== '/overview') (e.currentTarget.style.color = 'var(--text-muted)') }}
      >
        <Globe size={14} />
      </button>

      {/* Terminal */}
      <button
        onClick={() => router.push('/terminal')}
        title="Terminal (Web SSH)"
        style={{
          width: 30, height: 30, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-default)',
          background: pathname === '/terminal' ? 'var(--accent-bg)' : 'transparent',
          color: pathname === '/terminal' ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (pathname !== '/terminal') (e.currentTarget.style.color = 'var(--text-primary)') }}
        onMouseLeave={e => { if (pathname !== '/terminal') (e.currentTarget.style.color = 'var(--text-muted)') }}
      >
        <TerminalSquare size={14} />
      </button>

      {/* Settings / Home */}
      <button
        onClick={() => pathname === '/settings' ? router.push('/') : router.push('/settings')}
        title={pathname === '/settings' ? 'Back to Dashboard' : 'Settings'}
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
        {pathname === '/settings' ? <Home size={14} /> : <Settings size={14} />}
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
