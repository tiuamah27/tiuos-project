import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSystemMetrics, getContainers } from '@/services';
import { useTiuStore } from '@/store';
import { toast } from 'sonner';

export function useAlertMonitor() {
  const { activeServerId, servers, alertThresholds, addNotification, channels } = useTiuStore();
  const serverUrl = servers.find(s => s.id === activeServerId)?.url ?? '';
  
  const { data: metrics } = useQuery({
    queryKey: ['systemMetrics', activeServerId],
    queryFn: () => getSystemMetrics(serverUrl),
    refetchInterval: 5000,
  });

  const { data: containers } = useQuery({
    queryKey: ['containers', activeServerId],
    queryFn: () => getContainers(serverUrl),
    refetchInterval: 5000,
  });

  const lastAlerts = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!metrics) return;
    const now = Date.now();
    const cooldown = 60000; // 1 minute cooldown per alert type

    const triggerAlert = (id: string, title: string, message: string, level: 'warning' | 'error') => {
      if (now - (lastAlerts.current[id] || 0) > cooldown) {
        lastAlerts.current[id] = now;
        addNotification({ title, message, level });
        toast[level === 'error' ? 'error' : 'warning'](`${title}: ${message}`);
        
        // Mock sending to channels
        const enabledChannels = channels.filter(c => c.enabled);
        if (enabledChannels.length > 0) {
          console.log(`[Alert Monitor] Sending alert to ${enabledChannels.map(c => c.type).join(', ')}`);
        }
      }
    };

    if (metrics.cpu > alertThresholds.cpu) {
      triggerAlert('cpu', 'High CPU Usage', `CPU usage is at ${metrics.cpu.toFixed(1)}%, exceeding threshold of ${alertThresholds.cpu}%`, 'warning');
    }
    if (metrics.ram > alertThresholds.ram) {
      triggerAlert('ram', 'High RAM Usage', `RAM usage is at ${metrics.ram.toFixed(1)}%, exceeding threshold of ${alertThresholds.ram}%`, 'warning');
    }
    if (metrics.disk > alertThresholds.disk) {
      triggerAlert('disk', 'High Disk Usage', `Disk usage is at ${metrics.disk.toFixed(1)}%, exceeding threshold of ${alertThresholds.disk}%`, 'warning');
    }
  }, [metrics, alertThresholds, addNotification, channels]);

  useEffect(() => {
    if (!containers) return;
    const now = Date.now();
    const cooldown = 60000;

    containers.forEach(c => {
      // Alert for exited container if it is not expected
      if (c.status === 'exited' || c.status === 'dead') {
        const id = `container_down_${c.id}`;
        if (now - (lastAlerts.current[id] || 0) > cooldown) {
          lastAlerts.current[id] = now;
          addNotification({ title: 'Container Down', message: `Container ${c.name} has stopped unexpectedly.`, level: 'error' });
          toast.error(`Container Down: ${c.name}`);
        }
      }
      // Alert for crash loop
      if (c.restartCount > 5) {
        const id = `container_restart_${c.id}`;
        if (now - (lastAlerts.current[id] || 0) > cooldown) {
          lastAlerts.current[id] = now;
          addNotification({ title: 'Crash Loop', message: `Container ${c.name} has restarted ${c.restartCount} times.`, level: 'error' });
          toast.error(`Crash Loop: ${c.name}`);
        }
      }
    });
  }, [containers, addNotification]);
}
