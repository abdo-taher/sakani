<?php

namespace Tests\Feature;

use App\Models\Amenity;
use App\Models\Category;
use App\Models\Location;
use App\Models\PropertyType;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyRoundTripTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_property_form_fields_round_trip_through_create_and_update(): void
    {
        $rent = Category::create(['name' => 'إيجار', 'slug' => 'rent']);
        $sale = Category::create(['name' => 'بيع', 'slug' => 'sell']);
        PropertyType::create(['category_id' => $rent->id, 'name' => 'شقة']);
        $saleVilla = PropertyType::create(['category_id' => $sale->id, 'name' => 'فيلا']);
        $location = Location::create(['name' => 'الحي الأول']);
        $amenity = Amenity::create(['name' => 'مصعد كهربائي', 'icon' => 'elevator']);
        $tag = Tag::create(['name' => 'موقع مميز', 'slug' => 'prime-location']);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $create = $this->postJson('/api/properties', [
            'title' => 'عقار اختبار العقد الكامل',
            'description' => 'وصف كامل للعقار',
            'price' => 8500,
            'is_negotiable' => true,
            'has_offer' => true,
            'offer_price' => 8000,
            'offer_discount_percentage' => 6,
            'offer_start_date' => '2026-08-21',
            'offer_end_date' => '2026-09-21',
            'offer_title' => 'عرض الاختبار',
            'offer_badge' => 'خصم خاص',
            'operation_type' => 'rent',
            'property_type' => 'apartment',
            'location_id' => $location->id,
            'address_detail' => 'شارع الاختبار، بجوار الجامعة',
            'latitude' => 31.4385,
            'longitude' => 31.6705,
            'area' => 125,
            'rooms' => 2,
            'bathrooms' => 2,
            'floor' => 3,
            'balconies' => 1,
            'finishing' => 'super_lux',
            'furnishing' => 'furnished',
            'audience_type' => 'female_students',
            'status' => 'available',
            'featured' => true,
            'rent_duration' => 'yearly',
            'has_detailed_rooms' => true,
            'amenities' => [$amenity->name],
            'tags' => [$tag->name],
            'rooms_data' => [[
                'name' => 'غرفة 1',
                'description' => 'غرفة مكيفة',
                'price' => 4250,
                'area' => 20,
                'status' => 'reserved',
                'media' => [
                    [
                        'image_url' => 'https://example.com/room.jpg',
                        'image_public_id' => 'rooms/room.jpg',
                        'media_type' => 'image',
                        'is_primary' => true,
                    ],
                    [
                        'image_url' => 'https://example.com/room.mp4',
                        'image_public_id' => 'rooms/room.mp4',
                        'media_type' => 'video',
                    ],
                ],
            ]],
            'uploaded_images' => [[
                'image_url' => 'https://example.com/property.jpg',
                'image_public_id' => 'properties/property.jpg',
                'media_type' => 'image',
                'sort_order' => 0,
                'is_primary' => true,
            ]],
            'video_url' => 'https://example.com/property.mp4',
            'video_public_id' => 'properties/property.mp4',
            'video_thumbnail_url' => 'https://example.com/property-video.jpg',
            'submitter_name' => 'مالك الاختبار',
            'submitter_phone' => '+201000000000',
            'admin_notes' => 'ملاحظة داخلية',
        ]);

        $create->assertCreated()
            ->assertJsonPath('data.operation_type', 'rent')
            ->assertJsonPath('data.property_type.slug', 'apartment')
            ->assertJsonPath('data.address_detail', 'شارع الاختبار، بجوار الجامعة')
            ->assertJsonPath('data.owner_name', 'مالك الاختبار')
            ->assertJsonPath('data.is_negotiable', true)
            ->assertJsonCount(1, 'data.amenities')
            ->assertJsonCount(1, 'data.tags')
            ->assertJsonCount(1, 'data.images')
            ->assertJsonCount(1, 'data.detailed_rooms')
            ->assertJsonPath('data.detailed_rooms.0.status', 'reserved')
            ->assertJsonCount(2, 'data.detailed_rooms.0.room_images');

        $propertyId = $create->json('data.id');
        $roomId = $create->json('data.detailed_rooms.0.id');

        $this->assertDatabaseHas('rooms', [
            'id' => $roomId,
            'property_id' => $propertyId,
            'name' => 'غرفة 1',
            'description' => 'غرفة مكيفة',
            'price' => 4250,
            'area' => 20,
            'status' => 'reserved',
        ]);
        $this->assertDatabaseCount('room_images', 2);

        $roomUpdate = $this->putJson("/api/properties/{$propertyId}", [
            'has_detailed_rooms' => true,
            'replace_rooms' => true,
            'rooms_data' => [[
                'id' => $roomId,
                'name' => 'غرفة ماستر محدثة',
                'description' => 'وصف الغرفة المحدث بالكامل',
                'price' => 5000,
                'area' => 28,
                'status' => 'rented',
                'media' => [[
                    'image_url' => 'https://example.com/room-updated.mp4',
                    'image_public_id' => 'rooms/room-updated.mp4',
                    'media_type' => 'video',
                ]],
            ]],
        ]);

        $roomUpdate->assertOk()
            ->assertJsonCount(1, 'data.detailed_rooms')
            ->assertJsonPath('data.detailed_rooms.0.id', $roomId)
            ->assertJsonPath('data.detailed_rooms.0.name', 'غرفة ماستر محدثة')
            ->assertJsonPath('data.detailed_rooms.0.description', 'وصف الغرفة المحدث بالكامل')
            ->assertJsonPath('data.detailed_rooms.0.price', '5000.00')
            ->assertJsonPath('data.detailed_rooms.0.area', 28)
            ->assertJsonPath('data.detailed_rooms.0.status', 'rented')
            ->assertJsonPath('data.detailed_rooms.0.room_images.0.media_type', 'video')
            ->assertJsonPath('data.detailed_rooms.0.room_images.0.image_url', 'https://example.com/room-updated.mp4');

        $this->assertDatabaseCount('rooms', 1);
        $this->assertDatabaseCount('room_images', 1);
        $this->assertDatabaseHas('rooms', [
            'id' => $roomId,
            'name' => 'غرفة ماستر محدثة',
            'description' => 'وصف الغرفة المحدث بالكامل',
            'price' => 5000,
            'area' => 28,
            'status' => 'rented',
        ]);

        $this->getJson("/api/properties/{$propertyId}")
            ->assertOk()
            ->assertJsonPath('data.address_detail', 'شارع الاختبار، بجوار الجامعة')
            ->assertJsonPath('data.property_type.slug', 'apartment');

        $this->getJson('/api/properties?operation=rent&type=apartment&all_statuses=1')
            ->assertOk()
            ->assertJsonFragment(['id' => $propertyId]);

        $this->putJson("/api/properties/{$propertyId}", [
            'video_url' => 'https://example.com/tour-main.mp4',
            'video_public_id' => 'properties/tour-main.mp4',
            'video_thumbnail_url' => 'https://example.com/tour-thumb.jpg',
            'videos' => [
                [
                    'url' => 'https://example.com/tour-main.mp4',
                    'title' => 'الجولة الرئيسية',
                    'type' => 'walkthrough',
                    'is_primary' => true,
                ],
                [
                    'url' => 'https://example.com/tour-second.mp4',
                    'title' => 'جولة إضافية',
                    'type' => 'walkthrough',
                    'is_primary' => false,
                ],
            ],
        ])->assertOk()
            ->assertJsonCount(2, 'data.videos')
            ->assertJsonPath('data.videos.0.title', 'الجولة الرئيسية');

        $this->assertDatabaseCount('property_images', 3);

        $update = $this->putJson("/api/properties/{$propertyId}", [
            'title' => 'عقار محدث بالكامل',
            'description' => 'وصف محدث',
            'price' => 1500000,
            'is_negotiable' => false,
            'has_offer' => false,
            'offer_price' => null,
            'offer_discount_percentage' => null,
            'offer_start_date' => null,
            'offer_end_date' => null,
            'offer_title' => null,
            'offer_badge' => null,
            'operation_type' => 'sale',
            'property_type' => 'villa',
            'location_id' => $location->id,
            'address_detail' => null,
            'latitude' => 31.5,
            'longitude' => 31.7,
            'area' => 300,
            'rooms' => 5,
            'bathrooms' => 4,
            'floor' => 0,
            'balconies' => 0,
            'finishing' => 'lux',
            'furnishing' => 'unfurnished',
            'audience_type' => 'families',
            'status' => 'sold',
            'featured' => false,
            'rent_duration' => null,
            'has_detailed_rooms' => false,
            'amenities' => [],
            'tags' => [],
            'rooms_data' => [],
            'replace_rooms' => true,
            'uploaded_images' => [],
            'replace_images' => true,
            'video_url' => null,
            'video_thumbnail_url' => null,
            'videos' => [],
            'submitter_name' => null,
            'submitter_phone' => null,
            'admin_notes' => null,
        ]);

        $update->assertOk()
            ->assertJsonPath('data.operation_type', 'sale')
            ->assertJsonPath('data.property_type.id', $saleVilla->id)
            ->assertJsonPath('data.property_type.slug', 'villa')
            ->assertJsonPath('data.address_detail', null)
            ->assertJsonPath('data.owner_name', null)
            ->assertJsonPath('data.has_offer', false)
            ->assertJsonPath('data.is_negotiable', false)
            ->assertJsonCount(0, 'data.amenities')
            ->assertJsonCount(0, 'data.tags')
            ->assertJsonCount(0, 'data.images')
            ->assertJsonCount(0, 'data.detailed_rooms');

        $this->assertDatabaseHas('properties', [
            'id' => $propertyId,
            'category_id' => $sale->id,
            'property_type_id' => $saleVilla->id,
            'title' => 'عقار محدث بالكامل',
            'address' => null,
            'is_negotiable' => false,
            'offer_price' => null,
            'rent_duration' => null,
            'submitter_name' => null,
            'admin_notes' => null,
        ]);

        $this->getJson("/api/properties/{$propertyId}")
            ->assertOk()
            ->assertJsonPath('data.operation_type', 'sale')
            ->assertJsonPath('data.property_type.slug', 'villa')
            ->assertJsonCount(0, 'data.images')
            ->assertJsonCount(0, 'data.detailed_rooms');
    }
}
