<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerifyPropertyVideoThumbnailsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_scans_and_fixes_youtube_video_thumbnails(): void
    {
        $category = Category::create(['name' => 'Apartments', 'slug' => 'apartments', 'icon' => 'building']);
        $location = Location::create(['name' => 'Cairo', 'slug' => 'cairo', 'type' => 'city']);
        $propertyType = PropertyType::create(['name' => 'Studio', 'slug' => 'studio', 'category_id' => $category->id]);

        $prop = Property::create([
            'title' => 'شقة بفيو مميز',
            'description' => 'وصف العقار',
            'price' => 5000,
            'rooms' => 2,
            'bathrooms' => 1,
            'area' => 100,
            'floor' => 1,
            'balconies' => 0,
            'finishing' => 'lux',
            'furnishing' => 'furnished',
            'category_id' => $category->id,
            'location_id' => $location->id,
            'property_type_id' => $propertyType->id,
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'video_thumbnail_url' => null,
            'status' => 'available',
        ]);

        $this->artisan('properties:verify-video-thumbnails')
            ->expectsOutputToContain('MISSING_YT_THUMBNAIL')
            ->assertSuccessful();

        $this->artisan('properties:verify-video-thumbnails', ['--fix' => true])
            ->expectsOutputToContain('FIXED_YOUTUBE')
            ->assertSuccessful();

        $prop->refresh();
        $this->assertSame('https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg', $prop->video_thumbnail_url);
    }

    public function test_assigns_property_primary_photo_fallback_when_thumbnail_is_missing(): void
    {
        $category = Category::create(['name' => 'Villas', 'slug' => 'villas', 'icon' => 'home']);
        $location = Location::create(['name' => 'Giza', 'slug' => 'giza', 'type' => 'city']);
        $propertyType = PropertyType::create(['name' => 'Duplex', 'slug' => 'duplex', 'category_id' => $category->id]);

        $prop = Property::create([
            'title' => 'فيلا فاخرة',
            'description' => 'وصف الفيلا',
            'price' => 15000000,
            'rooms' => 4,
            'bathrooms' => 3,
            'area' => 350,
            'floor' => 1,
            'balconies' => 2,
            'finishing' => 'super_lux',
            'furnishing' => 'unfurnished',
            'category_id' => $category->id,
            'location_id' => $location->id,
            'property_type_id' => $propertyType->id,
            'video_url' => 'https://example.com/video.mp4',
            'video_thumbnail_url' => null,
            'status' => 'available',
        ]);

        PropertyImage::create([
            'property_id' => $prop->id,
            'image_url' => 'https://example.com/photos/primary.jpg',
            'image_public_id' => 'photos/primary.jpg',
            'is_primary' => true,
        ]);

        $this->artisan('properties:verify-video-thumbnails', ['--fix' => true])
            ->expectsOutputToContain('FIXED_FALLBACK')
            ->assertSuccessful();

        $prop->refresh();
        $this->assertSame('https://example.com/photos/primary.jpg', $prop->video_thumbnail_url);
    }
}
