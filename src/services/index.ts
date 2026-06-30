/**
 * TiuOS Service Layer
 * ─────────────────────────────────────────────────────────────
 * Ini adalah satu-satunya file yang perlu diubah untuk switch
 * antara mock data dan TiuAgent real.
 *
 * Cara switch ke live:
 * 1. Set NEXT_PUBLIC_DATA_MODE=live di .env.local
 * 2. Pastikan TiuAgent berjalan di server target
 * 3. Selesai — semua fungsi di bawah otomatis hit TiuAgent
 * ─────────────────────────────────────────────────────────────
 */

import {
  SystemMetrics, Container, StorageData, App,
  ActivityEvent, InfrastructureSummary, FileEntry, FileContent, ApiResponse,
  ActionResponse, LogLine, AppDetails
} from '@/types';
import {
  getMockSystem, getMockSystemB, MOCK_CONTAINERS, MOCK_STORAGE,
  MOCK_APPS, MOCK_ACTIVITY, getMockInfra, MOCK_FILE_TREE, MOCK_FILE_CONTENTS,
  mockStartContainer, mockStopContainer, mockRestartContainer, mockGetContainerLogs, generateMockAppDetails, generateSystemMetricsForServer
} from './mock/data';

// ── Config ────────────────────────────────────────────────────────────────
import { useTiuStore } from '@/store';

function isMock(): boolean {
  return useTiuStore.getState().dataMode !== 'live';
}

async function fetchAgent<T>(serverUrl: string, path: string): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${serverUrl}${path}`, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { status: 'ok', data, ts: Date.now() };
  } catch (e) {
    return { status: 'unavailable', reason: String(e), ts: Date.now() };
  }
}

// ── System ────────────────────────────────────────────────────────────────
export async function getSystemMetrics(serverUrl: string, serverId?: string): Promise<SystemMetrics> {
  if (isMock()) {
    await delay(120);
    return serverId ? generateSystemMetricsForServer(serverId) : getMockSystem();
  }
  const res = await fetchAgent<SystemMetrics>(serverUrl, '/api/v1/system');
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

// ── Containers ────────────────────────────────────────────────────────────
export async function getContainers(serverUrl: string): Promise<Container[]> {
  if (isMock()) {
    await delay(180);
    return MOCK_CONTAINERS;
  }
  const res = await fetchAgent<Container[]>(serverUrl, '/api/v1/docker');
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

export async function getAppDetails(serverUrl: string, id: string): Promise<AppDetails> {
  if (isMock()) {
    await delay(150);
    return generateMockAppDetails(id);
  }
  const res = await fetchAgent<AppDetails>(serverUrl, `/api/v1/docker/${id}/details`);
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

export async function startContainer(serverUrl: string, id: string): Promise<ActionResponse> {
  if (isMock()) {
    await delay(500);
    return mockStartContainer(id);
  }
  const res = await fetchAgent<ActionResponse>(serverUrl, `/api/v1/docker/${id}/start`);
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

export async function stopContainer(serverUrl: string, id: string): Promise<ActionResponse> {
  if (isMock()) {
    await delay(500);
    return mockStopContainer(id);
  }
  const res = await fetchAgent<ActionResponse>(serverUrl, `/api/v1/docker/${id}/stop`);
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

export async function restartContainer(serverUrl: string, id: string): Promise<ActionResponse> {
  if (isMock()) {
    await delay(800);
    return mockRestartContainer(id);
  }
  const res = await fetchAgent<ActionResponse>(serverUrl, `/api/v1/docker/${id}/restart`);
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

export async function getContainerLogs(serverUrl: string, id: string, tail: number = 100): Promise<LogLine[]> {
  if (isMock()) {
    await delay(300);
    return mockGetContainerLogs(id, tail);
  }
  const res = await fetchAgent<LogLine[]>(serverUrl, `/api/v1/docker/${id}/logs?tail=${tail}`);
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

// ── Storage ───────────────────────────────────────────────────────────────
export async function getStorage(serverUrl: string): Promise<StorageData> {
  if (isMock()) {
    await delay(200);
    return MOCK_STORAGE;
  }
  const res = await fetchAgent<StorageData>(serverUrl, '/api/v1/storage');
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

// ── Apps ──────────────────────────────────────────────────────────────────
export async function getApps(serverUrl: string): Promise<App[]> {
  if (isMock()) {
    await delay(150);
    return MOCK_APPS;
  }
  const res = await fetchAgent<App[]>(serverUrl, '/api/v1/apps');
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

// ── Activity ──────────────────────────────────────────────────────────────
export async function getActivity(serverUrl: string): Promise<ActivityEvent[]> {
  if (isMock()) {
    await delay(100);
    return MOCK_ACTIVITY;
  }
  const res = await fetchAgent<ActivityEvent[]>(serverUrl, '/api/v1/activity');
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

// ── Infrastructure ────────────────────────────────────────────────────────
export async function getInfrastructure(serverUrl: string, serverId?: string): Promise<InfrastructureSummary> {
  if (isMock()) {
    await delay(200);
    const infra = getMockInfra();
    if (serverId === 'server-b') {
      infra.server = getMockSystemB();
      infra.containersRunning = 2;
      infra.containersTotal = 3;
    }
    return infra;
  }
  const res = await fetchAgent<InfrastructureSummary>(serverUrl, '/api/v1/infrastructure');
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

// ── Files ─────────────────────────────────────────────────────────────────
export async function listFiles(serverUrl: string, path: string): Promise<FileEntry[]> {
  if (isMock()) {
    await delay(150);
    return MOCK_FILE_TREE[path] ?? [];
  }
  const res = await fetchAgent<FileEntry[]>(serverUrl, `/api/v1/files/list?path=${encodeURIComponent(path)}`);
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

export async function readFile(serverUrl: string, path: string): Promise<FileContent> {
  if (isMock()) {
    await delay(120);
    const content = MOCK_FILE_CONTENTS[path];
    if (!content) throw new Error('File tidak tersedia di mock data');
    return content;
  }
  const res = await fetchAgent<FileContent>(serverUrl, `/api/v1/files/read?path=${encodeURIComponent(path)}`);
  if (res.status !== 'ok' || !res.data) throw new Error(res.reason);
  return res.data;
}

// ── Util ──────────────────────────────────────────────────────────────────
function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
