<?php

namespace Tests\Feature;

use App\Mail\GalleryLinkMail;
use App\Models\Booth;
use App\Models\Customer;
use App\Models\Device;
use App\Models\DownloadToken;
use App\Models\Media;
use App\Models\PhotoSession;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

class GalleryApiTest extends ApiTestCase
{
    public function test_completed_session_creates_expiring_gallery_and_streams_private_media(): void
    {
        Storage::fake('local');
        [$operator, $device] = $this->desktopContext();
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->assertCreated()
            ->json('data.id');

        $binary = 'private-gallery-image';
        $mediaId = $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'edited',
                'filename' => 'final-photo.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode($binary),
                'width' => 1200,
                'height' => 1800,
            ])->assertCreated()
            ->json('data.id');

        $completed = $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk()
            ->assertJsonPath('data.status', 'completed');

        $token = $completed->json('data.download_token');

        $this->assertDatabaseHas('download_tokens', [
            'photo_session_id' => $sessionId,
            'token' => $token,
            'download_count' => 0,
        ]);

        $gallery = $this->withHeaders([
            'User-Agent' => 'Gallery API Test',
        ])->getJson("/api/v1/gallery/{$token}")
            ->assertOk()
            ->assertJsonPath('data.session_id', $sessionId)
            ->assertJsonPath('data.media.0.id', $mediaId)
            ->assertJsonPath('data.media.0.filename', 'final-photo.png')
            ->assertJsonMissingPath('data.media.0.object_key')
            ->assertJsonMissingPath('data.media.0.bucket');

        $this->assertStringContainsString(
            "/api/v1/gallery/{$token}/media/{$mediaId}",
            $gallery->json('data.media.0.download_url')
        );
        $this->assertDatabaseCount('gallery_views', 1);

        $download = $this->get("/api/v1/gallery/{$token}/media/{$mediaId}")
            ->assertOk()
            ->assertHeader('content-type', 'image/png')
            ->assertDownload('final-photo.png');

        $this->assertSame($binary, $download->streamedContent());
        $this->assertDatabaseHas('download_tokens', [
            'photo_session_id' => $sessionId,
            'download_count' => 1,
        ]);
        $this->assertNotNull(DownloadToken::firstWhere('token', $token)->last_download_at);
    }

    public function test_gallery_rejects_expired_tokens_and_media_from_another_session(): void
    {
        Storage::fake('local');
        $first = $this->completedSession('first');
        $second = $this->completedSession('second');

        $firstToken = DownloadToken::where('photo_session_id', $first->id)->firstOrFail();
        $secondMedia = Media::where('photo_session_id', $second->id)->firstOrFail();

        $this->getJson("/api/v1/gallery/{$firstToken->token}/media/{$secondMedia->id}")
            ->assertNotFound();

        $firstToken->update(['expires_at' => now()->subMinute()]);

        $this->getJson("/api/v1/gallery/{$firstToken->token}")
            ->assertStatus(410)
            ->assertJsonPath('message', 'This gallery link has expired.');
    }

    public function test_media_upload_uses_the_configured_r2_compatible_disk(): void
    {
        Storage::fake('r2');
        config()->set('media.disk', 'r2');
        config()->set('media.bucket', 'test-r2-bucket');

        [$operator, $device] = $this->desktopContext('r2');
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->json('data.id');

        $response = $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'template',
                'filename' => 'r2-photo.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('r2-bytes'),
            ])->assertCreated();

        $media = Media::findOrFail($response->json('data.id'));
        $this->assertSame('test-r2-bucket', $media->bucket);
        Storage::disk('r2')->assertExists($media->object_key);
    }

    public function test_media_upload_uses_customer_based_folder_slug(): void
    {
        Storage::fake('local');
        [$operator, $device] = $this->desktopContext('slug');
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $customer = Customer::create([
            'partner_id' => $device->partner_id,
            'name' => 'Budi // Santoso!!',
            'email' => 'budi@example.test',
        ]);

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions', [
                'customer_id' => $customer->id,
            ])->json('data.id');

        $response = $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'edited',
                'filename' => 'slug-photo.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('slug-bytes'),
            ])->assertCreated();

        $media = Media::findOrFail($response->json('data.id'));

        $this->assertMatchesRegularExpression(
            '#^photobooth/gallery-slug/general/name-budi-santoso/#',
            $media->object_key
        );
        $this->assertDatabaseHas('photo_sessions', [
            'id' => $sessionId,
            'folder_slug' => 'name-budi-santoso',
        ]);
    }

    public function test_session_folder_slug_falls_back_to_datetime_without_customer(): void
    {
        Storage::fake('local');
        [$operator, $device] = $this->desktopContext('slugdt');
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->json('data.id');

        $response = $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'edited',
                'filename' => 'slug-dt.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('dt-bytes'),
            ])->assertCreated();

        $media = Media::findOrFail($response->json('data.id'));

        $session = PhotoSession::findOrFail($sessionId);
        $this->assertNotNull(
            $session->folder_slug,
            'Fallback folder slug should be generated from the session start time.'
        );
        $this->assertMatchesRegularExpression(
            '/^\d{8}-\d{6}$/',
            (string) $session->folder_slug
        );
        $this->assertStringContainsString('/general/'.$session->folder_slug.'/', $media->object_key);
    }

    public function test_completing_session_with_customer_email_queues_gallery_email(): void
    {
        Mail::fake();
        Storage::fake('local');
        [$operator, $device] = $this->desktopContext('mail');
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $customer = Customer::create([
            'partner_id' => $device->partner_id,
            'name' => 'Sari Melati',
            'email' => 'sari@example.test',
        ]);

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions', [
                'customer_id' => $customer->id,
            ])->json('data.id');

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'edited',
                'filename' => 'mail-photo.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('mail-bytes'),
            ])->assertCreated();

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk();

        Mail::assertQueued(GalleryLinkMail::class, function ($mail) use ($customer) {
            return $mail->hasTo($customer->email)
                && $mail->envelope()->subject === 'Foto Sesi Photobooth Anda';
        });

        // Completing again (idempotent retry) must not queue a second email.
        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk();

        Mail::assertQueued(GalleryLinkMail::class, 1);
    }

    public function test_completing_session_without_customer_email_sends_nothing(): void
    {
        Mail::fake();
        Storage::fake('local');
        [$operator, $device] = $this->desktopContext('nomail');
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];

        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->json('data.id');

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'edited',
                'filename' => 'nomail-photo.png',
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode('nomail-bytes'),
            ])->assertCreated();

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk();

        Mail::assertNothingQueued();
    }

    private function completedSession(string $suffix): PhotoSession
    {
        [$operator, $device] = $this->desktopContext($suffix);
        Sanctum::actingAs($operator);
        $headers = ['X-Device-UUID' => $device->device_uuid];
        $sessionId = $this->withHeaders($headers)
            ->postJson('/api/v1/desktop/photo-sessions')
            ->json('data.id');

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/media", [
                'type' => 'edited',
                'filename' => "{$suffix}.png",
                'mime_type' => 'image/png',
                'data_url' => 'data:image/png;base64,'.base64_encode($suffix),
            ])->assertCreated();

        $this->withHeaders($headers)
            ->postJson("/api/v1/desktop/photo-sessions/{$sessionId}/complete")
            ->assertOk();

        return PhotoSession::findOrFail($sessionId);
    }

    private function desktopContext(string $suffix = 'gallery'): array
    {
        $partner = $this->createPartner([
            'company_name' => "Gallery {$suffix}",
            'slug' => "gallery-{$suffix}",
            'email' => "gallery-{$suffix}@example.test",
        ]);
        $booth = Booth::create([
            'partner_id' => $partner->id,
            'name' => "Gallery Booth {$suffix}",
            'status' => 'active',
        ]);
        $operator = $this->createOperator($partner, [
            'email' => "gallery-operator-{$suffix}@example.test",
        ]);
        $device = Device::create([
            'partner_id' => $partner->id,
            'booth_id' => $booth->id,
            'device_key' => "gallery-device-{$suffix}",
            'device_uuid' => 'eeeeeeee-eeee-4eee-8eee-'.str_pad(
                (string) (Device::count() + 1),
                12,
                '0',
                STR_PAD_LEFT
            ),
            'device_name' => "Gallery Device {$suffix}",
            'status' => 'active',
        ]);

        return [$operator, $device];
    }
}
