# 🔄 TiuAgent → TiuOS — Panduan Sinkronisasi

> Dokumen ini berisi panduan lengkap untuk menyinkronkan response TiuAgent
> agar 100% cocok dengan format yang diharapkan oleh TiuOS (frontend).
>
> **Referensi:**
> - TiuOS types: `tiuos/src/types/index.ts`
> - TiuOS services: `tiuos/src/services/index.ts`
> - TiuAgent: `03. Tiu Agent/src/`

---

## 📋 Ringkasan Perubahan

| # | Endpoint | Status | Tingkat Perubahan |
|---|----------|--------|-------------------|
| 1 | `/api/v1/system` | ⚠️ Mismatch besar | Restructure response |
| 2 | `/api/v1/docker` | ⚠️ Mismatch besar | Flatten + retype fields |
| 3 | `/api/v1/apps` | ⚠️ Mismatch sedang | Flatten + add `id` |
| 4 | `/api/v1/storage` | ⚠️ Mismatch sedang | Rename + restructure |
| 5 | `/api/v1/activity` | ⚠️ Mismatch sedang | Rename fields + add `id` |
| 6 | `/api/v1/infrastructure` | ⚠️ Mismatch sedang | Restructure response |
| 7 | `/api/v1/files/*` | ❌ Belum ada | Buat baru dari nol |

---

## 1️⃣ `/api/v1/system` — System Metrics

### Masalah
TiuAgent mengembalikan object nested (`cpu.usage`, `memory.used`), sedangkan TiuOS mengharapkan flat structure (`cpu`, `ram.used`). Selain itu, beberapa field penting belum ada di Agent.

### Agent Saat Ini (❌)
```json
{
  "cpu": { "usage": 45 },
  "memory": { "used": 4.7, "total": 8 },
  "disk": { "used": 210, "total": 500 },
  "network": { "downloadMbps": 5.5, "uploadMbps": 1.8 }
}
```

### TiuOS Butuh (✅)
```json
{
  "cpu": 45,
  "cpuInfo": { "cores": 6, "ghz": 3.2 },
  "ram": { "used": 4.7, "total": 8, "percent": 58.75 },
  "disk": { "used": 210, "total": 500, "percent": 42 },
  "network": { "download": 5.5, "upload": 1.8 },
  "uptime": "12d 4h 22m",
  "hostname": "tiu-server",
  "os": "Ubuntu 22.04",
  "loadAvg": [1.2, 0.8, 0.5]
}
```

### Yang Harus Diubah

#### File: `src/types/system.types.ts`
```diff
  export interface SystemResponse {
-   cpu: { usage: number };
-   memory: { used: number; total: number };
-   disk: { used: number; total: number };
-   network: { downloadMbps: number; uploadMbps: number };
+   cpu: number;
+   cpuInfo?: { cores: number; ghz: number };
+   ram: { used: number; total: number; percent: number };
+   disk: { used: number; total: number; percent: number };
+   network: { download: number; upload: number };
+   uptime: string;
+   hostname: string;
+   os?: string;
+   loadAvg?: [number, number, number];
  }
```

#### File: `src/services/system.service.ts`
- [ ] Ubah `cpu.usage` → `cpu` (langsung number)
- [ ] Tambah `cpuInfo` menggunakan `os.cpus()` untuk jumlah core dan kecepatan GHz
- [ ] Rename `memory` → `ram`, tambah field `percent`
- [ ] Tambah `percent` ke `disk`
- [ ] Rename `downloadMbps` → `download`, `uploadMbps` → `upload`
- [ ] Tambah `uptime` menggunakan `os.uptime()`, format ke "Xd Xh Xm"
- [ ] Tambah `hostname` menggunakan `os.hostname()`
- [ ] Tambah `os` dari `/etc/os-release` atau `os.type() + os.release()`
- [ ] Tambah `loadAvg` menggunakan `os.loadavg()`

---

## 2️⃣ `/api/v1/docker` — Container List

### Masalah
Agent mengembalikan wrapper `{ summary, containers, timestamp }`, sedangkan TiuOS mengharapkan **array langsung** `Container[]`. Beberapa field juga berbeda tipe (string vs number).

### Agent Saat Ini (❌)
```json
{
  "summary": { "total": 6, "running": 5, "stopped": 1 },
  "containers": [
    {
      "id": "a3f91c2d4e5f",
      "name": "hanfin",
      "image": "ghcr.io/hanfin:v2.4.1",
      "status": "running",
      "state": "healthy",
      "cpu": "1.4%",
      "ram": "312 MB",
      "uptime": "5d 12h",
      "created": "2023-10-25T00:00:00.000Z",
      "ports": ["3000:3000"]
    }
  ],
  "timestamp": "2026-06-28T12:00:00Z"
}
```

### TiuOS Butuh (✅)
```json
[
  {
    "id": "a3f91c2d4e5f",
    "name": "hanfin",
    "image": "ghcr.io/hanfin:v2.4.1",
    "version": "v2.4.1",
    "status": "running",
    "cpu": 1.4,
    "ram": 312,
    "uptime": "5d 12h",
    "restartCount": 0,
    "lastRestart": null,
    "ports": ["3000:3000"],
    "branch": "main",
    "commit": "a3f91c2"
  }
]
```

### Yang Harus Diubah

#### File: `src/types/docker.types.ts`
```diff
  export interface DockerContainer {
    id: string;
    name: string;
    image: string;
+   version: string;
-   status: string;
-   state: string;
+   status: 'running' | 'stopped' | 'paused' | 'restarting' | 'dead';
-   cpu: string;      // "1.4%"
-   ram: string;      // "312 MB"
+   cpu: number;      // 1.4
+   ram: number;      // 312 (MB)
    uptime: string;
-   created: string;
+   restartCount: number;
+   lastRestart: string | null;
    ports: string[];
+   branch?: string;
+   commit?: string;
  }
```

#### File: `src/routes/docker.ts`
- [ ] Response langsung return `Container[]` (array), bukan `{ summary, containers }`
- [ ] TiuOS sudah menghitung summary sendiri di frontend

#### File: `src/services/docker.service.ts`
- [ ] `cpu`: parse dari `"1.4%"` menjadi `1.4` (number)
- [ ] `ram`: parse dari `"312 MB"` menjadi `312` (number, dalam MB)
- [ ] Tambah `version`: extract dari image tag (misal `ghcr.io/hanfin:v2.4.1` → `v2.4.1`)
- [ ] Tambah `restartCount`: dari `container.inspect().RestartCount`
- [ ] Tambah `lastRestart`: dari `container.inspect().State.StartedAt` jika restart > 0
- [ ] Hapus field `state` dan `created` (tidak dipakai TiuOS)
- [ ] Opsional: tambah `branch`/`commit` dari Docker labels

---

## 3️⃣ `/api/v1/apps` — Application List

### Masalah
Agent mengembalikan wrapper `{ summary, apps }`, sedangkan TiuOS mengharapkan **array langsung** `App[]`. Dan field `id` tidak ada di Agent.

### Agent Saat Ini (❌)
```json
{
  "summary": { "total": 6, "running": 5, "stopped": 1 },
  "apps": [
    {
      "name": "HanFin",
      "container": "hanfin-app-1",
      "type": "application",
      "status": "running",
      "healthy": true,
      "image": "ghcr.io/hanfin:v2.4.1",
      "version": "v2.4.1",
      "url": "https://hanfin.tiu.my.id",
      "manageUrl": "",
      "created": "2023-10-25T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-06-28T12:00:00Z"
}
```

### TiuOS Butuh (✅)
```json
[
  {
    "id": "hanfin",
    "name": "HanFin",
    "type": "finance",
    "version": "v2.4.1",
    "status": "running",
    "url": "https://hanfin.tiu.my.id",
    "manageUrl": "",
    "container": "hanfin-app-1",
    "image": "ghcr.io/hanfin:v2.4.1",
    "healthy": true,
    "created": "2023-10-25T00:00:00.000Z",
    "branch": "main",
    "commit": "a3f91c2"
  }
]
```

### Yang Harus Diubah

#### File: `src/types/apps.types.ts`
```diff
- export type AppType = 'application' | 'automation' | 'database' | 'infrastructure' | 'monitoring' | 'system' | 'custom';
+ export type AppType = 'monitoring' | 'database' | 'automation' | 'tunnel' | 'finance' | 'custom';

  export interface AppEntity {
+   id: string;
    name: string;
    container: string;
    type: AppType;
-   status: string;
+   status: 'running' | 'stopped' | 'paused' | 'restarting' | 'dead';
    healthy: boolean;
    image: string;
    version: string;
-   url: string;
-   manageUrl: string;
+   url?: string;
+   manageUrl?: string;
    created: string;
+   branch?: string;
+   commit?: string;
  }
```

#### File: `src/routes/apps.ts`
- [ ] Response langsung return `App[]` (array), bukan `{ summary, apps }`

#### File: `src/services/apps.service.ts`
- [ ] Tambah `id`: generate dari container name (lowercase, strip suffix)
- [ ] Ubah AppType mapping:
  - `'application'` → `'custom'` (atau `'finance'` jika ada label)
  - `'infrastructure'` → `'custom'`
  - `'system'` → `'custom'`
- [ ] Ubah `url` dan `manageUrl` menjadi optional (kosong → `undefined`)
- [ ] Tambah `branch`/`commit` dari Docker labels (jika tersedia)

---

## 4️⃣ `/api/v1/storage` — Storage Data

### Masalah
Agent mengembalikan wrapper `{ summary, folders, categories, largestVolumes }`, sedangkan TiuOS mengharapkan flat `StorageData` dengan field yang berbeda nama.

### Agent Saat Ini (❌)
```json
{
  "summary": { "path": "/", "totalGiB": 500, "usedGiB": 210, "freeGiB": 290, "usagePercent": 42 },
  "folders": [...],
  "categories": [
    { "name": "Aplikasi", "path": "/opt/apps", "sizeBytes": 13312000000, "sizeFormatted": "12.4 GB", "sizeGiB": 12.4 }
  ],
  "largestVolumes": [
    { "name": "postgres_data", "path": "/var/lib/docker/volumes/...", "sizeBytes": 48534000000, "sizeFormatted": "45.2 GB", "sizeGiB": 45.2 }
  ],
  "timestamp": "...",
  "cache": { "enabled": true, "ttlSeconds": 300, "refreshedAt": "..." }
}
```

### TiuOS Butuh (✅)
```json
{
  "totalGB": 500,
  "usedGB": 210,
  "categories": [
    { "label": "Aplikasi", "path": "/opt/apps", "sizeGB": 12.4, "color": "#f59e0b" }
  ],
  "volumes": [
    { "name": "postgres_data", "mountpoint": "/var/lib/docker/volumes/...", "sizeGB": 45.2 }
  ]
}
```

### Yang Harus Diubah

#### File: `src/types/storage.types.ts`
```diff
+ export interface StorageResponse {
+   totalGB: number;
+   usedGB: number;
+   categories: {
+     label: string;
+     path: string;
+     sizeGB: number;
+     color: string;
+   }[];
+   volumes: {
+     name: string;
+     mountpoint: string;
+     sizeGB: number;
+   }[];
+ }
```

#### File: `src/services/storage.service.ts`
- [ ] Flatten response: `summary.totalGiB` → `totalGB`, `summary.usedGiB` → `usedGB`
- [ ] Categories: rename `name` → `label`, `sizeGiB` → `sizeGB`, tambah `color`
- [ ] Volumes: rename `largestVolumes` → `volumes`, `path` → `mountpoint`, `sizeGiB` → `sizeGB`
- [ ] Hapus `folders`, `cache`, `timestamp` dari response (tidak dipakai TiuOS)
- [ ] Tentukan `color` per kategori (hardcode mapping atau baca dari config)

#### Warna Kategori yang Dipakai TiuOS
```typescript
const CATEGORY_COLORS: Record<string, string> = {
  'Aplikasi':  '#3b82f6',  // biru
  'Database':  '#8b5cf6',  // ungu
  'Backup':    '#f59e0b',  // kuning
  'Infra':     '#06b6d4',  // cyan
  'Home':      '#10b981',  // hijau
  'Lainnya':   '#6b7280',  // abu
};
```

---

## 5️⃣ `/api/v1/activity` — Activity Feed

### Masalah
Agent mengembalikan `{ events: [...] }` dengan field `type`+`title`, sedangkan TiuOS mengharapkan **array langsung** dengan field `source`+`message` + `id`.

### Agent Saat Ini (❌)
```json
{
  "events": [
    {
      "timestamp": "2026-06-28T12:00:00Z",
      "type": "docker",
      "title": "Container berhenti — tidak ada sinyal heartbeat",
      "status": "warning"
    }
  ],
  "timestamp": "2026-06-28T12:00:00Z"
}
```

### TiuOS Butuh (✅)
```json
[
  {
    "id": "evt-1719576000000",
    "timestamp": "2026-06-28T12:00:00Z",
    "level": "warning",
    "source": "cloudflared",
    "message": "Container berhenti — tidak ada sinyal heartbeat"
  }
]
```

### Yang Harus Diubah

#### File: `src/types/activity.types.ts`
```diff
  export interface ActivityEvent {
+   id: string;
    timestamp: string;
-   type: ActivityEventType;
-   title: string;
-   status: ActivityEventStatus;
+   level: 'success' | 'warning' | 'error' | 'info';
+   source: string;
+   message: string;
  }
```

#### File: `src/routes/activity.ts`
- [ ] Response langsung return `ActivityEvent[]` (array), bukan `{ events }`

#### File: `src/services/activity.service.ts`
- [ ] Tambah `id`: generate dari timestamp (misal `evt-${Date.now()}` atau UUID)
- [ ] Rename `status` → `level`
- [ ] Rename `title` → `message`
- [ ] Rename `type` → `source` (dan ubah dari kategori umum ke nama spesifik: `"docker"` → nama container)

---

## 6️⃣ `/api/v1/infrastructure` — Summary

### Masalah
Structure-nya jauh berbeda.

### Agent Saat Ini (❌)
```json
{
  "server": { "hostname": "tiu-server", "status": "online" },
  "system": { "cpu": { "usage": 45 }, "memory": { "used": 4.7, "total": 8 } },
  "storage": { "usedPercent": 42 },
  "docker": { "status": "online", "containers": 6, "running": 5 },
  "applications": { "total": 6, "healthy": 5 },
  "timestamp": "..."
}
```

### TiuOS Butuh (✅)
```json
{
  "server": { /* full SystemMetrics object */ },
  "containersRunning": 5,
  "containersTotal": 6,
  "appsHealthy": 5,
  "appsTotal": 6,
  "storagePercent": 42
}
```

### Yang Harus Diubah

#### File: `src/types/infrastructure.types.ts`
```diff
  export interface InfrastructureResponse {
-   server: { hostname: string; status: 'online' };
-   system: { cpu: { usage: number }; memory: { used: number; total: number } };
-   storage: { usedPercent: number };
-   docker: { status: 'online' | 'unavailable'; containers: number; running: number };
-   applications: { total: number; healthy: number };
-   timestamp: string;
+   server: SystemResponse;  // full SystemMetrics
+   containersRunning: number;
+   containersTotal: number;
+   appsHealthy: number;
+   appsTotal: number;
+   storagePercent: number;
  }
```

#### File: `src/services/infrastructure.service.ts`
- [ ] `server`: panggil `getSystemMetrics()` untuk mendapatkan object lengkap
- [ ] Flatten docker counts: `docker.running` → `containersRunning`
- [ ] Flatten app counts: `applications.healthy` → `appsHealthy`
- [ ] `storagePercent`: dari storage summary

---

## 7️⃣ `/api/v1/files/*` — File Explorer (BARU)

### Status: ❌ Belum Ada di TiuAgent

TiuOS membutuhkan 2 endpoint baru untuk File Explorer:

### `GET /api/v1/files/list?path=/opt`

Response: `FileEntry[]`
```json
[
  {
    "name": "apps",
    "path": "/opt/apps",
    "type": "dir",
    "sizeBytes": 0,
    "modifiedAt": "2026-06-15T10:00:00Z",
    "permissions": "rwxr-xr-x",
    "owner": "root"
  },
  {
    "name": "docker-compose.yml",
    "path": "/opt/docker-compose.yml",
    "type": "file",
    "sizeBytes": 2048,
    "modifiedAt": "2026-06-20T14:30:00Z",
    "permissions": "rw-r--r--",
    "owner": "root"
  }
]
```

### `GET /api/v1/files/read?path=/opt/docker-compose.yml`

Response: `FileContent`
```json
{
  "path": "/opt/docker-compose.yml",
  "content": "version: '3.8'\nservices:\n  ...",
  "isSensored": true,
  "sensoredKeys": ["password", "secret"],
  "encoding": "text"
}
```

### Yang Harus Dibuat

#### File: `src/types/files.types.ts` (BARU)
```typescript
export type FileType = 'file' | 'dir' | 'symlink';

export interface FileEntry {
  name: string;
  path: string;
  type: FileType;
  sizeBytes: number;
  modifiedAt: string;
  permissions?: string;
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
```

#### File: `src/services/files.service.ts` (BARU)
- [ ] `listFiles(path)`: gunakan `fs.readdir` + `fs.stat` untuk setiap entry
- [ ] `readFile(path)`: gunakan `fs.readFile` dengan limit ukuran (misal max 1MB)
- [ ] Sensor otomatis: scan untuk keys sensitif (`password`, `secret`, `token`, `key`, `api_key`)
- [ ] Guard: batasi akses hanya ke path tertentu (whitelist: `/opt`, `/home`, `/etc`)
- [ ] Guard: tolak path traversal (`../`)

#### File: `src/routes/files.ts` (BARU)
- [ ] `GET /files/list?path=...` → panggil `listFiles()`
- [ ] `GET /files/read?path=...` → panggil `readFile()`

#### File: `src/server.ts`
- [ ] Register route baru: `app.register(filesRoutes, { prefix: '/api/v1' })`

---

## 🧹 Cleanup: Route yang Tidak Dipakai TiuOS

Route berikut ada di TiuAgent tapi **tidak dipanggil** oleh TiuOS. Bisa dipertahankan untuk keperluan lain atau dihapus untuk menyederhanakan:

| Route | File | Rekomendasi |
|-------|------|-------------|
| `/api/v1/health` | `routes/health.ts` | ✅ Pertahankan (berguna untuk health check) |
| `/api/v1/version` | `routes/version.ts` | ✅ Pertahankan (berguna untuk debugging) |
| `/` (root) | `routes/root.ts` | ✅ Pertahankan |
| `/api/v1/hanfin` | `routes/hanfin.ts` | ⚠️ Pertimbangkan: integrasi ke `/apps` |
| `/api/v1/automation` | `routes/automation.ts` | ⚠️ Pertimbangkan: integrasi ke `/apps` |
| `/api/v1/cloudflare` | `routes/cloudflare.ts` | ⚠️ Simpan untuk nanti (DNS Manager) |
| `/api/v1/backups` | `routes/backups.ts` | ⚠️ Simpan untuk nanti (Backup Manager) |

---

## ✅ Checklist Urutan Pengerjaan

### Tahap 1: Ubah Types (15 menit)
- [ ] Update `system.types.ts`
- [ ] Update `docker.types.ts`
- [ ] Update `apps.types.ts`
- [ ] Update `storage.types.ts`
- [ ] Update `activity.types.ts`
- [ ] Update `infrastructure.types.ts`
- [ ] Buat `files.types.ts` (baru)

### Tahap 2: Ubah Services (1-2 jam)
- [ ] Update `system.service.ts` — tambah uptime, hostname, os, cpuInfo, loadAvg
- [ ] Update `docker.service.ts` — cpu/ram jadi number, tambah version/restartCount
- [ ] Update `apps.service.ts` — tambah id, fix AppType, branch/commit
- [ ] Update `storage.service.ts` — flatten, rename fields, tambah color
- [ ] Update `activity.service.ts` — tambah id, rename fields
- [ ] Update `infrastructure.service.ts` — restructure
- [ ] Buat `files.service.ts` (baru)

### Tahap 3: Ubah Routes (30 menit)
- [ ] Update semua routes untuk return format baru (flatten wrapper)
- [ ] Buat `routes/files.ts` (baru)
- [ ] Register di `server.ts`

### Tahap 4: Test (30 menit)
- [ ] Jalankan TiuAgent, hit setiap endpoint, pastikan format cocok
- [ ] Di TiuOS, ubah `.env.local` ke `NEXT_PUBLIC_DATA_MODE=live`
- [ ] Set server URL ke IP TiuAgent
- [ ] Verifikasi semua section tampil data real

---

## 📝 Catatan Penting

> [!IMPORTANT]
> Jangan ubah field `cpu` dan `ram` di docker service menjadi **string** yang sudah diformat.
> TiuOS melakukan formatting sendiri di frontend. Kirim selalu dalam **number**.

> [!WARNING]
> File Explorer harus memiliki **whitelist path** dan **pengecekan path traversal**.
> Jangan biarkan user mengakses sembarang file di server.

> [!TIP]
> Untuk `branch` dan `commit` di Apps/Docker, gunakan Docker Labels saat build:
> ```dockerfile
> LABEL tiuos.branch="main"
> LABEL tiuos.commit="a3f91c2"
> LABEL tiuos.type="finance"
> LABEL tiuos.url="https://hanfin.tiu.my.id"
> ```
> TiuAgent bisa membaca labels ini via `container.inspect().Config.Labels`
