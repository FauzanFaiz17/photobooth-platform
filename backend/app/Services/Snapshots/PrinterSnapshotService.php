<?php

namespace App\Services\Snapshots;

use App\Models\PrinterProfile;
use App\Models\PrinterSnapshot;

class PrinterSnapshotService
{
    public function create(PrinterProfile $printer): PrinterSnapshot
    {
        return PrinterSnapshot::create([
            'printer_profile_id' => $printer->id,
            'printer_name'       => $printer->printer_name,
            'copies'             => $printer->copies,
            'paper_size'         => $printer->paper_size,
            'orientation'        => $printer->orientation,
            'auto_print'         => $printer->auto_print,
            'border'             => $printer->border,
            'bleed'              => $printer->bleed,
            'delay_ms'           => $printer->delay_ms,
            'version'            => $printer->version,
        ]);
    }
}