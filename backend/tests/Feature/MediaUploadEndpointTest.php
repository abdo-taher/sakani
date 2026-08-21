<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MediaUploadEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_browser_media_upload_is_persisted_and_returns_r2_contract(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        Storage::fake('r2');
        config()->set([
            'filesystems.media_disk' => 'r2',
            'filesystems.disks.r2.key' => 'test-key',
            'filesystems.disks.r2.secret' => 'test-secret',
            'filesystems.disks.r2.bucket' => 'test-bucket',
            'filesystems.disks.r2.endpoint' => 'https://example.r2.cloudflarestorage.com',
            'filesystems.disks.r2.url' => 'https://media.example.com',
        ]);

        $response = $this->post('/api/media/upload', [
            'file' => UploadedFile::fake()->image('property.jpg', 32, 32),
            'folder' => 'sakani/properties/images',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['url', 'key', 'public_id', 'file_path', 'size', 'mime_type']);

        $key = $response->json('key');
        $this->assertSame($key, $response->json('public_id'));
        $this->assertSame($key, $response->json('file_path'));
        $this->assertStringStartsWith('https://media.example.com/sakani/properties/images/', $response->json('url'));
        Storage::disk('r2')->assertExists($key);
    }

    public function test_media_upload_falls_back_to_public_storage_when_r2_is_unconfigured(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        Storage::fake('public');
        config()->set([
            'filesystems.media_disk' => 'r2',
            'filesystems.disks.r2.key' => null,
            'filesystems.disks.r2.secret' => null,
            'filesystems.disks.r2.bucket' => null,
            'filesystems.disks.r2.endpoint' => null,
            'filesystems.disks.r2.url' => null,
        ]);

        $response = $this->post('/api/media/upload', [
            'file' => UploadedFile::fake()->image('property.jpg', 32, 32),
            'folder' => 'sakani/properties/images',
        ], ['Accept' => 'application/json']);

        $response->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('storage_disk', 'public');

        $key = $response->json('key');
        Storage::disk('public')->assertExists($key);
    }
}
