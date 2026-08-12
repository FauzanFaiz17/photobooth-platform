# Backend API Reference

Dokumen ini menjelaskan API backend yang benar-benar terdaftar dan telah diuji pada 6 Agustus 2026. Source of truth route tetap berada di `backend/routes/api.php`.

## Konvensi Umum

- Base path: `/api/v1`
- Format request dan response: JSON
- Header umum:

```http
Accept: application/json
Content-Type: application/json
```

- Endpoint terproteksi membutuhkan token Sanctum:

```http
Authorization: Bearer <token>
```

- Endpoint desktop terproteksi juga membutuhkan fingerprint perangkat:

```http
X-Device-UUID: 11111111-1111-4111-8111-111111111111
```

### Envelope sukses

Auth, operasi hapus, dan API desktop menggunakan envelope berikut:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Endpoint list dan detail dashboard menggunakan Laravel JSON Resource. Detail berbentuk:

```json
{
  "data": {}
}
```

List berpaginasi berbentuk:

```json
{
  "data": [],
  "links": {
    "first": "http://localhost/api/v1/users?page=1",
    "last": "http://localhost/api/v1/users?page=1",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 1,
    "links": [],
    "path": "http://localhost/api/v1/users",
    "per_page": 10,
    "to": 1,
    "total": 1
  }
}
```

### Envelope error

Semua error API menggunakan bentuk:

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

Status yang umum:

| Status | Arti |
| --- | --- |
| `401` | Token tidak ada, tidak valid, atau kredensial login salah. |
| `403` | User tidak memiliki permission atau mencoba mengakses tenant/perangkat lain. |
| `404` | Resource atau perangkat tidak ditemukan. |
| `422` | Request tidak valid atau aturan bisnis tidak terpenuhi. |
| `500` | Error internal yang tidak tertangani. Detail disembunyikan pada production. |

## Ringkasan Route

### Auth

| Method | Route | Auth |
| --- | --- | --- |
| `POST` | `/login` | Tidak |
| `GET` | `/profile` | Bearer token |
| `POST` | `/logout` | Bearer token |

### Dashboard

| Method | Route | Permission |
| --- | --- | --- |
| `GET` | `/users` | `users.view` |
| `POST` | `/users` | `users.create` |
| `GET` | `/users/{user}` | `users.view` |
| `PUT` | `/users/{user}` | `users.update` |
| `DELETE` | `/users/{user}` | `users.delete` |
| `GET` | `/partners` | `partners.view` |
| `POST` | `/partners` | `partners.create` |
| `GET` | `/partners/{partner}` | `partners.view` |
| `PUT` | `/partners/{partner}` | `partners.update` |
| `DELETE` | `/partners/{partner}` | `partners.delete` |
| `GET` | `/subscription-plans` | `subscriptions.view` |
| `POST` | `/subscription-plans` | `subscriptions.create` |
| `GET` | `/subscription-plans/{subscriptionPlan}` | `subscriptions.view` |
| `PUT` | `/subscription-plans/{subscriptionPlan}` | `subscriptions.update` |
| `DELETE` | `/subscription-plans/{subscriptionPlan}` | `subscriptions.delete` |
| `GET` | `/partner-subscriptions` | `subscriptions.view` |
| `POST` | `/partner-subscriptions` | `subscriptions.create` |
| `GET` | `/partner-subscriptions/{partnerSubscription}` | `subscriptions.view` |
| `POST` | `/partner-subscriptions/{partnerSubscription}/activate` | `subscriptions.update` |
| `POST` | `/partner-subscriptions/{partnerSubscription}/renew` | `subscriptions.update` |
| `POST` | `/partner-subscriptions/{partnerSubscription}/cancel` | `subscriptions.update` |
| `POST` | `/partner-subscriptions/{partnerSubscription}/expire` | `subscriptions.update` |
| `GET` | `/customers` | `customers.view` |
| `GET` | `/customers/{customer}` | `customers.view` |
| `GET` | `/voucher-packages` | `vouchers.view` |
| `POST` | `/voucher-packages` | `vouchers.create` |
| `GET` | `/voucher-packages/{voucher_package}` | `vouchers.view` |
| `PUT/PATCH` | `/voucher-packages/{voucher_package}` | `vouchers.update` |
| `DELETE` | `/voucher-packages/{voucher_package}` | `vouchers.delete` |
| `GET` | `/vouchers` | `vouchers.view` |
| `POST` | `/vouchers` | `vouchers.create` |
| `GET` | `/vouchers/{voucher}` | `vouchers.view` |
| `POST` | `/vouchers/{voucher}/void` | `vouchers.update` |
| `GET` | `/payments` | `payments.view` |
| `GET` | `/payments/{payment}` | `payments.view` |
| `POST` | `/payments/{payment}/transition` | `payments.update` + Super Admin |
| `GET` | `/booths` | `booths.view` |
| `POST` | `/booths` | `booths.create` |
| `GET` | `/booths/{booth}` | `booths.view` |
| `PUT` | `/booths/{booth}` | `booths.update` |
| `DELETE` | `/booths/{booth}` | `booths.delete` |
| `GET` | `/templates` | `templates.view` |
| `POST` | `/templates` | `templates.create` |
| `GET` | `/templates/{template}` | `templates.view` |
| `PUT/PATCH` | `/templates/{template}` | `templates.update` |
| `DELETE` | `/templates/{template}` | `templates.delete` |
| `GET` | `/filters` | `filters.view` |
| `POST` | `/filters` | `filters.create` |
| `GET` | `/filters/{filter}` | `filters.view` |
| `PUT/PATCH` | `/filters/{filter}` | `filters.update` |
| `DELETE` | `/filters/{filter}` | `filters.delete` |
| `GET` | `/camera-profiles` | `camera_profiles.view` |
| `POST` | `/camera-profiles` | `camera_profiles.create` |
| `GET` | `/camera-profiles/{camera_profile}` | `camera_profiles.view` |
| `PUT/PATCH` | `/camera-profiles/{camera_profile}` | `camera_profiles.update` |
| `DELETE` | `/camera-profiles/{camera_profile}` | `camera_profiles.delete` |
| `GET` | `/printer-profiles` | `printer_profiles.view` |
| `POST` | `/printer-profiles` | `printer_profiles.create` |
| `GET` | `/printer-profiles/{printer_profile}` | `printer_profiles.view` |
| `PUT/PATCH` | `/printer-profiles/{printer_profile}` | `printer_profiles.update` |
| `DELETE` | `/printer-profiles/{printer_profile}` | `printer_profiles.delete` |
| `GET` | `/events` | `events.view` |
| `POST` | `/events` | `events.create` |
| `GET` | `/events/{event}` | `events.view` |
| `PUT/PATCH` | `/events/{event}` | `events.update` |
| `DELETE` | `/events/{event}` | `events.delete` |

### Public routes

| Method | Route | Auth | Verification |
| --- | --- | --- | --- |
| `POST` | `/payments/midtrans/notification` | Tidak | Signature Midtrans wajib valid |
| `GET` | `/gallery/{token}` | Tidak | Token 64 karakter, belum kedaluwarsa |
| `GET` | `/gallery/{token}/media/{media}` | Tidak | Token valid dan media milik session token |

### Desktop

| Method | Route | Auth | Device header |
| --- | --- | --- | --- |
| `POST` | `/desktop/devices/verify` | Tidak | Tidak |
| `POST` | `/desktop/devices/activate` | Tidak | Tidak |
| `POST` | `/desktop/devices/heartbeat` | Bearer token | Wajib |
| `POST` | `/desktop/customers/resolve` | Bearer token | Wajib |
| `POST` | `/desktop/vouchers/redeem` | Bearer token | Wajib |
| `POST` | `/desktop/payments` | Bearer token | Wajib |
| `GET` | `/desktop/bootstrap` | Bearer token | Wajib |
| `GET` | `/desktop/events/{eventCode}/configuration` | Bearer token | Wajib |
| `POST` | `/desktop/photo-sessions` | Bearer token | Wajib |
| `POST` | `/desktop/photo-sessions/{photoSession}/media` | Bearer token | Wajib |
| `POST` | `/desktop/photo-sessions/{photoSession}/complete` | Bearer token | Wajib |

## Auth API

### Login

`POST /login`

Electron mengirim header `X-Device-UUID`. Jika header ini tersedia, backend hanya menerbitkan token untuk operator yang berada pada partner yang sama dengan device aktif. Login web tetap dapat memakai endpoint ini tanpa device header.

Request:

```json
{
  "email": "operator@photobooth.test",
  "password": "Operator@12345"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "1|sanctum-token",
    "user": {
      "id": 2,
      "name": "Desktop Test Operator",
      "email": "operator@photobooth.test",
      "phone": "0800000000",
      "avatar": null,
      "status": "active",
      "last_login_at": "2026-08-06T10:00:00.000000Z",
      "created_at": "2026-08-06T09:00:00.000000Z",
      "role": {
        "id": 5,
        "name": "Operator",
        "slug": "operator"
      },
      "partner": {
        "id": 4,
        "company_name": "Desktop Test Partner",
        "brand_name": "Desktop Test"
      }
    }
  }
}
```

User harus berstatus `active`. Login yang gagal mengembalikan `401`.

### Profile

`GET /profile`

Response `200` memakai envelope sukses dan `data` berisi object user seperti pada login.

### Logout

`POST /logout`

Response `200`:

```json
{
  "success": true,
  "message": "Logout berhasil",
  "data": null
}
```

Logout hanya menghapus token yang sedang digunakan.

## User API

### Bentuk user

```json
{
  "id": 10,
  "name": "Operator Booth",
  "email": "operator@example.com",
  "phone": "08123456789",
  "avatar": null,
  "status": "active",
  "last_login_at": null,
  "created_at": "2026-08-06T10:00:00.000000Z",
  "role": {
    "id": 5,
    "name": "Operator",
    "slug": "operator"
  },
  "partner": {
    "id": 4,
    "company_name": "PT Example",
    "brand_name": "Example Booth"
  }
}
```

Status: `active`, `suspended`, `invited`, atau `inactive`.

### List user

`GET /users`

Query opsional:

| Field | Nilai |
| --- | --- |
| `search` | Pencarian nama atau email. |
| `role` | ID role. |
| `partner` | ID partner; hanya diterapkan untuk Super Admin. |
| `status` | Salah satu status user. |
| `sort` | `id`, `name`, `email`, `created_at`, `last_login_at`. |
| `direction` | `asc` atau `desc`. |
| `per_page` | Integer `5` sampai `100`; default `10`. |
| `page` | Nomor halaman. |

User non-Super Admin hanya menerima user dari partner miliknya.

### Detail user

`GET /users/{user}`

Response `200`: `{ "data": <user> }`. User partner tidak dapat melihat user tenant lain.

### Buat user

`POST /users`

```json
{
  "name": "Operator Booth",
  "email": "operator@example.com",
  "phone": "08123456789",
  "password": "Password123!",
  "password_confirmation": "Password123!",
  "role_id": 5,
  "partner_id": 4,
  "status": "active"
}
```

- `phone`, `partner_id`, dan `status` opsional.
- Super Admin wajib menentukan partner untuk role selain `super-admin`.
- User partner selalu membuat user di tenant sendiri; `partner_id` dari request tidak dipercaya.
- Role target harus berada di bawah level role pembuat.
- Response `201`: `{ "data": <user> }`.

### Ubah user

`PUT /users/{user}`

```json
{
  "name": "Operator Updated",
  "email": "operator.updated@example.com",
  "phone": null,
  "status": "suspended",
  "role_id": 5,
  "partner_id": 4,
  "password": "NewPassword123!",
  "password_confirmation": "NewPassword123!"
}
```

`name`, `email`, dan `status` wajib. `role_id`, `partner_id`, dan password opsional. Aturan tenant dan hierarki role tetap diterapkan.

### Hapus user

`DELETE /users/{user}`

Menggunakan soft delete. User tidak dapat menghapus akunnya sendiri.

## Partner API

### Bentuk partner

```json
{
  "id": 4,
  "company_name": "PT Example",
  "brand_name": "Example Booth",
  "slug": "pt-example",
  "address": "Jakarta",
  "phone": "021000000",
  "email": "partner@example.com",
  "tax_number": null,
  "logo": null,
  "status": "active",
  "created_at": "2026-08-06T10:00:00.000000Z",
  "subscription": {
    "id": 1,
    "status": "active",
    "starts_at": "2026-08-06T10:00:00.000000Z",
    "ends_at": "2026-09-05T10:00:00.000000Z",
    "plan": {
      "id": 1,
      "name": "Trial"
    }
  }
}
```

`subscription` bernilai `null` jika tidak ada subscription aktif. Status partner: `active`, `suspended`, `trial`, atau `inactive`.

### List partner

`GET /partners`

Query: `search`, `status`, `sort`, `direction`, `per_page`, dan `page`.

- `sort`: `id`, `company_name`, atau `created_at`.
- User non-Super Admin hanya menerima partner miliknya.

### Detail partner

`GET /partners/{partner}`

Response `200`: `{ "data": <partner> }`.

### Buat partner

`POST /partners`

```json
{
  "company_name": "PT Example",
  "brand_name": "Example Booth",
  "address": "Jakarta",
  "phone": "021000000",
  "email": "partner@example.com",
  "tax_number": null,
  "status": "trial"
}
```

Hanya Super Admin. `company_name` dan `email` wajib. Slug dibuat otomatis. Backend juga membuat subscription aktif 30 hari menggunakan plan bernama `Trial`; plan tersebut harus tersedia.

### Ubah partner

`PUT /partners/{partner}`

Semua field pada contoh berikut dikirim ulang karena endpoint menggunakan PUT:

```json
{
  "company_name": "PT Example Updated",
  "brand_name": "Example Booth",
  "address": "Bandung",
  "phone": "022000000",
  "email": "partner.updated@example.com",
  "tax_number": null,
  "status": "active"
}
```

### Hapus partner

`DELETE /partners/{partner}`

Menggunakan soft delete. Request ditolak `422` jika partner masih memiliki user.

## Subscription Plan API

### Bentuk subscription plan

```json
{
  "id": 2,
  "name": "Basic",
  "price": 199000,
  "billing_cycle": "monthly",
  "max_booths": 2,
  "max_devices": 4,
  "max_operators": 5,
  "features": ["Unlimited Session", "QR Download"],
  "is_active": true,
  "created_at": "2026-08-06T10:00:00.000000Z",
  "updated_at": "2026-08-06T10:00:00.000000Z"
}
```

### List plan

`GET /subscription-plans`

Query: `search`, `is_active`, `sort`, `direction`, `per_page`, dan `page`.

- `sort`: `id`, `name`, `price`, atau `created_at`.
- `is_active`: boolean.

### Detail plan

`GET /subscription-plans/{subscriptionPlan}`

Response `200`: `{ "data": <subscription-plan> }`.

### Buat plan

`POST /subscription-plans`

```json
{
  "name": "Professional",
  "price": 499000,
  "billing_cycle": "monthly",
  "max_booths": 10,
  "max_devices": 20,
  "max_operators": 30,
  "features": ["Cloud Storage", "Analytics", "Voucher"],
  "is_active": true
}
```

`billing_cycle`: `monthly` atau `yearly`. Hanya Super Admin yang dapat membuat, mengubah, atau menghapus plan.

### Ubah plan

`PUT /subscription-plans/{subscriptionPlan}`

Menggunakan bentuk request yang sama dengan create. Seluruh field wajib kecuali `features`.

### Hapus plan

`DELETE /subscription-plans/{subscriptionPlan}`

Menggunakan soft delete. Ditolak `422` jika plan sudah dipakai pada `partner_subscriptions`.

## Partner Subscription API

Endpoint ini mengelola penugasan plan dan lifecycle subscription partner. User partner dengan permission `subscriptions.view` hanya dapat melihat subscription tenant sendiri. Seluruh operasi mutasi hanya dapat dilakukan oleh Super Admin.

### Bentuk partner subscription

```json
{
  "id": 10,
  "status": "active",
  "starts_at": "2026-08-12T02:00:00.000000Z",
  "ends_at": "2026-09-12T02:00:00.000000Z",
  "auto_renew": true,
  "cancelled_at": null,
  "is_current": true,
  "remaining_days": 31,
  "partner": {
    "id": 4,
    "company_name": "PT Example",
    "slug": "pt-example"
  },
  "plan": {
    "id": 2,
    "name": "Professional",
    "billing_cycle": "monthly",
    "price": 499000,
    "max_booths": 10,
    "max_devices": 20,
    "max_operators": 30
  }
}
```

Status: `pending`, `active`, `expired`, atau `cancelled`.

### List dan detail

- `GET /partner-subscriptions`
- `GET /partner-subscriptions/{partnerSubscription}`

Query list opsional: `partner_id`, `subscription_plan_id`, `status`, `sort`, `direction`, `per_page`, dan `page`.

- `sort`: `starts_at`, `ends_at`, `created_at`, atau `status`.
- Filter `partner_id` hanya dipercaya untuk Super Admin. User partner selalu dibatasi ke `partner_id` dari tokennya.
- Akses detail subscription tenant lain mengembalikan `403`.

### Buat/assign subscription

`POST /partner-subscriptions`

```json
{
  "partner_id": 4,
  "subscription_plan_id": 2,
  "status": "pending",
  "starts_at": "2026-08-12T09:00:00+07:00",
  "ends_at": null,
  "auto_renew": true
}
```

- `status` opsional, hanya `pending` atau `active`; default `pending`.
- `starts_at` default ke waktu saat request diproses.
- Jika `ends_at` tidak diberikan, backend menghitung satu periode berdasarkan `billing_cycle` plan: satu bulan atau satu tahun.
- Plan yang tidak aktif ditolak `422`.
- Subscription aktif yang periodenya bertumpang tindih dengan subscription aktif lain pada partner yang sama ditolak `422`.

### Aktivasi pending subscription

`POST /partner-subscriptions/{partnerSubscription}/activate`

Body kosong. Hanya subscription `pending` yang dapat diaktifkan, dan waktu saat request harus berada di antara `starts_at` dan `ends_at`. Overlap dengan subscription aktif lain tetap ditolak.

### Renew subscription

`POST /partner-subscriptions/{partnerSubscription}/renew`

```json
{
  "periods": 2,
  "auto_renew": true
}
```

- Hanya status `active` atau `expired` yang dapat diperpanjang.
- `periods` bernilai 1 sampai 36 dan default 1.
- Subscription aktif diperpanjang dari `ends_at` yang sekarang dan harus memakai plan yang sama agar riwayat entitlement periode aktif tidak berubah.
- Subscription expired dimulai kembali dari waktu renew dan boleh memilih `subscription_plan_id` lain yang masih aktif.
- Hasil renew berstatus `active` dan `cancelled_at` dikosongkan.

### Cancel subscription

`POST /partner-subscriptions/{partnerSubscription}/cancel`

Pembatalan berlaku langsung: status menjadi `cancelled`, `auto_renew` menjadi `false`, `cancelled_at` diisi, dan periode dipotong ke waktu pembatalan jika belum berakhir.

### Expire subscription

`POST /partner-subscriptions/{partnerSubscription}/expire`

Hanya subscription aktif yang dapat di-expire secara manual. Status menjadi `expired`, `auto_renew` menjadi `false`, dan periode dipotong ke waktu request jika belum berakhir.

Backend juga menyediakan command berikut untuk menutup subscription aktif yang sudah melewati `ends_at`:

```powershell
php artisan subscriptions:expire
```

Command dijadwalkan berjalan setiap jam melalui Laravel scheduler. Pada production, proses `php artisan schedule:run` harus dipicu oleh cron/Task Scheduler setiap menit atau gunakan worker scheduler Laravel yang sesuai dengan deployment.

## Customer, Voucher, dan Payment API

### Customer resolution desktop

`POST /desktop/customers/resolve`

Endpoint ini membuat atau menemukan customer pada tenant device. Customer tetap opsional untuk anonymous walk-in; panggil endpoint hanya ketika customer memberikan nomor telepon atau email.

```json
{
  "name": "Siti Customer",
  "phone": "+62 812-3456-789",
  "email": "siti@example.com"
}
```

- Bearer token dan `X-Device-UUID` wajib.
- Minimal salah satu dari `phone` atau `email` wajib.
- Email disimpan lowercase. Nomor Indonesia seperti `+62 812...`, `62812...`, dan `0812...` dinormalisasi ke bentuk `0812...`.
- Kombinasi tenant+phone dan tenant+email unik. Retry dengan identitas yang sama mengembalikan customer yang sama.
- Jika phone dan email menunjuk dua record berbeda, request ditolak `422` agar backend tidak menggabungkan identitas secara ambigu.

Dashboard dapat membaca customer melalui `GET /customers` dan `GET /customers/{customer}`. User partner hanya melihat tenant sendiri; list mendukung `search`, `partner_id` untuk Super Admin, `sort`, `direction`, dan `per_page`.

### Voucher package

CRUD tersedia pada `/voucher-packages`. Package dapat global (`partner_id = null`) atau dimiliki partner.

- Partner dapat membaca package global dan package tenant sendiri.
- Partner hanya dapat membuat/mengubah/menghapus package tenant sendiri; global package hanya dapat dimutasi Super Admin.
- `template_id`, jika diisi, harus berupa template global atau template dari tenant package.
- Package yang sudah digunakan voucher tidak dapat dihapus.
- Field utama: `price`, `persons`, `captures`, `print_count`, `gif_included`, `video_included`, `template_id`, `validity_days`, dan `is_active`.

### Issue voucher

`POST /vouchers`

```json
{
  "partner_id": 4,
  "voucher_package_id": 10,
  "idempotency_key": "dashboard-request-8a92",
  "code": "WEDDING-001",
  "expired_at": "2026-09-12T10:00:00+07:00"
}
```

- `partner_id` wajib secara bisnis untuk Super Admin dan selalu diambil dari token untuk user partner.
- `idempotency_key` wajib dan unik per partner. Retry dengan key+package yang sama mengembalikan voucher lama tanpa duplikasi.
- Reuse key untuk package lain ditolak `422`.
- `code` opsional; backend membuat kode acak jika tidak diberikan. Kode disimpan uppercase dan unik secara global.
- `expired_at` default dihitung dari `validity_days` package.
- Hanya package aktif yang global atau dimiliki tenant voucher yang dapat digunakan.

Status voucher hanya bergerak melalui transisi berikut:

```text
unused -> redeemed
unused -> expired
unused -> void
```

Voucher yang sudah redeemed, expired, atau void tidak dapat digunakan kembali. `POST /vouchers/{voucher}/void` hanya menerima voucher `unused`.

### Redeem voucher desktop

`POST /desktop/vouchers/redeem`

```json
{
  "code": "WEDDING-001"
}
```

Redemption dilakukan dalam transaksi database dan lock row:

1. Validasi operator, device aktif, booth aktif, dan tenant voucher.
2. Validasi status `unused` serta waktu kedaluwarsa.
3. Buat payment `paid` dengan gateway `voucher` dan reference deterministik `VCH-{voucher_id}`.
4. Ubah voucher menjadi `redeemed`, lalu simpan `redeemed_by` dan `redeemed_at`.

Retry voucher yang sudah berhasil redeemed mengembalikan payment yang sama. Payment tidak dibuat dua kali.

Response:

```json
{
  "success": true,
  "message": "Voucher redeemed successfully.",
  "data": {
    "voucher": {},
    "payment": {
      "id": 20,
      "gateway": "voucher",
      "status": "paid",
      "amount": 50000,
      "net_amount": 50000
    }
  }
}
```

Payment `paid` tersebut dapat dikirim sebagai `payment_id` ketika membuat photo session. Payment tenant lain atau payment yang belum `paid` ditolak.

### Membuat payment desktop

`POST /desktop/payments`

```json
{
  "event_id": 10,
  "gateway": "midtrans_qris",
  "idempotency_key": "desktop-payment-8a92"
}
```

Alternatif tanpa event:

```json
{
  "amount": 50000,
  "gateway": "cash",
  "idempotency_key": "desktop-payment-cash-001"
}
```

- Bearer token operator dan `X-Device-UUID` wajib.
- Jika `event_id` diberikan, backend mengambil nominal dari `events.price`; `amount` dari client tidak dipercaya dan harus sama jika ikut dikirim.
- Tanpa event, `amount` wajib diberikan.
- Gateway desktop yang diterima: `cash`, `midtrans_qris`, atau `other`. Gateway `voucher` hanya dapat dibuat oleh proses redemption voucher.
- `idempotency_key` wajib dan unik per partner. Retry payload yang sama mengembalikan payment lama; reuse key dengan gateway/amount berbeda ditolak `422`.
- Payment cash langsung berstatus `paid`. Gateway eksternal dimulai sebagai `pending` dengan masa berlaku 15 menit.
- Pembuatan `midtrans_qris` memanggil Midtrans Core API QRIS. Backend tidak membuat payment jika `MIDTRANS_SERVER_KEY` belum dikonfigurasi.
- Retry dengan `idempotency_key` yang sama memakai payment dan transaksi Midtrans yang sudah ada; request charge tidak dikirim dua kali.

Contoh bagian response QRIS:

```json
{
  "data": {
    "reference": "PAY-...",
    "gateway": "midtrans_qris",
    "status": "pending",
    "expired_at": "2026-08-12T12:15:00.000000Z",
    "gateway_response": {
      "transaction_id": "midtrans-transaction-id",
      "transaction_status": "pending",
      "qr_string": "00020101021226...",
      "qr_url": "https://api.sandbox.midtrans.com/v2/qris/.../qr-code",
      "deeplink_url": "https://simulator.sandbox.midtrans.com/qris/index"
    }
  }
}
```

Renderer desktop dapat menampilkan `qr_url` sebagai gambar QR atau membangkitkan QR dari `qr_string`. Jangan menganggap `deeplink_url` selalu tersedia karena actions yang dikembalikan Midtrans dapat berbeda.

### Payment state machine

Transisi yang diizinkan:

```text
pending -> paid | failed | expired
paid -> refunded
failed, expired, refunded -> terminal
```

Request transisi internal/admin:

`POST /payments/{payment}/transition`

```json
{
  "status": "paid",
  "gateway_response": {
    "transaction_id": "gateway-transaction-id"
  }
}
```

- Endpoint hanya dapat digunakan Super Admin dengan `payments.update`.
- Mengirim status yang sama bersifat idempotent.
- Terminal state tidak dapat dikembalikan ke state sebelumnya.
- Voucher payment tidak dapat ditransisikan manual karena lifecycle-nya dimiliki proses redemption.
- Endpoint ini bukan webhook publik dan tetap ditujukan untuk operasi Super Admin.

### Midtrans notification

`POST /payments/midtrans/notification`

Endpoint ini publik agar dapat dipanggil server Midtrans, tetapi setiap payload diverifikasi menggunakan:

```text
SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
```

Backend juga mencocokkan `order_id` dengan reference payment QRIS dan memastikan `gross_amount` sama dengan nominal tersimpan. Signature tidak valid ditolak `403`, nominal berbeda ditolak `422`, dan callback replay bersifat idempotent.

Mapping status yang aktif:

| Midtrans | Payment |
| --- | --- |
| `settlement` | `paid` |
| `capture` + fraud `accept` | `paid` |
| `capture` + fraud `deny`, `deny`, `cancel`, `failure` | `failed` |
| `expire` | `expired` |
| `refund`, `partial_refund` | `refunded` |
| `pending` | Tidak mengubah status |

Callback terlambat yang akan memundurkan status, misalnya `pending` setelah `paid`, diabaikan. URL notification pada dashboard Midtrans harus diarahkan ke URL HTTPS publik aplikasi, misalnya `https://api.example.com/api/v1/payments/midtrans/notification`.

Konfigurasi sandbox:

```dotenv
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_API_URL=https://api.sandbox.midtrans.com
MIDTRANS_TIMEOUT=15
```

Untuk production, gunakan key production, set `MIDTRANS_IS_PRODUCTION=true`, dan gunakan `https://api.midtrans.com`. Jangan commit key ke repository.

Payment pending yang melewati `expired_at` ditutup setiap menit:

```powershell
php artisan payments:expire
```

### Payment dashboard

- `GET /payments`
- `GET /payments/{payment}`

Endpoint list/detail bersifat tenant-safe. Filter list: `partner_id` untuk Super Admin, `gateway`, `status`, `search` reference, `sort`, `direction`, dan `per_page`.

Cash dan QRIS Midtrans sudah dapat dibuat dari desktop. QRIS hanya tersedia ketika kredensial Midtrans dikonfigurasi; callback tersignature menjadi sumber transisi status gateway.

### Expiry voucher otomatis

```powershell
php artisan vouchers:expire
```

Command mengubah voucher `unused` yang melewati `expired_at` menjadi `expired` dan dijadwalkan setiap jam.

## Booth API

### Bentuk booth

```json
{
  "id": 1,
  "name": "Main Booth",
  "location": "Jakarta",
  "status": "active",
  "created_at": "2026-08-06T10:00:00.000000Z",
  "partner": {
    "id": 4,
    "company_name": "PT Example",
    "brand_name": "Example Booth"
  },
  "devices_count": 1
}
```

`devices_count` tersedia pada response list. Status: `active`, `maintenance`, atau `inactive`.

### List booth

`GET /booths`

Query: `search`, `status`, `partner`, `sort`, `direction`, `per_page`, dan `page`.

- `sort`: `id`, `name`, atau `created_at`.
- Filter `partner` hanya diterapkan untuk Super Admin.
- User non-Super Admin hanya menerima booth tenant sendiri.

### Detail booth

`GET /booths/{booth}`

Response `200`: `{ "data": <booth> }`.

### Buat booth

`POST /booths`

```json
{
  "partner_id": 4,
  "name": "Main Booth",
  "location": "Jakarta",
  "status": "active"
}
```

- `partner_id` wajib untuk Super Admin.
- User partner selalu membuat booth pada tenant sendiri.
- Partner wajib memiliki subscription aktif dan belum mencapai `max_booths`.

### Ubah booth

`PUT /booths/{booth}`

```json
{
  "name": "Main Booth Updated",
  "location": "Bandung",
  "status": "maintenance",
  "partner_id": 4
}
```

`partner_id` opsional dan hanya dapat diterapkan oleh Super Admin.

### Hapus booth

`DELETE /booths/{booth}`

Menggunakan soft delete. Ditolak `422` jika booth masih memiliki perangkat terdaftar.

## Master Configuration API

Master configuration terdiri dari template, filter, camera profile, dan printer profile.

- `partner_id = null` berarti global asset.
- Partner dapat melihat global asset dan asset tenant sendiri.
- Partner tidak dapat mengubah atau menghapus global asset.
- Super Admin dapat membuat global asset atau menentukan `partner_id`.
- Create selalu memakai `version = 1`.
- Setiap update menaikkan `version` secara otomatis.
- Field `version` tidak dikirim pada request.
- Update master tidak pernah mengubah snapshot event yang sudah dibuat.

Query list yang tersedia untuk keempat modul:

| Field | Keterangan |
| --- | --- |
| `search` | Pencarian nama configuration. |
| `scope` | `global` atau `partner`. |
| `partner_id` | Filter tenant; hanya diterapkan untuk Super Admin. |
| `status` | Filter khusus template. |
| `is_active` | Filter khusus filter/camera/printer. |
| `sort` | `id`, `created_at`, `updated_at`, atau `version`. |
| `direction` | `asc` atau `desc`. |
| `per_page` | Integer `5` sampai `100`. |
| `page` | Nomor halaman. |

List menggunakan response pagination dashboard. Detail/create/update menggunakan `{ "data": <resource> }`. Delete menggunakan envelope sukses.

### Template

Routes: `/templates` dan `/templates/{template}`.

Request create/update:

```json
{
  "partner_id": null,
  "name": "Classic 4 Frame",
  "preview_path": "templates/classic-preview.jpg",
  "thumbnail_path": "templates/classic-thumb.jpg",
  "json_layout": {
    "canvas": { "width": 1200, "height": 1800 },
    "frames": [
      { "x": 100, "y": 100, "width": 1000, "height": 350 }
    ]
  },
  "psd_path": null,
  "png_path": "templates/classic-overlay.png",
  "status": "published"
}
```

Kontrak `json_layout` yang digunakan aplikasi desktop:

| Field | Keterangan |
| --- | --- |
| `canvas.width`, `canvas.height` | Ukuran pixel hasil final. Desktop memakai fallback `1200x1800` jika tidak valid. |
| `canvas.background` | Warna latar CSS, opsional; default putih. |
| `frames` | Array slot foto dalam urutan capture. |
| `frames[].x`, `frames[].y` | Posisi kiri dan atas slot dalam pixel canvas. |
| `frames[].width`, `frames[].height` | Ukuran slot dalam pixel. Foto menggunakan crop `cover` dari bagian tengah. |
| `layout` | Opsional: `grid` atau `strip`, digunakan untuk fallback bila koordinat slot tidak lengkap. |

Jika `png_path` tersedia, Electron menggambar PNG tersebut di atas seluruh foto sebagai overlay terakhir. Asset relatif diselesaikan melalui `/storage/{png_path}` dan diambil oleh Electron main process agar pemuatan canvas tidak bergantung pada CORS browser. URL asset harus menggunakan HTTP/HTTPS, berasal dari origin `MAIN_VITE_API_URL`, mengembalikan MIME `image/*`, dan berukuran maksimal 30 MB. Layout lama yang tidak mempunyai ukuran frame tetap dapat dipakai melalui fallback grid/strip, tetapi template produksi sebaiknya selalu mengirim canvas dan koordinat lengkap.

Status: `draft`, `published`, atau `archived`. Hanya template `published` yang dapat digunakan untuk membuat event.

Resource:

```json
{
  "id": 1,
  "partner": null,
  "is_global": true,
  "name": "Classic 4 Frame",
  "preview_path": "templates/classic-preview.jpg",
  "thumbnail_path": "templates/classic-thumb.jpg",
  "json_layout": {},
  "psd_path": null,
  "png_path": "templates/classic-overlay.png",
  "version": 1,
  "status": "published",
  "created_at": "2026-08-06T10:00:00.000000Z",
  "updated_at": "2026-08-06T10:00:00.000000Z"
}
```

### Filter

Routes: `/filters` dan `/filters/{filter}`.

```json
{
  "partner_id": null,
  "name": "Warm",
  "lut_path": "filters/warm.cube",
  "brightness": 5,
  "contrast": 3,
  "saturation": 8,
  "sharpness": 2,
  "white_balance": 5,
  "intensity": 100,
  "is_active": true
}
```

`brightness`, `contrast`, `saturation`, `sharpness`, dan `white_balance` menerima nilai `-100` sampai `100`. `intensity` menerima `0` sampai `100`. Resource menambahkan `id`, `partner`, `is_global`, `version`, `created_at`, dan `updated_at`.

### Camera profile

Routes: `/camera-profiles` dan `/camera-profiles/{camera_profile}`.

```json
{
  "partner_id": null,
  "name": "Canon R100 Indoor",
  "iso": "400",
  "shutter_speed": "1/125",
  "aperture": "f/5.6",
  "white_balance": "Auto",
  "exposure": "0",
  "focus_mode": "AF",
  "countdown_seconds": 3,
  "burst_count": 4,
  "image_quality": "JPEG",
  "live_view": true,
  "is_active": true
}
```

`countdown_seconds` menerima `0` sampai `60`; `burst_count` menerima `1` sampai `20`. Resource menambahkan metadata partner, global scope, version, dan timestamps.

### Printer profile

Routes: `/printer-profiles` dan `/printer-profiles/{printer_profile}`.

```json
{
  "partner_id": null,
  "printer_name": "DNP DS620",
  "copies": 1,
  "paper_size": "4x6",
  "orientation": "portrait",
  "auto_print": true,
  "border": false,
  "bleed": 0,
  "delay_ms": 0,
  "is_active": true
}
```

`orientation`: `portrait` atau `landscape`. `copies` menerima `1` sampai `20`; `delay_ms` menerima `0` sampai `60000`. Resource menambahkan metadata partner, global scope, version, dan timestamps.

## Event API

Event menyimpan salinan immutable dari empat master configuration. Perubahan template/filter/profile setelah event dibuat tidak mengubah configuration event lama.

### List event

`GET /events`

Query:

| Field | Keterangan |
| --- | --- |
| `search` | Pencarian `event_name` atau `event_code`. |
| `status` | `draft`, `scheduled`, `ongoing`, `completed`, `cancelled`. |
| `booth_id` | Filter booth. |
| `partner_id` | Filter partner; hanya Super Admin. |
| `date_from`, `date_to` | Rentang `event_date`. |
| `sort` | `event_date`, `event_name`, `created_at`, atau `status`. |
| `direction` | `asc` atau `desc`. |
| `per_page` | Integer `5` sampai `100`. |

User partner hanya menerima event tenant sendiri.

### Buat event

`POST /events`

```json
{
  "booth_id": 1,
  "event_name": "Wedding John & Jane",
  "template_id": 1,
  "filter_id": 1,
  "camera_profile_id": 1,
  "printer_profile_id": 1,
  "event_date": "2026-08-20",
  "start_time": "10:00",
  "end_time": "18:00",
  "price": 50000,
  "print_count_limit": 2,
  "status": "scheduled"
}
```

Aturan bisnis:

- Partner event selalu berasal dari booth; client tidak mengirim `partner_id`.
- Booth harus dapat diakses user.
- Partner booth harus memiliki subscription aktif.
- Configuration harus global atau milik partner booth.
- Template harus `published`; filter/camera/printer harus aktif.
- `status` create hanya `draft` atau `scheduled`; default `draft`.
- `event_code` dibuat backend dalam bentuk `EVT-XXXXXXXX`.

Response event mencakup `configuration` snapshot:

```json
{
  "data": {
    "id": 10,
    "event_name": "Wedding John & Jane",
    "event_code": "EVT-AB12CD34",
    "event_date": "2026-08-20T00:00:00.000000Z",
    "start_time": "10:00:00",
    "end_time": "18:00:00",
    "price": 50000,
    "print_count_limit": 2,
    "status": "scheduled",
    "partner": { "id": 4, "company_name": "PT Example" },
    "booth": { "id": 1, "name": "Main Booth" },
    "created_by": { "id": 2, "name": "Administrator" },
    "configuration": {
      "template": {},
      "filter": {},
      "camera": {},
      "printer": {}
    }
  }
}
```

Snapshot berisi nilai master pada saat event dibuat, termasuk `version` sumbernya.

### Detail event

`GET /events/{event}`

Mengembalikan resource event beserta seluruh snapshot configuration.

### Ubah event

`PUT/PATCH /events/{event}`

```json
{
  "event_name": "Wedding Updated",
  "event_date": "2026-08-20",
  "start_time": "11:00",
  "end_time": "19:00",
  "price": 75000,
  "print_count_limit": 3,
  "status": "ongoing"
}
```

Update hanya mengubah metadata/lifecycle event. ID master configuration tidak diterima sehingga snapshot tidak dapat dimutasi melalui endpoint ini.

### Hapus event

`DELETE /events/{event}`

Menggunakan soft delete. Ditolak `422` jika event sudah memiliki photo session. Snapshot tidak ikut dihapus.

## Desktop API

API desktop memakai token user operator. Device UUID bukan token autentikasi; UUID digunakan untuk mengikat request dengan perangkat aktif, partner, booth, dan operator.

### Unduh event configuration

`GET /desktop/events/{eventCode}/configuration`

Operator memasukkan `event_code`; desktop mengirim bearer token dan `X-Device-UUID`. Event hanya ditemukan jika:

- Device aktif dan terhubung ke booth aktif.
- Device, user, dan event berada pada partner yang sama.
- Event terhubung ke booth device.
- Status event `scheduled` atau `ongoing`.

Response `200`:

```json
{
  "success": true,
  "message": "Event configuration loaded.",
  "data": {
    "event": {
      "id": 10,
      "event_name": "Wedding John & Jane",
      "event_code": "EVT-AB12CD34",
      "status": "scheduled",
      "event_date": "2026-08-20T00:00:00.000000Z",
      "start_time": "10:00:00",
      "end_time": "18:00:00",
      "price": 50000,
      "print_count_limit": 2,
      "partner": { "id": 4, "company_name": "PT Example" },
      "booth": { "id": 1, "name": "Main Booth" }
    },
    "template": {},
    "filter": {},
    "camera": {},
    "printer": {}
  }
}
```

Data template/filter/camera/printer berasal dari snapshot event, bukan master configuration terbaru.

### Verifikasi perangkat

`POST /desktop/devices/verify`

Request:

```json
{
  "device_uuid": "11111111-1111-4111-8111-111111111111"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Perangkat berhasil diverifikasi.",
  "data": {
    "id": 1,
    "device_key": "desktop-test-device",
    "device_uuid": "11111111-1111-4111-8111-111111111111",
    "device_name": "Desktop Test Device",
    "status": "active",
    "app_version": "1.0.0",
    "last_sync_at": null,
    "last_login_at": null,
    "partner": {
      "id": 4,
      "company_name": "Desktop Test Partner"
    },
    "booth": {
      "id": 1,
      "name": "Desktop Test Booth"
    }
  }
}
```

- Tidak ditemukan: `404`.
- Status `pending`, `blocked`, atau `revoked`: `403`.
- Identifier perangkat sensitif seperti Windows UUID, CPU identifier, dan MAC address tidak dikirim kembali.

### Aktivasi perangkat

`POST /desktop/devices/activate`

Endpoint ini dipanggil Electron sebelum login operator. Kode aktivasi dibuat oleh partner dari endpoint manajemen device, hanya berlaku sekali, dan kedaluwarsa setelah 30 menit.

Request:

```json
{
  "activation_code": "PB-ABCD-EFGH",
  "device_uuid": "11111111-1111-4111-8111-111111111111",
  "windows_uuid": "windows-uuid",
  "cpu_identifier": "cpu-id",
  "mac_address": "00:00:00:00:00:01",
  "app_version": "1.0.0"
}
```

Response `200` mengembalikan `DeviceResource` dengan status `active`. Setelah aktivasi berhasil, kode dihapus sehingga tidak bisa dipakai ulang. Kode invalid, kedaluwarsa, booth tidak aktif, subscription tidak aktif, atau UUID komputer yang sudah dipakai dikembalikan sebagai `422`.

Alur startup Electron adalah: restore fingerprint → `verify` → tampilkan halaman aktivasi bila `404` (belum terdaftar) → login → bootstrap. Error `403` (blocked/revoked/inactive) dan error jaringan tetap ditampilkan sebagai error dan tidak dialihkan ke halaman aktivasi.

Sampai UI manajemen device tersedia di dashboard, pending device dan kode aktivasi dapat dibuat melalui command backend yang menjalankan service serta limit subscription produksi yang sama:

```powershell
php artisan device:issue-activation desktop-test-partner 1 "Booth Laptop"
```

Argumen pertama menerima partner ID atau slug, argumen kedua adalah booth ID aktif, dan argumen ketiga adalah nama device. UUID tidak diberikan pada command; UUID baru disimpan ketika kode dimasukkan pada Electron.

Untuk device lama yang UUID-nya sudah terisi (misalnya pernah dibuat oleh development seeder), gunakan aksi regenerate yang setara dengan dashboard:

```powershell
php artisan device:regenerate-activation 1
```

Command ini mengosongkan fingerprint lama, mengubah status menjadi `pending`, dan mencetak kode aktivasi baru. Device tetap dimiliki partner dan booth yang sama; login tidak memindahkan kepemilikan device antar-partner.

### Heartbeat perangkat

`POST /desktop/devices/heartbeat`

Heartbeat membutuhkan bearer token operator dan header `X-Device-UUID`. Electron mengirimnya secara berkala setelah login untuk memperbarui `last_sync_at` dan versi aplikasi perangkat.

Request body opsional:

```json
{
  "app_version": "1.2.3"
}
```

Response `200` mengembalikan `DeviceResource`. Selain status lifecycle (`active`, `blocked`, atau `revoked`), resource memiliki:

- `presence_status`: `online` jika heartbeat terakhir maksimal 120 detik, `stale` jika lebih lama tetapi belum melewati 15 menit, dan `offline` setelah itu atau jika device tidak aktif.
- `presence_age_seconds`: umur heartbeat terakhir dalam detik, atau `null` jika belum pernah ada heartbeat.

Ambang tersebut dapat diubah melalui `DEVICE_ONLINE_AFTER_SECONDS` dan `DEVICE_OFFLINE_AFTER_SECONDS`. Interval heartbeat Electron saat ini adalah 60 detik.

Heartbeat lintas tenant, device tidak aktif, booth tidak aktif, atau header yang hilang ditolak; heartbeat gagal tidak menghapus sesi lokal desktop agar booth tetap dapat berjalan offline sementara.

### Bootstrap desktop

`GET /desktop/bootstrap`

Header `Authorization` dan `X-Device-UUID` wajib. Device harus aktif, dimiliki partner user, dan terhubung ke booth aktif.

Response `200`:

```json
{
  "success": true,
  "message": "Bootstrap berhasil dimuat.",
  "data": {
    "user": {},
    "device": {},
    "partner": {},
    "booth": {},
    "application": {
      "current_version": "1.0.0",
      "minimum_version": "1.0.0"
    },
    "server": {
      "time": "2026-08-06T10:00:00.000000Z"
    }
  }
}
```

Object `user`, `device`, `partner`, dan `booth` memakai bentuk resource pada bagian sebelumnya.

### Mulai photo session

`POST /desktop/photo-sessions`

Header `Authorization` dan `X-Device-UUID` wajib.

Request dapat kosong:

```json
{}
```

Atau menyertakan referensi opsional:

```json
{
  "event_id": 10,
  "customer_id": 20,
  "payment_id": 30
}
```

- Event harus berada pada partner dan booth perangkat.
- Customer harus global (`partner_id = null`) atau milik partner perangkat.
- Payment harus milik partner perangkat.

Response `201`:

```json
{
  "success": true,
  "message": "Photo session created.",
  "data": {
    "id": 100,
    "partner_id": 4,
    "booth_id": 1,
    "device_id": 1,
    "operator_id": 2,
    "event_id": null,
    "customer_id": null,
    "payment_id": null,
    "status": "started",
    "download_token": "64-character-random-token",
    "started_at": "2026-08-06T10:00:00.000000Z",
    "completed_at": null
  }
}
```

### Upload media session

`POST /desktop/photo-sessions/{photoSession}/media`

```json
{
  "type": "original",
  "filename": "raw-01.png",
  "mime_type": "image/png",
  "data_url": "data:image/png;base64,iVBORw0KGgoAAA...",
  "width": 1920,
  "height": 1080,
  "duration_seconds": null
}
```

Aturan field:

| Field | Aturan |
| --- | --- |
| `type` | `original`, `edited`, `template`, `gif`, `video`, `thumbnail`, `ai_generated`. |
| `filename` | Maksimal 255 karakter dan tidak boleh berisi slash/backslash. |
| `mime_type` | `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `video/mp4`, `application/zip`. |
| `data_url` | Data URL base64, maksimal 30.000.000 karakter. MIME harus sama dengan `mime_type`. |
| `width`, `height` | Integer positif, opsional. |
| `duration_seconds` | Angka minimal 0, opsional. |

Session harus berstatus `started`, dibuat oleh operator yang sedang login, dan berasal dari device yang sama.

Response `201`:

```json
{
  "success": true,
  "message": "Media uploaded.",
  "data": {
    "id": 200,
    "photo_session_id": 100,
    "type": "original",
    "filename": "raw-01.png",
    "mime_type": "image/png",
    "size_bytes": 125000,
    "checksum": "sha256-hex-value",
    "width": 1920,
    "height": 1080,
    "duration_seconds": null,
    "visibility": "private"
  }
}
```

Media disimpan melalui `MediaStorage` pada disk yang ditentukan `MEDIA_DISK`. Development menggunakan disk Laravel `local`; konfigurasi production dapat diarahkan ke disk S3-compatible Cloudflare R2. Object key internal tetap berbentuk `sessions/{session_id}/...`. `bucket` dan `object_key` tidak dikirim ke desktop atau gallery agar lokasi storage tidak menjadi kontrak publik.

Alur Electron mengunggah setiap capture terfilter sebagai `edited`, lalu hasil gabungan canvas, slot foto, dan overlay PNG sebagai:

```json
{
  "type": "template",
  "filename": "final-composite.png",
  "mime_type": "image/png",
  "data_url": "data:image/png;base64,iVBORw0KGgoAAA...",
  "width": 1200,
  "height": 1800
}
```

### Selesaikan photo session

`POST /desktop/photo-sessions/{photoSession}/complete`

Body kosong. Header `Authorization` dan `X-Device-UUID` wajib.

Response `200` mengembalikan photo session berstatus `completed`, `completed_at`, dan array `media`:

```json
{
  "success": true,
  "message": "Photo session completed.",
  "data": {
    "id": 100,
    "status": "completed",
    "completed_at": "2026-08-06T10:05:00.000000Z",
    "gallery": {
      "url": "http://localhost/api/v1/gallery/64-character-random-token",
      "expires_at": "2026-09-05T10:05:00.000000Z"
    },
    "media": [
      {
        "id": 200,
        "photo_session_id": 100,
        "type": "original",
        "filename": "raw-01.png",
        "mime_type": "image/png",
        "size_bytes": 125000,
        "checksum": "sha256-hex-value",
        "width": 1920,
        "height": 1080,
        "duration_seconds": null,
        "visibility": "private"
      }
    ]
  }
}
```

Completion bersifat idempotent: request complete dapat diulang dengan aman dan tetap mengembalikan session `completed`. Pada completion pertama backend membuat satu `download_tokens` record dengan TTL default 30 hari. Session yang sudah selesai tidak menerima media baru. Upload ulang dengan kombinasi session, type, filename, dan checksum yang sama mengembalikan media yang sudah ada tanpa membuat duplikasi.

## Public Gallery dan Download

### Membuka gallery

`GET /gallery/{token}`

Endpoint tidak membutuhkan login. Token hanya aktif untuk photo session `completed` dan sebelum `expires_at`. Token kedaluwarsa menghasilkan `410 Gone`. Setiap tampilan valid dicatat di `gallery_views` menggunakan IP, user agent, dan waktu akses.

```json
{
  "success": true,
  "message": "Gallery retrieved.",
  "data": {
    "session_id": 100,
    "completed_at": "2026-08-06T10:05:00.000000Z",
    "expires_at": "2026-09-05T10:05:00.000000Z",
    "media": [
      {
        "id": 200,
        "type": "template",
        "filename": "final-composite.png",
        "mime_type": "image/png",
        "size_bytes": 125000,
        "width": 1200,
        "height": 1800,
        "download_url": "http://localhost/api/v1/gallery/{token}/media/200"
      }
    ]
  }
}
```

Response tidak pernah menyertakan `bucket` atau `object_key`.

### Download media gallery

`GET /gallery/{token}/media/{media}`

Backend memastikan media berada di session yang dimiliki token, kemudian melakukan streaming file dari private storage. Download yang valid menaikkan `download_count` dan memperbarui `last_download_at`. Header menggunakan nama file dan MIME type yang tersimpan. Rate limit default adalah 60 request gallery dan 30 download per menit per client.

Konfigurasi:

```dotenv
MEDIA_DISK=local
MEDIA_BUCKET=local
GALLERY_TOKEN_TTL_DAYS=30
```

Untuk R2, arahkan `MEDIA_DISK` ke disk S3-compatible yang telah dikonfigurasi dengan endpoint, bucket, dan kredensial R2. File tetap private dan dilayani melalui endpoint Laravel; tidak ada URL object permanen di database.

Driver `league/flysystem-aws-s3-v3` sudah terpasang dan disk `r2` tersedia. Contoh konfigurasi:

```dotenv
MEDIA_DISK=r2
MEDIA_BUCKET=nama-bucket-r2

R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=nama-bucket-r2
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_REGION=auto
R2_USE_PATH_STYLE_ENDPOINT=true
```

Sesudah mengubah `.env`, bersihkan cache dan validasi koneksi tanpa mengunggah file permanen:

```powershell
php artisan config:clear
php artisan media:storage-check
```

Command hanya memeriksa konfigurasi dan melakukan operasi `exists` terhadap key health-check yang tidak dibuat. Kredensial tidak ditampilkan pada output.

## Reporting dan Audit

Endpoint report berada di bawah autentikasi Sanctum:

- `GET /reports/daily` dan `GET /reports/monthly` membatasi partner user ke tenant sendiri; Super Admin dapat memakai `partner_id`.
- `GET /reports/admin/daily` hanya untuk Super Admin.
- `GET /audit-logs` hanya untuk Super Admin dan mendukung filter `partner_id` serta `action`.

Agregasi dijalankan scheduler dan dapat dipicu manual:

```powershell
php artisan reports:aggregate-daily 2026-08-12
php artisan reports:aggregate-monthly 2026 8
```

Login/logout, pembayaran, redeem voucher, upload media, dan download gallery menghasilkan audit log. Metadata sensitif seperti password, token, activation code, signature, dan raw gateway response tidak disimpan.

## Security Hardening

- Login dan aktivasi device memakai rate limiter terpisah yang dapat dikonfigurasi melalui `LOGIN_RATE_LIMIT_PER_MINUTE` dan `ACTIVATION_RATE_LIMIT_PER_MINUTE`.
- Token Sanctum memiliki expiry eksplisit melalui `SANCTUM_TOKEN_EXPIRATION_MINUTES` (default 1440 menit).
- Login ulang mencabut token sebelumnya untuk client yang sama (`web` atau UUID desktop yang sama).
- Suite test memakai database MySQL khusus `photobooth_testing`; jangan arahkan konfigurasi test ke database development/production.

## Platform Credential Settings

Seluruh endpoint berikut membutuhkan Sanctum dan role Super Admin. Endpoint perubahan/test dibatasi 10 request per menit.

### Midtrans

- `GET /platform-settings/midtrans`
- `PUT /platform-settings/midtrans`
- `POST /platform-settings/midtrans/test`
- `DELETE /platform-settings/midtrans` menghapus override database dan kembali ke `.env`

Payload update:

```json
{
  "merchant_id": "G812345678",
  "client_key": "SB-Mid-client-...",
  "server_key": "SB-Mid-server-...",
  "production": false,
  "qris_enabled": true,
  "timeout": 15
}
```

`client_key` dan `server_key` boleh tidak dikirim ketika hanya mengubah environment/toggle; nilai terenkripsi sebelumnya dipertahankan. Response tidak pernah mengembalikan key asli, hanya nilai masked, flag `configured`, `source=database|environment`, dan `notification_url` yang harus didaftarkan pada dashboard Midtrans. Tombol Test Connection memakai credential yang sudah tersimpan.

### Cloudflare R2

- `GET /platform-settings/r2`
- `PUT /platform-settings/r2`
- `POST /platform-settings/r2/test`
- `DELETE /platform-settings/r2` menghapus override database dan kembali ke `.env`

Payload update:

```json
{
  "access_key_id": "...",
  "secret_access_key": "...",
  "bucket": "photobooth-media",
  "endpoint": "https://ACCOUNT_ID.r2.cloudflarestorage.com",
  "region": "auto",
  "use_path_style_endpoint": true,
  "enabled": true
}
```

Access key dan secret bersifat write-only dan terenkripsi menggunakan `APP_KEY`. Test koneksi melakukan operasi `exists` pada health-check key yang tidak dibuat. Mengaktifkan R2 mengarahkan upload baru ke bucket tersebut; media lama tetap dibaca berdasarkan bucket yang tersimpan pada record media sehingga perpindahan tidak memutus gallery atau printing lama.

Jangan simpan secret pada state persisten browser, `localStorage`, source frontend, analytics, atau log. Setelah update berhasil, frontend harus mengganti field secret dengan nilai kosong dan hanya menampilkan status/masked value dari response API.

## Route Belum Aktif

## Printing

Printer management requires the `printers.*` permissions:

- `GET|POST /printers`
- `GET|PUT|DELETE /printers/{printer}`

Print jobs require the `print_jobs.*` permissions. A completed photo session can create one idempotent queued job:

- `GET|POST /print-jobs`
- `GET /print-jobs/{printJob}`
- `POST /print-jobs/{printJob}/transition`
- `POST /print-jobs/{printJob}/retry` (failed jobs only)

The desktop queue is device-bound:

- `GET /desktop/print-jobs` with `X-Device-UUID` atomically claims queued jobs and returns them as `printing` (default one job per poll)
- `POST /desktop/print-jobs/{printJob}/status` with `status=printing|success|failed`
- `GET /desktop/print-jobs/{printJob}/media` streams the private final template media

Print status transitions are monotonic: `queued -> printing -> success|failed`, `queued -> cancelled`, and `failed -> queued` for retry. A failed transition requires `error_log`. Desktop polling only claims jobs whose printer is explicitly assigned to that device. Repeating `status=printing` renews the desktop lease; a lease older than `PRINT_JOB_LEASE_SECONDS` is returned to the queue and may be claimed again.

When a session with final `template`/`edited` media is completed, the backend automatically creates one idempotent print job if its immutable printer snapshot has `auto_print=true` and an active printer is assigned to the session device. `copies` comes from the immutable printer snapshot. Retrying session completion does not create another job.

The current pricing contract remains event-based: regular payments use `events.price` or an explicit backend-validated amount. Customer package tiers are not yet first-class database records. This does not affect automatic print copies, which are controlled by the event printer snapshot.

Route dashboard untuk pengelolaan gallery/media, role, permission, dan notification belum aktif. Public gallery/download berbasis token sudah aktif, tetapi belum ada halaman customer atau dashboard yang mengonsumsinya. Dashboard payment menyediakan list/detail dan transisi Super Admin, sedangkan pembuatan cash/QRIS dilakukan dari desktop dan status Midtrans diperbarui melalui callback tersignature. Frontend tidak boleh menganggap endpoint lain tersedia sampai didokumentasikan di file ini dan muncul pada `php artisan route:list --path=api`.

## Verifikasi Backend

Suite API berada di:

- `backend/tests/Feature/AuthApiTest.php`
- `backend/tests/Feature/ManagementApiTest.php`
- `backend/tests/Feature/DesktopApiTest.php`
- `backend/tests/Feature/MasterConfigurationApiTest.php`
- `backend/tests/Feature/EventApiTest.php`
- `backend/tests/Feature/PartnerSubscriptionApiTest.php`
- `backend/tests/Feature/CustomerVoucherApiTest.php`
- `backend/tests/Feature/PaymentLifecycleApiTest.php`
- `backend/tests/Feature/MidtransPaymentTest.php`
- `backend/tests/Feature/GalleryApiTest.php`
- `backend/tests/Feature/PrintingApiTest.php`
- `backend/tests/Feature/ReportingAuditTest.php`
- `backend/tests/Feature/SecurityHardeningTest.php`

Suite memakai database MySQL khusus yang dikonfigurasi di `backend/phpunit.xml`:

```powershell
php artisan test
```
