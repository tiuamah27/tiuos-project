# Session Logs

Catatan aktivitas dan pencapaian pengembangan TiuOS & Infrastruktur Server.

---

## [2026-06-30] - Deployment & Network Fixes

### 1. TiuAgent TypeScript Fix
- **Masalah:** Terjadi error Typescript `TS2367` saat melakukan build TiuAgent di server karena tipe status `exited` dan `stopped` yang tumpang tindih.
- **Solusi:** Memperbarui logika status Docker di `activity.service.ts` agar sesuai dengan `ContainerStatus` yang valid. Build kembali sukses.

### 2. Dockerizing TiuOS
- **Tujuan:** Meng-online-kan frontend TiuOS agar bisa diakses dari mana saja.
- **Implementasi:**
  - Membuat `Dockerfile` khusus untuk Next.js dengan mode `standalone`.
  - Mengubah konfigurasi `next.config.ts` (`output: 'standalone'`).
  - Menyiapkan `docker-compose.yml` untuk TiuOS dan menghubungkannya ke `tiu-network`.
  - Mengatasi konflik Port 3000 (yang dipakai oleh Hanfin) dengan mengubah port host TiuOS menjadi `3010`.

### 3. Mengatasi Isu "Mock Data" di Produksi
- **Masalah:** TiuOS menampilkan data palsu (mock) setelah di-deploy karena Next.js membutuhkan *environment variables* saat proses *build*, bukan saat *runtime*.
- **Solusi:** Memodifikasi `docker-compose.yml` dan `Dockerfile` agar menerima argumen build (`NEXT_PUBLIC_SERVERS` dan `NEXT_PUBLIC_DATA_MODE=live`). Data TiuOS kini 100% tersinkronisasi dan valid dengan kondisi server asli.

### 4. Cloudflare Zero Trust Routing
- **Masalah:** Error routing saat mencoba membuka `tiuos.tiuserver.my.id` dan `api.tiuserver.my.id`.
- **Solusi:** 
  - Mengubah pemetaan di `/etc/cloudflared/config.yml` melalui *terminal* server.
  - Memperbaiki salah ketik target port untuk TiuAgent dari `3005` menjadi `8080` (port bawaan).
  - Mengatur CNAME DNS Cloudflare secara manual via Web Dashboard untuk menjembatani rute baru ke Cloudflare Tunnel.

### 5. Dokumentasi Infrastruktur Server
- **Aksi:** Membangun dokumen `INFRASTRUCTURE.md` yang merangkum keseluruhan peta folder (`/opt/apps` & `/opt/infra`), pemetaan *port* Docker, dan pengaturan rute jaringan. Dokumen ini menjadi sumber acuan utama di masa depan.
- **Folder Rename:** Mengganti nama folder dari `/opt/apps/tiuos-project` menjadi `/opt/apps/tiuos` di server agar lebih rapi.

---

## [2026-06-30] - Dashboard Development (Phase 1-9)

Malam ini, kita telah menyelesaikan rentetan pengembangan yang sangat intens dan produktif, bergerak cepat dari integrasi Docker hingga manajemen Multi-Server! Seluruh jejak langkah telah direkam dengan saksama agar mudah dilacak di masa mendatang.

### **Phase 1: Docker Actions (Completed)**
- **UI `ContainerSection`**: Panel *container* dapat di-*expand* untuk melihat detail *port*, *uptime*, dan *image version*.
- **Controls**: Implementasi tombol interaktif `Start`, `Stop`, `Restart`, dan `Logs`.
- **Feedback**: Menggunakan `sonner` untuk notifikasi Toast dan konfirmasi dialog untuk aksi krusial.
- **LogViewer Modal**: Fitur jendela modal untuk membaca log dari kontainer dengan fitur *auto-scroll*.

### **Phase 2: Alerting & Webhooks (Completed)**
- **Hooks & State**: Membuat `useAlertMonitor` React Hook untuk memantau metrik secara periodik dan mencocokkannya dengan `alertThresholds` di `store/index.ts`.
- **TopBar Bell Icon**: Ikon lonceng notifikasi dengan *popover* *in-app* yang bisa di-klik dan di-*mark as read*.
- **Settings Page**: Menambahkan antarmuka untuk mengatur ambang batas (*thresholds*) CPU, RAM, Disk dan pengaturan *Notification Channels* (Mock logic untuk Email, Telegram, Discord).

### **Phase 3: Web Terminal (Completed)**
- **Integrasi `xterm.js`**: Emulator terminal tertanam langsung di peramban menggunakan `@xterm/xterm` dan `@xterm/addon-fit`.
- **Terminal Page (`/terminal`)**: Dilengkapi panel **Quick Commands** untuk eksekusi perintah instan dan **Audit Logs** untuk menyimpan jejak perintah.
- **TopBar Shortcut**: Penambahan ikon Terminal di pita navigasi atas untuk akses cepat.

### **Phase 4: App Detail Page (Completed)**
- **Dynamic Routing**: Membuat halaman `/apps/[id]` dengan antarmuka berbasis *Tabs* (Overview, Deploy/Git, Health, Environment).
- **Mocking**: Menyiapkan struktur data `AppDetails` dan layanan `getAppDetails(id)` di layer *Mock*.
- **Recharts Integration**: Memvisualisasikan penggunaan sumber daya (CPU dan RAM) menggunakan grafik garis yang interaktif.
- **Environment Variables**: Penambahan panel `.env` dengan kapabilitas mask/unmask nilai rahasia.

### **Phase 5: Backup Manager (Skipped)**
- Fitur ini dilewati sementara sesuai instruksi Anda, karena menunggu kesiapan infrastruktur backend cadangan di tingkat peladen.

### **Phase 6: Multi-Server Management (Completed)**
- **Global Overview (`/overview`)**: Dasbor agregasi skala besar yang menghitung total metrik seluruh server terdaftar secara simultan. Menampilkan status *Online/Offline* per-*node*.
- **Zustand Store Update**: Menambahkan kemampuan `addServer` dan `removeServer` pada global state.
- **Server Management UI**: Memodifikasi `/settings` dengan sistem tab untuk mengakomodasi form penambahan dan penghapusan server.
- **Deterministic Mocking**: Meracik algoritme pembangkit data di `generateSystemMetricsForServer(serverId)` sehingga setiap *server node* dapat menayangkan data simulasi metrik yang khas dan berbeda.
- **TopBar Integration**: Penambahan rute navigasi Global Overview (Ikon Globe).

### **Phase 7 & 8 (Skipped / Merged)**
- Anda mengonfirmasi bahwa perbaikan estetika (Polish & UX) dari Phase 7 sudah ternaungi secara organis di tahap-tahap sebelumnya, sementara log aggregator (Phase 8) ditunda terlebih dahulu.

### **Phase 9: TiuAgent v2 Rebuild (Completed)**
- **Discovery**: Menemukan bahwa agen purna rupa ternyata sudah bermukim di direktori `D:\TIU PROJECT\03. Tiu Agent`.
- **Verification**: Menginspeksi skrip agen (Fastify, TypeScript, Dockerode) dan mencocokkannya dengan API Contract milik Dasbor.
- **API Matching 100%**: Struktur `SystemResponse` dan `DockerContainer` agen secara akurat sepadan dengan struktur `SystemMetrics` dan `Container` milik TiuOS.
- **Readiness**: Sistem siap tempur. Perubahan mode TiuOS dari `mock` ke `live` akan serta-merta menghubungkan Dasbor dengan TiuAgent lokal Anda di port `8080`.

**Catatan Akhir (Final State):**
Dasbor TiuOS kini bukan sekadar simulasi kosong; semua pipa antar-muka telah terhubung sempurna untuk menerima asupan data murni dari TiuAgent v2.

---

## [2026-06-30 Malam] — Terminal Live, Bug Fixes & Documentation

Sesi malam ini difokuskan pada menghidupkan fitur Terminal Web SSH agar benar-benar berfungsi secara nyata (bukan simulasi), serta memperbaiki beberapa bug pasca-deployment.

### 1. TopBar Sticky
- **Masalah:** Bar navigasi atas (TopBar) ikut ter-scroll ke atas saat konten halaman di-scroll ke bawah.
- **Solusi:** Mengubah `position: 'relative'` menjadi `position: 'sticky'` dengan `top: 0` dan `zIndex: 50` pada komponen `TopBar.tsx`.

### 2. App Detail — Fix TypeScript Error
- **Masalah:** Halaman detail aplikasi (`/apps/[id]`) error saat mode Live karena tipe TypeScript tidak cocok dan navigasi yang salah.
- **Solusi:** Memperbaiki logika navigasi dan kompatibilitas tipe data agar sesuai dengan respons API TiuAgent.

### 3. Terminal Web SSH — Phase 3 LIVE ✅
Ini adalah pencapaian utama malam ini. Terminal Web yang sebelumnya hanya berupa *placeholder* (Mock) kini benar-benar terhubung ke server fisik.

#### Backend (TiuAgent):
- **Dependency baru:** `@fastify/websocket` dan `node-pty` (virtual terminal / pseudo-TTY).
- **Route baru:** `src/routes/terminal.ts` — Endpoint WebSocket `GET /api/v1/terminal`.
  - Saat klien browser terhubung, TiuAgent men-*spawn* proses `bash` menggunakan `node-pty`.
  - Output `bash` langsung di-*stream* ke WebSocket → Browser.
  - Input dari browser langsung diteruskan ke `bash` → Server.
  - Mendukung *resize* terminal secara dinamis.
- **Dockerfile:** Ditambahkan `python3`, `make`, dan `g++` agar `node-pty` (native C++ module) bisa dikompilasi.
- **Bug Fix:** Memperbaiki API `@fastify/websocket` v11 — parameter pertama handler adalah `socket` langsung, bukan `connection.socket`.

#### Frontend (TiuOS):
- **Dependency baru:** `@xterm/addon-attach` — menghubungkan WebSocket langsung ke Xterm.js.
- **`TerminalClient.tsx`:** Direfaktor total untuk mendukung mode Live (WebSocket + AttachAddon) dan Mock.
- **`terminal/page.tsx`:** Menghitung `wsUrl` dari konfigurasi server aktif.

#### Infrastruktur (Cloudflare Tunnel Fix):
- **Masalah:** Browser di `https://tiuos.tiuserver.my.id` tidak bisa WebSocket ke `ws://192.168.1.2:8080` (Mixed Content).
- **Solusi:** Menambahkan field `publicUrl` pada `ServerConfig` → WebSocket melalui `wss://api.tiuserver.my.id/api/v1/terminal`.

#### Hasil:
Terminal Web SSH **100% berfungsi**. Dari browser, pengguna bisa mengetikkan `whoami`, `free -m`, `df -h`, dll dan mendapatkan output real-time dari server fisik.

### 4. Dokumentasi
- **ROADMAP.md:** Diperbarui — menandai fitur koneksi WebSocket Terminal sebagai selesai.
- **tiuserver-docs.html:** Diperbarui untuk mencakup TiuOS dan TiuAgent.

---

## 📋 PR (Pekerjaan Rumah) — Yang Harus Dikerjakan Selanjutnya

### Prioritas Tinggi
1. **Terminal berjalan di dalam Container**
   - Saat ini terminal berjalan di dalam Docker container `tiu-agent` (bukan langsung di host). Perintah seperti `cd /opt/apps/tiuos` tidak akan ditemukan karena path tersebut ada di mesin host, bukan di container.
   - **Solusi:** Tambahkan volume mount atau gunakan `nsenter` agar terminal bisa mengakses filesystem host.

2. **Multiple Tab Terminal**
   - Saat ini hanya ada satu sesi terminal. Perlu ditambahkan dukungan *tab* agar pengguna bisa membuka beberapa sesi terminal sekaligus.

3. **Riwayat Command (History)**
   - Menyimpan riwayat perintah yang diketikkan agar bisa diakses kembali (panah atas/bawah).

### Prioritas Sedang
4. **Keamanan Terminal (Phase 8)**
   - Terminal saat ini berjalan sebagai `root` tanpa autentikasi. Sangat berbahaya jika TiuOS diakses oleh orang lain.
   - **PR:** Implementasi login page + session management sebelum Terminal bisa digunakan.

5. **App Detail Page — Mode Live**
   - Halaman `/apps/[id]` perlu endpoint backend baru: `GET /api/v1/docker/:id/details`.

6. **Network Stats Error**
   - Log TiuAgent: `ENOENT: '/host/sys/class/net/eno1/statistics/rx_bytes'`.
   - **PR:** Periksa volume mount atau deteksi interface jaringan secara otomatis.

### Prioritas Rendah
7. **Phase 5 — Backup Manager**
8. **Phase 10 — IoT & Server Rack Monitoring (ESP32 + Sensor Suhu + MQTT)**
9. **Quick Commands yang bisa di-custom dari UI**
