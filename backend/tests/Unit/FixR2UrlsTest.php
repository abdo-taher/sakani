<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\R2MediaService;
use App\Console\Commands\FixR2MediaUrls;

class FixR2UrlsTest extends TestCase
{
    /**
     * Test R2 key normalization rules
     */
    public function test_r2_key_normalization(): void
    {
        // 1. Input: sakani/locations/a.jpg -> Output: sakani/locations/a.jpg
        $this->assertEquals(
            'sakani/locations/a.jpg',
            R2MediaService::normalizeKey('sakani/locations/a.jpg')
        );

        // 2. Input: sakani/sakani/locations/a.jpg -> Output: sakani/locations/a.jpg
        $this->assertEquals(
            'sakani/locations/a.jpg',
            R2MediaService::normalizeKey('sakani/sakani/locations/a.jpg')
        );

        // 3. Input: sakani/sakani/sakani/properties/videos/a.mp4 -> Output: sakani/properties/videos/a.mp4
        $this->assertEquals(
            'sakani/properties/videos/a.mp4',
            R2MediaService::normalizeKey('sakani/sakani/sakani/properties/videos/a.mp4')
        );

        // 4. Leading slash with double sakani prefix
        $this->assertEquals(
            'sakani/properties/videos/a.mp4',
            R2MediaService::normalizeKey('/sakani/sakani/properties/videos/a.mp4')
        );
    }

    /**
     * Test full public URL normalization
     */
    public function test_full_r2_url_normalization(): void
    {
        config(['filesystems.disks.r2.url' => 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev']);

        // 1. Full URL input with triple sakani
        $this->assertEquals(
            'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/locations/a.jpg',
            R2MediaService::normalizeUrl('https://media.sakani.site/sakani/sakani/sakani/locations/a.jpg')
        );

        // 2. Already-correct URL remains exactly unchanged
        $this->assertEquals(
            'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/locations/a.jpg',
            R2MediaService::normalizeUrl('https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/locations/a.jpg')
        );

        // 3. r2.dev URL with duplicate sakani
        $this->assertEquals(
            'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/videos/a.mp4',
            R2MediaService::normalizeUrl('https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/sakani/properties/videos/a.mp4')
        );

        // 4. Unrelated external URL remains unchanged
        $this->assertEquals(
            'https://example.com/image.jpg',
            R2MediaService::normalizeUrl('https://example.com/image.jpg')
        );
    }

    /**
     * Test publicUrl method
     */
    public function test_public_url_method(): void
    {
        config(['filesystems.disks.r2.url' => 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev']);
        $service = new R2MediaService();

        $this->assertEquals(
            'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/videos/example.mp4',
            $service->publicUrl('sakani/properties/videos/example.mp4')
        );

        // Even with duplicate key
        $this->assertEquals(
            'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/properties/videos/example.mp4',
            $service->publicUrl('sakani/sakani/properties/videos/example.mp4')
        );
    }

    /**
     * Test command recognizes malformed URLs
     */
    public function test_command_detects_malformed_urls(): void
    {
        $command = new FixR2MediaUrls();
        $target = 'https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev';

        $this->assertTrue($command->isMalformedUrl('https://media.sakani.site/sakani/sakani/locations/a.jpg', $target));
        $this->assertTrue($command->isMalformedUrl('https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/sakani/locations/a.jpg', $target));
        $this->assertFalse($command->isMalformedUrl('https://pub-53f4892d4ffe491787baac754cbe0059.r2.dev/sakani/locations/a.jpg', $target));
        $this->assertFalse($command->isMalformedUrl('https://example.com/image.jpg', $target));
    }
}
