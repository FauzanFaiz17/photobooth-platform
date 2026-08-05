# Business Overview

## Project Name

Photobooth Platform

---

# 1. Executive Summary

Photobooth Platform adalah sebuah platform Software as a Service (SaaS) yang menyediakan sistem manajemen photobooth secara terpusat.

Platform ini memungkinkan pemilik usaha photobooth (Partner) untuk mengelola seluruh operasional bisnis melalui web dashboard, sedangkan aplikasi desktop digunakan oleh operator photobooth untuk menjalankan sesi foto pada setiap booth.

Sistem dirancang menggunakan arsitektur multi-tenant sehingga satu platform dapat digunakan oleh banyak partner secara bersamaan dengan data yang terisolasi.

---

# 2. Business Goal

Tujuan utama platform ini adalah:

- Memudahkan pengelolaan bisnis photobooth.
- Mengurangi konfigurasi manual pada setiap event.
- Menjamin konsistensi template, filter, kamera, dan printer melalui sistem snapshot.
- Mempermudah sinkronisasi hasil foto ke cloud.
- Menyediakan sistem berlangganan (subscription) bagi partner.

---

# 3. Target Users

Platform memiliki beberapa jenis pengguna.

## Super Admin

Merupakan pengelola utama platform.

Super Admin bertanggung jawab terhadap:

- Mengelola partner.
- Mengelola subscription plan.
- Mengelola template global.
- Mengelola filter global.
- Mengelola kamera profile.
- Mengelola printer profile.
- Monitoring seluruh sistem.

---

## Partner

Partner adalah pemilik usaha photobooth.

Partner dapat:

- Mengelola operator.
- Mengelola booth.
- Mengelola device.
- Membuat event.
- Memilih template.
- Memilih filter.
- Melihat laporan.

Setiap partner hanya dapat mengakses data miliknya sendiri.

---

## Operator

Operator menggunakan aplikasi desktop Electron.

Operator tidak mengakses dashboard web.

Tugas operator hanya:

- Login desktop.
- Memilih event.
- Menjalankan sesi foto.
- Mencetak hasil.
- Mengunggah hasil.

---

## Customer

Customer adalah pengguna akhir.

Customer hanya menggunakan photobooth.

Customer tidak memiliki akun.

---

# 4. Business Model

Platform menggunakan model SaaS.

Alur bisnis:

Super Admin

↓

Mendaftarkan Partner

↓

Partner membeli Subscription

↓

Subscription aktif

↓

Partner membuat Booth

↓

Booth mempunyai Device

↓

Operator menjalankan Desktop

↓

Customer melakukan sesi foto

---

# 5. Multi Tenant Concept

Setiap partner memiliki data sendiri.

Contoh:

Partner A

- Booth
- Device
- Event
- User

Partner B

- Booth
- Device
- Event
- User

Data antar partner tidak boleh saling terlihat.

Semua pembatasan dilakukan pada backend Laravel menggunakan Policy dan Service Layer.

---

# 6. Subscription Concept

Partner harus memiliki subscription aktif.

Subscription menentukan:

- Masa aktif layanan.
- Jumlah booth.
- Jumlah device.
- Fitur yang tersedia.

Jika subscription berakhir maka partner tidak dapat menggunakan layanan.

---

# 7. Booth Concept

Booth merupakan lokasi operasional photobooth.

Satu partner dapat memiliki banyak booth.

Contoh:

Partner

├── Booth Garut

├── Booth Bandung

└── Booth Jakarta

Setiap booth memiliki minimal satu device.

---

# 8. Device Concept

Device merupakan komputer desktop yang menjalankan aplikasi Electron.

Setiap device mempunyai:

- device_key
- device_uuid
- fingerprint hardware
- status

Device harus melalui proses aktivasi sebelum dapat digunakan.

Status device:

- pending
- active
- blocked
- revoked

---

# 9. Event Concept

Event merupakan konfigurasi sesi photobooth.

Contoh:

Wedding

Graduation

Birthday

Corporate Event

Setiap event memiliki konfigurasi:

- template
- filter
- camera profile
- printer profile

Konfigurasi tersebut tidak langsung digunakan.

Backend akan membuat snapshot immutable.

Desktop hanya mengunduh snapshot tersebut.

---

# 10. Snapshot Concept

Snapshot merupakan salinan konfigurasi event yang tidak dapat berubah.

Snapshot berisi:

- Template
- Filter
- Camera Profile
- Printer Profile

Jika template berubah setelah event dibuat maka event lama tetap menggunakan snapshot sebelumnya.

Konsep ini menjamin konsistensi hasil foto.

---

# 11. Desktop Application

Desktop dibuat menggunakan:

- Electron
- React
- TypeScript
- Vite

Desktop digunakan untuk:

- Login Device
- Download Event
- Live View Kamera
- Capture
- Compose
- Print
- Upload

Desktop bekerja secara offline-first.

---

# 12. Camera Workflow

Operator memilih event.

↓

Desktop menghubungkan kamera Canon.

↓

Live View.

↓

Countdown.

↓

Capture.

↓

Foto diunduh.

↓

Template diterapkan.

↓

Filter diterapkan.

↓

Preview.

↓

Print.

↓

Upload.

---

# 13. Printing Workflow

Foto hasil compose akan dikirim ke printer sesuai Printer Profile.

Printer Profile menentukan:

- ukuran kertas
- orientasi
- jumlah copy
- printer yang digunakan

---

# 14. Cloud Storage

Seluruh hasil akhir akan diunggah ke Cloudflare R2.

Cloudflare R2 digunakan untuk:

- hasil foto
- GIF
- video
- media event

Backend hanya menyimpan metadata.

---

# 15. Payment

Platform menggunakan Midtrans.

Midtrans digunakan untuk:

- pembayaran subscription partner.

Setelah pembayaran berhasil:

Partner Subscription akan aktif.

---

# 16. Authentication

Backend menggunakan Laravel Sanctum.

Dashboard Web menggunakan autentikasi user.

Desktop menggunakan autentikasi device dan operator.

---

# 17. Technology Stack

Backend

- Laravel 13
- MySQL
- Sanctum

Frontend

- React
- TypeScript
- Vite

Desktop

- Electron
- React
- IPC

Storage

- Cloudflare R2

Payment

- Midtrans

Camera

- Canon R100

---

# 18. Long-Term Vision

Platform dirancang agar dapat mendukung:

- Multi Partner
- Multi Booth
- Multi Device
- Offline Mode
- Sinkronisasi Otomatis
- Cloud Storage
- Template Marketplace
- AI Photo Enhancement
- Video Booth
- GIF Booth
- Analytics Dashboard

Seluruh arsitektur dikembangkan dengan prinsip modular sehingga setiap fitur baru dapat ditambahkan tanpa mengubah fondasi sistem.