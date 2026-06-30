'use client';

import { useQuery } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { getSystemMetrics } from '@/services';
import { Card, SectionLabel, ProgressBar, Skeleton, ErrorState } from '@/components/ui';
import { Server, Activity, Database, HardDrive, Network, Globe } from 'lucide-react';
import { cpuColor, diskColor } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function OverviewPage() {
  const { servers, setActiveServer } = useTiuStore();
  const router = useRouter();

  // Fetch metrics for all servers concurrently
  const serverQueries = useQuery({
    queryKey: ['allServerMetrics', servers.map(s => s.id)],
    queryFn: async () => {
      const promises = servers.map(async (s) => {
        try {
          const metrics = await getSystemMetrics(s.url, s.id);
          return { server: s, metrics, status: 'online' };
        } catch (e) {
          return { server: s, metrics: null, status: 'offline' };
        }
      });
      return Promise.all(promises);
    },
    refetchInterval: 3000,
  });

  const isLoading = serverQueries.isLoading;
  const data = serverQueries.data || [];

  const onlineServers = data.filter(d => d.status === 'online');
  const offlineServers = data.filter(d => d.status === 'offline');

  // Aggregations
  const totalCpu = onlineServers.length ? onlineServers.reduce((acc, curr) => acc + (curr.metrics?.cpu || 0), 0) / onlineServers.length : 0;
  const totalRamUsed = onlineServers.reduce((acc, curr) => acc + (curr.metrics?.ram.used || 0), 0);
  const totalRamTotal = onlineServers.reduce((acc, curr) => acc + (curr.metrics?.ram.total || 0), 0);
  const totalRamPercent = totalRamTotal > 0 ? (totalRamUsed / totalRamTotal) * 100 : 0;

  const handleServerClick = (id: string) => {
    setActiveServer(id);
    router.push('/');
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto', width: '100%', overflowY: 'auto', height: '100%' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Globe size={28} color="var(--accent)" /> Global Overview
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Aggregate status of all registered TiuOS servers.</p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Skeleton height={120} />
          <Skeleton height={300} />
        </div>
      ) : (
        <>
          {/* Global Aggregation */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Servers</span>
              <div style={{ fontSize: 28, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
                {servers.length}
                <span style={{ fontSize: 12, background: 'var(--success-bg)', color: 'var(--success)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                  {onlineServers.length} Online
                </span>
                {offlineServers.length > 0 && (
                  <span style={{ fontSize: 12, background: 'var(--danger-bg)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                    {offlineServers.length} Offline
                  </span>
                )}
              </div>
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Avg CPU Load</span>
              <div style={{ fontSize: 28, fontWeight: 700, color: cpuColor(totalCpu) }}>
                {totalCpu.toFixed(1)}%
              </div>
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total RAM Used</span>
              <div style={{ fontSize: 28, fontWeight: 700, color: cpuColor(totalRamPercent) }}>
                {totalRamUsed.toFixed(1)} / {totalRamTotal.toFixed(1)} GB
              </div>
              <ProgressBar value={totalRamPercent} color={cpuColor(totalRamPercent)} />
            </Card>
          </div>

          <SectionLabel>Server Nodes</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 20 }}>
            {data.map((item) => (
              <Card 
                key={item.server.id} 
                style={{ 
                  cursor: 'pointer', 
                  transition: 'transform 0.15s, border-color 0.15s',
                  border: '1px solid var(--border-default)',
                  opacity: item.status === 'offline' ? 0.7 : 1
                }}
                hoverable
                onClick={() => handleServerClick(item.server.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 10, 
                      background: item.status === 'online' ? 'var(--accent-bg)' : 'var(--bg-surface)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: item.status === 'online' ? 'var(--accent)' : 'var(--text-muted)'
                    }}>
                      <Server size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{item.server.name}</h3>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 4 }}>{item.server.url}</div>
                    </div>
                  </div>
                  <div style={{ 
                    width: 10, height: 10, borderRadius: '50%', 
                    background: item.status === 'online' ? 'var(--success)' : 'var(--danger)',
                    boxShadow: `0 0 8px ${item.status === 'online' ? 'var(--success)' : 'var(--danger)'}`
                  }} />
                </div>

                {item.status === 'online' && item.metrics ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>CPU</span>
                        <span style={{ fontWeight: 600, color: cpuColor(item.metrics.cpu) }}>{item.metrics.cpu.toFixed(1)}%</span>
                      </div>
                      <ProgressBar value={item.metrics.cpu} color={cpuColor(item.metrics.cpu)} height={6} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--text-muted)' }}>RAM</span>
                        <span style={{ fontWeight: 600, color: cpuColor(item.metrics.ram.percent) }}>{item.metrics.ram.used.toFixed(1)} GB</span>
                      </div>
                      <ProgressBar value={item.metrics.ram.percent} color={cpuColor(item.metrics.ram.percent)} height={6} />
                    </div>
                    
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={14} /> Load: {item.metrics.loadAvg[0].toFixed(2)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><HardDrive size={14} /> Disk: {item.metrics.disk.percent.toFixed(0)}%</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--danger)', fontSize: 13, fontWeight: 500 }}>
                    Server Unreachable
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
