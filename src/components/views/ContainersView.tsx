'use client';

import { useQuery } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { getContainers } from '@/services';
import { Card, SectionLabel, StatusBadge, Skeleton, ErrorState, CopyBox } from '@/components/ui';
import { statusLabel, formatRelativeTime } from '@/lib/utils';
import { Container } from '@/types';
import { useState } from 'react';

function statusVariant(s: string) {
  if (s === 'running') return 'success' as const;
  if (s === 'paused' || s === 'restarting') return 'warning' as const;
  return 'danger' as const;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', gap: 8,
    }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

export function ContainersView() {
  const { getActiveServer, activeServerId } = useTiuStore();
  const server = getActiveServer();
  const [selected, setSelected] = useState<Container | null>(null);

  const { data: containers, isLoading, error } = useQuery({
    queryKey: ['containers', activeServerId],
    queryFn: () => getContainers(server.url),
    refetchInterval: 10000,
  });

  const running = containers?.filter(c => c.status === 'running').length ?? 0;
  const total = containers?.length ?? 0;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', gap: 12 }}>

      {/* Table */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <SectionLabel>Semua Container ({running}/{total} berjalan)</SectionLabel>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 56px 80px 80px 90px',
            padding: '8px 14px', borderBottom: '1px solid var(--border-default)',
            fontSize: 10, color: 'var(--text-muted)', fontWeight: 600,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            <span>Container</span>
            <span>Port</span>
            <span style={{ textAlign: 'right' }}>CPU</span>
            <span style={{ textAlign: 'right' }}>RAM</span>
            <span style={{ textAlign: 'right' }}>Uptime</span>
            <span style={{ textAlign: 'right' }}>Restart</span>
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
              <div
                key={c.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.image}:{c.version}</div>
                  </div>
                  <StatusBadge variant={statusVariant(c.status)}>{statusLabel(c.status)}</StatusBadge>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                  {c.ports[0] ?? '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {c.status === 'running' ? `${c.cpu.toFixed(1)}%` : '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>
                  {c.status === 'running' ? `${c.ram} MB` : '—'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right' }}>{c.uptime}</span>
                <span style={{ fontSize: 12, color: c.restartCount > 0 ? 'var(--warning)' : 'var(--text-muted)', textAlign: 'right' }}>
                  {c.restartCount}×
                </span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Detail panel */}
      {selected && (
        <div style={{ width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }} className="fade-in">
          <SectionLabel>Detail — {selected.name}</SectionLabel>
          <Card style={{ padding: 12 }}>
            <DetailRow label="Nama" value={selected.name} />
            <DetailRow label="Image" value={selected.image} />
            <DetailRow label="Versi" value={selected.version} />
            <DetailRow label="Status" value={statusLabel(selected.status)} />
            <DetailRow label="Port" value={selected.ports.join(', ') || '—'} />
            <DetailRow label="Uptime" value={selected.uptime} />
            <DetailRow label="Total restart" value={`${selected.restartCount}×`} />
            <DetailRow label="Terakhir restart" value={formatRelativeTime(selected.lastRestart)} />
            {selected.branch && <DetailRow label="Branch" value={selected.branch} />}
            {selected.commit && <DetailRow label="Commit" value={selected.commit} />}
          </Card>

          <SectionLabel>Terminal Commands</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <CopyBox label="Log real-time" value={`docker logs ${selected.name} -f`} />
            <CopyBox label="Log 100 baris terakhir" value={`docker logs ${selected.name} --tail 100`} />
            <CopyBox label="Masuk ke container" value={`docker exec -it ${selected.name} sh`} />
            <CopyBox label="Lihat stats" value={`docker stats ${selected.name}`} />
            <CopyBox label="Inspect detail" value={`docker inspect ${selected.name}`} />
            <CopyBox label="Restart container" value={`docker restart ${selected.name}`} />
          </div>
        </div>
      )}
    </div>
  );
}
