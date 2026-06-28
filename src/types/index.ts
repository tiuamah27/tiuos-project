// ─────────────────────────────────────────────
// TiuOS — Global Types
// ─────────────────────────────────────────────

export interface ServerConfig {
  id: string;
  name: string;
  url: string;
  location?: string;
}

// ── System ──────────────────────────────────
export interface SystemMetrics {
  cpu: number;           // percentage 0-100
  cpuInfo?: { cores: number; ghz: number };
  ram: { used: number; total: number; percent: number }; // GB
  disk: { used: number; total: number; percent: number }; // GB
  network: { download: number; upload: number };          // Mbps
  uptime: string;        // "5d 12h 33m"
  hostname: string;
  os?: string;
  loadAvg?: [number, number, number];
}

export interface SparkPoint {
  t: number;   // timestamp ms
  v: number;   // value
}

// ── Container / Docker ──────────────────────
export type ContainerStatus = 'running' | 'stopped' | 'paused' | 'restarting' | 'dead';

export interface Container {
  id: string;
  name: string;
  image: string;
  version: string;
  status: ContainerStatus;
  cpu: number;        // %
  ram: number;        // MB
  uptime: string;     // "5d 12h"
  restartCount: number;
  lastRestart: string | null;  // ISO string or null
  ports: string[];    // ["3000:3000", "5432:5432"]
  branch?: string;
  commit?: string;
}

// ── Storage ──────────────────────────────────
export interface StorageCategory {
  label: string;
  path: string;
  sizeGB: number;
  sizeBytes?: number;
  color: string;
}

export interface DockerVolume {
  name: string;
  mountpoint: string;
  sizeGB: number;
  sizeBytes?: number;
}

export interface StorageData {
  categories: StorageCategory[];
  volumes: DockerVolume[];
  totalGB: number;
  usedGB: number;
}

// ── Apps ─────────────────────────────────────
export type AppType = 'monitoring' | 'database' | 'automation' | 'tunnel' | 'finance' | 'custom';

export interface App {
  id: string;
  name: string;
  type: AppType;
  version: string;
  status: ContainerStatus;
  url?: string;
  manageUrl?: string;
  container?: string;
  image?: string;
  healthy?: boolean;
  created?: string;
  branch?: string;
  commit?: string;
}

// ── Files ────────────────────────────────────
export type FileType = 'file' | 'dir' | 'symlink';

export interface FileEntry {
  name: string;
  path: string;
  type: FileType;
  sizeBytes: number;
  modifiedAt: string;   // ISO string
  permissions?: string; // "rwxr-xr-x"
  owner?: string;
  isSensitive?: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  isSensored: boolean;
  sensoredKeys: string[];
  encoding: 'text' | 'binary' | 'too-large';
}

// ── Activity ─────────────────────────────────
export type ActivityLevel = 'success' | 'warning' | 'error' | 'info';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  level: ActivityLevel;
  source: string;
  message: string;
}

// ── Infrastructure Summary ───────────────────
export interface InfrastructureSummary {
  server: SystemMetrics;
  containersRunning: number;
  containersTotal: number;
  appsHealthy: number;
  appsTotal: number;
  storagePercent: number;
}

// ── API Response wrapper ─────────────────────
export interface ApiResponse<T> {
  status: 'ok' | 'unavailable';
  data?: T;
  reason?: string;
  ts: number;
}
