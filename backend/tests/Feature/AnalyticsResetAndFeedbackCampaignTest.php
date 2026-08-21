<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Property;
use App\Models\Room;
use App\Models\Reservation;
use App\Models\Location;
use App\Models\Category;
use App\Models\PropertyType;
use App\Models\VisitorLog;
use App\Models\FeedbackCampaign;
use App\Models\FeedbackResponse;
use App\Models\Setting;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

class AnalyticsResetAndFeedbackCampaignTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $regularUser;
    protected Location $location;
    protected Category $category;
    protected PropertyType $propType;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();

        // 1. Setup Admin User
        $this->admin = User::create([
            'username' => 'admin_test',
            'password' => bcrypt('secret123'),
            'role' => 'admin',
        ]);

        $this->regularUser = User::create([
            'username' => 'user_test',
            'password' => bcrypt('secret123'),
            'role' => 'user',
        ]);

        // 2. Base Models
        $this->location = Location::create(['name' => 'الحي الأول - دمياط الجديدة']);
        $this->category = Category::create(['name' => 'إيجار', 'slug' => 'rent']);
        $this->propType = PropertyType::create(['name' => 'شقة', 'slug' => 'apartment', 'category_id' => $this->category->id]);
    }

    /**
     * 1. Authorization: Unauthenticated or Non-Admin access is denied
     */
    public function test_unauthenticated_or_non_admin_cannot_access_statistics_or_reset(): void
    {
        // Unauthenticated
        $this->getJson('/api/statistics')->assertUnauthorized();
        $this->postJson('/api/analytics/reset-visits')->assertUnauthorized();

        // Regular User
        $this->actingAs($this->regularUser, 'sanctum')
             ->getJson('/api/statistics')
             ->assertForbidden();

        $this->actingAs($this->regularUser, 'sanctum')
             ->postJson('/api/analytics/reset-visits')
             ->assertForbidden();
    }

    /**
     * 2. Comprehensive Statistics Data Structure and Ranges
     */
    public function test_admin_can_access_comprehensive_statistics(): void
    {
        // Seed test property, room, and reservation
        $prop = Property::create([
            'title' => 'شقة فاخرة للإيجار بالحي الأول',
            'description' => 'شقة سوبر لوكس',
            'price' => 4500,
            'category_id' => $this->category->id,
            'property_type_id' => $this->propType->id,
            'location_id' => $this->location->id,
            'operation_type' => 'rent',
            'property_type' => 'apartment',
            'area' => 120,
            'rooms' => 3,
            'bathrooms' => 1,
            'floor' => 2,
            'finishing' => 'super_lux',
            'furnishing' => 'furnished',
            'audience_type' => 'families',
            'status' => 'available',
            'submission_status' => 'approved',
            'views' => 42,
        ]);

        Room::create([
            'property_id' => $prop->id,
            'name' => 'غرفة 1',
            'price' => 1500,
            'area' => 20,
            'status' => 'available',
            'is_available' => true,
        ]);

        Reservation::create([
            'property_id' => $prop->id,
            'name' => 'أحمد علي',
            'phone' => '01012345678',
            'status' => 'pending',
        ]);

        $res = $this->actingAs($this->admin, 'sanctum')->getJson('/api/statistics?range=30_days');
        $res->assertOk();
        $res->assertJsonStructure([
            'success',
            'range',
            'baseline_info',
            'kpis' => [
                'visits',
                'visitors',
                'reservations',
                'properties',
                'total_views',
                'feedback_responses',
            ],
            'inventory' => [
                'total_properties',
                'by_status',
                'by_operation',
                'by_audience',
                'by_location',
                'by_type',
                'by_furnishing',
            ],
            'rooms_analytics' => [
                'total_rooms',
                'available_rooms',
                'occupied_rooms',
                'occupancy_percentage',
                'avg_room_price',
            ],
            'reservations_analytics' => [
                'total_reservations',
                'pending',
                'accepted',
                'rejected',
                'acceptance_rate',
            ],
            'conversion_intelligence',
            'acquisition',
            'feedback_summary',
        ]);

        $this->assertEquals(1, $res->json('inventory.total_properties'));
        $this->assertEquals(1, $res->json('rooms_analytics.total_rooms'));
        $this->assertEquals(1, $res->json('reservations_analytics.total_reservations'));
        $this->assertEquals(42, $res->json('kpis.total_views.current'));
    }

    /**
     * 2.5 Admin Dashboard Endpoint Across All Ranges
     */
    public function test_admin_can_access_dashboard_overview_all_ranges(): void
    {
        foreach (['all', 'today', '7_days', '30_days'] as $rng) {
            $res = $this->actingAs($this->admin, 'sanctum')->getJson("/api/dashboard?range={$rng}");
            $res->assertOk();
            $res->assertJson([
                'success' => true,
            ]);
            $res->assertJsonStructure([
                'success',
                'counts',
                'audience_distribution',
                'category_distribution',
                'location_distribution',
                'top_viewed_properties',
                'monthly_stats',
                'visitor_stats',
                'referral_stats',
            ]);
        }
    }

    /**
     * 3. Safe Visits Reset Baseline & Business Data Preservation
     */
    public function test_admin_can_safely_reset_visits_baseline_and_preserve_all_business_data(): void
    {
        // Seed business records
        $prop = Property::create([
            'title' => 'فيلا للبيع بالحي المتميز',
            'description' => 'فيلا مستقلة راقية',
            'price' => 8500000,
            'category_id' => $this->category->id,
            'property_type_id' => $this->propType->id,
            'location_id' => $this->location->id,
            'operation_type' => 'sale',
            'property_type' => 'villa',
            'area' => 350,
            'rooms' => 6,
            'bathrooms' => 4,
            'floor' => 1,
            'finishing' => 'ultra_lux',
            'furnishing' => 'unfurnished',
            'audience_type' => 'all',
            'status' => 'available',
            'submission_status' => 'approved',
            'views' => 150,
        ]);

        $room = Room::create([
            'property_id' => $prop->id,
            'name' => 'غرفة نوم رئيسية',
            'price' => 3000,
            'area' => 35,
            'status' => 'available',
        ]);

        $resv = Reservation::create([
            'property_id' => $prop->id,
            'name' => 'محمود سمير',
            'phone' => '01099887766',
            'status' => 'accepted',
        ]);

        // Seed old visitor logs
        VisitorLog::create(['ip' => '1.1.1.1', 'path' => '/properties', 'user_agent' => 'Mozilla']);
        VisitorLog::create(['ip' => '2.2.2.2', 'path' => '/properties', 'user_agent' => 'Mozilla']);

        $beforePropsCount = Property::count();
        $beforeRoomsCount = Room::count();
        $beforeResvCount = Reservation::count();
        $beforeUsersCount = User::count();

        // Perform Visits Reset as Admin
        $res = $this->actingAs($this->admin, 'sanctum')->postJson('/api/analytics/reset-visits');
        $res->assertOk();
        $res->assertJson([
            'success' => true,
            'visitor_stats' => [
                'today' => 0,
                'month' => 0,
                'all_time' => 0,
                'total_visits' => 0,
            ]
        ]);

        // Verify Business Data is 100% Intact
        $this->assertEquals($beforePropsCount, Property::count(), 'Properties must NOT be deleted by visits reset');
        $this->assertEquals($beforeRoomsCount, Room::count(), 'Rooms must NOT be deleted by visits reset');
        $this->assertEquals($beforeResvCount, Reservation::count(), 'Reservations must NOT be deleted by visits reset');
        $this->assertEquals($beforeUsersCount, User::count(), 'Users must NOT be deleted by visits reset');

        // Verify Setting Baseline was updated
        $this->assertNotNull(Setting::where('key', 'visits_baseline_at')->value('value'));

        // Verify Audit Notification was logged
        $this->assertTrue(
            Notification::where('type', 'system_alert')->where('title', 'like', '%إعادة ضبط عداد الزيارات%')->exists(),
            'System audit notification must be created upon visits reset'
        );
    }

    /**
     * 4. New Visits After Reset Increment From Zero
     */
    public function test_new_visits_after_reset_accumulate_from_zero(): void
    {
        // 1. Reset baseline
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/analytics/reset-visits')->assertOk();

        // 2. Fetch statistics immediately after reset
        $statsRes1 = $this->actingAs($this->admin, 'sanctum')->getJson('/api/statistics?range=30_days');
        $statsRes1->assertOk();
        $this->assertEquals(0, $statsRes1->json('kpis.visits.current'));
        $this->assertEquals(0, $statsRes1->json('kpis.visitors.current'));

        // 3. New guest visitor visits a public page
        $this->app['auth']->forgetGuards();
        $this->get('/api/properties')->assertOk();

        // Flush memory query cache for fresh lookup
        Cache::forget('sakani_statistics_data_v3_30_days');

        // 4. Fetch statistics again and verify count is >= 1
        $statsRes2 = $this->actingAs($this->admin, 'sanctum')->getJson('/api/statistics?range=30_days');
        $statsRes2->assertOk();
        $this->assertGreaterThanOrEqual(1, $statsRes2->json('kpis.visits.current'));
    }

    /**
     * 5. Feedback Campaign Management Full Lifecycle
     */
    public function test_feedback_campaign_lifecycle_and_responses(): void
    {
        // 5.1 Admin Creates Campaign
        $campRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/feedback/campaigns', [
            'title' => 'استطلاع رضا زوار دمياط الجديدة',
            'description' => 'قياس تجربة البحث عن شقق مفروشة',
            'type' => 'choice',
            'question' => 'ما رأيك في سرعة تجربة البحث عن شقق؟',
            'options' => [
                ['id' => 'opt-1', 'label' => 'ممتازة جداً'],
                ['id' => 'opt-2', 'label' => 'جيدة'],
            ],
            'target_page' => 'all',
            'is_active' => true,
        ]);
        $campRes->assertCreated();
        $campId = $campRes->json('campaign.id');

        // 5.2 Public Client Fetches Active Campaign
        $activeRes = $this->getJson('/api/feedback/campaigns/active');
        $activeRes->assertOk();
        $this->assertEquals((string)$campId, (string)$activeRes->json('campaign.id'));

        // 5.3 Public Client Submits Feedback Response
        $respRes = $this->postJson('/api/feedback/responses', [
            'campaign_id' => (string)$campId,
            'campaign_title' => 'استطلاع رضا زوار دمياط الجديدة',
            'client_name' => 'سارة إبراهيم',
            'client_phone' => '01022334455',
            'rating' => 5,
            'selected_option_id' => 'opt-1',
            'selected_option_label' => 'ممتازة جداً',
            'comment' => 'تجربة ممتازة وسريعة جداً شكراً لكم',
        ]);
        $respRes->assertCreated();
        $responseId = $respRes->json('response.id');

        // 5.4 Admin Retrieves Responses List
        $adminResp = $this->actingAs($this->admin, 'sanctum')->getJson('/api/feedback/responses?campaign_id=' . $campId);
        $adminResp->assertOk();
        $this->assertCount(1, $adminResp->json('data'));
        $this->assertEquals('سارة إبراهيم', $adminResp->json('data.0.client_name'));

        // 5.5 Admin Updates Campaign (e.g. Pause)
        $updateRes = $this->actingAs($this->admin, 'sanctum')->putJson('/api/feedback/campaigns/' . $campId, [
            'is_active' => false,
        ]);
        $updateRes->assertOk();
        $this->assertFalse((bool)$updateRes->json('campaign.is_active'));

        // 5.6 Admin Deletes Individual Response
        $delResp = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/feedback/responses/' . $responseId);
        $delResp->assertOk();
        $this->assertDatabaseMissing('feedback_responses', ['id' => $responseId]);

        // 5.7 Admin Deletes Campaign
        $delCamp = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/feedback/campaigns/' . $campId);
        $delCamp->assertOk();
        $this->assertDatabaseMissing('feedback_campaigns', ['id' => $campId]);
    }
}
