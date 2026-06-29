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
