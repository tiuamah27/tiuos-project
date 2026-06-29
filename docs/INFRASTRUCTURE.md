# Dokumentasi Infrastruktur Server TiuOS

Dokumen ini berisi pemetaan lengkap mengenai arsitektur server, lokasi file, jaringan Docker, dan perutean (routing) domain agar memudahkan pemeliharaan di masa depan.

---

## 1. Spesifikasi Umum
- **OS Server:** Linux (Debian/Ubuntu based)
- **User Utama:** `tiuamah`
- **Hostname Server:** `tiuserver`
- **Domain Utama:** `tiuserver.my.id`

---

## 2. Struktur Direktori (Folder)
Semua aplikasi dan infrastruktur disimpan di dalam folder `/opt/`. Folder ini dibagi menjadi dua kategori utama:

### `/opt/apps/` (Aplikasi Utama / User-facing)
Tempat menyimpan aplikasi yang digunakan langsung oleh pengguna.
- 📁 `/opt/apps/tiuos` (Frontend TiuOS, port `3010`)
- 📁 `/opt/apps/hanfin` (Aplikasi Keuangan HanFin, port `3000`)
- 📁 `/opt/apps/n8n` (Aplikasi Otomatisasi Workflow, port `5678`)

### `/opt/infra/` (Infrastruktur / Backend)
Tempat menyimpan aplikasi pendukung atau layanan di latar belakang.
- 📁 `/opt/infra/tiu-agent` (Backend API untuk TiuOS, port `8080`)
- 📁 `/opt/infra/cloudflared` (Konfigurasi Tunnel *Deprecated*, kini menggunakan konfigurasi global di `/etc`)
- 📁 `/opt/infra/beszel` (Monitoring Hub, port `8090`)
- 📁 `/opt/infra/beszel-agent` (Monitoring Agent)
- 📁 `/opt/infra/uptime-kuma` (Ping & Status Monitoring, port `3001`)

*(Catatan: Homarr dan Portainer telah dihapus secara permanen untuk menghemat resource server).*

---

## 3. Jaringan Docker (Docker Network)
Agar container dapat saling berkomunikasi secara internal dan aman tanpa perlu mengekspos semua port ke internet, kita menggunakan jaringan khusus bernama **`tiu-network`**.

- **Cara membuat jaringan:** `docker network create tiu-network`
- **Aplikasi yang tergabung:** TiuOS, TiuAgent, Hanfin, n8n, Cloudflared.

---

## 4. Cloudflare Tunnel & Perutean DNS
Server ini diekspos ke internet **secara aman tanpa membuka port di firewall lokal (NAT)** menggunakan Cloudflare Zero Trust Tunnel. 

- **ID Tunnel:** `1d502bd1-f08a-4262-8815-f63f9739fa51`
- **Lokasi File Konfigurasi (Lokal):** `/etc/cloudflared/config.yml`
- **Lokasi Sertifikat (Credentials):** `/home/tiuamah/.cloudflared/1d502bd1-f08a-4262-8815-f63f9739fa51.json`

### Daftar Rute (Ingress Rules)
Jika Anda membuka `/etc/cloudflared/config.yml`, berikut adalah pemetaan domain menuju aplikasi lokal di server:

| Domain Publik (URL) | Port Lokal (Docker) | Keterangan |
| :--- | :--- | :--- |
| `tiuos.tiuserver.my.id` | `localhost:3010` | Frontend Dashboard TiuOS |
| `api.tiuserver.my.id` | `localhost:8080` | Backend API TiuAgent |
| `hanfin.tiuserver.my.id`| `localhost:3000` | Aplikasi Keuangan Hanfin |
| `beszel.tiuserver.my.id`| `localhost:8090` | Beszel Monitoring Hub |
| `uptime.tiuserver.my.id`| `localhost:3001` | Uptime Kuma |
| `n8n.tiuserver.my.id` | `localhost:5678` | n8n Automation |

---

## 5. Cheat Sheet (Perintah Penting Sehari-hari)

Berikut adalah contekan perintah Linux/Docker yang sering digunakan saat mengelola server ini:

### Memperbarui Aplikasi (TiuOS / TiuAgent)
Jika ada perubahan kode di GitHub dan Anda ingin menerapkannya di server:
```bash
cd /opt/apps/tiuos  # Atau /opt/infra/tiu-agent
sudo git pull
sudo docker compose up -d --build
```

### Memeriksa Log Error (Contoh TiuAgent)
```bash
docker logs -f tiu-agent
```

### Merestart Cloudflare Tunnel
Jika Anda baru saja menambahkan domain baru di `/etc/cloudflared/config.yml`:
```bash
sudo systemctl restart cloudflared
```

### Memeriksa Status Cloudflare Tunnel
```bash
sudo systemctl status cloudflared
```
