<?php

namespace App\Services\Snapshots;

use App\Models\Filter;
use App\Models\FilterSnapshot;

class FilterSnapshotService
{
    public function create(Filter $filter): FilterSnapshot
    {
        return FilterSnapshot::create([
            'filter_id'       => $filter->id,
            'name'            => $filter->name,
            'lut_path'        => $filter->lut_path,
            'brightness'      => $filter->brightness,
            'contrast'        => $filter->contrast,
            'saturation'      => $filter->saturation,
            'sharpness'       => $filter->sharpness,
            'white_balance'   => $filter->white_balance,
            'intensity'       => $filter->intensity,
            'version'         => $filter->version,
        ]);
    }
}