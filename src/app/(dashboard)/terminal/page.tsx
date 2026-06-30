'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, SectionLabel, TerminalClientRef } from '@/components/ui';
import { TerminalSquare, Play, History, ShieldAlert } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import { useTiuStore } from '@/store';

// Dynamic import with SSR disabled
const TerminalClient = dynamic(() => import('@/components/ui/TerminalClient').then(mod => mod.TerminalClient), { ssr: false });

interface AuditLog {
  id: string;
  command: string;
  timestamp: string;
}

const QUICK_COMMANDS = [
  { label: 'Restart Server', cmd: 'systemctl restart nginx' },
  { label: 'Check Disk', cmd: 'df -h' },
  { label: 'Check RAM', cmd: 'free -m' },
  { label: 'Clear Cache', cmd: 'rm -rf /var/cache/*' },
];

export default function TerminalPage() {
  const terminalRef = useRef<TerminalClientRef>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);
  const { dataMode, servers, activeServerId } = useTiuStore();

  const serverUrl = servers.find(s => s.id === activeServerId)?.url;

  const wsUrl = useMemo(() => {
    if (dataMode !== 'live' || !serverUrl) return undefined;
    try {
      const url = new URL(serverUrl);
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${url.origin}/api/v1/terminal`;
    } catch {
      return undefined;
    }
  }, [dataMode, serverUrl]);

  const handleCommand = (cmd: string) => {
    if (sessionExpired) {
      toast.error('Session expired. Please refresh the page.');
      return;
    }

    // Add to audit log
    const newLog: AuditLog = {
      id: Math.random().toString(36).substring(2),
      command: cmd,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 50));

    // Simple mock parser for demonstration
    if (dataMode === 'mock') {
      setTimeout(() => {
        let response = '';
        const parts = cmd.split(' ');
        const main = parts[0];

        switch (main) {
          case 'help':
            response = 'Available commands (mock):\r\nhelp, date, whoami, clear, echo, df, free';
            break;
          case 'date':
            response = new Date().toString();
            break;
          case 'whoami':
            response = 'tiuos-admin';
            break;
          case 'clear':
            terminalRef.current?.clear();
            return;
          case 'echo':
            response = parts.slice(1).join(' ');
            break;
          case 'df':
            response = 'Filesystem      Size  Used Avail Use% Mounted on\r\n/dev/sda1        50G   10G   40G  20% /';
            break;
          case 'free':
            response = '              total        used        free      shared  buff/cache   available\r\nMem:           8000        2000        4000          10        2000        5500';
            break;
          case 'systemctl':
          case 'rm':
            response = `Mock executed: ${cmd}`;
            break;
          default:
            response = `bash: ${main}: command not found`;
        }

        if (response) {
          terminalRef.current?.writeln(response);
        }
        terminalRef.current?.prompt();
      }, 200);
      // In live mode, command logic is handled via websocket directly in TerminalClient.
      // This is just to log the command execution locally.
    }
  };

  const handleIdleTimeout = () => {
    setSessionExpired(true);
    terminalRef.current?.writeln('\r\n\r\n[SYSTEM] Session expired due to inactivity. Please refresh to start a new session.');
    toast.error('Terminal session expired.');
  };

  const executeQuickCommand = (cmd: string) => {
    if (sessionExpired) return;
    terminalRef.current?.writeln(cmd);
    handleCommand(cmd);
  };

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, padding: 16, gap: 16, overflow: 'hidden' }}>
      
      {/* Main Terminal Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <TerminalSquare size={20} color="var(--accent)" />
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Terminal (Web SSH)</h1>
          {sessionExpired && (
            <span style={{ padding: '2px 8px', background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: 12, borderRadius: 12, fontWeight: 600 }}>Session Expired</span>
          )}
        </div>
        
        <div style={{ flex: 1, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-default)', background: '#0d1117', position: 'relative' }}>
          {sessionExpired && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, textAlign: 'center' }}>
                <ShieldAlert size={48} color="var(--danger)" style={{ marginBottom: 16 }} />
                <h3 style={{ margin: 0, marginBottom: 8, color: 'var(--text-primary)' }}>Session Timeout</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>Your terminal session has been closed due to inactivity.</p>
                <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                  Reconnect
                </button>
              </div>
            </div>
          )}
          <TerminalClient 
            innerRef={terminalRef} 
            onCommand={handleCommand} 
            onIdleTimeout={handleIdleTimeout} 
            idleTimeoutMs={300000} // 5 minutes
            initialText={wsUrl ? "Connecting to live server..." : "Welcome to TiuOS Web Terminal.\r\nType 'help' to see available mock commands."}
            wsUrl={wsUrl}
          />
        </div>
      </div>

      {/* Right Sidebar: Quick Commands & Audit Log */}
      <div className="hide-on-mobile" style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        <Card style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Play size={16} color="var(--success)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Quick Commands</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_COMMANDS.map(cmd => (
              <button
                key={cmd.label}
                onClick={() => executeQuickCommand(cmd.cmd)}
                disabled={sessionExpired}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                  borderRadius: 6, color: 'var(--text-secondary)', cursor: sessionExpired ? 'not-allowed' : 'pointer',
                  textAlign: 'left', transition: 'background 0.1s'
                }}
                onMouseEnter={e => { if (!sessionExpired) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)' }}
                onMouseLeave={e => { if (!sessionExpired) (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface)' }}
              >
                <span style={{ fontSize: 13, fontWeight: 500 }}>{cmd.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{cmd.cmd}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <History size={16} color="var(--info)" />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Audit Log</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: 20 }}>No commands executed yet.</div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 12, borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatRelativeTime(log.timestamp)}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: 4 }}>tiuos-admin</span>
                  </div>
                  <code style={{ fontSize: 12, color: 'var(--success)', fontFamily: 'monospace', wordBreak: 'break-all' }}>$ {log.command}</code>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
