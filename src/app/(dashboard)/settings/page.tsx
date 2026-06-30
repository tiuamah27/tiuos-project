'use client';

import { useTiuStore } from '@/store';
import { Card, SectionLabel } from '@/components/ui';
import { toast } from 'sonner';
import { Bell, ShieldAlert, Send, Server, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

type SettingsTab = 'alerts' | 'servers';

export default function SettingsPage() {
  const { alertThresholds, setAlertThresholds, channels, updateChannel, servers, addServer, removeServer, activeServerId } = useTiuStore();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('alerts');
  const [thresh, setThresh] = useState(alertThresholds);

  // New server state
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerLocation, setNewServerLocation] = useState('');

  const handleSaveThresholds = () => {
    setAlertThresholds(thresh);
    toast.success('Alert thresholds saved');
  };

  const handleTestNotification = (type: string) => {
    const channel = channels.find(c => c.type === type);
    if (!channel || !channel.enabled) {
      toast.error(`Cannot test: ${type} channel is disabled`);
      return;
    }
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: `Sending test to ${type}...`,
        success: `Test notification sent via ${type}!`,
        error: `Failed to send to ${type}`
      }
    );
  };

  const handleAddServer = () => {
    if (!newServerName || !newServerUrl) {
      toast.error('Name and URL are required');
      return;
    }
    addServer({
      id: `server-${Date.now()}`,
      name: newServerName,
      url: newServerUrl,
      location: newServerLocation || undefined,
    });
    setNewServerName('');
    setNewServerUrl('');
    setNewServerLocation('');
    toast.success('Server added successfully');
  };

  const handleRemoveServer = (id: string) => {
    if (servers.length <= 1) {
      toast.error('Cannot remove the last server');
      return;
    }
    removeServer(id);
    toast.success('Server removed');
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto', width: '100%', overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Settings</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Configure system alert thresholds, notification channels, and manage servers.</p>
      </div>

      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'alerts' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'alerts' ? '2px solid var(--accent)' : '2px solid transparent',
          }}
        >
          Alerts & Notifications
        </button>
        <button
          onClick={() => setActiveTab('servers')}
          style={{
            background: 'none', border: 'none', padding: '0 0 12px 0',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            color: activeTab === 'servers' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'servers' ? '2px solid var(--accent)' : '2px solid transparent',
          }}
        >
          Server Management
        </button>
      </div>

      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <ShieldAlert size={18} color="var(--warning)" />
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Alert Rules & Thresholds</h2>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Set the thresholds for system metrics. When these are exceeded, an alert will be triggered.
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* CPU */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>CPU Usage Alert</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{thresh.cpu}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="5"
                  value={thresh.cpu} onChange={e => setThresh({ ...thresh, cpu: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>

              {/* RAM */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>RAM Usage Alert</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{thresh.ram}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="5"
                  value={thresh.ram} onChange={e => setThresh({ ...thresh, ram: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>

              {/* Disk */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Disk Space Alert</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{thresh.disk}%</span>
                </div>
                <input 
                  type="range" min="10" max="100" step="5"
                  value={thresh.disk} onChange={e => setThresh({ ...thresh, disk: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button 
                onClick={handleSaveThresholds}
                style={{ padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}
              >
                Save Thresholds
              </button>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Bell size={18} color="var(--info)" />
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Notification Channels</h2>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Configure where you want to receive alert notifications.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {channels.map((ch) => (
                <div key={ch.type} style={{ padding: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input 
                        type="checkbox" 
                        checked={ch.enabled} 
                        onChange={(e) => updateChannel(ch.type, { enabled: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{ch.type}</span>
                    </div>
                    <button 
                      onClick={() => handleTestNotification(ch.type)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 12, cursor: 'pointer' }}
                    >
                      <Send size={12} /> Test
                    </button>
                  </div>

                  {ch.enabled && (
                    <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {ch.type === 'telegram' && (
                        <>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Bot Token</label>
                            <input type="password" value={ch.token ?? ''} onChange={e => updateChannel(ch.type, { token: e.target.value })} style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13 }} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Chat ID</label>
                            <input type="text" value={ch.chatId ?? ''} onChange={e => updateChannel(ch.type, { chatId: e.target.value })} style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13 }} placeholder="-1001234567890" />
                          </div>
                        </>
                      )}

                      {ch.type === 'discord' && (
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Webhook URL</label>
                          <input type="password" value={ch.webhookUrl ?? ''} onChange={e => updateChannel(ch.type, { webhookUrl: e.target.value })} style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13 }} placeholder="https://discord.com/api/webhooks/..." />
                        </div>
                      )}

                      {ch.type === 'email' && (
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>To Address</label>
                          <input type="email" value={ch.emailTo ?? ''} onChange={e => updateChannel(ch.type, { emailTo: e.target.value })} style={{ width: '100%', padding: '6px 10px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 4, color: 'var(--text-primary)', fontSize: 13 }} placeholder="admin@example.com" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'servers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Server size={18} color="var(--accent)" />
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Manage Servers</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {servers.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-elevated)', border: `1px solid ${s.id === activeServerId ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {s.name}
                      {s.id === activeServerId && <span style={{ fontSize: 10, background: 'var(--accent-bg)', color: 'var(--accent)', padding: '2px 6px', borderRadius: 4 }}>Active</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'monospace' }}>{s.url} • {s.location || 'Unknown location'}</div>
                  </div>
                  <button 
                    onClick={() => handleRemoveServer(s.id)}
                    disabled={servers.length <= 1}
                    style={{ padding: 8, background: 'transparent', border: 'none', color: 'var(--danger)', cursor: servers.length <= 1 ? 'not-allowed' : 'pointer', opacity: servers.length <= 1 ? 0.5 : 1 }}
                    title="Remove Server"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <SectionLabel>Add New Server</SectionLabel>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <input 
                  type="text" 
                  placeholder="Server Name (e.g. Jakarta App)" 
                  value={newServerName} onChange={e => setNewServerName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }} 
                />
                <input 
                  type="text" 
                  placeholder="Location (e.g. Jakarta, ID)" 
                  value={newServerLocation} onChange={e => setNewServerLocation(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <input 
                  type="url" 
                  placeholder="TiuAgent URL (e.g. http://192.168.1.5:8080)" 
                  value={newServerUrl} onChange={e => setNewServerUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13, marginBottom: 8 }} 
                />
              </div>
              <button 
                onClick={handleAddServer}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                <Plus size={16} /> Add Server
              </button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
