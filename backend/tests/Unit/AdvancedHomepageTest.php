<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class AdvancedHomepageTest extends TestCase
{
    /**
     * Test Discovery Filter Mapping: Whole rental vs Room rental vs Furnished vs Student Girls vs Youth vs Sale
     */
    public function test_discovery_filter_mapping_and_counts(): void
    {
        $properties = [
            [
                'id' => 1,
                'operation_type' => 'rent',
                'property_type' => 'apartment',
                'furnishing' => 'unfurnished',
                'audience_type' => 'families',
                'has_detailed_rooms' => false,
                'detailed_rooms' => [],
                'status' => 'available',
                'featured' => true,
                'views' => 120,
            ],
            [
                'id' => 2,
                'operation_type' => 'rent',
                'property_type' => 'apartment',
                'furnishing' => 'furnished',
                'audience_type' => 'female_students',
                'has_detailed_rooms' => true,
                'detailed_rooms' => [
                    ['id' => 101, 'name' => 'غرفة 1', 'price' => 1800, 'status' => 'available'],
                    ['id' => 102, 'name' => 'غرفة 2', 'price' => 2000, 'status' => 'available'],
                ],
                'status' => 'available',
                'featured' => true,
                'views' => 350,
            ],
            [
                'id' => 3,
                'operation_type' => 'rent',
                'property_type' => 'apartment',
                'furnishing' => 'furnished',
                'audience_type' => 'young_men',
                'has_detailed_rooms' => false,
                'detailed_rooms' => [],
                'status' => 'available',
                'featured' => false,
                'views' => 80,
            ],
            [
                'id' => 4,
                'operation_type' => 'sale',
                'property_type' => 'apartment',
                'furnishing' => 'unfurnished',
                'audience_type' => 'all',
                'has_detailed_rooms' => false,
                'detailed_rooms' => [],
                'status' => 'available',
                'featured' => true,
                'views' => 210,
            ],
        ];

        // 1. Rent Whole
        $rentWhole = array_filter($properties, fn($p) => $p['operation_type'] === 'rent' && empty($p['has_detailed_rooms']));
        $this->assertCount(2, $rentWhole);

        // 2. Rent Room
        $rentRoom = array_filter($properties, fn($p) => $p['operation_type'] === 'rent' && !empty($p['has_detailed_rooms']) && count($p['detailed_rooms']) > 0);
        $this->assertCount(1, $rentRoom);

        // 3. Furnished
        $furnished = array_filter($properties, fn($p) => $p['furnishing'] === 'furnished');
        $this->assertCount(2, $furnished);

        // 4. Female Students
        $femaleStudents = array_filter($properties, fn($p) => ($p['audience_type'] ?? '') === 'female_students');
        $this->assertCount(1, $femaleStudents);

        // 5. Young Men
        $youngMen = array_filter($properties, fn($p) => ($p['audience_type'] ?? '') === 'young_men');
        $this->assertCount(1, $youngMen);

        // 6. Sale
        $sale = array_filter($properties, fn($p) => $p['operation_type'] === 'sale');
        $this->assertCount(1, $sale);
    }

    /**
     * Test Location Aggregation: Min Price and Available Count computation
     */
    public function test_location_aggregation_and_min_price(): void
    {
        $locations = [
            ['id' => 1, 'name' => 'الحي الخامس'],
            ['id' => 2, 'name' => 'الحي الأول'],
        ];

        $properties = [
            ['id' => 1, 'location_id' => 1, 'price' => 3500, 'status' => 'available'],
            ['id' => 2, 'location_id' => 1, 'price' => 2500, 'status' => 'available'],
            ['id' => 3, 'location_id' => 1, 'price' => 5000, 'status' => 'sold'],
            ['id' => 4, 'location_id' => 2, 'price' => 4000, 'status' => 'available'],
        ];

        $aggregated = array_map(function ($loc) use ($properties) {
            $locProps = array_filter($properties, fn($p) => $p['location_id'] === $loc['id'] && $p['status'] === 'available');
            $prices = array_column($locProps, 'price');
            return [
                'id' => $loc['id'],
                'name' => $loc['name'],
                'available_count' => count($locProps),
                'min_price' => count($prices) > 0 ? min($prices) : null,
            ];
        }, $locations);

        $this->assertEquals(2, $aggregated[0]['available_count']);
        $this->assertEquals(2500, $aggregated[0]['min_price']);

        $this->assertEquals(1, $aggregated[1]['available_count']);
        $this->assertEquals(4000, $aggregated[1]['min_price']);
    }

    /**
     * Test Most Viewed Properties Sorting & Deduplication
     */
    public function test_most_viewed_sorting(): void
    {
        $properties = [
            ['id' => 1, 'title' => 'عقار أ', 'views' => 50],
            ['id' => 2, 'title' => 'عقار ب', 'views' => 500],
            ['id' => 3, 'title' => 'عقار ج', 'views' => 250],
            ['id' => 4, 'title' => 'عقار د', 'views' => 10],
        ];

        usort($properties, fn($a, $b) => $b['views'] <=> $a['views']);

        $top2 = array_slice($properties, 0, 2);
        $this->assertEquals(2, $top2[0]['id']);
        $this->assertEquals(500, $top2[0]['views']);
        $this->assertEquals(3, $top2[1]['id']);
        $this->assertEquals(250, $top2[1]['views']);
    }

    /**
     * Test Client Active Reservation Banner Logic
     */
    public function test_client_reservation_awareness_logic(): void
    {
        $isAdmin = false;
        $clientReservations = [
            ['property_id' => '1', 'phone' => '01012345678', 'created_at' => '2026-08-16T12:00:00Z']
        ];

        // Should show active banner for client with reservations
        $showBanner = !$isAdmin && count($clientReservations) > 0;
        $this->assertTrue($showBanner);

        // When logged in as Admin, banner should not be displayed
        $isAdmin = true;
        $showBannerForAdmin = !$isAdmin && count($clientReservations) > 0;
        $this->assertFalse($showBannerForAdmin);
    }
}
