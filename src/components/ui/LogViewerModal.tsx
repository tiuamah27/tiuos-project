import { useEffect, useRef, useState } from 'react';
import { LogLine } from '@/types';
import { X, Download } from 'lucide-react';

export function LogViewerModal({
  isOpen,
  title,
  onClose,
  logs,
  isLoading
}: {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  logs: LogLine[];
  isLoading: boolean;
}) {
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const downloadLog = () => {
    const text = logs.map(l => l.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 998,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(2px)', padding: 20
    }}>
      <div style={{
        background: '#0c0c0c', border: '1px solid var(--border-default)',
        borderRadius: 12, width: '100%', maxWidth: 900, height: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-surface)'
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            Logs: {title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
              Auto-scroll
            </label>
            <button onClick={downloadLog} style={{
              background: 'transparent', border: '1px solid var(--border-subtle)', padding: '4px 8px',
              borderRadius: 6, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6,
              cursor: 'pointer', fontSize: 12
            }} title="Download Log">
              <Download size={14} /> Download
            </button>
            <button onClick={onClose} style={{
              background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4
            }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <div ref={containerRef} style={{
          flex: 1, padding: 16, overflowY: 'auto',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.6,
          color: '#a1a1aa'
        }}>
          {isLoading ? (
            <div style={{ color: 'var(--text-muted)' }}>Memuat log...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>Tidak ada log.</div>
          ) : (
            logs.map((l, i) => (
              <div key={i} style={{ wordBreak: 'break-all' }}>
                <span style={{ color: '#52525b', marginRight: 10 }}>{new Date(l.timestamp).toLocaleTimeString()}</span>
                {l.text.replace(/^\[.*?\]\s*\[.*?\]\s*/, '')}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
