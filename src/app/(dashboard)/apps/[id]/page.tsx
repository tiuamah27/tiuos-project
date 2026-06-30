'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useMemo, use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTiuStore } from '@/store';
import { getAppDetails, restartContainer, stopContainer, startContainer } from '@/services';
import { Card, SectionLabel, StatusBadge, Skeleton, ErrorState, ConfirmDialog } from '@/components/ui';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowLeft, Box, Play, Square, RefreshCw, Activity, TerminalSquare, ShieldAlert, GitCommit, Settings, Eye, EyeOff, ShieldCheck, ShieldX, CheckCircle2, ServerCrash, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/utils';
import { AppDetails } from '@/types';

type Tab = 'overview' | 'deploy' | 'health' | 'env';

function statusVariant(s: string) {
  if (s === 'running' || s === 'healthy') return 'success' as const;
  if (s === 'paused' || s === 'restarting' || s === 'degraded') return 'warning' as const;
  return 'danger' as const;
}

export default function AppDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { servers, activeServerId } = useTiuStore();
  const serverUrl = servers.find(s => s.id === activeServerId)?.url ?? '';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [confirmAction, setConfirmAction] = useState<'stop' | 'restart' | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const { data: app, isLoading, error } = useQuery({
    queryKey: ['appDetails', activeServerId, id],
    queryFn: () => getAppDetails(serverUrl, id),
    refetchInterval: isDeploying ? false : 5000,
  });

  const stopMutation = useMutation({
    mutationFn: (containerId: string) => stopContainer(serverUrl, containerId),
    onSuccess: () => {
      toast.success('Container dihentikan');
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['appDetails', activeServerId, id] });
    },
    onError: (e) => toast.error(e.message)
  });

  const restartMutation = useMutation({
    mutationFn: (containerId: string) => restartContainer(serverUrl, containerId),
    onSuccess: () => {
      toast.success('Container direstart');
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['appDetails', activeServerId, id] });
    },
    onError: (e) => toast.error(e.message)
  });

  const startMutation = useMutation({
    mutationFn: (containerId: string) => startContainer(serverUrl, containerId),
    onSuccess: () => {
      toast.success('Container berjalan');
      queryClient.invalidateQueries({ queryKey: ['appDetails', activeServerId, id] });
    },
    onError: (e) => toast.error(e.message)
  });

  const handleRedeploy = () => {
    setIsDeploying(true);
    toast.info('Memulai redeploy...');
    setTimeout(() => {
      setIsDeploying(false);
      toast.success('Redeploy berhasil diselesaikan');
    }, 4000);
  };

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <div style={{ padding: 24 }}><Skeleton height={200} /></div>;
  }
  if (error || !app) {
    return <div style={{ padding: 24 }}><ErrorState message={error?.message || 'App tidak ditemukan'} /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-base)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <button 
            onClick={() => router.push('/')}
            style={{ padding: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, background: 'var(--accent-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                <Box size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {app.name}
                  <StatusBadge variant={statusVariant(app.status)}>{app.status}</StatusBadge>
                </h1>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', gap: 16, marginTop: 4 }}>
                  <span><span style={{ fontWeight: 600 }}>Image:</span> {app.image}:{app.version}</span>
                  <span><span style={{ fontWeight: 600 }}>Uptime:</span> {app.uptime}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            {app.status === 'running' ? (
              <>
                <button
                  onClick={() => setConfirmAction('restart')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border-default)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  <RefreshCw size={14} /> Restart
                </button>
                <button
                  onClick={() => setConfirmAction('stop')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--danger-border)', background: 'var(--danger-bg)', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >
                  <Square size={14} fill="currentColor" /> Stop
                </button>
              </>
            ) : (
              <button
                onClick={() => startMutation.mutate(app.id)}
                disabled={startMutation.isPending}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--success-border)', background: 'var(--success-bg)', color: 'var(--success)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                <Play size={14} fill="currentColor" /> Start
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          {(['overview', 'deploy', 'health', 'env'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: 'none', border: 'none', padding: '0 0 12px 0',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                color: activeTab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
                textTransform: 'capitalize'
              }}
            >
              {t === 'env' ? 'Environment' : t === 'deploy' ? 'Deploy & Git' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* CPU Chart */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <SectionLabel>CPU Usage</SectionLabel>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{app.cpu.toFixed(1)}%</span>
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={app.cpuHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cpuGradApp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#cpuGradApp)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* RAM Chart */}
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <SectionLabel>RAM Usage</SectionLabel>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--warning)' }}>{app.ram} MB</span>
                </div>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={app.ramHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="ramGradApp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                      <Area type="monotone" dataKey="value" stroke="var(--warning)" strokeWidth={2} fillOpacity={1} fill="url(#ramGradApp)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            <Card>
              <SectionLabel>Network & Ports</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                {app.ports.map(p => (
                  <div key={p} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}>
                    {p}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* DEPLOY & GIT */}
        {activeTab === 'deploy' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <GitCommit size={18} color="var(--text-secondary)" />
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Git History</span>
                </div>
                <button
                  disabled={isDeploying}
                  onClick={handleRedeploy}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--accent)', color: 'white', cursor: isDeploying ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: isDeploying ? 0.7 : 1 }}
                >
                  <RefreshCw size={14} className={isDeploying ? 'spin' : ''} /> {isDeploying ? 'Deploying...' : 'Redeploy Latest'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 10, bottom: 10, left: 19, width: 2, background: 'var(--border-subtle)' }} />
                {app.commits.map((c, i) => (
                  <div key={c.hash} style={{ display: 'flex', gap: 16, padding: '16px 0', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: i === 0 ? 'var(--accent)' : 'var(--bg-surface)', border: `2px solid ${i === 0 ? 'var(--accent)' : 'var(--border-default)'}`, marginTop: 4 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{c.message}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 12 }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--info)' }}>{c.hash}</span>
                        <span>by <span style={{ color: 'var(--text-secondary)' }}>{c.author}</span></span>
                        <span>{formatRelativeTime(c.date)}</span>
                      </div>
                    </div>
                    <div>
                      {i !== 0 && (
                        <button style={{ padding: '6px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, fontSize: 11, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          Rollback
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            
            <Card style={{ alignSelf: 'start' }}>
              <SectionLabel>Deployment Info</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Source</span>
                  <span style={{ fontWeight: 500 }}>GitHub</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Branch</span>
                  <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>main</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Auto Deploy</span>
                  <StatusBadge variant="success">Enabled</StatusBadge>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* HEALTH */}
        {activeTab === 'health' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
              <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
                {app.healthStatus === 'healthy' ? <CheckCircle2 size={40} color="var(--success)" /> : app.healthStatus === 'degraded' ? <Clock size={40} color="var(--warning)" /> : <ServerCrash size={40} color="var(--danger)" />}
                <div style={{ fontSize: 18, fontWeight: 700, textTransform: 'capitalize' }}>System {app.healthStatus}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Last checked 1 min ago</div>
              </Card>

              <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
                {app.sslExpiryDays > 14 ? <ShieldCheck size={40} color="var(--success)" /> : <ShieldAlert size={40} color="var(--warning)" />}
                <div style={{ fontSize: 18, fontWeight: 700 }}>SSL Active</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Expires in {app.sslExpiryDays} days</div>
              </Card>
            </div>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <SectionLabel>Response Time (ms)</SectionLabel>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--info)' }}>Avg 200ms</span>
              </div>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={app.responseTimeHistory} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--info)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--info)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="value" stroke="var(--info)" strokeWidth={2} fillOpacity={1} fill="url(#rtGrad)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

        {/* ENVIRONMENT */}
        {activeTab === 'env' && (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings size={18} color="var(--text-secondary)" />
                <span style={{ fontSize: 16, fontWeight: 600 }}>Environment Variables</span>
              </div>
              <button style={{ padding: '6px 12px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Save Changes
              </button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', width: '30%' }}>KEY</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>VALUE</th>
                  <th style={{ padding: '12px 20px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', width: 80 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {app.envVars.map((env, i) => (
                  <tr key={env.key} style={{ borderBottom: i === app.envVars.length - 1 ? 'none' : '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 20px', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{env.key}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <input 
                        type={env.isSecret && !showSecrets[env.key] ? 'password' : 'text'}
                        defaultValue={env.value}
                        style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 13 }}
                      />
                    </td>
                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                      {env.isSecret && (
                        <button 
                          onClick={() => toggleSecret(env.key)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          {showSecrets[env.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

      </div>

      <ConfirmDialog
        isOpen={!!confirmAction}
        title={confirmAction === 'restart' ? 'Restart App' : 'Stop App'}
        message={`Apakah Anda yakin ingin melakukan ${confirmAction} pada aplikasi ${app.name}?`}
        confirmText={confirmAction === 'restart' ? 'Restart' : 'Stop'}
        variant={confirmAction === 'restart' ? 'warning' : 'danger'}
        isLoading={stopMutation.isPending || restartMutation.isPending}
        onConfirm={() => confirmAction === 'restart' ? restartMutation.mutate(app.id) : stopMutation.mutate(app.id)}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
