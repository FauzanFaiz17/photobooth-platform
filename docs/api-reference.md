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

### Desktop

| Method | Route | Auth | Device header |
| --- | --- | --- | --- |
| `POST` | `/desktop/devices/verify` | Tidak | Tidak |
| `POST` | `/desktop/devices/activate` | Tidak | Tidak |
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

Development storage menggunakan disk Laravel `local` dengan object key internal `sessions/{session_id}/...`. `bucket` dan `object_key` tidak dikirim ke desktop agar lokasi storage tidak menjadi kontrak publik.

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

Completion bersifat idempotent: request complete dapat diulang dengan aman dan tetap mengembalikan session `completed`. Session yang sudah selesai tidak menerima media baru. Upload ulang dengan kombinasi session, type, filename, dan checksum yang sama mengembalikan media yang sudah ada tanpa membuat duplikasi.

## Route Belum Aktif

Route dashboard untuk device, customer, voucher, payment, gallery/media management, report, role, dan permission belum aktif. Frontend tidak boleh menganggap endpoint tersebut tersedia sampai didokumentasikan di file ini dan muncul pada `php artisan route:list --path=api`.

## Verifikasi Backend

Suite API berada di:

- `backend/tests/Feature/AuthApiTest.php`
- `backend/tests/Feature/ManagementApiTest.php`
- `backend/tests/Feature/DesktopApiTest.php`
- `backend/tests/Feature/MasterConfigurationApiTest.php`
- `backend/tests/Feature/EventApiTest.php`

Pada instalasi PHP yang belum mengaktifkan `pdo_sqlite`, suite dapat dijalankan tanpa mengubah `php.ini` menggunakan:

```powershell
php -d extension=pdo_sqlite vendor\bin\phpunit
```
