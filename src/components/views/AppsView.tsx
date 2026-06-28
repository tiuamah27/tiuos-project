'use client';

import { useQuery } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { getApps } from '@/services';
import { Card, SectionLabel, StatusBadge, Skeleton, ErrorState } from '@/components/ui';
import { statusLabel } from '@/lib/utils';
import { App, AppType } from '@/types';
import { ExternalLink, GitBranch, GitCommit } from 'lucide-react';

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
  return (
    <Card hoverable style={{ padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{app.name}</span>
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 4,
              background: `${TYPE_COLOR[app.type]}22`,
              color: TYPE_COLOR[app.type], fontWeight: 500,
            }}>
              {TYPE_LABEL[app.type]}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {app.version}
          </div>
        </div>
        <StatusBadge variant={isRunning ? 'success' : 'danger'}>
          {statusLabel(app.status)}
        </StatusBadge>
      </div>

      {(app.branch || app.commit) && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {app.branch && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
              <GitBranch size={11} /> {app.branch}
            </div>
          )}
          {app.commit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              <GitCommit size={11} /> {app.commit}
            </div>
          )}
        </div>
      )}

      {app.url && (
        <a
          href={app.url} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: 'var(--accent)', textDecoration: 'none',
          }}
        >
          <ExternalLink size={11} /> {app.url}
        </a>
      )}
    </Card>
  );
}

export function AppsView() {
  const { getActiveServer, activeServerId } = useTiuStore();
  const server = getActiveServer();

  const { data: apps, isLoading, error } = useQuery({
    queryKey: ['apps', activeServerId],
    queryFn: () => getApps(server.url),
    refetchInterval: 30000,
  });

  const healthy = apps?.filter(a => a.status === 'running').length ?? 0;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
      <SectionLabel>Semua Aplikasi ({healthy}/{apps?.length ?? '—'} berjalan)</SectionLabel>
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={120} />)}
        </div>
      )}
      {error && <ErrorState message="Gagal memuat data aplikasi" />}
      {apps && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {apps.map(app => <AppCard key={app.id} app={app} />)}
        </div>
      )}
    </div>
  );
}
