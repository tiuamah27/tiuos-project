import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ServerConfig } from '@/types';

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

      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      activeTab: 'overview',
      setActiveTab: (tab) => set({ activeTab: tab }),

      dataMode: (process.env.NEXT_PUBLIC_DATA_MODE as 'mock' | 'live') ?? 'mock',
      setDataMode: (mode) => set({ dataMode: mode }),
    }),
    { name: 'tiuos-store', partialize: (s) => ({ activeServerId: s.activeServerId, sidebarOpen: s.sidebarOpen, activeTab: s.activeTab }) }
  )
);
