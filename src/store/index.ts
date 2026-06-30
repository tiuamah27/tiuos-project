import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServerConfig, AlertThresholds, NotificationChannel, AppNotification } from '@/types';

function parseServers(): ServerConfig[] {
  try {
    const raw = process.env.NEXT_PUBLIC_SERVERS;
    if (!raw) return [{ id: 'server-a', name: 'TiuServer-A', url: 'http://192.168.1.10:8080' }];
    return JSON.parse(raw);
  } catch {
    return [{ id: 'server-a', name: 'TiuServer-A', url: 'http://192.168.1.10:8080' }];
  }
}

export type TabId = 'overview' | 'docker' | 'files' | 'apps' | 'monitoring';

interface TiuStore {
  // Server selection
  servers: ServerConfig[];
  activeServerId: string;
  setActiveServer: (id: string) => void;
  getActiveServer: () => ServerConfig;
  addServer: (server: ServerConfig) => void;
  removeServer: (id: string) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;

  // Active tab (single-page dashboard)
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // Data mode
  dataMode: 'mock' | 'live';
  setDataMode: (mode: 'mock' | 'live') => void;

  // Alerts & Notifications
  alertThresholds: AlertThresholds;
  setAlertThresholds: (t: Partial<AlertThresholds>) => void;
  channels: NotificationChannel[];
  setChannels: (channels: NotificationChannel[]) => void;
  updateChannel: (type: NotificationChannel['type'], update: Partial<NotificationChannel>) => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useTiuStore = create<TiuStore>()(
  persist(
    (set, get) => ({
      servers: parseServers(),
      activeServerId: process.env.NEXT_PUBLIC_DEFAULT_SERVER ?? 'server-a',
      setActiveServer: (id) => set({ activeServerId: id }),
      getActiveServer: () => {
        const { servers, activeServerId } = get();
        return servers.find(s => s.id === activeServerId) ?? servers[0];
      },
      addServer: (server) => set((state) => ({ servers: [...state.servers, server] })),
      removeServer: (id) => set((state) => {
        const newServers = state.servers.filter(s => s.id !== id);
        return {
          servers: newServers,
          activeServerId: state.activeServerId === id ? (newServers[0]?.id ?? '') : state.activeServerId
        };
      }),

      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      activeTab: 'overview',
      setActiveTab: (tab) => set({ activeTab: tab }),

      dataMode: (process.env.NEXT_PUBLIC_DATA_MODE as 'mock' | 'live') ?? 'mock',
      setDataMode: (mode) => set({ dataMode: mode }),

      alertThresholds: { cpu: 90, ram: 90, disk: 85 },
      setAlertThresholds: (t) => set(s => ({ alertThresholds: { ...s.alertThresholds, ...t } })),
      channels: [
        { type: 'telegram', enabled: false },
        { type: 'discord', enabled: false },
        { type: 'email', enabled: false },
      ],
      setChannels: (channels) => set({ channels }),
      updateChannel: (type, update) => set(s => ({ channels: s.channels.map(c => c.type === type ? { ...c, ...update } : c) })),
      notifications: [],
      addNotification: (n) => set(s => {
        const newNotif: AppNotification = { ...n, id: Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString(), read: false };
        return { notifications: [newNotif, ...s.notifications].slice(0, 50) };
      }),
      markAsRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
      markAllAsRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    { name: 'tiuos-store', partialize: (s) => ({ activeServerId: s.activeServerId, sidebarOpen: s.sidebarOpen, activeTab: s.activeTab, alertThresholds: s.alertThresholds, channels: s.channels }) }
  )
);
