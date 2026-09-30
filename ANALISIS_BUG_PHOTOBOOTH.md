# Laporan Investigasi & Analisis Bug Persisten Photobooth Platform

**Tanggal:** 30 September 2026  
**Repositori:** `FauzanFaiz17/photobooth-platform` (branch `develop`)  
**Analisis Oleh:** Tim Arona & Sensei (Lysander)

---

## 📌 Ringkasan Eksekutif

Berdasarkan laporan adanya kendala/bug persisten pada Photobooth Platform serta penelusuran riwayat commit terakhir (`96d1526` *"perbaikan hubungan kamera"* dan `9d0b758` *"cek email hosting"*), ditemukan **5 temuan teknis** konkret. 

Dua di antaranya merupakan **biang kerok utama** yang saling membingungkan tim pengembang:
1. **Kamera Canon membeku/putus mendadak**: Bukan disebabkan oleh kabel USB goyang atau kamera reboot, melainkan *event handler* EDSDK mendownload satu foto **dua kali berturut-turut**, sehingga panggilan kedua membaca *handle* yang sudah mati (`0x00000061`). Hal ini memicu recovery sesi paksa yang merusak stream *Live View*.
2. **Email link galeri tidak pernah terkirim ke customer**: Masalah bukan pada konfigurasi hosting/SMTP Laravel, melainkan `FinishPage.tsx` di Electron memanggil pembuatan sesi **tanpa menyertakan `customer_id`**, sehingga email customer di database tersimpan `NULL`.

Berikut adalah rincian investigasi mendalam, bukti baris kode, dan rekomendasi perbaikannya.

---

## 🔍 Temuan 1: Kamera Canon Macet / Sesi Di-reset Paksa (Kritis)

### 1. Gejala & Dampak
* Live View kamera Canon tiba-tiba blank / membeku setelah jepret foto.
* Pengaturan ISO/aperture tidak merespons.
* Muncul log error `EDS_ERR_INVALID_HANDLE (0x00000061)`.
* Watchdog Electron mencatat camera service tidak sehat dan me-restart proses berulang kali.

### 2. Akar Masalah (Root Cause)
Terletak pada:
* File: `desktop/electron-app/cameraAPI/src/edsdk_wrapper.py` (baris 465–470)
* File: `desktop/electron-app/cameraAPI/src/camera_manager.py` (baris 526–544)

Saat kamera Canon diset `SaveTo = Host` (disimpan ke PC), EDSDK memicu **dua event berbeda** untuk satu jepretan foto yang sama:
1. `0x00000204` (`kEdsObjectEvent_DirItemCreated`)
2. `0x00000208` (`kEdsObjectEvent_DirItemRequestTransfer`)

Perhatikan implementasi saat ini pada `edsdk_wrapper.py`:
```python
def _on_object_event(event: int, ref: EdsBaseRef, ctx) -> EdsError:
    # kEdsObjectEvent_DirItemRequestTransfer = 0x208
    # kEdsObjectEvent_DirItemCreated = 0x204
    if event in (0x00000208, 0x00000204, 0x00000209) and ref:
        _pending_downloads.append(ref)
    return EDS_ERR_OK
```

Karena kondisi `if event in (0x208, 0x204, ...)` bernilai `True` untuk kedua event tersebut:
1. Referensi direktori item (`ref`) dimasukkan ke antrean `_pending_downloads` **sebanyak dua kali**.
2. Loop `poll_downloads()` mengambil entri pertama, mendownload file, memanggil `EdsDownloadComplete`, lalu mengeksekusi `_edsdk.EdsRelease(ref)` pada blok `finally`.
3. Loop kemudian memproses entri kedua (yang merujuk pada objek yang sama). Karena objek sudah di-release, fungsi SDK menghasilkan error **`EDS_ERR_INVALID_HANDLE` (`0x61`)**.
4. Di `camera_manager.py`, error `0x61` ditangkap sebagai tanda *"kamera reboot / sesi basi"*, lalu memanggil `_recover_stale_session()`.
5. Akibatnya, sesi koneksi kamera dan live view ditutup paksa di tengah jalan setiap kali selesai jepret foto!

### 3. Bukti Referensi Resmi Canon SDK (`shared/Windows/sample/...`)
Pada contoh resmi Canon SDK C++ (`CameraEventListener.h` baris 26–48) dan C# (`CameraEventListener.cs` baris 27–42):
```cpp
switch (inEvent)
{
case kEdsObjectEvent_DirItemRequestTransfer:
    fireEvent(controller, "download", inRef);
    break;

default:
    // Event selain transfer WAJIB langsung di-release
    if (inRef != NULL)
    {
        EdsRelease(inRef);
    }
    break;
}
```
Event `DirItemCreated` sengaja **diabaikan dan di-release**, hanya `DirItemRequestTransfer` (`0x208`) yang diproses untuk pengunduhan.

### 4. Solusi Perbaikan
Perbarui callback event di `desktop/electron-app/cameraAPI/src/edsdk_wrapper.py`:
```python
def _on_object_event(event: int, ref: EdsBaseRef, ctx) -> EdsError:
    # Hanya antrekan download untuk event DirItemRequestTransfer (0x208)
    if event in (0x00000208, 0x00000209) and ref:
        _pending_downloads.append(ref)
    else:
        # Objek dari event lain (misal 0x204 DirItemCreated) wajib dilepas
        # agar reference count tidak bocor dan tidak menimbulkan duplikasi
        if ref:
            try:
                if _edsdk:
                    _edsdk.EdsRelease(ref)
            except Exception:
                pass
    return EDS_ERR_OK
```

---

## 🔍 Temuan 2: Email Galeri Customer Tidak Pernah Masuk (Tinggi)

### 1. Gejala & Dampak
* Pengunjung memasukkan email di halaman *Data Customer*, namun email link galeri tidak pernah sampai ke inbox maupun spam.
* Tim menduga hosting/SMTP bermasalah sehingga menambahkan perintah diagnostik `mail:status` di `backend/routes/console.php`.

### 2. Akar Masalah (Root Cause)
Terletak pada: `desktop/electron-app/src/renderer/src/pages/FinishPage.tsx` (baris 204–215).

Di `CustomerPage.tsx`, data customer disimpan ke state Zustand (`setCustomerId(customer.id)`). Namun di `FinishPage.tsx`, pembuatan sesi foto dilakukan seperti ini:
```typescript
// FinishPage.tsx baris 208
if (!sessionId) {
  const session = await createPhotoSession(eventConfiguration.event.id)
  sessionId = session.id
  ...
}
```

Perhatikan definisi fungsi `createPhotoSession` di `desktop/electron-app/src/renderer/src/api/media.ts`:
```typescript
export async function createPhotoSession(
  eventId: number,
  paymentId?: number,
  customerId?: number
): Promise<RemotePhotoSession>
```

`FinishPage.tsx` **tidak mengirimkan parameter `paymentId` dan `customerId`** dari store!
Akibatnya:
1. Kolom `customer_id` pada tabel `photo_sessions` bernilai `NULL`.
2. Saat sesi ditandai selesai (`complete`), backend Laravel mengecek:
   ```php
   // PhotoSessionService.php baris 178
   if ($photoSession->customer?->email) {
       SendGalleryLinkEmail::dispatch($photoSession->id);
   } else {
       Log::info('[gallery-mail] Tidak diantrekan: sesi tanpa email customer.');
   }
   ```
3. Job pengiriman email dilewati secara diam-diam karena customer dianggap tidak ada.

### 3. Solusi Perbaikan
Di `FinishPage.tsx`:
```typescript
const paymentId = useSessionStore((state) => state.paymentId)
const customerId = useSessionStore((state) => state.customerId)

// Saat createPhotoSession dipanggil:
if (!sessionId) {
  const session = await createPhotoSession(
    eventConfiguration.event.id,
    paymentId ?? undefined,
    customerId ?? undefined
  )
  sessionId = session.id
  ...
}
```

---

## 🔍 Temuan 3: Eksekusi Binary Kamera `main.exe` Gagal pada Clone Baru (Sedang)

### 1. Gejala & Dampak
* Saat repositori di-clone ke perangkat baru dan dijalankan, Electron gagal menyalakan service kamera Python.
* Watchdog Electron mencatat *health check failed* dan melakukan restart proses setiap 10 detik.

### 2. Akar Masalah (Root Cause)
* File: `desktop/electron-app/src/main/index.ts` (baris 158–168)
* File: `desktop/electron-app/cameraAPI/.gitignore`

Di `index.ts`:
```typescript
const exePath = app.isPackaged
  ? join(process.resourcesPath, 'bin', 'main.exe')
  : join(__dirname, '../../cameraAPI/main.exe')
```
Namun di folder `cameraAPI/`, file `main.exe` terdaftar dalam `.gitignore`. File binary yang ter-commit justru bernama `..out-copy.exe`.

### 3. Solusi Perbaikan
1. Berikan fallback pada Electron untuk menjalankan `python run.py` jika `main.exe` belum di-build (sangat memudahkan proses development).
2. Periksa kembali penamaan file build atau dokumentasikan di README bahwa `cameraAPI/build.bat` wajib dijalankan sebelum memulai Electron.

---

## 🔍 Temuan 4: Regex Format Nama File Foto Canon Mismatch (Sedang)

### 1. Gejala & Dampak
* Terkadang muncul error: *"File hasil capture Canon tidak ditemukan dalam 8 detik"* meskipun kamera menjepret foto.

### 2. Akar Masalah (Root Cause)
* File: `desktop/electron-app/src/main/index.ts` (baris 70)
* File: `desktop/electron-app/src/renderer/src/features/camera/components/CameraCapture.tsx` (baris 277)

Fungsi pencari file capture terbaru di `index.ts` memfilter nama file dengan regex:
```typescript
const candidates = entries.filter((name) => /^(capture_|img_).+\.jpe?g$/i.test(name))
```
Perhatikan penggunaan garis bawah (`_`). Namun di `CameraCapture.tsx`, parameter nama file yang dioper saat capture Canon menggunakan tanda hubung strip (`-`):
```typescript
const capture = await window.electron.camera.captureCanon({
  filename: `capture-${String(shotIndex + 1).padStart(2, '0')}.jpg`
})
```
Jika file unduhan Canon sempat di-rename menjadi `capture-01.jpg` lalu user menekan **Ulangi (Retake)**, fungsi fallback `waitForNewestCapture` mengabaikan file tersebut karena regex menolak tanda hubung `-`.

### 3. Solusi Perbaikan
Ubah regex di `desktop/electron-app/src/main/index.ts`:
```typescript
const candidates = entries.filter((name) => /^(capture[_-]|img_).+\.jpe?g$/i.test(name))
```

---

## 🔍 Temuan 5: Whitelist Origin Asset Template di Electron Main Process (Minor/Potensial)

### 1. Gejala & Dampak
* Asset template (PNG overlay) berpotensi gagal dimuat dengan error: *"Origin asset template tidak diizinkan."*

### 2. Akar Masalah (Root Cause)
Di `desktop/electron-app/src/main/index.ts` (baris 94–101):
```typescript
const remoteApiUrl = import.meta.env.MAIN_VITE_API_URL as string | undefined
const rendererApiUrl = (import.meta.env as unknown as Record<string, string | undefined>).VITE_API_URL
const allowedAssetOrigins = new Set(
  [remoteApiUrl, rendererApiUrl]
    .filter((value): value is string => Boolean(value))
    .map((value) => new URL(value).origin)
)
```
Pada build Electron-Vite standar, `import.meta.env.VITE_API_URL` tidak selalu ter-expose ke proses `main` kecuali didefinisikan dengan prefix `MAIN_VITE_`. Jika file asset template dihosting di storage eksternal seperti Cloudflare R2 atau S3 (bukan domain backend langsung), origin URL gambar akan ditolak oleh `allowedAssetOrigins`.

### 3. Solusi Perbaikan
Pastikan origin CDN / Cloudflare R2 juga dimasukkan ke dalam daftar izin (`allowedAssetOrigins`) atau dukung wildcard/konfigurasi URL storage publik di `.env`.

---

## 📋 Checklist Rencana Tindakan (Action Plan)

- [ ] **Prioritas 1 (Kamera):** Edit `desktop/electron-app/cameraAPI/src/edsdk_wrapper.py`, ubah `_on_object_event` agar hanya memproses event `0x00000208` dan melepas (`EdsRelease`) event lainnya.
- [ ] **Prioritas 2 (Email Customer):** Edit `desktop/electron-app/src/renderer/src/pages/FinishPage.tsx`, sertakan `paymentId` dan `customerId` saat pemanggilan `createPhotoSession()`.
- [ ] **Prioritas 3 (Deteksi File):** Sesuaikan regex di `desktop/electron-app/src/main/index.ts` agar mendukung pola `capture-*.jpg` maupun `capture_*.jpg`.
- [ ] **Prioritas 4 (Dev Environment):** Rapikan binary `main.exe` / `..out-copy.exe` atau tambahkan fallback spawn Python di `index.ts`.

---
*Dokumen ini dibuat otomatis oleh Arona untuk mempermudah koordinasi dan investigasi tim developer Photobooth Platform.*
