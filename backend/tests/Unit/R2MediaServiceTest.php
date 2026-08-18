<?php

namespace Tests\Unit;

use App\Services\R2MediaService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class R2MediaServiceTest extends TestCase
{
    public function test_extract_key_from_various_url_formats()
    {
        $service = new R2MediaService();

        // Standard R2 public url
        $url1 = 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/images/sample.jpg';
        $this->assertEquals('sakani/properties/images/sample.jpg', $service->extractKeyFromUrl($url1));

        // Custom domain URL
        $url2 = 'https://media.sakani.site/sakani/locations/loc.jpg';
        $this->assertEquals('sakani/locations/loc.jpg', $service->extractKeyFromUrl($url2));

        // Direct key
        $key1 = 'sakani/rooms/images/room1.webp';
        $this->assertEquals('sakani/rooms/images/room1.webp', $service->extractKeyFromUrl($key1));
    }

    public function test_upload_file_to_storage_disk()
    {
        Storage::fake('r2');
        config(['filesystems.disks.r2.url' => 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev']);

        $service = new R2MediaService();
        $file = UploadedFile::fake()->image('test_prop.jpg', 600, 400);

        $result = $service->uploadImage($file, 'sakani/properties/images');

        $this->assertTrue($result['success']);
        $this->assertStringStartsWith('sakani/properties/images/', $result['key']);
        $this->assertStringStartsWith('https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/images/', $result['url']);

        Storage::disk('r2')->assertExists($result['key']);
    }

    public function test_delete_file_from_storage_disk()
    {
        Storage::fake('r2');
        Storage::disk('r2')->put('sakani/properties/images/delete_me.jpg', 'fake content');

        $service = new R2MediaService();
        $deleted = $service->delete('https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/images/delete_me.jpg');

        $this->assertTrue($deleted);
        Storage::disk('r2')->assertMissing('sakani/properties/images/delete_me.jpg');
    }
}
