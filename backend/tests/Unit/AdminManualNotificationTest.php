<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class AdminManualNotificationTest extends TestCase
{
    /**
     * Helper to compute active recipients from simulated device tokens and reservation logs
     */
    protected function computeActiveRecipients(array $tokens, int $activeDays = 30): array
    {
        $cutoff = strtotime("-{$activeDays} days");

        $activeTokens = array_filter($tokens, function ($t) use ($cutoff) {
            return ($t['last_used_at'] ?? 0) >= $cutoff;
        });

        $activePhones = array_unique(array_filter(array_column($activeTokens, 'phone')));

        return [
            'active_devices_count' => count($activeTokens),
            'active_customers_count' => count($activePhones),
            'total_active_recipients' => max(count($activeTokens), count($activePhones), 1),
        ];
    }

    /**
     * Helper to prepare notification payload for broadcast
     */
    protected function prepareBroadcastPayload(string $title, string $message, string $scope, ?string $phone = null, ?string $link = '/'): array
    {
        return [
            'type' => 'manual_admin_broadcast',
            'recipient_type' => 'customer',
            'customer_phone' => $scope === 'specific_phone' ? $phone : null,
            'title' => trim($title),
            'message' => trim($message),
            'link' => $link ?: '/',
            'is_read' => false,
            'target_scope' => $scope,
        ];
    }

    public function test_active_recipients_filtering_by_30_days_window()
    {
        $now = time();
        $sampleTokens = [
            ['token' => 't1', 'phone' => '01011111111', 'last_used_at' => $now - (2 * 86400)],  // 2 days ago (Active)
            ['token' => 't2', 'phone' => '01022222222', 'last_used_at' => $now - (15 * 86400)], // 15 days ago (Active)
            ['token' => 't3', 'phone' => '01033333333', 'last_used_at' => $now - (45 * 86400)], // 45 days ago (Stale)
            ['token' => 't4', 'phone' => '01011111111', 'last_used_at' => $now - (1 * 86400)],  // 1 day ago (Active same phone)
        ];

        $counts = $this->computeActiveRecipients($sampleTokens, 30);

        $this->assertEquals(3, $counts['active_devices_count']);
        $this->assertEquals(2, $counts['active_customers_count']); // 01011111111 and 01022222222
        $this->assertEquals(3, $counts['total_active_recipients']);
    }

    public function test_manual_notification_specific_phone_payload()
    {
        $payload = $this->prepareBroadcastPayload(
            'عرض مميز',
            'خصم خاص على شقق الحي الخامس',
            'specific_phone',
            '01012345678',
            '/properties/sk-101'
        );

        $this->assertEquals('manual_admin_broadcast', $payload['type']);
        $this->assertEquals('customer', $payload['recipient_type']);
        $this->assertEquals('01012345678', $payload['customer_phone']);
        $this->assertEquals('/properties/sk-101', $payload['link']);
        $this->assertFalse($payload['is_read']);
    }

    public function test_manual_notification_active_users_payload()
    {
        $payload = $this->prepareBroadcastPayload(
            'تنبيه عام',
            'تمت إضافة عقارات حصرية جديدة',
            'active_users',
            null,
            '/properties'
        );

        $this->assertEquals('manual_admin_broadcast', $payload['type']);
        $this->assertEquals('active_users', $payload['target_scope']);
        $this->assertNull($payload['customer_phone']);
        $this->assertEquals('/properties', $payload['link']);
    }
}
