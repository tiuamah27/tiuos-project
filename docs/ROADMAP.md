# 🗺️ TiuOS — Roadmap & Feature Backlog

> Dokumen ini berisi daftar fitur yang akan dikembangkan untuk TiuOS.
> Dikerjakan secara bertahap berdasarkan prioritas.
>
> **Last Updated:** 28 Juni 2026

---

## 📊 Status Saat Ini (v0.1 — Foundation)

Fitur yang sudah selesai:

- [x] Dashboard layout (sidebar + topbar + main content)
- [x] Monitoring real-time (CPU, RAM, Disk, Network, Uptime)
- [x] Grafik live (CPU, RAM, Network Download/Upload) dengan sparkline
- [x] Aplikasi — card view, grouped (Web Access / Internal)
- [x] Aplikasi — expand/collapse detail (Docker Image, Container, Branch, Commit, Healthcheck)
- [x] Activity Feed — timeline layout dengan scroll di dalam card
- [x] Storage Preview — donut chart + kategori + docker volumes
- [x] Docker Center — tabel container (status, CPU, RAM, Port, Uptime)
- [x] File Explorer — tree view, baca isi file, breadcrumb, sensor data sensitif
- [x] Mock data mode (simulasi) untuk development tanpa server

---

## 🔥 Phase 1 — Docker Actions (Prioritas Tertinggi)

> **Goal:** Mengubah TiuOS dari "read-only dashboard" menjadi "actionable management tool"

### 1.1 Container Controls
- [x] Tombol **Start** container yang sedang stopped
- [x] Tombol **Stop** container yang sedang running
- [x] Tombol **Restart** container
- [x] Konfirmasi dialog sebelum aksi destructive (stop/restart)
- [x] Toast/notifikasi sukses/gagal setelah aksi
- [x] Loading state saat menunggu respons aksi

### 1.2 Container Logs (Real-time)
- [x] Halaman/modal untuk melihat log container
- [x] Streaming log secara real-time (WebSocket atau SSE)
- [x] Fitur search/filter dalam log
- [x] Tombol download log sebagai file `.txt`
- [x] Auto-scroll ke bawah dengan toggle on/off
- [x] Pilihan jumlah baris (tail 100, 500, 1000)

### 1.3 Update TiuAgent
- [x] Endpoint `POST /api/v1/docker/:id/start`
- [x] Endpoint `POST /api/v1/docker/:id/stop`
- [x] Endpoint `POST /api/v1/docker/:id/restart`
- [x] Endpoint `GET /api/v1/docker/:id/logs?tail=100`
- [x] WebSocket endpoint untuk streaming log

---

## ⭐ Phase 2 — Notifikasi & Alerting

> **Goal:** TiuOS bisa memberi peringatan otomatis saat ada masalah di server

### 2.1 Alert Rules
- [x] Konfigurasi threshold alert (misal: CPU > 90%, Disk > 85%)
- [x] Alert saat container mati/crash
- [x] Alert saat container restart berulang (crash loop)
- [x] Alert saat disk space hampir penuh
- [x] Alert saat RAM usage tinggi berkepanjangan
- [x] Cooldown period (jangan spam notifikasi berulang)

### 2.2 Notification Channels
- [x] **Telegram Bot** — kirim pesan ke chat/group
- [x] **Discord Webhook** — kirim ke channel Discord
- [x] **Email** (SMTP) — kirim email notifikasi
- [x] **In-app notification** — bell icon di topbar dengan badge count
- [x] Notification history (log semua alert yang pernah dikirim)

### 2.3 Settings UI
- [x] Halaman settings untuk konfigurasi channel notifikasi
- [x] Test button ("Kirim Notifikasi Test")
- [x] Enable/disable per channel
- [x] Konfigurasi threshold per metrik

---

## 🖥️ Phase 3 — Terminal Web (Web SSH)

> **Goal:** Akses terminal server langsung dari browser tanpa perlu SSH client

### 3.1 Terminal Emulator
- [x] Embedded terminal UI menggunakan xterm.js
- [ ] Koneksi ke server via WebSocket (Backend TiuAgent)
- [x] Support copy/paste
- [x] Support resize terminal
- [ ] Multiple tab terminal
- [ ] Riwayat command (History)

### 3.2 Quick Commands
- [x] Predefined quick commands (restart docker, check disk, dll)
- [x] Custom command favorites/bookmarks
- [x] Command palette (Ctrl+K) untuk akses cepat

### 3.3 Keamanan
- [x] Session timeout otomatis
- [x] Audit log (siapa menjalankan command apa, kapan)
- [x] Whitelist command (opsional, untuk keamanan ekstra)

---

## 📱 Phase 4 — Halaman Detail Aplikasi

> **Goal:** Setiap aplikasi memiliki halaman detail lengkap

### 4.1 App Detail Page
- [x] Route `/apps/:id` untuk setiap aplikasi
- [x] Resource usage khusus container tersebut (CPU, RAM timeline)
- [x] Uptime history (kapan saja container up/down)
- [x] Environment variables (dengan sensor untuk secrets)
- [x] Port mapping & network info
- [x] Image info & version history

### 4.2 Deploy & Git Integration
- [x] Git commit history (untuk app dari GitHub seperti HanFin)
- [x] Tombol **Redeploy** (pull latest + restart)
- [x] Deploy log / build output
- [x] Webhook endpoint untuk auto-deploy dari GitHub push
- [x] Rollback ke versi sebelumnya

### 4.3 App Health
- [x] Healthcheck history chart
- [x] Response time monitoring (jika app punya URL)
- [x] SSL certificate expiry check
- [x] Domain/DNS status check

---

## 🗄️ Phase 5 — Backup Manager

> **Goal:** Kelola backup server dari dashboard

### 5.1 Backup Overview
- [ ] Daftar semua backup yang tersedia
- [ ] Ukuran tiap backup
- [ ] Tanggal pembuatan & retention policy
- [ ] Filter by tipe (database, files, full)

### 5.2 Backup Actions
- [ ] Trigger manual backup dari dashboard
- [ ] Jadwal backup otomatis (daily, weekly, monthly)
- [ ] Download backup
- [ ] Restore dari backup tertentu
- [ ] Delete backup lama

### 5.3 Backup Targets
- [ ] Backup database PostgreSQL (pg_dump)
- [ ] Backup Docker volumes
- [ ] Backup ke remote storage (S3, Google Drive, dll)
- [ ] Backup config files

---

## 🌐 Phase 6 — Multi-Server

> **Goal:** Monitor dan kelola beberapa server dari satu TiuOS instance

### 6.1 Server Management
- [x] Tambah/hapus server dari UI
- [x] Switch antar server via sidebar (infrastruktur sudah ada)
- [x] Setiap server punya TiuAgent sendiri
- [x] Status indicator per server (online/offline) di sidebar

### 6.2 Aggregate View
- [x] Overview page yang menampilkan ringkasan semua server
- [x] Total resource usage across all servers
- [x] Alert summary dari semua server
- [x] Quick comparison antar server

---

## 🎨 Phase 7 — Polish & UX

> **Goal:** Meningkatkan kualitas tampilan dan pengalaman pengguna

### 7.1 Theming
- [x] Dark mode (sudah ada) ✅
- [x] Light mode
- [x] Theme toggle di topbar

### Phase 7: UI & Aesthetics Polish 
- [x] Responsive layout untuk Mobile (Dashboard layout responsif, hamburger menu dll) -> *(Dibatalkan: Sidebar dan hamburger menu dihapus atas permintaan)*
- [x] Tambahkan Color Picker untuk kustomisasi aksen warna -> *(Dibatalkan: Dihapus atas permintaan)*
- [x] Native Tooltips pada Stat Cards dan Metric Cards

### 7.3 User Experience
- [x] Keyboard shortcuts (Ctrl+K command palette)
- [x] Loading skeleton untuk semua section (sudah partial) ✅
- [x] Error boundary & graceful error handling
- [x] Onboarding / first-time setup wizard (Dilewati untuk versi 0.1)
- [x] Tooltip untuk setiap metrik (penjelasan singkat)

---

## 🔐 Phase 8 — Auth & Security

> **Goal:** Mengamankan akses ke TiuOS

### 8.1 Authentication
- [ ] Login page
- [ ] Username/password authentication
- [ ] Session management (JWT atau cookie-based)
- [ ] Logout & session expiry
- [ ] "Remember me" option

### 8.2 Authorization (opsional, untuk tim)
- [ ] Role-based access (Admin, Viewer)
- [ ] Admin bisa control containers, Viewer hanya bisa lihat
- [ ] Audit log (siapa melakukan apa)

### 8.3 Security Hardening
- [ ] Rate limiting pada API
- [ ] HTTPS enforcement
- [ ] CORS configuration
- [ ] IP whitelist (opsional)
- [ ] 2FA / Two-Factor Authentication (nice to have)

---

## 🔧 Phase 9 — TiuAgent v2 (Rebuild)

> **Goal:** Rebuild TiuAgent dari nol agar sesuai 100% dengan TiuOS

### 9.1 Core
- [x] Finalisasi API Contract dari `src/types/index.ts`
- [x] Setup project baru (Fastify / Express / Hono)
- [x] Endpoint `/api/v1/system` — match SystemMetrics type
- [x] Endpoint `/api/v1/docker` — match Container type
- [x] Endpoint `/api/v1/apps` — match App type
- [x] Endpoint `/api/v1/storage` — match StorageData type
- [x] Endpoint `/api/v1/activity` — match ActivityEvent type
- [x] Endpoint `/api/v1/files` — match FileEntry/FileContent type

### 9.2 Docker Integration
- [x] Komunikasi via Docker Socket (`/var/run/docker.sock`)
- [x] Auto-detect containers & apps
- [x] Label-based categorization (`tiuos.type`, `tiuos.url`)
- [x] Container stats streaming

### 9.3 Deployment
- [x] Docker image untuk TiuAgent sendiri
- [x] Docker Compose setup (TiuAgent + dependencies)
- [x] Dokumentasi instalasi
- [x] Auto-update mechanism

---

## 🌡️ Phase 10 — IoT & Physical Server Monitoring

> **Goal:** Memantau suhu hardware server dan rak fisik, serta mengontrol kipas secara otomatis via mikrokontroler (ESP32)

### 10.1 Server Hardware Temperature (Tahap 1)
- [ ] Integrasi `lm-sensors` di Linux (Debian)
- [ ] TiuAgent: Endpoint untuk membaca suhu CPU dan Motherboard (`/sys/class/thermal/`)
- [ ] TiuOS: Tambahkan grafik/angka suhu CPU di atas grafik CPU (%) saat ini

### 10.2 Server Rack Environment (Tahap 2 - ESP32)
- [ ] Setup Hardware: ESP32 + Sensor Suhu (DHT22/DS18B20) di dalam rak
- [ ] Setup Hardware: Sensor Listrik (PZEM-004T) untuk memantau Watt/Ampere/Voltase rak
- [ ] Setup Hardware: Kipas PC (PWM) yang terhubung ke ESP32
- [ ] Kode ESP32: Logika kontrol otomatis RPM kipas berdasarkan suhu rak (berdiri sendiri / mandiri)

### 10.3 IoT Communication (Tahap 3)
- [ ] Deploy MQTT Broker (misal: Eclipse Mosquitto) via Docker di server
- [ ] Kode ESP32: Publish data suhu dan listrik ke MQTT Broker via WiFi
- [ ] TiuAgent: Berperan sebagai MQTT Client untuk melakukan *subscribe* dan menerima data dari ESP32
- [ ] TiuOS: Dashboard khusus "Physical Environment" untuk menampilkan grafik suhu rak, konsumsi listrik, dan status kipas

---

## 💡 Ide Tambahan (Someday / Maybe)

Belum dijadwalkan, bisa diambil kapan saja:

- [ ] **Cron Job Manager** — lihat & kelola cron jobs di server
- [ ] **Nginx Config Editor** — edit nginx config dari UI
- [ ] **DNS Manager** — kelola DNS records (jika pakai Cloudflare API)
- [ ] **SSL Auto-Renew Monitor** — pantau sertifikat Let's Encrypt
- [ ] **Database Query Tool** — jalankan SQL query dari browser (khusus PostgreSQL)
- [ ] **Uptime Kuma Integration** — embed uptime monitoring
- [ ] **Prometheus/Grafana Export** — export metrics ke format standar
- [ ] **PWA Support** — install TiuOS sebagai app di HP/desktop
- [ ] **Webhook Manager** — kelola incoming/outgoing webhooks
- [ ] **Docker Compose Editor** — edit & deploy docker-compose dari UI
- [ ] **System Update Manager** — cek & apply OS updates
- [ ] **Firewall Manager** — kelola UFW rules dari UI
- [ ] **Port Scanner** — cek port yang terbuka di server

---

## 📝 Catatan

- Semua phase bisa dikerjakan secara paralel jika tidak ada dependency
- Phase 9 (TiuAgent v2) sebaiknya dikerjakan **setelah** UI sudah stabil
- Setiap phase bisa dipecah menjadi sprint yang lebih kecil
- Prioritas bisa berubah sesuai kebutuhan

---

> *"TiuOS — Your server, your rules."*
