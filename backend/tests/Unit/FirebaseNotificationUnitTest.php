<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Services\FirebaseNotificationService;
use App\Models\Notification;
use App\Models\DeviceToken;

class FirebaseNotificationUnitTest extends TestCase
{
    /**
     * Test that FirebaseNotificationService gracefully handles empty tokens.
     */
    public function test_firebase_service_handles_empty_tokens(): void
    {
        $res = FirebaseNotificationService::sendToTokens([], 'عنوان الإشعار', 'نص الرسالة');
        
        $this->assertIsArray($res);
        $this->assertEquals(0, $res['success_count']);
        $this->assertEquals(0, $res['failure_count']);
        $this->assertEquals('no_tokens', $res['status']);
    }

    /**
     * Test that FirebaseNotificationService handles tokens safely without throwing exceptions.
     */
    public function test_firebase_service_handles_tokens_safely(): void
    {
        $res = FirebaseNotificationService::sendToTokens(
            ['sample-test-fcm-token-12345'],
            'طلب حجز جديد',
            'محمد قدم طلب حجز على العقار'
        );

        $this->assertIsArray($res);
        $this->assertArrayHasKey('success_count', $res);
        $this->assertArrayHasKey('failure_count', $res);
        $this->assertArrayHasKey('status', $res);
    }

    /**
     * Test that Firebase Project ID and credentials are correctly parsed.
     */
    public function test_firebase_service_credentials_and_project_id(): void
    {
        $projectId = FirebaseNotificationService::getFirebaseProjectId();
        $this->assertEquals('sakani-fa8db', $projectId);
    }

    /**
     * Test that Notification model attributes and default values match design.
     */
    public function test_notification_model_structure(): void
    {
        $notification = new Notification([
            'type' => 'reservation',
            'recipient_type' => 'customer',
            'customer_phone' => '01012345678',
            'entity_type' => 'reservation',
            'entity_id' => 42,
            'title' => 'تأكيد الحجز',
            'message' => 'تم تأكيد حجزك بنجاح',
            'link' => '/properties/42',
            'is_read' => false,
            'data' => ['key' => 'value'],
        ]);

        $this->assertEquals('reservation', $notification->type);
        $this->assertEquals('customer', $notification->recipient_type);
        $this->assertEquals('01012345678', $notification->customer_phone);
        $this->assertEquals('تأكيد الحجز', $notification->title);
        $this->assertFalse($notification->is_read);
    }

    /**
     * Test that DeviceToken model attributes match design.
     */
    public function test_device_token_model_structure(): void
    {
        $deviceToken = new DeviceToken();
        $deviceToken->user_id = 1;
        $deviceToken->phone = '01012345678';
        $deviceToken->token = 'fcm-registration-token-string';
        $deviceToken->device_type = 'web';

        $this->assertEquals(1, $deviceToken->user_id);
        $this->assertEquals('01012345678', $deviceToken->phone);
        $this->assertEquals('fcm-registration-token-string', $deviceToken->token);
        $this->assertEquals('web', $deviceToken->device_type);
        $this->assertContains('token', $deviceToken->getFillable());
    }
}
