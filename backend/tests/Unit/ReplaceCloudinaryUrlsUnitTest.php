<?php

namespace Tests\Unit;

use App\Console\Commands\ReplaceCloudinaryUrls;
use PHPUnit\Framework\TestCase;

class ReplaceCloudinaryUrlsUnitTest extends TestCase
{
    public function test_url_conversion_regex_handles_various_cloudinary_formats()
    {
        $command = new ReplaceCloudinaryUrls();
        $r2Base = 'https://media.sakani.site';

        // 1. Standard image with version
        $url1 = 'https://res.cloudinary.com/mbspzmww/image/upload/v1784878608/sakani/locations/yid3petxmx3oq4weubjj.jpg';
        $this->assertEquals(
            'https://media.sakani.site/sakani/locations/yid3petxmx3oq4weubjj.jpg',
            $command->convertCloudinaryUrlToR2($url1, $r2Base)
        );

        // 2. Video URL with version
        $url2 = 'https://res.cloudinary.com/mbspzmww/video/upload/v1785005701/sakani/properties/videos/oyfo00ok6yysl9kj55g6.mp4';
        $this->assertEquals(
            'https://media.sakani.site/sakani/properties/videos/oyfo00ok6yysl9kj55g6.mp4',
            $command->convertCloudinaryUrlToR2($url2, $r2Base)
        );

        // 3. Image with thumbnail path and version
        $url3 = 'https://res.cloudinary.com/mbspzmww/image/upload/v1785005703/sakani/properties/thumbnails/b22rphtvhwx4k8spwxqw.jpg';
        $this->assertEquals(
            'https://media.sakani.site/sakani/properties/thumbnails/b22rphtvhwx4k8spwxqw.jpg',
            $command->convertCloudinaryUrlToR2($url3, $r2Base)
        );

        // 4. Image with transformations and version
        $url4 = 'https://res.cloudinary.com/mbspzmww/image/upload/w_800,c_fill,q_auto/v123456/sakani/properties/images/photo.png';
        $this->assertEquals(
            'https://media.sakani.site/sakani/properties/images/photo.png',
            $command->convertCloudinaryUrlToR2($url4, $r2Base)
        );

        // 5. Custom R2 Public URL override
        $customBase = 'https://pub-abc123xyz.r2.dev';
        $this->assertEquals(
            'https://pub-abc123xyz.r2.dev/sakani/locations/yid3petxmx3oq4weubjj.jpg',
            $command->convertCloudinaryUrlToR2($url1, $customBase)
        );

        // 6. Non-Cloudinary URL should return null
        $url5 = 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format';
        $this->assertNull($command->convertCloudinaryUrlToR2($url5, $r2Base));
    }
}
