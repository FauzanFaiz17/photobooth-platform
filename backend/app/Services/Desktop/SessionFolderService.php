<?php

namespace App\Services\Desktop;

use App\Models\PhotoSession;

class SessionFolderService
{
    /**
     * Build a sanitized, human-readable folder label for a photo session.
     *
     * The slug is a display/label only. Session identity and authorization
     * always remain based on the photo session id / download token.
     *
     * Priority: name -> email -> phone. When no customer data exists the
     * slug falls back to the session start date and time.
     */
    public function slugFor(PhotoSession $photoSession): string
    {
        $customer = $photoSession->customer;

        $source = null;

        if ($customer?->name) {
            $source = ['name', $customer->name];
        } elseif ($customer?->email) {
            $source = ['email', $customer->email];
        } elseif ($customer?->phone) {
            $source = ['phone', $customer->phone];
        }

        $label = $source
            ? $this->sanitize($source[1])
            : $photoSession->started_at?->format('Ymd-His') ?? now()->format('Ymd-His');

        return $source
            ? $source[0].'-'.$label
            : $label;
    }

    /**
     * Build the storage folder path for a session's media.
     *
     * Structure: photobooth/{partner-name}/{event-name}/{customer-folder}
     * No technical segments (no "partners/4", "events/1", "sessions/16").
     * Customer sessions without an event use a "general" event folder.
     */
    public function folderPathFor(PhotoSession $photoSession): string
    {
        $partnerSegment = $this->sanitize(
            $photoSession->partner?->company_name ?? 'partner-'.$photoSession->partner_id
        );

        $event = $photoSession->event;
        $eventSegment = $event
            ? $this->sanitize($event->name ?: $event->event_code ?? 'event-'.$event->id)
            : 'general';

        return implode('/', [
            'photobooth',
            $partnerSegment,
            $eventSegment,
            $this->slugFor($photoSession),
        ]);
    }

    /**
     * Keep only filesystem-safe characters and prevent traversal.
     */
    private function sanitize(string $value): string
    {
        $value = mb_strtolower(trim($value));

        $value = preg_replace('/[^\p{L}\p{N}]+/u', '-', $value) ?? '';

        $value = trim($value, '-');

        if ($value === '' || preg_match('/^(\.|\.\.)$/i', $value)) {
            $value = 'session';
        }

        return mb_substr($value, 0, 80);
    }
}
