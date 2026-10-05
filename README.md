# Photobooth Platform

Platform SaaS multi-tenant untuk bisnis photobooth: dashboard manajemen berbasis web, aplikasi booth berbasis Electron, dan backend REST API Laravel.

## Stack

- Backend: Laravel 13 (PHP `^8.3`), Laravel Sanctum, MySQL 8, PHPUnit
- Web dashboard: React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS 4
- Desktop booth: Electron + React + TypeScript (electron-vite), Zustand, React Query, Axios
- Kamera: layanan lokal FastAPI (`cameraAPI/main.exe`) dengan Canon EDSDK + fallback webcam
- Storage: Cloudflare R2 (S3-compatible) atau local disk
- Pembayaran: Midtrans QRIS (sandbox/production)
- Cetak: driver printer Windows (mis. DNP DS-RX1) + antrean print job di backend

## Struktur repository

| Path | Isi |
| --- | --- |
| `backend/` | REST API Laravel, migrasi MySQL, RBAC, multi-tenant, job/scheduler |
| `web/` | Dashboard manajemen (React + Vite), di-deploy via Vercel (`web/vercel.json`) |
| `desktop/electron-app/` | Aplikasi booth Electron yang sebenarnya (renderer, main process, `cameraAPI/`) |
| `desktop/` | Scaffold Vite lama yang tidak dipakai — jangan salah paham dengan `desktop/electron-app/` |
| `docs/` | `business-overview.md`, `api-reference.md`, skema target `photobooth_saas_schema.dbml`, catatan diskusi |
| `shared/` | Aset template 2R/4R, EDSDK, driver printer (sebagian besar di-gitignore) |
| `AI_CONTEXT.md` | Konteks kerja AI/contributor (lokal, di-gitignore) |

## Alur produk

```text
Super Admin mendaftarkan Partner → Partner aktifkan Subscription
→ Partner buat Booth dan daftarkan Device (kode aktivasi)
→ Operator login di desktop → input Event Code → unduh snapshot event
→ Pilih ukuran (2R/4R) → pilih template → bayar (QRIS/voucher/nonaktif) → data customer opsional
→ Capture → komposit (foto + GIF + video) → filter cetak → cetak lokal → upload ke cloud
→ Sesi selesai → gallery token + email link ke customer
```

## Menjalankan proyek

Jalankan perintah di direktori masing-masing.

| Area | Perintah |
| --- | --- |
| Backend | `composer setup`, `composer dev`, `composer test` |
| Web | `npm install`, `npm run dev`, `npm run build`, `npm run lint` |
| Desktop | `npm install`, `npm run dev`, `npm run typecheck`, `npm run build:win` |

`composer test` membutuhkan database MySQL khusus `photobooth_testing` (dikonfigurasi di `backend/phpunit.xml`).

## Konfigurasi

Backend (`backend/.env`) membutuhkan konfigurasi Laravel + MySQL standar, lalu:

- `MEDIA_DISK` / `MEDIA_BUCKET` — adapter storage media (`local` atau `r2`)
- `GALLERY_TOKEN_TTL_DAYS`, `GALLERY_WEB_BASE_URL` — masa berlaku dan base URL gallery publik
- `MIDTRANS_*` — kredensial Midtrans (bisa juga diisi via dashboard Super Admin)
- `SANCTUM_TOKEN_EXPIRATION_MINUTES`, `LOGIN_RATE_LIMIT_PER_MINUTE`, `ACTIVATION_RATE_LIMIT_PER_MINUTE`, `PRINT_JOB_LEASE_SECONDS`
- `MAIL_*` — untuk email gallery link dan notifikasi printer

Web (`web/.env`):

- `VITE_API_BASE_URL` — base URL API (contoh: `https://api.rizelabs.my.id/api`)
- `VITE_API_PROXY_TARGET` — target proxy dev (contoh: `http://127.0.0.1:8000`)

Kredensial Midtrans dan Cloudflare R2 juga dapat dikelola lewat API `platform-settings` (Super Admin, terenkripsi di database). Jangan pernah commit kredensial.

## Perintah artisan berguna

- `php artisan device:issue-activation {partner} {booth} {nama}` — buat kode aktivasi device (berlaku 30 menit)
- `php artisan device:regenerate-activation {device-id}` — buat ulang kode aktivasi
- `php artisan subscriptions:expire`, `vouchers:expire`, `payments:expire` — dijadwalkan otomatis
- `php artisan reports:aggregate-daily`, `reports:aggregate-monthly` — agregasi laporan
- `php artisan media:storage-check` — cek konfigurasi storage aktif
- `php artisan mail:test {email}`, `php artisan mail:status` — diagnosa email
- `php artisan db:seed --class=DesktopTestSeeder` / `DesktopDemoSeeder` — data development desktop

## Dokumentasi

- `docs/business-overview.md` — model bisnis, peran, dan konsep domain
- `docs/api-reference.md` — referensi endpoint yang terdaftar dan teruji
- `docs/photobooth_saas_schema.dbml` — desain database target
- `AI_CONTEXT.md` — konteks dan riwayat perkembangan proyek

## Catatan penting

- Snapshot konfigurasi event bersifat immutable; buat snapshot baru, jangan edit yang lama.
- Seluruh pengecekan tenant dilakukan di server (policy + service layer), bukan di UI.
- Endpoint baru berada di bawah `/api/v1`, memakai envelope `{ success, message, data }`, dan dilindungi Sanctum/permission.
- Halaman API reference di `docs/api-reference.md` adalah acuan kontrak endpoint; route tetap mengikuti `backend/routes/api.php`.
- Riwayat perkembangan dan catatan integrasi terbaru ada di `AI_CONTEXT.md`.
