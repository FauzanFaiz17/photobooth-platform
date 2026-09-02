<x-mail::message>
# Halo {{ $customerName ?? 'Kak' }},

Terima kasih sudah berfoto di photobooth kami! 🎉

Foto hasil sesi Anda sudah siap dan bisa diakses melalui tautan berikut:

<x-mail::button :url="$galleryUrl">
Lihat & Unduh Foto
</x-mail::button>

Tautan ini berlaku sampai **{{ $expiresAt }}**. Setelah tanggal tersebut, tautan akan kedaluwarsa.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
