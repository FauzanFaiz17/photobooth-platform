<?php

namespace App\Contracts;

use App\Models\Payment;

interface PaymentGateway
{
    public function isConfigured(): bool;

    public function createQrisTransaction(Payment $payment): array;

    public function getTransactionStatus(Payment $payment): array;

    public function verifyNotification(array $payload): bool;

    public function notificationStatus(array $payload): ?string;
}
