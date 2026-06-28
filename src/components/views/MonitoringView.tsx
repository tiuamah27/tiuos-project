'use client';

import { useQuery } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { getSystemMetrics } from '@/services';
import { Card, SectionLabel } from '@/components/ui';
import { cpuColor } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

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
            <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
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
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#g-${dataKey})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function MonitoringView() {
  const { getActiveServer, activeServerId } = useTiuStore();
  const server = getActiveServer();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const tickRef = useRef(0);

  const { data: metrics } = useQuery({
    queryKey: ['system', activeServerId],
    queryFn: () => getSystemMetrics(server.url, activeServerId),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!metrics) return;
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => [...prev.slice(-(MAX_POINTS - 1)), {
      t: time,
      cpu: metrics.cpu,
      ram: metrics.ram.percent,
      dl: metrics.network.download,
      ul: metrics.network.upload,
    }]);
  }, [metrics]);

  const latestCpu = metrics?.cpu ?? 0;

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Live stats row */}
      {metrics && (
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'CPU', value: `${metrics.cpu.toFixed(1)}%`, color: cpuColor(latestCpu) },
            { label: 'RAM', value: `${metrics.ram.percent.toFixed(0)}%`, color: 'var(--accent)' },
            { label: 'Download', value: `${metrics.network.download.toFixed(1)} Mbps`, color: 'var(--info)' },
            { label: 'Upload', value: `${metrics.network.upload.toFixed(1)} Mbps`, color: '#8b5cf6' },
            { label: 'Uptime', value: metrics.uptime, color: 'var(--text-secondary)' },
          ].map(({ label, value, color }) => (
            <Card key={label} style={{ flex: 1, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
            </Card>
          ))}
        </div>
      )}

      <SectionLabel>Grafik Historis ({history.length} titik data)</SectionLabel>
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
    </div>
  );
}
