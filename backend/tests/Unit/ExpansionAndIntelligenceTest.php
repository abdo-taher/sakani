<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ExpansionAndIntelligenceTest extends TestCase
{
    /**
     * Helper: Phone normalization logic for Egyptian numbers
     */
    protected function normalizePhone(string $phone): string
    {
        $cleaned = preg_replace('/[^\d]/', '', $phone);

        if (str_starts_with($cleaned, '0020')) {
            $cleaned = '0' . substr($cleaned, 4);
        } elseif (str_starts_with($cleaned, '20')) {
            $cleaned = '0' . substr($cleaned, 2);
        } elseif (!str_starts_with($cleaned, '0') && strlen($cleaned) === 10) {
            $cleaned = '0' . $cleaned;
        }

        return $cleaned;
    }

    /**
     * Helper: Haversine distance calculator in KM
     */
    protected function calculateHaversine(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371; // km

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }

    /**
     * Helper: Public property visibility filter
     */
    protected function filterPubliclyVisible(array $properties): array
    {
        return array_values(array_filter($properties, function ($p) {
            // Exclude pending or rejected submissions
            if (isset($p['submission_status']) && $p['submission_status'] !== 'approved') {
                return false;
            }
            if (($p['status'] ?? '') === 'pending_review' || ($p['status'] ?? '') === 'rejected') {
                return false;
            }
            return ($p['status'] ?? '') === 'available';
        }));
    }

    /**
     * Helper: Customer engagement score calculator
     */
    protected function calculateCustomerScore(array $interactions): array
    {
        $score = 0;
        $score += ($interactions['reservations'] ?? 0) * 30;
        $score += ($interactions['room_reservations'] ?? 0) * 25;
        $score += ($interactions['need_requests'] ?? 0) * 20;
        $score += ($interactions['property_submissions'] ?? 0) * 15;
        $score += ($interactions['contact_messages'] ?? 0) * 10;

        // Recency bonus
        if (!empty($interactions['last_interaction_days_ago'])) {
            if ($interactions['last_interaction_days_ago'] <= 7) {
                $score += 15;
            } elseif ($interactions['last_interaction_days_ago'] <= 30) {
                $score += 10;
            }
        }

        $tier = 'gray';
        $tierLabel = 'عميل جديد / عادي';
        if ($score >= 70) {
            $tier = 'gold';
            $tierLabel = 'عميل مميز (VIP)';
        } elseif ($score >= 35) {
            $tier = 'blue';
            $tierLabel = 'عميل نشط';
        }

        return [
            'score' => $score,
            'tier' => $tier,
            'tier_label' => $tierLabel,
        ];
    }

    /**
     * Helper: Match properties for a customer need request
     */
    protected function matchPropertiesForNeed(array $needRequest, array $availableProperties): array
    {
        return array_values(array_filter($availableProperties, function ($p) use ($needRequest) {
            // Operation match
            if (!empty($needRequest['listing_type']) && $needRequest['listing_type'] !== 'all') {
                $reqOp = $needRequest['listing_type'] === 'buy' ? 'sale' : 'rent';
                if ($p['operation_type'] !== $reqOp) {
                    return false;
                }
            }

            // Budget match (price <= budget * 1.15)
            if (!empty($needRequest['budget']) && $needRequest['budget'] > 0) {
                if ($p['price'] > ($needRequest['budget'] * 1.15)) {
                    return false;
                }
            }

            // Rooms match
            if (!empty($needRequest['rooms']) && $needRequest['rooms'] > 0) {
                if ($p['rooms'] < $needRequest['rooms']) {
                    return false;
                }
            }

            return true;
        }));
    }

    public function test_public_property_submission_workflow_and_visibility()
    {
        $submittedProperty = [
            'id' => 101,
            'title' => 'شقة معروضة من مالك بالحي الخامس',
            'price' => 1200000,
            'operation_type' => 'sale',
            'status' => 'pending_review',
            'submission_status' => 'pending_review',
            'submitter_name' => 'محمد أحمد',
            'submitter_phone' => '01012345678',
        ];

        $allProperties = [
            ['id' => 1, 'title' => 'عقار معتمد مسبقاً', 'status' => 'available', 'submission_status' => 'approved'],
            $submittedProperty,
        ];

        // 1. Before approval: Pending property must NOT appear publicly
        $publicVisibleBefore = $this->filterPubliclyVisible($allProperties);
        $this->assertCount(1, $publicVisibleBefore);
        $this->assertEquals(1, $publicVisibleBefore[0]['id']);

        // 2. Admin approves property
        $approvedProperty = $submittedProperty;
        $approvedProperty['submission_status'] = 'approved';
        $approvedProperty['status'] = 'available';

        $allProperties[1] = $approvedProperty;

        // 3. After approval: Property MUST now appear publicly
        $publicVisibleAfter = $this->filterPubliclyVisible($allProperties);
        $this->assertCount(2, $publicVisibleAfter);
        $this->assertEquals(101, $publicVisibleAfter[1]['id']);
    }

    public function test_geospatial_haversine_proximity_calculation_and_filtering()
    {
        $centerLat = 31.4357;
        $centerLng = 31.6708;

        // Point A: الحي المتميز (approx 1.5 km from center)
        $distA = $this->calculateHaversine($centerLat, $centerLng, 31.4420, 31.6850);
        $this->assertGreaterThan(0.5, $distA);
        $this->assertLessThan(3.0, $distA);

        // Point B: Cairo (approx 160+ km away)
        $distB = $this->calculateHaversine($centerLat, $centerLng, 30.0444, 31.2357);
        $this->assertGreaterThan(100, $distB);

        // Filtering with 5 km radius
        $properties = [
            ['id' => 1, 'title' => 'عقار دمياط الجديدة', 'lat' => 31.4420, 'lng' => 31.6850],
            ['id' => 2, 'title' => 'عقار القاهرة البعيد', 'lat' => 30.0444, 'lng' => 31.2357],
            ['id' => 3, 'title' => 'عقار بدون إحداثيات', 'lat' => null, 'lng' => null],
        ];

        $withinRadius = array_values(array_filter($properties, function ($p) use ($centerLat, $centerLng) {
            if (!$p['lat'] || !$p['lng']) return false;
            $d = $this->calculateHaversine($centerLat, $centerLng, $p['lat'], $p['lng']);
            return $d <= 5.0;
        }));

        $this->assertCount(1, $withinRadius);
        $this->assertEquals(1, $withinRadius[0]['id']);
    }

    public function test_egyptian_phone_normalization_formats()
    {
        $formats = [
            '01012345678' => '01012345678',
            '+201012345678' => '01012345678',
            '00201012345678' => '01012345678',
            '201012345678' => '01012345678',
            '+20 10 1234 5678' => '01012345678',
            '01198765432' => '01198765432',
            '+201298765432' => '01298765432',
            '01555555555' => '01555555555',
        ];

        foreach ($formats as $input => $expected) {
            $this->assertEquals($expected, $this->normalizePhone($input), "Failed normalizing: {$input}");
        }
    }

    public function test_customer_intelligence_scoring_and_tier_calculation()
    {
        // High engagement customer: 2 reservations (+60), 1 need request (+20), active 2 days ago (+15) -> 95 (VIP)
        $vipCustomer = $this->calculateCustomerScore([
            'reservations' => 2,
            'need_requests' => 1,
            'last_interaction_days_ago' => 2,
        ]);
        $this->assertEquals(95, $vipCustomer['score']);
        $this->assertEquals('gold', $vipCustomer['tier']);
        $this->assertEquals('عميل مميز (VIP)', $vipCustomer['tier_label']);

        // Medium active customer: 1 need request (+20), 1 contact message (+10), active 10 days ago (+10) -> 40 (Active)
        $activeCustomer = $this->calculateCustomerScore([
            'need_requests' => 1,
            'contact_messages' => 1,
            'last_interaction_days_ago' => 10,
        ]);
        $this->assertEquals(40, $activeCustomer['score']);
        $this->assertEquals('blue', $activeCustomer['tier']);
        $this->assertEquals('عميل نشط', $activeCustomer['tier_label']);

        // Low / New customer: 1 contact message (+10), active 45 days ago (0) -> 10 (Regular)
        $regularCustomer = $this->calculateCustomerScore([
            'contact_messages' => 1,
            'last_interaction_days_ago' => 45,
        ]);
        $this->assertEquals(10, $regularCustomer['score']);
        $this->assertEquals('gray', $regularCustomer['tier']);
    }

    public function test_need_request_smart_property_matcher()
    {
        $availableProperties = [
            ['id' => 1, 'title' => 'شقة 3 غرف إيجار 4000', 'operation_type' => 'rent', 'rooms' => 3, 'price' => 4000],
            ['id' => 2, 'title' => 'شقة غرفتين إيجار 3000', 'operation_type' => 'rent', 'rooms' => 2, 'price' => 3000],
            ['id' => 3, 'title' => 'شقة 3 غرف بيع 1500000', 'operation_type' => 'sale', 'rooms' => 3, 'price' => 1500000],
            ['id' => 4, 'title' => 'شقة 3 غرف إيجار 8000', 'operation_type' => 'rent', 'rooms' => 3, 'price' => 8000],
        ];

        // Customer wants rent, min 3 rooms, budget 4500
        $needRequest = [
            'listing_type' => 'rent',
            'rooms' => 3,
            'budget' => 4500,
        ];

        $matched = $this->matchPropertiesForNeed($needRequest, $availableProperties);

        $this->assertCount(1, $matched);
        $this->assertEquals(1, $matched[0]['id']);
    }
}
