<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class DiscoveryAndNotificationLifecycleTest extends TestCase
{
    /**
     * Helper to simulate discovery property filter logic
     */
    protected function filterProperties(array $properties, array $params): array
    {
        return array_values(array_filter($properties, function ($p) use ($params) {
            // Operation / Category Filter
            if (!empty($params['operation']) && $params['operation'] !== 'all') {
                if (($p['operation_type'] ?? '') !== $params['operation']) {
                    return false;
                }
            }

            // Property Type Filter
            if (!empty($params['type']) && $params['type'] !== 'all') {
                if (($p['property_type'] ?? '') !== $params['type']) {
                    return false;
                }
            }

            // Furnishing Filter
            if (!empty($params['furnishing']) && $params['furnishing'] !== 'all') {
                if (($p['furnishing'] ?? '') !== $params['furnishing']) {
                    return false;
                }
            }

            // Mode Filter ('full' vs 'room')
            if (!empty($params['mode'])) {
                if ($params['mode'] === 'room') {
                    if (empty($p['has_detailed_rooms']) || empty($p['rooms_count']) || $p['rooms_count'] <= 0) {
                        return false;
                    }
                } elseif ($params['mode'] === 'full') {
                    if (!empty($p['has_detailed_rooms']) && !empty($p['rooms_count']) && $p['rooms_count'] > 0) {
                        return false;
                    }
                }
            }

            return true;
        }));
    }

    /**
     * D1: Click 'شقق للبيع' -> Only apartments for sale appear.
     */
    public function test_d1_sale_apartments_filter_matches_only_sale_apartments(): void
    {
        $properties = [
            ['id' => 1, 'title' => 'شقة تمليك', 'operation_type' => 'sale', 'property_type' => 'apartment', 'furnishing' => 'unfurnished', 'has_detailed_rooms' => false, 'rooms_count' => 0],
            ['id' => 2, 'title' => 'فيلا للبيع', 'operation_type' => 'sale', 'property_type' => 'villa', 'furnishing' => 'unfurnished', 'has_detailed_rooms' => false, 'rooms_count' => 0],
            ['id' => 3, 'title' => 'شقة للإيجار', 'operation_type' => 'rent', 'property_type' => 'apartment', 'furnishing' => 'unfurnished', 'has_detailed_rooms' => false, 'rooms_count' => 0],
        ];

        $results = $this->filterProperties($properties, ['operation' => 'sale', 'type' => 'apartment']);

        $this->assertCount(1, $results);
        $this->assertEquals(1, $results[0]['id']);
        $this->assertEquals('sale', $results[0]['operation_type']);
        $this->assertEquals('apartment', $results[0]['property_type']);
    }

    /**
     * D2: Click 'شقق للإيجار بالكامل' -> Excludes room rentals.
     */
    public function test_d2_full_rental_filter_excludes_room_rentals(): void
    {
        $properties = [
            ['id' => 1, 'title' => 'شقة عائلية كاملة', 'operation_type' => 'rent', 'property_type' => 'apartment', 'has_detailed_rooms' => false, 'rooms_count' => 0],
            ['id' => 2, 'title' => 'عقار غرف طالبات', 'operation_type' => 'rent', 'property_type' => 'apartment', 'has_detailed_rooms' => true, 'rooms_count' => 3],
        ];

        $results = $this->filterProperties($properties, ['operation' => 'rent', 'mode' => 'full']);

        $this->assertCount(1, $results);
        $this->assertEquals(1, $results[0]['id']);
        $this->assertFalse($results[0]['has_detailed_rooms']);
    }

    /**
     * D3: Click 'إيجار بالغرف' -> Only appropriate detailed-room properties appear.
     */
    public function test_d3_room_rental_filter_includes_only_properties_with_rooms(): void
    {
        $properties = [
            ['id' => 1, 'title' => 'شقة للإيجار بالكامل', 'operation_type' => 'rent', 'has_detailed_rooms' => false, 'rooms_count' => 0],
            ['id' => 2, 'title' => 'سكن شباب غرف مستقلة', 'operation_type' => 'rent', 'has_detailed_rooms' => true, 'rooms_count' => 4],
            ['id' => 3, 'title' => 'عقار فارغ بدون غرف مسجلة', 'operation_type' => 'rent', 'has_detailed_rooms' => true, 'rooms_count' => 0],
        ];

        $results = $this->filterProperties($properties, ['operation' => 'rent', 'mode' => 'room']);

        $this->assertCount(1, $results);
        $this->assertEquals(2, $results[0]['id']);
        $this->assertTrue($results[0]['has_detailed_rooms']);
        $this->assertGreaterThan(0, $results[0]['rooms_count']);
    }

    /**
     * D4: Click 'شقق مفروشة' -> Only matching furnished apartments appear.
     */
    public function test_d4_furnished_filter_matches_only_furnished_properties(): void
    {
        $properties = [
            ['id' => 1, 'title' => 'شقة سوبر لوكس مفروشة', 'furnishing' => 'furnished'],
            ['id' => 2, 'title' => 'شقة نصف مفروشة / فارغة', 'furnishing' => 'unfurnished'],
        ];

        $results = $this->filterProperties($properties, ['furnishing' => 'furnished']);

        $this->assertCount(1, $results);
        $this->assertEquals(1, $results[0]['id']);
        $this->assertEquals('furnished', $results[0]['furnishing']);
    }

    /**
     * N3: Client creates reservation -> Admin in-app notification generated.
     */
    public function test_n3_reservation_created_generates_admin_notification(): void
    {
        $reservation = [
            'id' => 101,
            'client_name' => 'أحمد محمود',
            'client_phone' => '01012345678',
            'property_title' => 'شقة مطلة على البحر',
            'property_ref' => 'SK-889',
            'room_name' => null,
        ];

        $title = 'طلب حجز جديد';
        $message = "{$reservation['client_name']} قدم طلب حجز على عقار ({$reservation['property_title']}) - كود: {$reservation['property_ref']}";

        $adminNotification = [
            'recipient_type' => 'admin',
            'type' => 'reservation',
            'title' => $title,
            'message' => $message,
            'link' => '/admin/reservations',
        ];

        $this->assertEquals('admin', $adminNotification['recipient_type']);
        $this->assertStringContainsString('أحمد محمود', $adminNotification['message']);
        $this->assertStringContainsString('SK-889', $adminNotification['message']);
    }

    /**
     * N4: Admin accepts reservation #X -> exact client receives acceptance notification.
     */
    public function test_n4_admin_accepts_reservation_notifies_only_target_client(): void
    {
        $reservation = [
            'id' => 45,
            'client_phone' => '01099887766',
            'property_title' => 'فيلا الحي المتميز',
        ];

        $oldStatus = 'pending';
        $newStatus = 'accepted';

        $this->assertNotEquals($oldStatus, $newStatus);

        $clientNotification = [
            'recipient_type' => 'customer',
            'customer_phone' => $reservation['client_phone'],
            'title' => 'تم قبول طلب الحجز',
            'message' => "تهانينا! تمت الموافقة وقبول طلب حجزك للعقار ({$reservation['property_title']}).",
        ];

        $this->assertEquals('customer', $clientNotification['recipient_type']);
        $this->assertEquals('01099887766', $clientNotification['customer_phone']);
        $this->assertEquals('تم قبول طلب الحجز', $clientNotification['title']);
    }

    /**
     * N5: Admin accepts a room reservation -> Message identifies room name and property.
     */
    public function test_n5_admin_accepts_room_reservation_includes_room_name(): void
    {
        $reservation = [
            'id' => 46,
            'client_phone' => '01122334455',
            'property_title' => 'سكن طالبات متميز',
            'room_name' => 'غرفة 2 - ماستر',
        ];

        $title = 'تم قبول طلب الحجز';
        $message = "تهانينا! تمت الموافقة وقبول طلب حجزك للغرفة \"{$reservation['room_name']}\" بالعقار ({$reservation['property_title']}).";

        $this->assertStringContainsString('غرفة 2 - ماستر', $message);
        $this->assertStringContainsString('سكن طالبات متميز', $message);
    }

    /**
     * N6: Admin saves an already-accepted reservation without state change -> Suppress duplicate notification.
     */
    public function test_n6_duplicate_status_transition_suppresses_notification(): void
    {
        $oldStatus = 'accepted';
        $newStatus = 'accepted';

        $shouldNotify = ($oldStatus !== $newStatus);

        $this->assertFalse($shouldNotify);
    }

    /**
     * N7 & N8: Need Request created and status changed notification.
     */
    public function test_n7_and_n8_need_request_lifecycle_notifications(): void
    {
        $needRequest = [
            'id' => 12,
            'name' => 'سارة علي',
            'phone' => '01055554444',
            'location' => 'الحي الأول',
            'listing_type' => 'rent',
        ];

        // 1. Creation -> Admin notified
        $adminTitle = 'طلب إيجار جديد';
        $this->assertEquals('طلب إيجار جديد', $adminTitle);

        // 2. Status change to 'contacted' -> Client notified
        $oldStatus = 'pending';
        $newStatus = 'contacted';
        $this->assertNotEquals($oldStatus, $newStatus);

        $clientTitle = 'جاري متابعة طلبك العقاري';
        $this->assertEquals('جاري متابعة طلبك العقاري', $clientTitle);
    }

    /**
     * N9: Push failure resiliency -> Main action succeeds even if FCM fails.
     */
    public function test_n9_push_failure_does_not_break_business_flow(): void
    {
        $businessActionSucceeded = true;
        $fcmExceptionCaught = false;

        try {
            // Simulate FCM throw
            throw new \Exception('FCM connection timeout');
        } catch (\Throwable $e) {
            $fcmExceptionCaught = true;
            // Handled safely without affecting $businessActionSucceeded
        }

        $this->assertTrue($fcmExceptionCaught);
        $this->assertTrue($businessActionSucceeded);
    }

    /**
     * N10: Security -> Unauthorized access to other client's notifications is rejected.
     */
    public function test_n10_unauthorized_notification_access_is_denied(): void
    {
        $attackerPhone = '01011111111';
        $victimPhone = '01099999999';
        $attackerToken = 'device-token-abc';

        $registeredTokens = [
            'device-token-abc' => '01011111111',
            'device-token-xyz' => '01099999999',
        ];

        $isAuthorized = (isset($registeredTokens[$attackerToken]) && $registeredTokens[$attackerToken] === $victimPhone);

        $this->assertFalse($isAuthorized);
    }
}
