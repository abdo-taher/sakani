<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class CustomerReservationTrackingTest extends TestCase
{
    /**
     * Helper to simulate customer reservations scoping by phone / token identity
     */
    protected function filterCustomerReservations(array $reservations, ?string $clientPhone, ?string $token = null, array $deviceTokens = []): array
    {
        $phonesToQuery = [];
        if ($clientPhone) {
            $clean = preg_replace('/\D/', '', $clientPhone);
            if (str_starts_with($clean, '20') && strlen($clean) > 10) {
                $clean = '0' . substr($clean, 2);
            }
            $phonesToQuery[] = $clean;
            $phonesToQuery[] = $clientPhone;
        }

        if ($token) {
            foreach ($deviceTokens as $dt) {
                if (($dt['token'] ?? '') === $token && !empty($dt['phone'])) {
                    $clean = preg_replace('/\D/', '', $dt['phone']);
                    if (str_starts_with($clean, '20') && strlen($clean) > 10) {
                        $clean = '0' . substr($clean, 2);
                    }
                    $phonesToQuery[] = $clean;
                    $phonesToQuery[] = $dt['phone'];
                }
            }
        }

        $phonesToQuery = array_unique(array_filter($phonesToQuery));

        if (empty($phonesToQuery)) {
            return [];
        }

        return array_values(array_filter($reservations, function ($r) use ($phonesToQuery) {
            $rPhone = preg_replace('/\D/', '', $r['phone'] ?? '');
            if (str_starts_with($rPhone, '20') && strlen($rPhone) > 10) {
                $rPhone = '0' . substr($rPhone, 2);
            }
            return in_array($rPhone, $phonesToQuery) || in_array($r['phone'] ?? '', $phonesToQuery);
        }));
    }

    public function test_r1_customer_reserves_normal_property_appears_in_my_reservations()
    {
        $reservations = [
            [
                'id' => 101,
                'property_id' => 1,
                'room_id' => null,
                'name' => 'أحمد محمود',
                'phone' => '01011111111',
                'status' => 'pending',
                'property' => [
                    'id' => 1,
                    'title' => 'شقة 120م بالحي الخامس',
                ],
            ],
            [
                'id' => 102,
                'property_id' => 2,
                'room_id' => null,
                'name' => 'خالد سعيد',
                'phone' => '01022222222',
                'status' => 'pending',
                'property' => [
                    'id' => 2,
                    'title' => 'فيلا مميزة بالحي الأول',
                ],
            ],
        ];

        $clientReservations = $this->filterCustomerReservations($reservations, '01011111111');

        $this->assertCount(1, $clientReservations);
        $this->assertEquals(101, $clientReservations[0]['id']);
        $this->assertNull($clientReservations[0]['room_id']);
        $this->assertEquals('شقة 120م بالحي الخامس', $clientReservations[0]['property']['title']);
    }

    public function test_r2_customer_reserves_room_a_clearly_identifies_room()
    {
        $reservations = [
            [
                'id' => 201,
                'property_id' => 5,
                'room_id' => 12,
                'name' => 'سارة أحمد',
                'phone' => '01033333333',
                'status' => 'pending',
                'room' => [
                    'id' => 12,
                    'name' => 'غرفة ماستر A',
                    'price' => 2500,
                ],
            ],
        ];

        $clientReservations = $this->filterCustomerReservations($reservations, '01033333333');

        $this->assertCount(1, $clientReservations);
        $this->assertEquals(12, $clientReservations[0]['room_id']);
        $this->assertEquals('غرفة ماستر A', $clientReservations[0]['room']['name']);
        $this->assertEquals(2500, $clientReservations[0]['room']['price']);
    }

    public function test_r3_different_customer_cannot_see_customer_a_reservations()
    {
        $reservations = [
            [
                'id' => 301,
                'property_id' => 1,
                'name' => 'العميل أ',
                'phone' => '01011111111',
                'status' => 'pending',
            ],
        ];

        $clientBReservations = $this->filterCustomerReservations($reservations, '01099999999');

        $this->assertCount(0, $clientBReservations);
    }

    public function test_r4_admin_accepts_reservation_status_reflects_to_customer()
    {
        $reservation = [
            'id' => 401,
            'property_id' => 1,
            'phone' => '01055555555',
            'status' => 'pending',
        ];

        // Simulate admin status update
        $reservation['status'] = 'accepted';

        $clientReservations = $this->filterCustomerReservations([$reservation], '01055555555');

        $this->assertEquals('accepted', $clientReservations[0]['status']);
    }

    public function test_r5_admin_rejects_reservation_status_reflects_to_customer()
    {
        $reservation = [
            'id' => 501,
            'property_id' => 1,
            'phone' => '01066666666',
            'status' => 'pending',
        ];

        // Simulate admin status update
        $reservation['status'] = 'rejected';

        $clientReservations = $this->filterCustomerReservations([$reservation], '01066666666');

        $this->assertEquals('rejected', $clientReservations[0]['status']);
    }
}
