import {
  SystemMetrics, Container, StorageData, App,
  ActivityEvent, InfrastructureSummary, FileEntry, FileContent,
  ActionResponse, LogLine, AppDetails, MetricDataPoint, GitCommit, EnvVar
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────
function rand(min: number, max: number, dec = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}

// ── System ───────────────────────────────────────────────────────────────
export function getMockSystem(): SystemMetrics {
  return {
    cpu: rand(8, 45),
    cpuInfo: { cores: 8, ghz: 3.2 },
    ram: { used: rand(4.2, 6.8), total: 8, percent: rand(52, 85) },
    disk: { used: rand(180, 240), total: 500, percent: rand(36, 48) },
    network: { download: rand(0.5, 8.2), upload: rand(0.1, 2.4) },
    uptime: '12d 4h 22m',
    hostname: 'tiuserver-a',
    os: 'Ubuntu 24.04 LTS',
    loadAvg: [rand(0.1, 1.2), rand(0.1, 0.9), rand(0.1, 0.7)],
  };
}

export function getMockSystemB(): SystemMetrics {
  return generateSystemMetricsForServer('server-b');
}

export function generateSystemMetricsForServer(serverId: string): SystemMetrics {
  const seed = serverId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const now = Date.now();
  
  // Make metrics deterministically vary by server and time
  const cpuBase = (seed % 60) + 10; // 10% to 70% base
  const ramBase = (seed % 40) + 30; // 30% to 70% base
  const diskBase = (seed % 50) + 20; // 20% to 70% base
  
  const timeOffset = Math.sin(now / 10000); // Oscillation over time
  
  const cpu = Math.min(100, Math.max(0, cpuBase + timeOffset * 20 + (Math.random() * 5)));
  const ram = Math.min(100, Math.max(0, ramBase + timeOffset * 5 + (Math.random() * 2)));
  
  return {
    cpu,
    ram: { used: ram * 0.08, total: 8, percent: ram },
    disk: { used: diskBase * 5, total: 500, percent: diskBase },
    uptime: `${Math.floor(seed % 30)} days`,
    hostname: serverId,
    os: 'Ubuntu 22.04 LTS',
    cpuInfo: { cores: 4, ghz: 2.4 },
    network: { download: rand(0.1, 2.0), upload: rand(0.05, 0.8) },
    loadAvg: [rand(0.05, 0.5), rand(0.05, 0.4), rand(0.05, 0.3)],
  };
}

// ── Containers ────────────────────────────────────────────────────────────
export const MOCK_CONTAINERS: Container[] = [
  {
    id: 'c1a2b3', name: 'hanfin', image: 'hanfin', version: 'v2.4.1',
    status: 'running', cpu: rand(0.3, 1.8), ram: 312,
    uptime: '5d 12h 33m', restartCount: 3,
    lastRestart: new Date(Date.now() - 3 * 86400000).toISOString(),
    ports: ['3000:3000'], branch: 'main', commit: 'a3f91c2',
  },
  {
    id: 'd4e5f6', name: 'n8n', image: 'n8nio/n8n', version: '1.45.1',
    status: 'running', cpu: rand(0.8, 3.5), ram: 480,
    uptime: '5d 12h 33m', restartCount: 1,
    lastRestart: new Date(Date.now() - 5 * 86400000).toISOString(),
    ports: ['5678:5678'],
  },
  {
    id: 'g7h8i9', name: 'postgres', image: 'postgres', version: '16.2',
    status: 'running', cpu: rand(0.1, 0.5), ram: 128,
    uptime: '12d 4h 22m', restartCount: 0,
    lastRestart: null,
    ports: ['5432:5432'],
  },
  {
    id: 'j1k2l3', name: 'portainer', image: 'portainer/portainer-ce', version: '2.20.3',
    status: 'running', cpu: rand(0.05, 0.3), ram: 64,
    uptime: '12d 4h 22m', restartCount: 0,
    lastRestart: null,
    ports: ['9000:9000', '9443:9443'],
  },
  {
    id: 'm4n5o6', name: 'cloudflared', image: 'cloudflare/cloudflared', version: 'latest',
    status: 'stopped', cpu: 0, ram: 0,
    uptime: '—', restartCount: 2,
    lastRestart: new Date(Date.now() - 1 * 86400000).toISOString(),
    ports: [],
  },
  {
    id: 'p7q8r9', name: 'nginx', image: 'nginx', version: '1.25.4',
    status: 'running', cpu: rand(0.02, 0.2), ram: 32,
    uptime: '12d 4h 22m', restartCount: 0,
    lastRestart: null,
    ports: ['80:80', '443:443'],
  },
];

// ── Storage ───────────────────────────────────────────────────────────────
export const MOCK_STORAGE: StorageData = {
  totalGB: 500, usedGB: 210,
  categories: [
    { label: 'Aplikasi', path: '/opt/apps', sizeGB: 12.4, color: '#39d353' },
    { label: 'Database', path: '/opt/data', sizeGB: 48.2, color: '#3b82f6' },
    { label: 'Backup', path: '/opt/backups', sizeGB: 95.1, color: '#f59e0b' },
    { label: 'Infra', path: '/opt/infra', sizeGB: 3.2, color: '#8b5cf6' },
    { label: 'Home', path: '/home', sizeGB: 8.7, color: '#ec4899' },
    { label: 'Lainnya', path: '/', sizeGB: 42.4, color: '#6b7280' },
  ],
  volumes: [
    { name: 'postgres_data', mountpoint: '/var/lib/docker/volumes/postgres_data/_data', sizeGB: 45.2 },
    { name: 'n8n_data', mountpoint: '/var/lib/docker/volumes/n8n_data/_data', sizeGB: 2.8 },
    { name: 'portainer_data', mountpoint: '/var/lib/docker/volumes/portainer_data/_data', sizeGB: 0.4 },
  ],
};

// ── Apps ──────────────────────────────────────────────────────────────────
export const MOCK_APPS: App[] = [
  { id: 'hanfin', name: 'HanFin', type: 'finance', version: 'v2.4.1', status: 'running', url: 'http://192.168.1.10:3000', branch: 'main', commit: 'a3f91c2', container: 'hanfin-app-1', image: 'ghcr.io/hanfin:v2.4.1', healthy: true, manageUrl: 'http://192.168.1.10:3000/admin', created: '2023-10-25T10:00:00Z' },
  { id: 'n8n', name: 'n8n', type: 'automation', version: '1.45.1', status: 'running', url: 'http://192.168.1.10:5678', container: 'n8n-docker-1', image: 'n8nio/n8n:latest', healthy: true, created: '2024-01-15T08:30:00Z' },
  { id: 'postgres', name: 'PostgreSQL', type: 'database', version: '16.2', status: 'running', container: 'postgres-db-1', image: 'postgres:16.2', healthy: true, created: '2023-11-12T14:20:00Z' },
  { id: 'portainer', name: 'Portainer', type: 'monitoring', version: '2.20.3', status: 'running', url: 'http://192.168.1.10:9000', container: 'portainer', image: 'portainer/portainer-ce:latest', healthy: true, created: '2023-09-01T09:15:00Z' },
  { id: 'cloudflared', name: 'Cloudflared', type: 'tunnel', version: 'latest', status: 'stopped', container: 'cloudflare-tunnel', image: 'cloudflare/cloudflared:latest', healthy: false, created: '2024-02-20T11:45:00Z' },
  { id: 'nginx', name: 'Nginx', type: 'custom', version: '1.25.4', status: 'running', container: 'nginx-proxy', image: 'nginx:alpine', healthy: true, created: '2023-08-10T16:00:00Z' },
];

// ── Activity ──────────────────────────────────────────────────────────────
export const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: '1', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), level: 'warning', source: 'cloudflared', message: 'Container berhenti — tidak ada sinyal heartbeat' },
  { id: '2', timestamp: new Date(Date.now() - 18 * 60000).toISOString(), level: 'success', source: 'hanfin', message: 'Container berjalan normal — uptime 5d 12h' },
  { id: '3', timestamp: new Date(Date.now() - 1 * 3600000).toISOString(), level: 'info', source: 'system', message: 'RAM usage 78% — mendekati batas rekomendasi' },
  { id: '4', timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), level: 'success', source: 'n8n', message: '142 workflow aktif, 2.847 eksekusi berhasil' },
  { id: '5', timestamp: new Date(Date.now() - 6 * 3600000).toISOString(), level: 'info', source: 'postgres', message: 'Database berjalan normal — 12 hari tanpa restart' },
  { id: '6', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), level: 'error', source: 'cloudflared', message: 'Container restart ke-2 — koneksi tunnel terputus' },
  { id: '7', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), level: 'success', source: 'backup', message: 'Direktori backup ditemukan: /opt/backups (95.1 GB)' },
  { id: '8', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), level: 'success', source: 'hanfin', message: 'Container restart berhasil setelah update v2.4.1' },
];

// ── Infrastructure Summary ────────────────────────────────────────────────
export function getMockInfra(): InfrastructureSummary {
  return {
    server: getMockSystem(),
    containersRunning: 5,
    containersTotal: 6,
    appsHealthy: 4,
    appsTotal: 6,
    storagePercent: 42,
  };
}

// ── Files ─────────────────────────────────────────────────────────────────
export const MOCK_FILE_TREE: Record<string, FileEntry[]> = {
  '/': [
    { name: 'opt', path: '/opt', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 86400000).toISOString() },
    { name: 'home', path: '/home', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 3600000).toISOString() },
    { name: 'etc', path: '/etc', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 7200000).toISOString() },
  ],
  '/opt': [
    { name: 'apps', path: '/opt/apps', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 86400000).toISOString() },
    { name: 'infra', path: '/opt/infra', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 86400000).toISOString() },
    { name: 'backups', path: '/opt/backups', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  '/opt/apps': [
    { name: 'hanfin', path: '/opt/apps/hanfin', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { name: 'n8n', path: '/opt/apps/n8n', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
  ],
  '/opt/apps/hanfin': [
    { name: 'package.json', path: '/opt/apps/hanfin/package.json', type: 'file', sizeBytes: 1240, modifiedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { name: '.env', path: '/opt/apps/hanfin/.env', type: 'file', sizeBytes: 842, modifiedAt: new Date(Date.now() - 2 * 86400000).toISOString(), isSensitive: true },
    { name: 'docker-compose.yml', path: '/opt/apps/hanfin/docker-compose.yml', type: 'file', sizeBytes: 680, modifiedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { name: 'src', path: '/opt/apps/hanfin/src', type: 'dir', sizeBytes: 0, modifiedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    { name: 'README.md', path: '/opt/apps/hanfin/README.md', type: 'file', sizeBytes: 2100, modifiedAt: new Date(Date.now() - 10 * 86400000).toISOString() },
  ],
};

export const MOCK_FILE_CONTENTS: Record<string, FileContent> = {
  '/opt/apps/hanfin/.env': {
    path: '/opt/apps/hanfin/.env',
    isSensored: true,
    sensoredKeys: ['DB_PASS', 'JWT_SECRET'],
    encoding: 'text',
    content: `# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hanfin_db
DB_USER=hanfin
DB_PASS=••••••••••
# Auth
JWT_SECRET=••••••••••
NEXT_PUBLIC_URL=http://192.168.1.10:3000
# App
NODE_ENV=production
PORT=3000`,
  },
  '/opt/apps/hanfin/package.json': {
    path: '/opt/apps/hanfin/package.json',
    isSensored: false, sensoredKeys: [], encoding: 'text',
    content: `{
  "name": "hanfin",
  "version": "2.4.1",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "@supabase/supabase-js": "^2.39.0"
  }
}`,
  },
  '/opt/apps/hanfin/docker-compose.yml': {
    path: '/opt/apps/hanfin/docker-compose.yml',
    isSensored: false, sensoredKeys: [], encoding: 'text',
    content: `version: '3.8'
services:
  hanfin:
    image: hanfin:v2.4.1
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    networks:
      - tiu-network

networks:
  tiu-network:
    external: true`,
  },
  '/opt/apps/hanfin/README.md': {
    path: '/opt/apps/hanfin/README.md',
    isSensored: false, sensoredKeys: [], encoding: 'text',
    content: `# HanFin

Aplikasi keuangan keluarga berbasis web.

## Stack
- Next.js 14
- Supabase
- Tailwind CSS

## Deployment
\`\`\`
docker compose up -d
\`\`\``,
  },
};

// ── Docker Actions (Mock) ─────────────────────────────────────────────────
export async function mockStartContainer(id: string): Promise<ActionResponse> {
  const container = MOCK_CONTAINERS.find(c => c.id === id);
  if (!container) return { success: false, message: 'Container tidak ditemukan' };
  if (container.status === 'running') return { success: false, message: 'Container sudah berjalan' };
  
  container.status = 'running';
  return { success: true, message: `Container ${container.name} berhasil dijalankan` };
}

export async function mockStopContainer(id: string): Promise<ActionResponse> {
  const container = MOCK_CONTAINERS.find(c => c.id === id);
  if (!container) return { success: false, message: 'Container tidak ditemukan' };
  if (container.status !== 'running') return { success: false, message: 'Container tidak sedang berjalan' };
  
  container.status = 'stopped';
  container.cpu = 0;
  container.ram = 0;
  return { success: true, message: `Container ${container.name} berhasil dihentikan` };
}

export async function mockRestartContainer(id: string): Promise<ActionResponse> {
  const container = MOCK_CONTAINERS.find(c => c.id === id);
  if (!container) return { success: false, message: 'Container tidak ditemukan' };
  
  container.status = 'running';
  container.restartCount += 1;
  container.lastRestart = new Date().toISOString();
  return { success: true, message: `Container ${container.name} berhasil di-restart` };
}

export async function mockGetContainerLogs(id: string, tail: number = 100): Promise<LogLine[]> {
  const container = MOCK_CONTAINERS.find(c => c.id === id);
  if (!container) throw new Error('Container tidak ditemukan');
  
  const logs: LogLine[] = [];
  const now = Date.now();
  
  for (let i = tail; i > 0; i--) {
    const time = new Date(now - i * 1000).toISOString();
    logs.push({
      timestamp: time,
      text: `[${time}] [${container.name}] Log entry ${tail - i + 1}: ${Math.random().toString(36).substring(7)}`
    });
  }
  
  return logs;
}

export function generateMockAppDetails(id: string): AppDetails {
  const c = MOCK_CONTAINERS.find(c => c.id === id) || MOCK_CONTAINERS[0];
  
  const now = new Date();
  const generateHistory = (base: number, variance: number): MetricDataPoint[] => {
    return Array.from({ length: 24 }).map((_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { time, value: Math.max(0, Math.min(100, base + (Math.random() * variance * 2 - variance))) };
    });
  };

  const cpuHistory = generateHistory(c.cpu, 5);
  const ramHistory = generateHistory((c.ram / 2048) * 100, 10);
  const responseTimeHistory = Array.from({ length: 24 }).map((_, i) => ({
    time: new Date(now.getTime() - (23 - i) * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: Math.max(20, Math.min(500, 150 + (Math.random() * 100 - 50)))
  }));

  const commits: GitCommit[] = [
    { hash: 'a1b2c3d', message: 'Update configuration for production', author: 'tiuam', date: new Date(now.getTime() - 86400000).toISOString() },
    { hash: 'e4f5g6h', message: 'Fix bug in login flow', author: 'johndoe', date: new Date(now.getTime() - 172800000).toISOString() },
    { hash: 'i7j8k9l', message: 'Initial commit', author: 'tiuam', date: new Date(now.getTime() - 259200000).toISOString() },
  ];

  const envVars: EnvVar[] = [
    { key: 'NODE_ENV', value: 'production', isSecret: false },
    { key: 'PORT', value: c.ports[0]?.split(':')[0] || '80', isSecret: false },
    { key: 'DATABASE_URL', value: 'postgresql://user:pass@db:5432/app', isSecret: true },
    { key: 'API_KEY', value: 'sk_live_1234567890abcdef', isSecret: true },
  ];

  return {
    ...c,
    cpuHistory,
    ramHistory,
    responseTimeHistory,
    commits,
    envVars,
    domain: `${c.name}.tiuos.local`,
    sslExpiryDays: Math.floor(Math.random() * 60) + 10,
    healthStatus: c.status === 'running' ? 'healthy' : 'down',
  };
}
