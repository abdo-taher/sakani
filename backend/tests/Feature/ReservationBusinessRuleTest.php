<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Location;
use App\Models\Category;
use App\Models\PropertyType;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReservationBusinessRuleTest extends TestCase
{
    use RefreshDatabase;
    protected function createMockProperty(int $id = 1, string $title = 'شقة فاخرة'): Property
    {
        // Return a mock Property object or find or create
        $prop = Property::find($id);
        if (!$prop) {
            $location = Location::first() ?: Location::create(['name' => 'الحي المتميز']);
            $category = Category::first() ?: Category::create(['name' => 'سكني', 'slug' => 'residential']);
            $type = PropertyType::first() ?: PropertyType::create(['name' => 'شقة', 'slug' => 'apartment', 'category_id' => $category->id]);

            $prop = Property::create([
                'id' => $id,
                'title' => $title,
                'description' => 'شقة ممتازة للبيع',
                'price' => 1500000,
                'operation_type' => 'sale',
                'property_type_id' => $type->id,
                'location_id' => $location->id,
                'category_id' => $category->id,
                'area' => 140,
                'rooms' => 3,
                'bathrooms' => 2,
                'status' => 'available',
                'featured' => false,
                'furnishing' => 'unfurnished',
            ]);
        }
        return $prop;
    }

    /**
     * CASE 1:
     * Phone number has no active reservation -> Allow reservation.
     */
    public function test_case_1_allow_reservation_when_no_active_reservation(): void
    {
        $property = $this->createMockProperty(101, 'شقة 101');
        $phone = '01011112222';

        // Clear any previous reservations for this phone
        Reservation::where('phone', $phone)->delete();

        $response = $this->postJson('/api/reservations', [
            'property_id' => $property->id,
            'name' => 'محمود أحمد',
            'phone' => $phone,
            'message' => 'أرغب بالمعاينة يوم السبت',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('message', 'تم تقديم طلب الحجز بنجاح');

        $this->assertDatabaseHas('reservations', [
            'property_id' => $property->id,
            'phone' => $phone,
            'status' => 'pending',
        ]);
    }

    /**
     * CASE 2:
     * Same phone already has active reservation for Property A -> Reject reservation for Property B.
     */
    public function test_case_2_reject_reservation_for_property_b_when_active_on_property_a(): void
    {
        $propA = $this->createMockProperty(102, 'عقار أ');
        $propB = $this->createMockProperty(103, 'عقار ب');
        $phone = '01033334444';

        Reservation::where('phone', $phone)->delete();

        // 1. Create active reservation on Property A
        $this->postJson('/api/reservations', [
            'property_id' => $propA->id,
            'name' => 'طارق كمال',
            'phone' => $phone,
        ])->assertStatus(201);

        // 2. Try to create reservation on Property B with same phone
        $response = $this->postJson('/api/reservations', [
            'property_id' => $propB->id,
            'name' => 'طارق كمال',
            'phone' => $phone,
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('error_code', 'ACTIVE_RESERVATION_EXISTS')
                 ->assertJsonFragment([
                     'message' => 'لديك طلب حجز قائم بالفعل على عقار آخر. لا يمكنك حجز عقار جديد قبل إنهاء الطلب الحالي.'
                 ]);
    }

    /**
     * CASE 3:
     * Same phone tries Property A again while active -> Reject duplicate.
     */
    public function test_case_3_reject_duplicate_reservation_for_same_property(): void
    {
        $propA = $this->createMockProperty(104, 'عقار أ مكرر');
        $phone = '01055556666';

        Reservation::where('phone', $phone)->delete();

        // 1. First reservation
        $this->postJson('/api/reservations', [
            'property_id' => $propA->id,
            'name' => 'يوسف إبراهيم',
            'phone' => $phone,
        ])->assertStatus(201);

        // 2. Duplicate reservation for same property
        $response = $this->postJson('/api/reservations', [
            'property_id' => $propA->id,
            'name' => 'يوسف إبراهيم',
            'phone' => $phone,
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('error_code', 'DUPLICATE_ACTIVE_RESERVATION')
                 ->assertJsonFragment([
                     'message' => 'لديك طلب حجز قائم بالفعل لهذا العقار. يمكنك التواصل معنا لمتابعة حالة الحجز.'
                 ]);
    }

    /**
     * CASE 4:
     * Previous reservation becomes inactive/completed/cancelled -> Allow new reservation.
     */
    public function test_case_4_allow_new_reservation_after_previous_becomes_inactive(): void
    {
        $propA = $this->createMockProperty(105, 'عقار أ سابق');
        $propB = $this->createMockProperty(106, 'عقار ب جديد');
        $phone = '01077778888';

        Reservation::where('phone', $phone)->delete();

        // 1. Create active reservation on Property A
        $res = Reservation::create([
            'property_id' => $propA->id,
            'name' => 'سامي حسن',
            'phone' => $phone,
            'status' => 'pending',
        ]);

        // 2. Mark reservation on Property A as cancelled or completed
        $res->update(['status' => 'cancelled']);

        // 3. Now customer should be allowed to reserve Property B
        $response = $this->postJson('/api/reservations', [
            'property_id' => $propB->id,
            'name' => 'سامي حسن',
            'phone' => $phone,
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('message', 'تم تقديم طلب الحجز بنجاح');
    }

    /**
     * CASE 5:
     * Phone Normalization Test (Egyptian +20 vs 010).
     */
    public function test_case_5_phone_normalization_prevents_bypass(): void
    {
        $propA = $this->createMockProperty(107, 'عقار أ كود دولي');
        $propB = $this->createMockProperty(108, 'عقار ب كود محلي');

        // Customer registers with international format +201099990000
        Reservation::where('phone', '01099990000')->orWhere('phone', '+201099990000')->delete();

        $this->postJson('/api/reservations', [
            'property_id' => $propA->id,
            'name' => 'كريم عصام',
            'phone' => '+201099990000',
        ])->assertStatus(201);

        // Customer tries Property B using local format 01099990000
        $response = $this->postJson('/api/reservations', [
            'property_id' => $propB->id,
            'name' => 'كريم عصام',
            'phone' => '01099990000',
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('error_code', 'ACTIVE_RESERVATION_EXISTS');
    }

    /**
     * Reservation Check Endpoint Test
     */
    public function test_reservation_check_endpoint(): void
    {
        $propA = $this->createMockProperty(109, 'عقار فحص');
        $phone = '01012344321';

        Reservation::where('phone', $phone)->delete();

        // 1. When no reservation exists
        $check1 = $this->postJson('/api/reservations/check', [
            'property_id' => $propA->id,
            'phone' => $phone,
        ]);
        $check1->assertStatus(200)
               ->assertJsonPath('can_reserve', true)
               ->assertJsonPath('has_active_reservation', false);

        // 2. Create reservation
        Reservation::create([
            'property_id' => $propA->id,
            'name' => 'عمر خالد',
            'phone' => $phone,
            'status' => 'pending',
        ]);

        // 3. When active reservation exists for same property
        $check2 = $this->postJson('/api/reservations/check', [
            'property_id' => $propA->id,
            'phone' => $phone,
        ]);
        $check2->assertStatus(200)
               ->assertJsonPath('can_reserve', false)
               ->assertJsonPath('is_same_property', true);
    }
}
