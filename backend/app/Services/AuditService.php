<?php

namespace App\Services;

use App\Jobs\RecordAuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditService
{
    public function record(string $action, ?User $user, ?Model $subject, string $description, array $metadata = [], ?int $partnerId = null): void
    {
        RecordAuditLog::dispatch([
            'partner_id' => $partnerId ?? $subject?->partner_id ?? $user?->partner_id,
            'user_id' => $user?->id,
            'action' => $action,
            'subject_type' => $subject ? $subject::class : null,
            'subject_id' => $subject?->getKey(),
            'description' => $description,
            'ip_address' => request()?->ip(),
            'user_agent' => mb_substr((string) request()?->userAgent(), 0, 255),
            'metadata' => $this->sanitize($metadata),
            'created_at' => now(),
        ]);
    }

    private function sanitize(array $metadata): array
    {
        foreach (['password', 'token', 'activation_code', 'signature_key', 'gateway_response'] as $key) {
            unset($metadata[$key]);
        }

        return $metadata;
    }
}
