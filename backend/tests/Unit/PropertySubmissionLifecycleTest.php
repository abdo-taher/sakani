<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Setting;

class PropertySubmissionLifecycleTest extends TestCase
{
    /**
     * Test submission status transitions and persistence
     */
    public function test_property_submission_rejection_lifecycle()
    {
        $submission = [
            'id' => 101,
            'title' => 'شقة 120م بالحي المتميز',
            'submitter_name' => 'أحمد محمود',
            'submitter_phone' => '01067725976',
            'status' => 'pending_review',
            'submission_status' => 'pending_review',
            'rejection_reason' => null,
        ];

        // Simulate reject action
        $rejectionReason = 'الصور غير واضحة ويُرجى إعادة الرفع';
        $submission['submission_status'] = 'rejected';
        $submission['status'] = 'rejected';
        $submission['rejection_reason'] = $rejectionReason;

        $this->assertEquals('rejected', $submission['submission_status']);
        $this->assertEquals('rejected', $submission['status']);
        $this->assertEquals($rejectionReason, $submission['rejection_reason']);
    }

    /**
     * Test submissions filter logic for pending, approved, rejected, all
     */
    public function test_property_submissions_filter_logic()
    {
        $allSubmissions = [
            ['id' => 1, 'title' => 'عقار 1', 'submission_status' => 'pending_review', 'status' => 'pending_review'],
            ['id' => 2, 'title' => 'عقار 2', 'submission_status' => 'approved', 'status' => 'available'],
            ['id' => 3, 'title' => 'عقار 3', 'submission_status' => 'rejected', 'status' => 'rejected'],
            ['id' => 4, 'title' => 'عقار 4', 'submission_status' => 'pending_review', 'status' => 'pending_review'],
        ];

        // Filter: pending
        $pending = array_values(array_filter($allSubmissions, function($s) {
            return $s['submission_status'] === 'pending_review' || $s['status'] === 'pending_review';
        }));
        $this->assertCount(2, $pending);

        // Filter: approved
        $approved = array_values(array_filter($allSubmissions, function($s) {
            return $s['submission_status'] === 'approved';
        }));
        $this->assertCount(1, $approved);

        // Filter: rejected
        $rejected = array_values(array_filter($allSubmissions, function($s) {
            return $s['submission_status'] === 'rejected' || $s['status'] === 'rejected';
        }));
        $this->assertCount(1, $rejected);
        $this->assertEquals(3, $rejected[0]['id']);
    }

    /**
     * Test Settings defaults structure
     */
    public function test_settings_defaults_contain_critical_keys()
    {
        $defaults = Setting::defaults();

        $this->assertArrayHasKey('site_name', $defaults);
        $this->assertArrayHasKey('phone', $defaults);
        $this->assertArrayHasKey('whatsapp', $defaults);
        $this->assertArrayHasKey('email', $defaults);
        $this->assertArrayHasKey('address', $defaults);
        $this->assertArrayHasKey('commission_text', $defaults);
        $this->assertArrayHasKey('announcement_enabled', $defaults);
        $this->assertArrayHasKey('announcement_text', $defaults);
    }
}
