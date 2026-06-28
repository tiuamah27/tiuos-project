'use client';

import { useQuery } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { getSystemMetrics, getContainers, getStorage, getActivity } from '@/services';
import { Card, SectionLabel, StatusBadge, ProgressBar, Skeleton, ErrorState, CopyBox } from '@/components/ui';
import { cpuColor, diskColor, statusColor, statusLabel, formatRelativeTime } from '@/lib/utils';
import { Container, ActivityEvent } from '@/types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useState, useEffect, useRef } from 'react';

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

// ── Container Row ─────────────────────────────────────────────
function ContainerRow({ c, selected, onClick }:
  { c: Container; selected: boolean; onClick: () => void }
) {
  const badgeVariant = c.status === 'running' ? 'success' : c.status === 'paused' ? 'warning' : 'danger';
  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '1fr 52px 72px 80px',
        padding: '9px 14px', borderBottom: '1px solid var(--border-subtle)',
        alignItems: 'center', cursor: 'pointer',
        background: selected ? 'var(--accent-bg)' : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.name}
        </span>
        <StatusBadge variant={badgeVariant}>{statusLabel(c.status)}</StatusBadge>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
        {c.status === 'running' ? `${c.cpu.toFixed(1)}%` : '—'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
        {c.status === 'running' ? `${c.ram} MB` : '—'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
        {c.uptime}
      </span>
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────
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

function ActivityItem({ event }: { event: ActivityEvent }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '7px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%', marginTop: 5, flexShrink: 0,
        background: LEVEL_COLOR[event.level] ?? 'var(--text-muted)',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-primary)', lineHeight: 1.4 }}>{event.message}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
          {event.source} · {formatRelativeTime(event.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ── Main View ─────────────────────────────────────────────────
export function OverviewView() {
  const { getActiveServer, activeServerId } = useTiuStore();
  const server = getActiveServer();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['system', activeServerId],
    queryFn: () => getSystemMetrics(server.url, activeServerId),
    refetchInterval: 3000,
  });

  const { data: containers, isLoading: loadingContainers } = useQuery({
    queryKey: ['containers', activeServerId],
    queryFn: () => getContainers(server.url),
    refetchInterval: 10000,
  });

  const { data: activity } = useQuery({
    queryKey: ['activity', activeServerId],
    queryFn: () => getActivity(server.url),
    refetchInterval: 30000,
  });

  const cpuSpark = useSparkline(metrics?.cpu ?? 0);
  const ramSpark = useSparkline(metrics?.ram.percent ?? 0);
  const dlSpark  = useSparkline(metrics?.network.download ?? 0);

  const selected = containers?.find(c => c.id === selectedId) ?? null;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Metric Cards ── */}
      <div>
        <SectionLabel>Kesehatan Server</SectionLabel>
        {loadingMetrics ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ flex: 1 }}><Skeleton height={90} /></div>)}
          </div>
        ) : metrics ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <MetricCard label="CPU" value={metrics.cpu.toFixed(0)} unit="%" pct={metrics.cpu} color={cpuColor(metrics.cpu)} spark={cpuSpark} />
            <MetricCard label="RAM" value={metrics.ram.used.toFixed(1)} unit="GB" sub={`${metrics.ram.percent.toFixed(0)}% dari ${metrics.ram.total} GB`} pct={metrics.ram.percent} color={metrics.ram.percent > 80 ? 'var(--warning)' : 'var(--accent)'} spark={ramSpark} />
            <MetricCard label="Disk" value={metrics.disk.used.toFixed(0)} unit="GB" sub={`${metrics.disk.percent.toFixed(0)}% dari ${metrics.disk.total} GB`} pct={metrics.disk.percent} color={diskColor(metrics.disk.percent)} spark={[]} />
            <MetricCard label="Network" value={`↓ ${metrics.network.download.toFixed(1)}`} unit="Mbps" sub={`↑ ${metrics.network.upload.toFixed(1)} Mbps`} color="var(--info)" spark={dlSpark} />
          </div>
        ) : <ErrorState message="Tidak dapat memuat data sistem" />}
      </div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* Container list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <SectionLabel>Containers Berjalan</SectionLabel>
          <Card style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 52px 72px 80px',
              padding: '7px 14px', borderBottom: '1px solid var(--border-subtle)',
              fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              <span>Nama</span>
              <span style={{ textAlign: 'right' }}>CPU</span>
              <span style={{ textAlign: 'right' }}>RAM</span>
              <span style={{ textAlign: 'right' }}>Uptime</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {loadingContainers
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <Skeleton height={14} width="60%" />
                    </div>
                  ))
                : containers?.map(c => (
                    <ContainerRow
                      key={c.id} c={c}
                      selected={selectedId === c.id}
                      onClick={() => setSelectedId(prev => prev === c.id ? null : c.id)}
                    />
                  ))
              }
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        {selected ? (
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
            <SectionLabel>Detail — {selected.name}</SectionLabel>
            <Card style={{ padding: 12 }}>
              <DetailRow label="Image" value={`${selected.image}:${selected.version}`} />
              <DetailRow label="Status" value={statusLabel(selected.status)} />
              <DetailRow label="Port" value={selected.ports.length ? selected.ports.join(', ') : '—'} />
              <DetailRow label="Uptime" value={selected.uptime} />
              <DetailRow label="Restart" value={`${selected.restartCount}× total`} />
              <DetailRow label="Terakhir restart" value={formatRelativeTime(selected.lastRestart)} />
              {selected.branch && <DetailRow label="Branch" value={selected.branch} />}
              {selected.commit && <DetailRow label="Commit" value={selected.commit} />}
            </Card>

            <SectionLabel>Buka di Terminal</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <CopyBox label="Lihat log" value={`docker logs ${selected.name} -f`} />
              <CopyBox label="Buka shell" value={`docker exec -it ${selected.name} sh`} />
              <CopyBox label="Inspect" value={`docker inspect ${selected.name}`} />
            </div>
          </div>
        ) : (
          <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
            <SectionLabel>Aktivitas Terbaru</SectionLabel>
            <Card style={{ padding: '4px 12px', flex: 1, overflow: 'auto' }}>
              {activity?.slice(0, 8).map(e => <ActivityItem key={e.id} event={e} />)}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
