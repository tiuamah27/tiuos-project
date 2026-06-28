'use client';

import { useQuery } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { getSystemMetrics, getContainers, getApps, getActivity, listFiles, readFile, getStorage } from '@/services';
import { TopBar } from '@/components/layout/TopBar';
import { Card, SectionLabel, StatusBadge, ProgressBar, Skeleton, ErrorState, CopyBox, EmptyState } from '@/components/ui';
import { cpuColor, diskColor, statusLabel, formatRelativeTime, getFileIcon } from '@/lib/utils';
import { Container, ActivityEvent, App, AppType, FileEntry, FileContent, StorageData } from '@/types';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { useState, useEffect, useRef, ReactNode, Fragment } from 'react';
import {
  ExternalLink, GitBranch, GitCommit, Lock,
  ChevronRight, ChevronDown, ChevronLeft, ChevronUp, Folder, Database,
  Server, MoreHorizontal, ArrowUpRight, History
} from 'lucide-react';

// ═════════════════════════════════════════════════════════════
// Shared Components
// ═════════════════════════════════════════════════════════════

function formatStorageSize(sizeGB: number, sizeBytes?: number): string {
  if (sizeBytes !== undefined) {
    if (sizeBytes === 0) return '0 B';
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    if (sizeBytes < 1024 * 1024 * 1024) return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (sizeGB >= 1) return `${sizeGB.toFixed(1)} GB`;
  return `${(sizeGB * 1024).toFixed(1)} MB`;
}

// ── Collapsible Panel ─────────────────────────────────────────
function Panel({ title, icon, badge, badgeColor, defaultOpen = true, children, noPadding, fillHeight }:
  { title: string; icon?: ReactNode; badge?: string; badgeColor?: string; defaultOpen?: boolean; children: ReactNode; noPadding?: boolean; fillHeight?: boolean }
) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card style={{ padding: 0, overflow: 'hidden', ...(fillHeight ? { display: 'flex', flexDirection: 'column', height: '100%' } : {}) }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--border-subtle)' : 'none',
          userSelect: 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon && <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 10,
              background: badgeColor ? `${badgeColor}18` : 'var(--bg-elevated)',
              color: badgeColor || 'var(--text-muted)', fontWeight: 600,
            }}>
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </div>
      {open && (
        <div style={{ ...(fillHeight ? { flex: 1, minHeight: 0, position: 'relative' } : {}), ...(noPadding ? undefined : { padding: 14 }) }}>
          {children}
        </div>
      )}
    </Card>
  );
}

// ── Sparkline hook ────────────────────────────────────────────
function useSparkline(value: number) {
  const history = useRef<{ v: number }[]>([]);
  useEffect(() => {
    history.current = [...history.current.slice(-19), { v: value }];
  }, [value]);
  return history.current;
}

// ── Metric Card ───────────────────────────────────────────────
function MetricCard({ label, value, unit, sub, pct, color, spark }:
  { label: string; value: string | number; unit?: string; sub?: string; pct?: number; color: string; spark: { v: number }[] }
) {
  return (
    <Card style={{ flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</span>
            {unit && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{unit}</span>}
          </div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
        </div>
        {spark.length > 2 && (
          <div style={{ width: 60, height: 28, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}>
                <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {pct !== undefined && <ProgressBar value={pct} color={color} />}
    </Card>
  );
}

// ── Detail Row ────────────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', gap: 8,
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

// ── Activity Item ─────────────────────────────────────────────
const LEVEL_COLOR: Record<string, string> = {
  success: 'var(--success)', warning: 'var(--warning)',
  error: 'var(--danger)', info: 'var(--info)',
};
function ActivityItem({ event, isLast }: { event: ActivityEvent, isLast?: boolean }) {
  return (
    <div style={{ position: 'relative', display: 'flex', gap: 14, padding: '0 0 20px 0' }}>
      {/* Timeline line */}
      {!isLast && <div style={{ position: 'absolute', left: 4.5, top: 14, bottom: -4, width: 1, background: 'var(--border-subtle)' }} />}
      
      {/* Dot */}
      <div style={{ 
        width: 10, height: 10, borderRadius: '50%', 
        background: LEVEL_COLOR[event.level] ?? '#8b5cf6', 
        marginTop: 5, zIndex: 1, flexShrink: 0,
        boxShadow: `0 0 0 4px var(--bg-base)`
      }} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {event.source}: {event.message}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {event.level}
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
          {formatRelativeTime(event.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Storage Section
// ═════════════════════════════════════════════════════════════
function StorageSection({ storage, isLoading, error }: { storage?: StorageData; isLoading: boolean; error: Error | null }) {
  return (
    <Panel title="Storage Preview" noPadding defaultOpen>
      <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 24, padding: 20 }}>
        {isLoading ? (
          <div style={{ borderRadius: '50%', overflow: 'hidden', width: 130, height: 130 }}>
            <Skeleton height={130} width={130} />
          </div>
        ) : storage ? (
          <div style={{ position: 'relative', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="65" cy="65" r="50" fill="transparent" stroke="var(--border-subtle)" strokeWidth="12" />
              <circle cx="65" cy="65" r="50" fill="transparent" stroke="var(--accent)" strokeWidth="12" strokeDasharray={2 * Math.PI * 50} strokeDashoffset={(2 * Math.PI * 50) - (storage.totalGB > 0 ? (storage.usedGB / storage.totalGB) : 0) * (2 * Math.PI * 50)} strokeLinecap="round" />
            </svg>
            <div style={{ position: 'absolute', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>USED</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{storage.usedGB.toFixed(1)} <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)' }}>GB</span></div>
            </div>
          </div>
        ) : <ErrorState message="Error" />}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <span>Storage Categories</span>
              <span>Details</span>
            </div>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton height={16} width="100%" />
                <Skeleton height={16} width="100%" />
                <Skeleton height={16} width="100%" />
              </div>
            ) : storage?.categories.map(c => (
              <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Folder size={14} color={c.color} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.label}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{formatStorageSize(c.sizeGB, c.sizeBytes)}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              <span>Largest Docker Volumes</span>
            </div>
            {isLoading ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                 <Skeleton height={16} width="100%" />
                 <Skeleton height={16} width="100%" />
               </div>
            ) : storage?.volumes.slice(0, 5).map(v => (
              <div key={v.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <Database size={14} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, flexShrink: 0, paddingLeft: 8 }}>{formatStorageSize(v.sizeGB, v.sizeBytes)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

// ═════════════════════════════════════════════════════════════
// Container Section (FULL features)
// ═════════════════════════════════════════════════════════════
function statusVariant(s: string) {
  if (s === 'running') return 'success' as const;
  if (s === 'paused' || s === 'restarting') return 'warning' as const;
  return 'danger' as const;
}

function ContainerSection({ containers, isLoading, error }:
  { containers?: Container[]; isLoading: boolean; error: Error | null }
) {
  const [selected, setSelected] = useState<Container | null>(null);
  const running = containers?.filter(c => c.status === 'running').length ?? 0;

  return (
    <Panel
      title="Docker Center"
      badge={`${running}/${containers?.length ?? 0} berjalan`}
      badgeColor="var(--success)"
      noPadding
      fillHeight
    >
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Table */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 56px 80px 80px 90px',
            padding: '8px 14px', borderBottom: '1px solid var(--border-default)',
            fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <span>Container</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>CPU</span>
            <span style={{ textAlign: 'right' }}>RAM</span>
            <span style={{ textAlign: 'right' }}>Port</span>
            <span style={{ textAlign: 'right' }}>Uptime</span>
          </div>
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '11px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Skeleton height={14} width="70%" />
            </div>
          ))}
          {error && <ErrorState message="Gagal memuat data container" />}
          {containers?.map(c => {
            const isSelected = selected?.id === c.id;
            return (
              <Fragment key={c.id}>
                <div
                  onClick={() => setSelected(prev => prev?.id === c.id ? null : c)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 56px 80px 80px 90px',
                    padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)',
                    alignItems: 'center', cursor: 'pointer',
                    background: isSelected ? 'var(--accent-bg)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.name}
                  </div>
                  <div>
                    <StatusBadge variant={statusVariant(c.status)}>{statusLabel(c.status)}</StatusBadge>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {c.status === 'running' ? `${c.cpu.toFixed(1)}%` : '—'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
                    {c.status === 'running' ? `${c.ram} MB` : '—'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.ports[0] ?? '—'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{c.uptime}</span>
                </div>
                
                {isSelected && (
                  <div style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <SectionLabel>Detail</SectionLabel>
                        <Card style={{ padding: 12 }}>
                          <DetailRow label="Image" value={c.image} />
                          <DetailRow label="Versi" value={c.version} />
                          <DetailRow label="Total restart" value={`${c.restartCount}×`} />
                          <DetailRow label="Terakhir restart" value={formatRelativeTime(c.lastRestart)} />
                        </Card>
                      </div>
                      <div>
                        <SectionLabel>Terminal Commands</SectionLabel>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <CopyBox label="Log real-time" value={`docker logs ${c.name} -f`} />
                          <CopyBox label="Masuk shell" value={`docker exec -it ${c.name} sh`} />
                          <CopyBox label="Restart" value={`docker restart ${c.name}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ═════════════════════════════════════════════════════════════
// Apps Section (FULL features)
// ═════════════════════════════════════════════════════════════
const TYPE_LABEL: Record<AppType, string> = {
  monitoring: 'Monitoring', database: 'Database', automation: 'Otomatisasi',
  tunnel: 'Tunnel', finance: 'Finansial', custom: 'Custom',
};
const TYPE_COLOR: Record<AppType, string> = {
  monitoring: 'var(--info)', database: 'var(--accent)',
  automation: '#8b5cf6', tunnel: '#ec4899',
  finance: 'var(--warning)', custom: 'var(--text-muted)',
};

function AppCard({ app }: { app: App }) {
  const isRunning = app.status === 'running';
  const [showExtra, setShowExtra] = useState(false);
  const hasExtra = !!(app.container || app.image || app.created || app.healthy !== undefined || app.branch || app.commit);
  
  return (
    <Card hoverable style={{ padding: 16, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1 }}>
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Icon Box */}
            <div style={{ 
              width: 44, height: 44, borderRadius: 10, 
              border: '1px solid var(--border-subtle)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-base)', color: 'var(--text-secondary)'
            }}>
              <Server size={22} />
            </div>
            {/* Name & Type */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1 }}>{app.name}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: TYPE_COLOR[app.type] || 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: TYPE_COLOR[app.type] || 'var(--text-primary)' }} />
                {TYPE_LABEL[app.type]}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowExtra(!showExtra)}
            style={{ background: showExtra ? 'var(--bg-elevated)' : 'transparent', border: 'none', color: showExtra ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, transition: 'all 0.2s' }}
            title="Toggle Details"
          >
            {showExtra ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Middle Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Versi</div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
              {app.version}
            </div>
          </div>
          <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Status</div>
            <div style={{ fontSize: 12, color: isRunning ? 'var(--success)' : 'var(--danger)', fontWeight: 500, textTransform: 'uppercase' }}>
              {statusLabel(app.status)}
            </div>
          </div>
        </div>

        {/* Extra Agent Fields (Preview) */}
        {hasExtra && showExtra && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16, background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            {app.branch && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Git Branch</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}><GitBranch size={12} color="var(--text-muted)" /> {app.branch}</span>
              </div>
            )}
            {app.commit && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Deploy</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{app.commit}</span>
              </div>
            )}
            {app.image && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Docker Image</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }} title={app.image}>{app.image}</span>
              </div>
            )}
            {app.container && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Container</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{app.container}</span>
              </div>
            )}
            {app.created && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: app.healthy !== undefined ? '1px solid var(--border-subtle)' : 'none' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Created</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{new Date(app.created).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            {app.healthy !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px' }}>
                <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Healthcheck</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: app.healthy ? 'var(--success)' : 'var(--danger)' }}>{app.healthy ? 'Healthy' : 'Unhealthy'}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Button */}
      {app.url && (
        <a 
          href={app.url} target="_blank" rel="noopener noreferrer"
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, 
            width: '100%', padding: '10px', 
            background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: 8,
            color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'background 0.1s', textDecoration: 'none', marginTop: 'auto'
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          Kelola <ArrowUpRight size={16} />
        </a>
      )}
    </Card>
  );
}

function AppsSection({ apps, isLoading, error }:
  { apps?: App[]; isLoading: boolean; error: Error | null }
) {
  const healthy = apps?.filter(a => a.status === 'running').length ?? 0;
  const withUrl = apps?.filter(a => a.url) ?? [];
  const withoutUrl = apps?.filter(a => !a.url) ?? [];

  return (
    <Panel
      title="Aplikasi"
      badge={`${healthy}/${apps?.length ?? '—'} berjalan`}
      badgeColor="var(--accent)"
    >
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={120} />)}
        </div>
      )}
      {error && <ErrorState message="Gagal memuat data aplikasi" />}
      {apps && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Group: Dengan Akses Web */}
          {withUrl.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExternalLink size={12} />
                Dengan Akses Web · {withUrl.length}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignItems: 'flex-start' }}>
                {withUrl.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            </div>
          )}

          {/* Group: Layanan Internal */}
          {withoutUrl.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Server size={12} />
                Layanan Internal · {withoutUrl.length}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, alignItems: 'flex-start' }}>
                {withoutUrl.map(app => <AppCard key={app.id} app={app} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

// ═════════════════════════════════════════════════════════════
// Monitoring Section (FULL features)
// ═════════════════════════════════════════════════════════════
interface HistoryPoint { t: string; cpu: number; ram: number; dl: number; ul: number; }
const MAX_POINTS = 40;

function ChartCard({ title, data, dataKey, color, unit, yMax }:
  { title: string; data: HistoryPoint[]; dataKey: keyof HistoryPoint; color: string; unit: string; yMax?: number }
) {
  return (
    <Card style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 12 }}>{title}</div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`ug-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0, yMax ?? 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={32} tickFormatter={v => `${v}${unit}`} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 11 }}
            labelStyle={{ color: 'var(--text-muted)' }}
            formatter={(v) => [`${Number(v).toFixed(1)}${unit}`, title]}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#ug-${dataKey})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════
// File Explorer Section (FULL features)
// ═════════════════════════════════════════════════════════════
function TreeNode({
  entry, depth, isOpen, isSelected, onToggle, onSelect,
}: {
  entry: FileEntry; depth: number; isOpen: boolean; isSelected: boolean;
  onToggle: () => void; onSelect: () => void;
}) {
  return (
    <div
      onClick={entry.type === 'dir' ? onToggle : onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 8px', paddingLeft: 8 + depth * 16,
        borderRadius: 5, cursor: 'pointer', margin: '1px 4px',
        background: isSelected ? 'var(--accent-bg)' : 'transparent',
        border: `1px solid ${isSelected ? 'var(--accent-border)' : 'transparent'}`,
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {entry.type === 'dir' ? (
        isOpen ? <ChevronDown size={11} color="var(--text-muted)" /> : <ChevronRight size={11} color="var(--text-muted)" />
      ) : <span style={{ width: 11 }} />}
      <span style={{ fontSize: 13 }}>{getFileIcon(entry.name, entry.type)}</span>
      <span style={{
        fontSize: 12, fontWeight: entry.type === 'dir' ? 500 : 400,
        color: entry.isSensitive ? 'var(--warning)' : entry.type === 'dir' ? 'var(--text-primary)' : 'var(--text-secondary)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{entry.name}</span>
      {entry.isSensitive && <Lock size={10} color="var(--warning)" style={{ flexShrink: 0 }} />}
    </div>
  );
}

function FilePreview({ content }: { content: FileContent }) {
  if (content.encoding === 'binary') return <EmptyState icon="🚫" message="File binary tidak dapat dipreview" />;
  if (content.encoding === 'too-large') return <EmptyState icon="📦" message="File terlalu besar untuk dipreview" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 8 }}>
      {content.isSensored && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', flexShrink: 0,
          background: 'var(--warning-bg)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <Lock size={11} color="var(--warning)" />
          <span style={{ fontSize: 11, color: 'var(--warning)' }}>
            Nilai sensitif disensor otomatis ({content.sensoredKeys.join(', ')})
          </span>
        </div>
      )}
      <pre style={{
        margin: 0, padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 8,
        border: '1px solid var(--border-subtle)', fontSize: 12, lineHeight: 1.7,
        color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace',
        overflow: 'auto', flex: 1, minHeight: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {content.content}
      </pre>
    </div>
  );
}

const ROOT_PATHS = ['/', '/opt', '/home', '/etc'];

function FilesSection({ serverUrl, activeServerId }:
  { serverUrl: string; activeServerId: string }
) {
  const [currentPath, setCurrentPath] = useState('/opt');
  const [openDirs, setOpenDirs] = useState<Set<string>>(new Set(['/opt', '/opt/apps']));
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['files', activeServerId, currentPath],
    queryFn: () => listFiles(serverUrl, currentPath),
  });

  const { data: fileContent, isLoading: loadingContent, error: contentError } = useQuery({
    queryKey: ['file-content', activeServerId, selectedFile?.path],
    queryFn: () => readFile(serverUrl, selectedFile!.path),
    enabled: !!selectedFile && selectedFile.type === 'file',
  });

  function toggleDir(path: string) {
    setOpenDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
    setCurrentPath(path);
  }

  function goUp() {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath('/' + parts.join('/'));
  }

  return (
    <Panel title="File Explorer" badge={currentPath} noPadding>
      <div style={{ display: 'flex', height: 700, overflow: 'hidden' }}>
        {/* Tree panel */}
        <div style={{
          width: 440, flexShrink: 0, borderRight: '1px solid var(--border-subtle)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ padding: '10px 8px 6px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={goUp} disabled={currentPath === '/'} title="Kembali"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '2px 7px', borderRadius: 4, fontSize: 10,
                  cursor: currentPath === '/' ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--border-default)', background: 'transparent',
                  color: 'var(--text-muted)', opacity: currentPath === '/' ? 0.5 : 1, height: 20,
                }}>
                <ChevronLeft size={13} strokeWidth={2.5} />
              </button>
              {ROOT_PATHS.map(p => (
                <button key={p} onClick={() => setCurrentPath(p)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '2px 7px', borderRadius: 4, fontSize: 10, cursor: 'pointer',
                    border: `1px solid ${currentPath.startsWith(p) && p !== '/' ? 'var(--accent-border)' : 'var(--border-default)'}`,
                    background: currentPath.startsWith(p) && p !== '/' ? 'var(--accent-bg)' : 'transparent',
                    color: currentPath.startsWith(p) && p !== '/' ? 'var(--accent)' : 'var(--text-muted)',
                    height: 20,
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ padding: '6px 12px' }}><Skeleton height={12} width={`${60 + i * 8}%`} /></div>)
              : entries?.map(entry => (
                  <TreeNode key={entry.path} entry={entry} depth={0}
                    isOpen={openDirs.has(entry.path)}
                    isSelected={selectedFile?.path === entry.path}
                    onToggle={() => toggleDir(entry.path)}
                    onSelect={() => setSelectedFile(entry)} />
                ))
            }
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 14, gap: 10 }}>
          {selectedFile ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SectionLabel>Preview — {selectedFile.name}</SectionLabel>
                {selectedFile.isSensitive && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: -8 }}>
                    <Lock size={11} color="var(--warning)" />
                    <span style={{ fontSize: 10, color: 'var(--warning)' }}>Sensitif</span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: 14 }}>
                {loadingContent && <Skeleton height="100%" />}
                {contentError && <ErrorState message="Gagal membaca file" />}
                {fileContent && <FilePreview content={fileContent} />}
              </div>
            </>
          ) : (
            <EmptyState icon="📂" message="Pilih file dari panel kiri untuk melihat isinya" />
          )}
        </div>

        {/* Info + commands panel */}
        {selectedFile && (
          <div style={{
            width: 460, flexShrink: 0, borderLeft: '1px solid var(--border-subtle)',
            padding: 12, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto',
            background: 'var(--bg-surface)',
          }} className="fade-in">
            <div>
              <SectionLabel>Info File</SectionLabel>
              <Card style={{ padding: 10 }}>
                {[
                  ['Nama', selectedFile.name],
                  ['Tipe', selectedFile.type],
                  ['Diubah', formatRelativeTime(selectedFile.modifiedAt)],
                  ...(selectedFile.owner ? [['Owner', selectedFile.owner]] : []),
                  ...(selectedFile.permissions ? [['Permission', selectedFile.permissions]] : []),
                ].map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '5px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 11,
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 11 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Path</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, wordBreak: 'break-all', textAlign: 'right', maxWidth: 120 }}>
                    {selectedFile.path}
                  </span>
                </div>
              </Card>
            </div>
            <div>
              <SectionLabel>Terminal Commands</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <CopyBox label="Buka folder" value={`cd ${selectedFile.path.split('/').slice(0, -1).join('/') || '/'}`} />
                {selectedFile.type === 'file' && (
                  <>
                    <CopyBox label="Lihat isi" value={`cat ${selectedFile.path}`} />
                    <CopyBox label="Edit dengan nano" value={`sudo nano ${selectedFile.path}`} />
                    <CopyBox label="Edit dengan vim" value={`sudo vim ${selectedFile.path}`} />
                    <CopyBox label="Info detail" value={`ls -la ${selectedFile.path}`} />
                  </>
                )}
                {selectedFile.type === 'dir' && (
                  <>
                    <CopyBox label="Lihat isi folder" value={`ls -la ${selectedFile.path}`} />
                    <CopyBox label="Ukuran folder" value={`du -sh ${selectedFile.path}`} />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

// ═════════════════════════════════════════════════════════════
// MAIN UNIFIED DASHBOARD
// ═════════════════════════════════════════════════════════════
export default function UnifiedDashboard() {
  const { getActiveServer, activeServerId } = useTiuStore();
  const server = getActiveServer();

  // ── Monitoring history ──
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  // ── Data queries ──
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['system', activeServerId],
    queryFn: () => getSystemMetrics(server.url, activeServerId),
    refetchInterval: 3000,
  });

  const { data: containers, isLoading: loadingContainers, error: containerError } = useQuery({
    queryKey: ['containers', activeServerId],
    queryFn: () => getContainers(server.url),
    refetchInterval: 10000,
  });

  const { data: apps, isLoading: loadingApps, error: appsError } = useQuery({
    queryKey: ['apps', activeServerId],
    queryFn: () => getApps(server.url),
    refetchInterval: 30000,
  });

  const { data: activity } = useQuery({
    queryKey: ['activity', activeServerId],
    queryFn: () => getActivity(server.url),
    refetchInterval: 30000,
  });

  const { data: storage, isLoading: loadingStorage, error: storageError } = useQuery({
    queryKey: ['storage', activeServerId],
    queryFn: () => getStorage(server.url),
    refetchInterval: 60000,
  });

  // ── Sparklines ──
  const cpuSpark = useSparkline(metrics?.cpu ?? 0);
  const ramSpark = useSparkline(metrics?.ram.percent ?? 0);
  const dlSpark  = useSparkline(metrics?.network.download ?? 0);

  // ── Monitoring history ──
  useEffect(() => {
    if (!metrics) return;
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => [...prev.slice(-(MAX_POINTS - 1)), {
      t: time, cpu: metrics.cpu, ram: metrics.ram.percent,
      dl: metrics.network.download, ul: metrics.network.upload,
    }]);
  }, [metrics]);

  const latestCpu = metrics?.cpu ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Dashboard" subtitle={metrics?.hostname ?? server.name} />

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ═══ SECTION 1: Monitoring Real-time ═══ */}
        <Panel
          title="Monitoring Real-time"
          badge={history.length > 0 ? `${history.length} titik data · 3 detik interval` : 'Mengumpulkan data...'}
          badgeColor="var(--info)"
        >
          {loadingMetrics ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[1,2,3,4,5].map(i => <div key={i} style={{ flex: 1 }}><Skeleton height={90} /></div>)}
            </div>
          ) : metrics ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <MetricCard label="CPU" value={metrics.cpu.toFixed(0)} unit="%" sub={metrics.cpuInfo ? `${metrics.cpuInfo.cores} cores @ ${metrics.cpuInfo.ghz} GHz` : undefined} pct={metrics.cpu} color={cpuColor(metrics.cpu)} spark={cpuSpark} />
              <MetricCard label="RAM" value={metrics.ram.used.toFixed(1)} unit="GB" sub={`${metrics.ram.percent.toFixed(0)}% dari ${metrics.ram.total} GB`} pct={metrics.ram.percent} color={metrics.ram.percent > 80 ? 'var(--warning)' : 'var(--accent)'} spark={ramSpark} />
              <MetricCard label="Disk" value={metrics.disk.used.toFixed(0)} unit="GB" sub={`${metrics.disk.percent.toFixed(0)}% dari ${metrics.disk.total} GB`} pct={metrics.disk.percent} color={diskColor(metrics.disk.percent)} spark={[]} />
              <MetricCard label="Network" value={`↓ ${metrics.network.download.toFixed(1)}`} unit="Mbps" sub={`↑ ${metrics.network.upload.toFixed(1)} Mbps`} color="var(--info)" spark={dlSpark} />
              <MetricCard label="Uptime" value={metrics.uptime} color="var(--text-secondary)" spark={[]} />
            </div>
          ) : <ErrorState message="Tidak dapat memuat data sistem" />}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ChartCard title="CPU (%)" data={history} dataKey="cpu" color={cpuColor(latestCpu)} unit="%" yMax={100} />
            <ChartCard title="RAM (%)" data={history} dataKey="ram" color="var(--accent)" unit="%" yMax={100} />
            <ChartCard title="Network Download (Mbps)" data={history} dataKey="dl" color="var(--info)" unit=" Mbps" />
            <ChartCard title="Network Upload (Mbps)" data={history} dataKey="ul" color="#8b5cf6" unit=" Mbps" />
          </div>
          {history.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 40 }}>
              Mengumpulkan data... grafik akan muncul setelah beberapa detik
            </div>
          )}
        </Panel>

        {/* ═══ SECTION 3: Apps (full cards) + Activity ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
          <AppsSection apps={apps} isLoading={loadingApps} error={appsError} />

          <Panel title="Activity Feed" icon={<History size={14} />} noPadding fillHeight>
            <div style={{ position: 'relative', height: '100%', minHeight: 200 }}>
              <div style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: '16px 20px 4px 20px' }}>
                {activity?.map((e, index) => <ActivityItem key={e.id} event={e} isLast={index === activity.length - 1} />)}
              </div>
            </div>
          </Panel>
        </div>

        {/* ═══ SECTION 2: Storage & Containers ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 12 }}>
          <StorageSection storage={storage} isLoading={loadingStorage} error={storageError} />
          <ContainerSection containers={containers} isLoading={loadingContainers} error={containerError} />
        </div>

        {/* ═══ SECTION 4: (Removed, moved to top) ═══ */}

        {/* ═══ SECTION 5: File Explorer (full 3-panel) ═══ */}
        <FilesSection serverUrl={server.url} activeServerId={activeServerId} />

      </div>
    </div>
  );
}
