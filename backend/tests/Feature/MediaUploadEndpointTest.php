<?php

namespace Tests\Feature;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaUploadEndpointTest extends TestCase
{
    public function test_browser_media_upload_is_persisted_and_returns_r2_contract(): void
    {
        Storage::fake('r2');
        config()->set([
            'filesystems.media_disk' => 'r2',
            'filesystems.disks.r2.key' => 'test-key',
            'filesystems.disks.r2.secret' => 'test-secret',
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
}
