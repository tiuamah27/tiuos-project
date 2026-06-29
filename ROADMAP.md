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
- [ ] Tombol **Start** container yang sedang stopped
- [ ] Tombol **Stop** container yang sedang running
- [ ] Tombol **Restart** container
- [ ] Konfirmasi dialog sebelum aksi destructive (stop/restart)
- [ ] Toast/notifikasi sukses/gagal setelah aksi
- [ ] Loading state saat menunggu respons aksi

### 1.2 Container Logs (Real-time)
- [ ] Halaman/modal untuk melihat log container
- [ ] Streaming log secara real-time (WebSocket atau SSE)
- [ ] Fitur search/filter dalam log
- [ ] Tombol download log sebagai file `.txt`
- [ ] Auto-scroll ke bawah dengan toggle on/off
- [ ] Pilihan jumlah baris (tail 100, 500, 1000)

### 1.3 Update TiuAgent
- [ ] Endpoint `POST /api/v1/docker/:id/start`
- [ ] Endpoint `POST /api/v1/docker/:id/stop`
- [ ] Endpoint `POST /api/v1/docker/:id/restart`
- [ ] Endpoint `GET /api/v1/docker/:id/logs?tail=100`
- [ ] WebSocket endpoint untuk streaming log

---

## ⭐ Phase 2 — Notifikasi & Alerting

> **Goal:** TiuOS bisa memberi peringatan otomatis saat ada masalah di server

### 2.1 Alert Rules
- [ ] Konfigurasi threshold alert (misal: CPU > 90%, Disk > 85%)
- [ ] Alert saat container mati/crash
- [ ] Alert saat container restart berulang (crash loop)
- [ ] Alert saat disk space hampir penuh
- [ ] Alert saat RAM usage tinggi berkepanjangan
- [ ] Cooldown period (jangan spam notifikasi berulang)

### 2.2 Notification Channels
- [ ] **Telegram Bot** — kirim pesan ke chat/group
- [ ] **Discord Webhook** — kirim ke channel Discord
- [ ] **Email** (SMTP) — kirim email notifikasi
- [ ] **In-app notification** — bell icon di topbar dengan badge count
- [ ] Notification history (log semua alert yang pernah dikirim)

### 2.3 Settings UI
- [ ] Halaman settings untuk konfigurasi channel notifikasi
- [ ] Test button ("Kirim Notifikasi Test")
- [ ] Enable/disable per channel
- [ ] Konfigurasi threshold per metrik

---

## 🖥️ Phase 3 — Terminal Web (Web SSH)

> **Goal:** Akses terminal server langsung dari browser tanpa perlu SSH client

### 3.1 Terminal Emulator
- [ ] Embedded terminal menggunakan xterm.js
- [ ] Koneksi ke server via WebSocket
- [ ] Support copy/paste
- [ ] Support resize terminal
- [ ] Multiple tab terminal
- [ ] Riwayat command

### 3.2 Quick Commands
- [ ] Predefined quick commands (restart docker, check disk, dll)
- [ ] Custom command favorites/bookmarks
- [ ] Command palette (Ctrl+K) untuk akses cepat

### 3.3 Keamanan
- [ ] Session timeout otomatis
- [ ] Audit log (siapa menjalankan command apa, kapan)
- [ ] Whitelist command (opsional, untuk keamanan ekstra)

---

## 📱 Phase 4 — Halaman Detail Aplikasi

> **Goal:** Setiap aplikasi memiliki halaman detail lengkap

### 4.1 App Detail Page
- [ ] Route `/apps/:id` untuk setiap aplikasi
- [ ] Resource usage khusus container tersebut (CPU, RAM timeline)
- [ ] Uptime history (kapan saja container up/down)
- [ ] Environment variables (dengan sensor untuk secrets)
- [ ] Port mapping & network info
- [ ] Image info & version history

### 4.2 Deploy & Git Integration
- [ ] Git commit history (untuk app dari GitHub seperti HanFin)
- [ ] Tombol **Redeploy** (pull latest + restart)
- [ ] Deploy log / build output
- [ ] Webhook endpoint untuk auto-deploy dari GitHub push
- [ ] Rollback ke versi sebelumnya

### 4.3 App Health
- [ ] Healthcheck history chart
- [ ] Response time monitoring (jika app punya URL)
- [ ] SSL certificate expiry check
- [ ] Domain/DNS status check

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
- [ ] Tambah/hapus server dari UI
- [ ] Switch antar server via sidebar (infrastruktur sudah ada)
- [ ] Setiap server punya TiuAgent sendiri
- [ ] Status indicator per server (online/offline) di sidebar

### 6.2 Aggregate View
- [ ] Overview page yang menampilkan ringkasan semua server
- [ ] Total resource usage across all servers
- [ ] Alert summary dari semua server
- [ ] Quick comparison antar server

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
- [ ] Finalisasi API Contract dari `src/types/index.ts`
- [ ] Setup project baru (Fastify / Express / Hono)
- [ ] Endpoint `/api/v1/system` — match SystemMetrics type
- [ ] Endpoint `/api/v1/docker` — match Container type
- [ ] Endpoint `/api/v1/apps` — match App type
- [ ] Endpoint `/api/v1/storage` — match StorageData type
- [ ] Endpoint `/api/v1/activity` — match ActivityEvent type
- [ ] Endpoint `/api/v1/files` — match FileEntry/FileContent type

### 9.2 Docker Integration
- [ ] Komunikasi via Docker Socket (`/var/run/docker.sock`)
- [ ] Auto-detect containers & apps
- [ ] Label-based categorization (`tiuos.type`, `tiuos.url`)
- [ ] Container stats streaming

### 9.3 Deployment
- [ ] Docker image untuk TiuAgent sendiri
- [ ] Docker Compose setup (TiuAgent + dependencies)
- [ ] Dokumentasi instalasi
- [ ] Auto-update mechanism

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
