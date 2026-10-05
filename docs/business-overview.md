# Business Overview

## Project Name

Photobooth Platform

---

# 1. Executive Summary

Photobooth Platform adalah sebuah platform Software as a Service (SaaS) yang menyediakan sistem manajemen photobooth secara terpusat.

Platform ini memungkinkan pemilik usaha photobooth (Partner) untuk mengelola seluruh operasional bisnis melalui web dashboard, sedangkan aplikasi desktop digunakan oleh operator photobooth untuk menjalankan sesi foto pada setiap booth.

Sistem dirancang menggunakan arsitektur multi-tenant sehingga satu platform dapat digunakan oleh banyak partner secara bersamaan dengan data yang terisolasi.

Saat ini platform sudah mencakup siklus operasional penuh: aktivasi device, konfigurasi event dengan snapshot immutable, pembayaran QRIS Midtrans dan voucher, sesi foto dengan komposit foto/GIF/video, cetak lokal maupun antrean cetak terpusat, gallery online berbasis token dengan pengiriman link via email, laporan, audit log, dan notifikasi stok kertas printer.

---

# 2. Business Goal

Tujuan utama platform ini adalah:

- Memudahkan pengelolaan bisnis photobooth dari satu dashboard.
- Mengurangi konfigurasi manual pada setiap event.
- Menjamin konsistensi template, filter, kamera, dan printer melalui sistem snapshot immutable.
- Mempermudah sinkronisasi hasil foto ke cloud dan pembagian hasil ke customer.
- Menyediakan sistem berlangganan (subscription) bagi partner.
- Menyediakan pembayaran QRIS (Midtrans) dan voucher untuk sesi foto di booth.
- Memantau operasional melalui laporan harian/bulanan, statistik platform, dan audit log.

---

# 3. Target Users

Platform memiliki beberapa jenis pengguna.

## Super Admin

Merupakan pengelola utama platform.

Super Admin bertanggung jawab terhadap:

- Mengelola partner dan detail partnernya.
- Mengelola subscription plan dan lifecycle subscription partner (assign, activate, renew, cancel, expire).
- Mengelola user platform.
- Mengelola konfigurasi global: template, filter, camera profile, printer profile.
- Mengelola event, booth, device, dan printer di seluruh tenant.
- Mengelola voucher package global dan penerbitan voucher.
- Mengelola kredensial platform (Midtrans dan Cloudflare R2) yang disimpan terenkripsi.
- Melihat laporan platform, gallery, transaksi, print jobs, dan audit log.

Halaman Super Admin: Users, Platform Credentials, Audit Log.

---

## Partner

Partner adalah pemilik usaha photobooth.

Partner dapat:

- Mengelola operator (user) di tenant-nya.
- Mengelola booth.
- Mengelola device, termasuk menerbitkan kode aktivasi.
- Membuat dan mengelola event.
- Mengelola template (frame), filter, camera profile, dan printer profile miliknya atau memakai aset global.
- Mengelola printer fisik dan alert stok kertas.
- Mengelola voucher package dan voucher.
- Melihat gallery sesi, customer, transaksi, print jobs, dan laporan harian/bulanan.

Setiap partner hanya dapat mengakses data miliknya sendiri. Pembatasan dilakukan di backend melalui policy dan service layer, bukan di UI.

---

## Operator

Operator menggunakan aplikasi desktop Electron.

Operator tidak mengakses dashboard web.

Tugas operator hanya:

- Mengaktifkan device dan login desktop.
- Memasukkan event code.
- Menjalankan alur sesi: pilih ukuran dan template, pembayaran, data customer, capture, preview, filter cetak.
- Mencetak hasil secara lokal.
- Mengunggah hasil dan menyelesaikan sesi.
- Mengakses halaman Settings (dilindungi verifikasi password operator) untuk pengaturan printer/kamera, test print, minimize, dan exit.

---

## Customer

Customer adalah pengguna akhir.

Customer hanya menggunakan photobooth di booth.

Customer tidak memiliki akun, namun dapat:

- Mengisi data (nama, email, phone) secara opsional saat sesi.
- Membayar sesi melalui QRIS Midtrans atau voucher.
- Menerima link gallery via email jika mencantumkan email.
- Mengakses gallery online berbasis token untuk melihat dan mengunduh hasil media.

---

# 4. Business Model

Platform menggunakan model SaaS.

Alur bisnis:

```text
Super Admin
   ↓ mendaftarkan
Partner
   ↓ membeli / diassign
Subscription (aktif)
   ↓ membuat
Booth
   ↓ mendaftarkan
Device (diaktivasi dengan kode sekali pakai)
   ↓ dijalankan oleh
Operator Desktop
   ↓ memasukkan
Event Code → unduh snapshot event
   ↓ customer melakukan
Sesi foto → bayar → capture → cetak → upload → gallery
```

---

# 5. Multi Tenant Concept

Setiap partner memiliki data sendiri.

Contoh:

Partner A

- Booth
- Device
- Event
- User
- Template / Filter / Printer / Voucher

Partner B

- Booth
- Device
- Event
- User
- Template / Filter / Printer / Voucher

Data antar partner tidak boleh saling terlihat.

Semua pembatasan dilakukan pada backend Laravel menggunakan Policy, Permission, dan Service Layer. Aset global menggunakan `partner_id = NULL`; partner dapat memakai aset global atau aset miliknya sendiri, tetapi tidak dapat mengubah aset global.

---

# 6. Subscription Concept

Partner harus memiliki subscription aktif untuk membuat booth, device, dan event.

Subscription menentukan:

- Masa aktif layanan (periode bulanan/tahunan).
- Jumlah booth dan device yang diizinkan.
- Plan yang dipakai.

Lifecycle subscription: `pending → active → expired | cancelled`.

- Assignment, aktivasi, perpanjangan, pembatalan, dan expire dilakukan Super Admin.
- Pembatasan jumlah (limit) dicek sebelum membuat resource yang terikat subscription.
- Command `subscriptions:expire` dijadwalkan tiap jam untuk menandai subscription yang lewat tanggal.

Jika subscription berakhir maka partner tidak dapat membuat resource baru.

---

# 7. Booth Concept

Booth merupakan lokasi operasional photobooth.

Satu partner dapat memiliki banyak booth.

Contoh:

```text
Partner
├── Booth Garut
├── Booth Bandung
└── Booth Jakarta
```

Setiap booth memiliki minimal satu device. Booth juga menjadi titik penempatan printer fisik dan menjadi acuan kepemilikan event.

---

# 8. Device Concept

Device merupakan komputer desktop yang menjalankan aplikasi Electron.

Setiap device mempunyai:

- device UUID (fingerprint hardware: Windows UUID, CPU identifier, MAC address, versi aplikasi)
- nama device dan booth terkait
- status lifecycle
- timestamp login dan heartbeat

Device harus melalui proses aktivasi sebelum dapat digunakan.

Status device:

- `pending`
- `active`
- `blocked`
- `revoked`

Alur aktivasi:

1. Super Admin/Partner menerbitkan kode aktivasi (berlaku 30 menit) melalui dashboard atau command `device:issue-activation`.
2. Aplikasi desktop mengirim fingerprint saat startup; jika device belum terdaftar, pengguna diarahkan ke halaman aktivasi.
3. Kode dimasukkan → device terikat ke partner dan booth → status menjadi `active`.
4. Operator dapat login; login desktop memvalidasi `X-Device-UUID` sehingga token hanya diterbitkan untuk operator partner yang sama dengan device.

Device juga mengirim heartbeat berkala (tiap 60 detik) untuk pembaruan `last_sync_at`. Dashboard menampilkan presence: `online`, `stale`, atau `offline` berdasarkan threshold di `config/device.php`.

Device yang diblokir/dicabut, subscription tidak aktif, atau booth tidak aktif akan ditolak dengan pesan error yang jelas.

---

# 9. Event Concept

Event merupakan konfigurasi sesi photobooth.

Contoh: Wedding, Graduation, Birthday, Corporate Event.

Setiap event memiliki:

- Kode event (`event_code`) yang dimasukkan operator di desktop.
- Booth sebagai acuan kepemilikan (partner diturunkan dari booth).
- Jadwal: tanggal, jam mulai, jam selesai.
- Status: `draft`, `scheduled`, `ongoing`, `completed`, `cancelled`. Pembuatan event baru dimulai dari `draft`/`scheduled`; desktop hanya menerima event berstatus `scheduled` atau `ongoing`.
- Snapshot konfigurasi (lihat bagian Snapshot).
- Batas jumlah cetak (`print_count_limit`).

### Opsi template dan filter

Saat ini satu event dapat memiliki **banyak template dan banyak filter** melalui pivot yang menunjuk ke snapshot (`event_templates`, `event_filters`), lengkap dengan penanda default. Desktop menampilkan seluruh pilihan tersebut kepada operator.

### Opsi ukuran dan harga cetak

Template memiliki atribut ukuran kertas (`paper_size`: `2r` atau `4r`). Setiap event memiliki daftar `event_print_options`:

- `paper_size` (2r/4r)
- `unit_quantity` (jumlah lembar per unit)
- `quantity_step` (kelipatan pemilihan jumlah)
- `price` dan `discount`

Desktop meminta operator memilih ukuran → template yang sesuai ukuran → jumlah lembar sesuai kelipatan. Backend menghitung amount pembayaran dari opsi yang dipilih (bukan dari satu harga tunggal).

### Mode pembayaran dan media

- `payment_mode`: `disabled` (tanpa bayar), `voucher_only` (hanya voucher), `full` (QRIS/voucher).
- `gif_enabled` dan `video_enabled`: menentukan apakah sesi membuat GIF animasi dan video komposit.
- Snapshot template GIF terpisah (`gif_template_snapshot_id`) untuk layout animasi.

Konfigurasi event dibuat/diubah lewat dashboard, lalu desktop hanya mengunduh snapshot untuk event tersebut dengan status `scheduled` atau `ongoing`.

---

# 10. Snapshot Concept

Snapshot merupakan salinan konfigurasi event yang tidak dapat berubah (immutable).

Snapshot berisi:

- Template
- Filter
- Camera Profile
- Printer Profile
- (opsional) Template GIF

Jika master configuration berubah setelah event dibuat maka event lama tetap menggunakan snapshot sebelumnya.

Konsep ini menjamin konsistensi hasil foto. Pivot opsi event juga menunjuk ke baris snapshot, bukan ke master, sehingga perubahan master tidak mengubah event yang sudah berjalan.

Aturan: jangan pernah mengedit snapshot yang sudah terikat event; buat snapshot baru bila konfigurasi berubah.

---

# 11. Desktop Application

Desktop dibuat menggunakan:

- Electron (main process, preload IPC, renderer)
- React + TypeScript + Vite
- Zustand (state sesi), React Query, Axios, electron-store (persistensi lokal)

Ciri aplikasi:

- Cek koneksi internet sebelum login; pesan error jelas bila jaringan/server bermasalah.
- Startup: Splash → restore token → restore fingerprint → verifikasi/aktivasi device → bootstrap → Welcome.
- Halaman Welcome menampilkan judul, subtitle, dan logo toko (disimpan lokal dari Settings) serta nama partner, dengan tombol Start.
- Aplikasi berjalan fullscreen; tombol minimize/exit hanya tersedia di halaman Settings.
- Settings dilindungi verifikasi password operator (`POST /v1/verify-password`).
- Route booth dijaga agar device belum terdaftar tidak bisa melewati aktivasi.

Alur sesi (route):

```text
/dashboard  → input event code → unduh konfigurasi snapshot
/template   → pilih ukuran (2R/4R) → pilih template
/payment    → QRIS Midtrans atau voucher (dilewati bila payment_mode=disabled)
/customer   → data customer opsional (nama, email, phone)
/camera     → live view, countdown, capture, review per foto (Ulangi/Lanjutkan)
/preview    → komposit foto + GIF + video
/filter     → filter khusus cetak
/finish     → cetak lokal → simpan lokal → upload → selesaikan sesi
```

Halaman terpisah: Splash, Activate Device, Login, Welcome, Settings, Camera Settings.

Konfigurasi event di-cache di `electron-store` dan hanya dipakai saat gagal karena jaringan; error validasi/otorisasi server tidak ditutupi oleh cache. Retry upload dan completion bersifat idempoten; berkas yang sudah terunggah tidak diunggah ulang.

---

# 12. Camera Workflow

Layanan kamera berjalan lokal sebagai FastAPI (`cameraAPI/main.exe`) di `127.0.0.1:5000`, di-spawn dan diawasi (watchdog) oleh proses utama Electron.

Endpoint layanan kamera:

- `GET /options`, `GET /video_feed` (MJPEG), `GET /health`
- `POST /capture`, `POST /set_save_dir`
- `POST /toggle_webcam`, `POST /toggle_mirror`
- `POST /set_property`, `POST /get_property`, `POST /auto_focus`

Dukungan kamera:

- Canon melalui EDSDK (wrapper Python `edsdk_wrapper.py`); integrasi Canon aktif namun tetap membutuhkan kamera terhubung untuk validasi akhir.
- Webcam sebagai jalur cadangan/test bila layanan kamera gagal start (aplikasi tidak keluar saat camera service gagal).

Alur capture:

```text
Operator pilih event → template → bayar → data customer
   ↓
Live view + countdown (nilai dari camera snapshot) + overlay PNG template
   ↓
Capture per foto → review (Ulangi / Lanjutkan)
   ↓
Komposit sesuai json_layout canvas + frame → overlay PNG final
   ↓
GIF animasi (gifenc) + video komposit (MediaRecorder WebM)
   ↓
Simpan lokal (Pictures/Photobooth/<sesi>/) → upload → selesaikan sesi
```

Pengaturan kamera (picture style, contrast, saturation, white balance, countdown 2/3/5 detik) dikelola di dashboard camera profile dan dipakai oleh desktop.

---

# 13. Printing Workflow

Printing memiliki dua jalur.

## Cetak lokal dari desktop (jalur utama saat ini)

- Filter dipilih setelah preview, tepat sebelum finish: hasil `printImage` (berfilter) dicetak, sedangkan capture/GIF/komposit arsip tetap tanpa filter.
- Electron membaca daftar printer Windows dan mengirim gambar secara silent melalui driver yang dipilih.
- Pemetaan ukuran: 2R → 60x90 mm, 4R → 100x150 mm; orientasi dan jumlah copy mengikuti konfigurasi sesi.
- Halaman Settings (tersimpan lokal) memilih driver printer per ukuran dan menjalankan test print.
- Status lokal mencegah retry mencetak job kedua; completion mengirim `printed_locally=true` sehingga backend tidak membuat auto-print queue duplikat.

## Antrean cetak terpusat (backend)

- Setiap sesi selesai dapat otomatis membuat satu print job idempoten bila printer snapshot memiliki `auto_print=true` dan printer fisik aktif terpasang pada device sesi.
- Desktop mempolling job dengan klaim atomik (`FOR UPDATE SKIP LOCKED`), memperbarui status, dan mengunduh media cetak privat.
- Lifecycle print job: `queued → printing → success | failed`, `queued → cancelled`, `failed → queued` (retry). Lease job kembali ke antrean bila stale (`PRINT_JOB_LEASE_SECONDS`).
- Dashboard dapat melihat dan mengelola print jobs, termasuk transisi status dan retry.

## Printer fisik dan alert stok kertas

- Printer fisik terikat ke partner/booth/device dengan nama driver Windows.
- `printer_alert_settings` menyimpan `total_print_limit` dan `low_stock_threshold`.
- Saat sisa cetak di bawah threshold, sistem mengirim email ke penerima yang ditentukan (dengan debounce) dan mencatat log + audit.

---

# 14. Cloud Storage dan Gallery

Media disimpan melalui kontrak `MediaStorage` yang didukung disk Laravel:

- `local` (pengembangan) atau `r2` (Cloudflare R2, S3-compatible) dipilih lewat `MEDIA_DISK`.
- Kredensial R2 dapat diisi lewat environment atau disimpan terenkripsi di database (platform settings) oleh Super Admin, dengan endpoint test koneksi.
- Objek bersifat privat; database hanya menyimpan `bucket` dan `object_key`, tidak pernah mengekspos kunci objek mentah.

Saat sesi selesai:

- Backend membuat satu gallery token kedaluwarsa (default 30 hari, `GALLERY_TOKEN_TTL_DAYS`) secara idempoten.
- Link gallery dikirim ke email customer (job antrian) bila customer memiliki email.
- Endpoint publik: `GET /api/v1/gallery/{token}` untuk metadata dan `GET /api/v1/gallery/{token}/media/{media}` untuk pengunduhan tersaring, dilindungi rate limit.
- Link kedaluwarsa mengembalikan `410`; akses media lintas sesi mengembalikan `404`.
- Setiap akses dicatat sebagai `gallery_views` (IP, user agent, waktu), dan statistik unduhan diperbarui.

Web dashboard memiliki halaman Gallery untuk melihat sesi dan medianya, serta halaman gallery publik berbasis token.

---

# 15. Payment

## Pembayaran sesi di booth

Desktop membuat pembayaran dengan idempotency key per partner:

- Gateway: `midtrans_qris`, `cash`, `voucher`.
- Amount dihitung dari `event_print_options` yang dipilih (ukuran, jumlah, diskon).
- `cash` langsung menjadi `paid`; `midtrans_qris` dimulai `pending` dengan jendela kedaluwarsa 15 menit.
- Midtrans QRIS: charge dibuat melalui Core API, QR string/URL/deeplink disimpan, dan desktop menampilkan QR hasil generate untuk dipindai customer.
- Callback Midtrans ditandatangani (SHA-512) dan diverifikasi pada endpoint publik `POST /api/v1/payments/midtrans/notification`.

State machine pembayaran (monoton, replay-safe):

```text
pending → paid | failed | expired
paid    → refunded
```

Status terminal tidak bergerak mundur; callback berulang atau keluar urutan tidak merusak status.

- Kredensial Midtrans diselesaikan dinamis dari database atau environment; bila tidak dikonfigurasi, pembuatan QRIS menolak dengan jelas (tanpa QR palsu).
- Command `payments:expire` dijadwalkan tiap menit untuk pembayaran pending yang lewat.

## Voucher

- Voucher package (global atau partner) berisi harga, jumlah person/capture/print, opsi GIF/video, template, dan masa berlaku.
- Penerbitan voucher idempoten (idempotency key wajib per partner), kode bisa kustom.
- Lifecycle: `unused → redeemed | expired | void`.
- Voucher mendukung `usage_limit` (dari `session_count` paket) dengan pencatatan `voucher_redemptions`; status menjadi `redeemed` setelah kuota habis.
- Penukaran di desktop dilakukan dengan database locking; retry mengembalikan pembayaran yang sama, bukan duplikat.
- Command `vouchers:expire` dijadwalkan tiap jam.

## Subscription

Saat ini pengelolaan billing subscription partner dilakukan Super Admin (assign/activate/renew/cancel/expire). Integrasi pembayaran online untuk subscription merupakan pengembangan lanjutan.

---

# 16. Authentication

Backend menggunakan Laravel Sanctum dengan token yang kedaluwarsa eksplisit (default 24 jam) dan login baru mencabut token client sebelumnya.

- Dashboard web: login user → token + profile.
- Desktop: verifikasi/aktivasi device (publik, rate limited) + login operator dengan header `X-Device-UUID`.
- Halaman Settings desktop: verifikasi password operator.
- Endpoint publik (gallery, notifikasi Midtrans, aset template) dilindungi token kedaluwarsa, signature, atau rate limit.
- RBAC berbasis role dan permission; Super Admin ditandai role `super-admin`.

---

# 17. Web Dashboard

Dashboard web (React 19 + TypeScript + Vite) digunakan Super Admin dan Partner.

Menu utama:

- Overview — ringkasan booth, device, event, partner.
- Kiosk — daftar partner, detail partner, booth, device, master configuration (template/filter/camera/printer), printer fisik.
- Events — daftar, buat, edit, detail event beserta opsi template/filter/ukuran/harga.
- Gallery — sesi dan media yang sudah diunggah.
- Statistics — laporan harian/bulanan partner atau statistik platform.
- Transactions — daftar dan detail pembayaran, transisi status (Super Admin).
- Print Jobs — daftar, detail, transisi, dan retry job cetak.
- Customers — data customer tenant.
- Subscriptions — plan dan subscription partner.
- Frame Photo — editor template/frame (canvas, deteksi slot otomatis, slot QR, preview, unggah aset).
- Voucher — package dan voucher beserta penerbitan.

Halaman Super Admin: Users, Platform Credentials (Midtrans/R2 write-only), Audit Log.

Halaman publik: gallery berbasis token (`/gallery/:token`).

Menu Request saat ini menampilkan halaman "Segera Hadir" (belum ada API).

---

# 18. Reporting, Audit, dan Notifikasi

- Agregasi otomatis: laporan harian partner, laporan bulanan partner, dan statistik harian platform (job terjadwal + command `reports:aggregate-daily` / `reports:aggregate-monthly`).
- API laporan harian/bulanan untuk partner dan laporan platform untuk Super Admin.
- Audit log merekam aktivitas penting secara sanitized: login/logout, pembuatan pembayaran desktop, transisi pembayaran, penukaran voucher, upload media, unduhan gallery, operasi print queue, dan perubahan kredensial platform — tanpa nilai rahasia.
- Notifikasi email: link gallery ke customer dan alert stok kertas printer.

---

# 19. Technology Stack

Backend

- Laravel 13 (PHP 8.3+)
- MySQL 8
- Laravel Sanctum
- PHPUnit (database MySQL khusus `photobooth_testing`)
- Flysystem S3-compatible (Cloudflare R2)

Web Dashboard

- React 19, TypeScript, Vite 8, React Router 7
- Tailwind CSS 4, komponen shadcn/Base UI, Recharts
- Klien API fetch lokal dengan base URL `VITE_API_BASE_URL`

Desktop

- Electron, React, TypeScript, electron-vite
- Zustand, React Query, Axios, electron-store, gifenc, qrcode
- Layanan kamera FastAPI lokal (Canon EDSDK + webcam)
- Print via BrowserWindow/webContents dengan driver Windows

Storage

- Cloudflare R2 atau local disk

Payment

- Midtrans (QRIS Core API)

Camera / Printer

- Canon (EDSDK) dan webcam; printer fisik contoh: DNP DS-RX1

---

# 20. Long-Term Vision

Platform dirancang agar dapat mendukung:

- Multi Partner, Multi Booth, Multi Device
- Offline Mode dan Sinkronisasi Otomatis yang lebih kuat
- Pembayaran online untuk subscription partner
- Gallery sharing dan download massal
- Template Marketplace
- AI Photo Enhancement
- Video Booth dan GIF Booth (fitur dasar GIF/video sudah berjalan)
- Analytics Dashboard yang lebih dalam
- Monitoring perangkat realtime

Seluruh arsitektur dikembangkan dengan prinsip modular — service layer, kontrak payment gateway, dan kontrak storage — sehingga setiap fitur baru dapat ditambahkan tanpa mengubah fondasi sistem.
