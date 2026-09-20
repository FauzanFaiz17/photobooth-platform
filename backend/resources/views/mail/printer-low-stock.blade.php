<x-mail::message>
# Peringatan Stok Cetakan Rendah

Printer **{{ $printerName }}** pada booth **{{ $boothName }}** memiliki stok cetakan yang tinggal sedikit.

<x-mail::panel>
**Sisa Cetakan:** {{ $remainingPrints }} lembar<br>
**Threshold:** {{ $threshold }} lembar<br>
**Partner:** {{ $partnerName }}
</x-mail::panel>

Segera lakukan pengisian ulang kertas printer untuk menghindari terhentinya layanan cetak.

Terima kasih,<br>
{{ config('app.name') }}
</x-mail::message>
