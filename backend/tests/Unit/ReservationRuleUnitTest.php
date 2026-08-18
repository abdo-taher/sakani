<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class ReservationRuleUnitTest extends TestCase
{
    /**
     * Helper to normalize phone numbers identical to ReservationController
     */
    protected function normalizePhone(?string $phone): string
    {
        if (!$phone) {
            return '';
        }
        $clean = preg_replace('/\D/', '', $phone);
        if (str_starts_with($clean, '20') && strlen($clean) > 10) {
            $clean = '0' . substr($clean, 2);
        }
        return $clean;
    }

    /**
     * Active statuses in system
     */
    protected function isActiveStatus(string $status): bool
    {
        $activeStatuses = ['pending', 'contacted', 'accepted', 'confirmed', 'in_progress', 'new'];
        return in_array($status, $activeStatuses, true);
    }

    /**
     * Business Rule Evaluation Engine:
     * Whole Property vs Room-based Unit of Reservation.
     */
    protected function evaluateReservationAttempt(
        array $property,
        array $existingReservationsForProperty,
        string $requestedPhone,
        int $requestedPropertyId,
        ?int $requestedRoomId = null,
        ?array $requestedRoom = null
    ): array {
        $normalizedRequestedPhone = $this->normalizePhone($requestedPhone);

        // 1. Global Property Status check (Sold / Rented blocks all reservations)
        if ($property['status'] === 'sold') {
            return [
                'allowed' => false,
                'status_code' => 409,
                'error_code' => 'PROPERTY_SOLD',
                'message' => 'تم بيع هذا العقار ولم يعد متاحاً للحجز.',
            ];
        }

        if ($property['status'] === 'rented') {
            return [
                'allowed' => false,
                'status_code' => 409,
                'error_code' => 'PROPERTY_RENTED',
                'message' => 'تم تأجير هذا العقار ولم يعد متاحاً للحجز.',
            ];
        }

        // =========================================================================
        // CASE A: ROOM RESERVATION (Unit = Room)
        // =========================================================================
        if ($requestedRoomId !== null) {
            if ($requestedRoom && $requestedRoom['status'] === 'rented') {
                return [
                    'allowed' => false,
                    'status_code' => 409,
                    'error_code' => 'ROOM_RENTED',
                    'message' => 'تم تأجير هذه الغرفة بالفعل وليست متاحة للحجز.',
                ];
            }

            // Check active reservation for this room
            $activeRoomRes = null;
            foreach ($existingReservationsForProperty as $res) {
                if ($res['property_id'] === $requestedPropertyId && 
                    isset($res['room_id']) && $res['room_id'] === $requestedRoomId && 
                    $this->isActiveStatus($res['status'])) {
                    $activeRoomRes = $res;
                    break;
                }
            }

            if ($activeRoomRes) {
                $isSameCustomer = ($this->normalizePhone($activeRoomRes['phone']) === $normalizedRequestedPhone);
                if ($isSameCustomer) {
                    return [
                        'allowed' => false,
                        'status_code' => 409,
                        'error_code' => 'DUPLICATE_RESERVATION',
                        'message' => 'لقد قمت بإرسال طلب حجز لهذه الغرفة بالفعل.',
                    ];
                }

                return [
                    'allowed' => false,
                    'status_code' => 409,
                    'error_code' => 'ROOM_ALREADY_RESERVED',
                    'message' => 'هذه الغرفة محجوزة بالفعل ولا يمكن حجزها حالياً.',
                ];
            }

            if ($requestedRoom && $requestedRoom['status'] === 'reserved') {
                return [
                    'allowed' => false,
                    'status_code' => 409,
                    'error_code' => 'ROOM_ALREADY_RESERVED',
                    'message' => 'هذه الغرفة محجوزة بالفعل ولا يمكن حجزها حالياً.',
                ];
            }

            return [
                'allowed' => true,
                'status_code' => 201,
                'message' => 'تم تقديم طلب حجز الغرفة بنجاح',
            ];
        }

        // =========================================================================
        // CASE B: WHOLE PROPERTY RESERVATION (Unit = Property)
        // =========================================================================
        if ($property['status'] === 'reserved') {
            return [
                'allowed' => false,
                'status_code' => 409,
                'error_code' => 'PROPERTY_ALREADY_RESERVED',
                'message' => 'هذا العقار محجوز بالفعل ولا يمكن حجزه حالياً.',
            ];
        }

        $activePropertyRes = null;
        foreach ($existingReservationsForProperty as $res) {
            if ($res['property_id'] === $requestedPropertyId && 
                empty($res['room_id']) && 
                $this->isActiveStatus($res['status'])) {
                $activePropertyRes = $res;
                break;
            }
        }

        if ($activePropertyRes) {
            $isSameCustomer = ($this->normalizePhone($activePropertyRes['phone']) === $normalizedRequestedPhone);
            if ($isSameCustomer) {
                return [
                    'allowed' => false,
                    'status_code' => 409,
                    'error_code' => 'DUPLICATE_RESERVATION',
                    'message' => 'لديك طلب حجز قائم بالفعل لهذا العقار. يمكنك التواصل معنا لمتابعة حالة الحجز.',
                ];
            }

            return [
                'allowed' => false,
                'status_code' => 409,
                'error_code' => 'PROPERTY_ALREADY_RESERVED',
                'message' => 'هذا العقار محجوز بالفعل ولا يمكن حجزه حالياً.',
            ];
        }

        return [
            'allowed' => true,
            'status_code' => 201,
            'message' => 'تم تقديم طلب الحجز بنجاح وموافقة الطلب المبدئية',
        ];
    }

    public function test_a_property_available_customer1_reserves_success(): void
    {
        $propertyA = ['id' => 101, 'status' => 'available'];
        $existing = [];

        $result = $this->evaluateReservationAttempt($propertyA, $existing, '01011112222', 101);

        $this->assertTrue($result['allowed']);
        $this->assertEquals(201, $result['status_code']);
    }

    public function test_b_property_has_active_reservation_customer2_fails(): void
    {
        $propertyA = ['id' => 101, 'status' => 'available'];
        $existing = [
            ['id' => 1, 'property_id' => 101, 'room_id' => null, 'phone' => '01011112222', 'status' => 'pending'],
        ];

        $result = $this->evaluateReservationAttempt($propertyA, $existing, '01033334444', 101);

        $this->assertFalse($result['allowed']);
        $this->assertEquals(409, $result['status_code']);
        $this->assertEquals('PROPERTY_ALREADY_RESERVED', $result['error_code']);
    }

    public function test_c_customer1_reserves_same_property_again_fails_duplicate(): void
    {
        $propertyA = ['id' => 101, 'status' => 'available'];
        $existing = [
            ['id' => 1, 'property_id' => 101, 'room_id' => null, 'phone' => '01011112222', 'status' => 'in_progress'],
        ];

        $result = $this->evaluateReservationAttempt($propertyA, $existing, '201011112222', 101);

        $this->assertFalse($result['allowed']);
        $this->assertEquals(409, $result['status_code']);
        $this->assertEquals('DUPLICATE_RESERVATION', $result['error_code']);
    }

    public function test_d_customer1_can_reserve_property_b_while_holding_property_a(): void
    {
        $propertyB = ['id' => 102, 'status' => 'available'];
        $existingForPropertyB = [];

        $result = $this->evaluateReservationAttempt($propertyB, $existingForPropertyB, '01011112222', 102);

        $this->assertTrue($result['allowed']);
        $this->assertEquals(201, $result['status_code']);
    }

    public function test_e_sold_property_is_rejected(): void
    {
        $propertyA = ['id' => 101, 'status' => 'sold'];
        $existing = [];

        $result = $this->evaluateReservationAttempt($propertyA, $existing, '01099998888', 101);

        $this->assertFalse($result['allowed']);
        $this->assertEquals(409, $result['status_code']);
        $this->assertEquals('PROPERTY_SOLD', $result['error_code']);
    }

    public function test_f_rented_property_is_rejected(): void
    {
        $propertyA = ['id' => 101, 'status' => 'rented'];
        $existing = [];

        $result = $this->evaluateReservationAttempt($propertyA, $existing, '01099998888', 101);

        $this->assertFalse($result['allowed']);
        $this->assertEquals(409, $result['status_code']);
        $this->assertEquals('PROPERTY_RENTED', $result['error_code']);
    }

    public function test_g_room_rental_reserving_room1_succeeds_and_leaves_room2_available(): void
    {
        $propertyA = ['id' => 101, 'status' => 'available', 'has_detailed_rooms' => true];
        $room1 = ['id' => 1, 'status' => 'available'];
        $room2 = ['id' => 2, 'status' => 'available'];
        $existing = [];

        // Customer 1 reserves Room 1
        $res1 = $this->evaluateReservationAttempt($propertyA, $existing, '01011112222', 101, 1, $room1);
        $this->assertTrue($res1['allowed']);
        $this->assertEquals(201, $res1['status_code']);

        // Now existing has active reservation for Room 1
        $existing[] = ['id' => 1, 'property_id' => 101, 'room_id' => 1, 'phone' => '01011112222', 'status' => 'pending'];
        $room1['status'] = 'reserved';

        // Customer 2 reserves Room 2 in the SAME property -> SUCCESS!
        $res2 = $this->evaluateReservationAttempt($propertyA, $existing, '01033334444', 101, 2, $room2);
        $this->assertTrue($res2['allowed']);
        $this->assertEquals(201, $res2['status_code']);

        // Customer 3 tries to reserve Room 1 -> REJECTED (409)!
        $res3 = $this->evaluateReservationAttempt($propertyA, $existing, '01055556666', 101, 1, $room1);
        $this->assertFalse($res3['allowed']);
        $this->assertEquals(409, $res3['status_code']);
        $this->assertEquals('ROOM_ALREADY_RESERVED', $res3['error_code']);
    }

    public function test_h_room_rental_when_parent_property_sold_blocks_rooms(): void
    {
        $propertyA = ['id' => 101, 'status' => 'sold', 'has_detailed_rooms' => true];
        $room1 = ['id' => 1, 'status' => 'available'];
        $existing = [];

        $result = $this->evaluateReservationAttempt($propertyA, $existing, '01011112222', 101, 1, $room1);

        $this->assertFalse($result['allowed']);
        $this->assertEquals(409, $result['status_code']);
        $this->assertEquals('PROPERTY_SOLD', $result['error_code']);
    }

    public function test_i_same_customer_can_reserve_room2_after_reserving_room1(): void
    {
        $propertyA = ['id' => 101, 'status' => 'available', 'has_detailed_rooms' => true];
        $room1 = ['id' => 1, 'status' => 'reserved'];
        $room2 = ['id' => 2, 'status' => 'available'];
        
        // Customer 1 already has active reservation on Room 1
        $existing = [
            ['id' => 1, 'property_id' => 101, 'room_id' => 1, 'phone' => '01011112222', 'status' => 'pending'],
        ];

        // Same Customer 1 attempts to reserve Room 2 in the same property -> MUST SUCCEED (Unit = Room)
        $result = $this->evaluateReservationAttempt($propertyA, $existing, '01011112222', 101, 2, $room2);

        $this->assertTrue($result['allowed']);
        $this->assertEquals(201, $result['status_code']);
    }

    public function test_j_same_customer_reserving_same_room_again_fails_duplicate(): void
    {
        $propertyA = ['id' => 101, 'status' => 'available', 'has_detailed_rooms' => true];
        $room1 = ['id' => 1, 'status' => 'reserved'];
        
        // Customer 1 already has active reservation on Room 1
        $existing = [
            ['id' => 1, 'property_id' => 101, 'room_id' => 1, 'phone' => '01011112222', 'status' => 'pending'],
        ];

        // Same Customer 1 attempts to reserve Room 1 again -> DUPLICATE REJECTED
        $result = $this->evaluateReservationAttempt($propertyA, $existing, '201011112222', 101, 1, $room1);

        $this->assertFalse($result['allowed']);
        $this->assertEquals(409, $result['status_code']);
        $this->assertEquals('DUPLICATE_RESERVATION', $result['error_code']);
    }
}
