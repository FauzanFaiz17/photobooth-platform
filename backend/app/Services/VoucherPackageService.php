<?php

namespace App\Services;

use App\Models\Template;
use App\Models\User;
use App\Models\VoucherPackage;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VoucherPackageService
{
    public function index(array $filters, User $user): LengthAwarePaginator
    {
        $query = VoucherPackage::query()->withCount('vouchers');

        if ($user->isSuperAdmin()) {
            if (($filters['scope'] ?? null) === 'global') {
                $query->whereNull('partner_id');
            } elseif (($filters['scope'] ?? null) === 'partner') {
                $query->whereNotNull('partner_id');
            }

            if (! empty($filters['partner_id'])) {
                $query->where('partner_id', $filters['partner_id']);
            }
        } else {
            $query->where(function ($nested) use ($user) {
                $nested->whereNull('partner_id')->orWhere('partner_id', $user->partner_id);
            });
        }

        if (array_key_exists('is_active', $filters)) {
            $query->where('is_active', $filters['is_active']);
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'like', "%{$filters['search']}%");
        }

        return $query
            ->orderBy($filters['sort'] ?? 'created_at', $filters['direction'] ?? 'desc')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function store(array $data, User $user): VoucherPackage
    {
        return DB::transaction(function () use ($data, $user) {
            $data['partner_id'] = $user->isSuperAdmin()
                ? ($data['partner_id'] ?? null)
                : $user->partner_id;

            if (! $user->isSuperAdmin() && ! $data['partner_id']) {
                throw ValidationException::withMessages([
                    'partner_id' => 'A partner account is required to create a voucher package.',
                ]);
            }
            $this->validateTemplate($data['template_id'] ?? null, $data['partner_id']);

            return VoucherPackage::create($data)->loadCount('vouchers');
        });
    }

    public function update(VoucherPackage $package, array $data, User $user): VoucherPackage
    {
        return DB::transaction(function () use ($package, $data, $user) {
            $targetPartnerId = $user->isSuperAdmin()
                ? ($data['partner_id'] ?? null)
                : $package->partner_id;
            $this->validateTemplate($data['template_id'] ?? null, $targetPartnerId);
            $data['partner_id'] = $targetPartnerId;
            $package->update($data);

            return $package->fresh()->loadCount('vouchers');
        });
    }

    public function destroy(VoucherPackage $package): void
    {
        if ($package->vouchers()->exists()) {
            throw ValidationException::withMessages([
                'voucher_package' => 'A voucher package already used by vouchers cannot be deleted.',
            ]);
        }

        $package->delete();
    }

    private function validateTemplate(?int $templateId, ?int $partnerId): void
    {
        if (! $templateId) {
            return;
        }

        $valid = Template::query()
            ->whereKey($templateId)
            ->where(function ($query) use ($partnerId) {
                $query->whereNull('partner_id');
                if ($partnerId !== null) {
                    $query->orWhere('partner_id', $partnerId);
                }
            })
            ->exists();

        if (! $valid) {
            throw ValidationException::withMessages([
                'template_id' => 'The template is not available to this voucher package tenant.',
            ]);
        }
    }
}
