<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\Notification;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationDeleteAllAndPropertyMediaTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_all_admin_notifications_without_affecting_customer_notifications(): void
    {
        // Setup admin notifications
        Notification::create([
            'type' => 'inquiry',
            'recipient_type' => 'admin',
            'title' => 'Admin notification 1',
            'message' => 'Test message 1',
            'is_read' => false,
        ]);
        Notification::create([
            'type' => 'inquiry',
            'recipient_type' => 'admin',
            'title' => 'Admin notification 2',
            'message' => 'Test message 2',
            'is_read' => true,
        ]);

        // Setup customer notifications
        Notification::create([
            'type' => 'reservation_confirmed',
            'recipient_type' => 'customer',
            'customer_phone' => '01012345678',
            'title' => 'Customer notification',
            'message' => 'Test message for customer',
            'is_read' => false,
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $response = $this->deleteJson('/api/notifications');
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Admin notifications should be 0
        $this->assertEquals(0, Notification::forAdmin()->count());

        // Customer notification must remain intact
        $this->assertEquals(1, Notification::where('recipient_type', 'customer')->count());
    }

    public function test_customer_can_delete_all_own_notifications_isolated_by_phone(): void
    {
        // Customer A notifications
        Notification::create([
            'type' => 'reservation_accepted',
            'recipient_type' => 'customer',
            'customer_phone' => '01012345678',
            'title' => 'Client A Notif 1',
            'message' => 'Msg 1',
            'is_read' => false,
        ]);
        Notification::create([
            'type' => 'reservation_accepted',
            'recipient_type' => 'customer',
            'customer_phone' => '01012345678',
            'title' => 'Client A Notif 2',
            'message' => 'Msg 2',
            'is_read' => true,
        ]);

        // Customer B notifications
        Notification::create([
            'type' => 'reservation_accepted',
            'recipient_type' => 'customer',
            'customer_phone' => '01198765432',
            'title' => 'Client B Notif',
            'message' => 'Msg B',
            'is_read' => false,
        ]);

        // Admin notification
        Notification::create([
            'type' => 'inquiry',
            'recipient_type' => 'admin',
            'title' => 'Admin Notif',
            'message' => 'Admin Msg',
            'is_read' => false,
        ]);

        // Customer A deletes all using +20 format
        $response = $this->deleteJson('/api/customer/notifications', [
            'phone' => '+201012345678',
        ]);
        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Customer A notifications should be 0
        $this->assertEquals(0, Notification::where('recipient_type', 'customer')->where('customer_phone', '01012345678')->count());

        // Customer B notifications must still be 1
        $this->assertEquals(1, Notification::where('recipient_type', 'customer')->where('customer_phone', '01198765432')->count());

        // Admin notification must still be 1
        $this->assertEquals(1, Notification::forAdmin()->count());
    }

    public function test_property_create_with_image_urls_does_not_fail_file_validation(): void
    {
        $rent = Category::create(['name' => 'إيجار', 'slug' => 'rent']);
        $apartment = PropertyType::create(['category_id' => $rent->id, 'name' => 'شقة']);
        $location = Location::create(['name' => 'الحي الأول']);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $payload = [
            'title' => 'شقة مميزة للإيجار في دمياط الجديدة',
            'description' => 'شقة ممتازة على البحر مباشرة',
            'price' => 5000,
            'operation_type' => 'rent',
            'property_type' => 'apartment',
            'category_id' => $rent->id,
            'property_type_id' => $apartment->id,
            'location_id' => $location->id,
            'rooms' => 3,
            'bathrooms' => 2,
            'area' => 120,
            'images' => [
                'https://r2.sakani.site/sakani/properties/images/img1.webp',
                'https://r2.sakani.site/sakani/properties/images/img2.webp',
            ],
            'uploaded_images' => [
                [
                    'image_url' => 'https://r2.sakani.site/sakani/properties/images/img1.webp',
                    'image_public_id' => 'sakani/properties/images/img1.webp',
                    'media_type' => 'image',
                    'sort_order' => 0,
                    'is_primary' => true,
                ],
                [
                    'image_url' => 'https://r2.sakani.site/sakani/properties/images/img2.webp',
                    'image_public_id' => 'sakani/properties/images/img2.webp',
                    'media_type' => 'image',
                    'sort_order' => 1,
                    'is_primary' => false,
                ],
            ],
        ];

        $response = $this->postJson('/api/properties', $payload);
        $response->assertStatus(201);
        $this->assertDatabaseHas('properties', ['title' => 'شقة مميزة للإيجار في دمياط الجديدة']);
        $this->assertDatabaseHas('property_images', ['image_url' => 'https://r2.sakani.site/sakani/properties/images/img1.webp']);
    }

    public function test_property_update_without_media_changes_succeeds_and_preserves_images(): void
    {
        $rent = Category::create(['name' => 'إيجار', 'slug' => 'rent']);
        $apartment = PropertyType::create(['category_id' => $rent->id, 'name' => 'شقة']);
        $location = Location::create(['name' => 'الحي الأول']);

        $property = Property::create([
            'title' => 'عنوان قديم',
            'description' => 'وصف قديم',
            'price' => 4000,
            'category_id' => $rent->id,
            'property_type_id' => $apartment->id,
            'location_id' => $location->id,
            'rooms' => 2,
            'bathrooms' => 1,
            'status' => 'available',
            'finishing' => 'super_lux',
            'furnishing' => 'unfurnished',
        ]);

        PropertyImage::create([
            'property_id' => $property->id,
            'image_url' => 'https://r2.sakani.site/sakani/properties/images/existing.webp',
            'image_public_id' => 'existing.webp',
            'media_type' => 'image',
            'sort_order' => 0,
            'is_primary' => true,
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        // Update only title
        $response = $this->putJson("/api/properties/{$property->id}", [
            'title' => 'عنوان محدث جديد',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'title' => 'عنوان محدث جديد',
        ]);
        $this->assertDatabaseHas('property_images', [
            'property_id' => $property->id,
            'image_url' => 'https://r2.sakani.site/sakani/properties/images/existing.webp',
        ]);
    }
}
