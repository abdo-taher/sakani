<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FinalFilterRegressionMatrixTest extends TestCase
{
    use RefreshDatabase;

    protected Location $locDistrict1;
    protected Location $locDistrict2;
    protected Location $locDistrict3;

    protected Category $catRent;
    protected Category $catSale;

    protected PropertyType $typeApartment;
    protected PropertyType $typeVilla;
    protected PropertyType $typeDuplex;

    protected Property $propSaleAptD1;
    protected Property $propRentWholeD1;
    protected Property $propRentRoomD2;
    protected Property $propRentRoomD2YoungMen;
    protected Property $propSaleVillaD3;
    protected Property $propRentAptD3Rented;
    protected Property $propSaleOfferD1;
    protected Property $propFarCoordinates;

    protected function setUp(): void
    {
        parent::setUp();
        \Illuminate\Support\Facades\Cache::flush();
        Property::query()->delete();
        Location::query()->delete();
        Category::query()->delete();
        PropertyType::query()->delete();
        Room::query()->delete();

        // 1. Setup Categories
        $this->catRent = Category::create(['name' => 'إيجار', 'slug' => 'rent']);
        $this->catSale = Category::create(['name' => 'بيع', 'slug' => 'sale']);

        // 2. Setup Property Types
        $this->typeApartment = PropertyType::create(['name' => 'شقة', 'slug' => 'apartment', 'category_id' => $this->catRent->id]);
        $this->typeVilla = PropertyType::create(['name' => 'فيلا', 'slug' => 'villa', 'category_id' => $this->catSale->id]);
        $this->typeDuplex = PropertyType::create(['name' => 'دوبلكس', 'slug' => 'duplex', 'category_id' => $this->catSale->id]);

        // 3. Setup Locations / Districts
        $this->locDistrict1 = Location::create(['name' => 'الحي الأول - دمياط الجديدة']);
        $this->locDistrict2 = Location::create(['name' => 'المنطقة المركزية']);
        $this->locDistrict3 = Location::create(['name' => 'الحي المتميز']);

        // 4. Seed Matrix of Properties
        // Record 1: Sale Apartment in District 1, 150m², 3 rooms, unfurnished, 2,500,000, available
        $this->propSaleAptD1 = Property::create([
            'title' => 'شقة للبيع بالحي الأول تشطيب سوبر لوكس',
            'description' => 'شقة مميزة بالحي الأول للبيع استلام فوري',
            'price' => 2500000,
            'category_id' => $this->catSale->id,
            'property_type_id' => $this->typeApartment->id,
            'location_id' => $this->locDistrict1->id,
            'operation_type' => 'sale',
            'property_type' => 'apartment',
            'area' => 150,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => 2,
            'finishing' => 'super_lux',
            'furnishing' => 'unfurnished',
            'audience_type' => 'all',
            'status' => 'available',
            'submission_status' => 'approved',
            'has_detailed_rooms' => false,
            'latitude' => 31.4380,
            'longitude' => 31.6700,
        ]);

        // Record 2: Rent Whole Apartment in District 1, 120m², 2 rooms, furnished, families, 5,000, available
        $this->propRentWholeD1 = Property::create([
            'title' => 'شقة مفروشة للإيجار بالكامل عائلات الحي الأول',
            'description' => 'شقة مجهزة بالكامل للإيجار الشهري للعائلات',
            'price' => 5000,
            'category_id' => $this->catRent->id,
            'property_type_id' => $this->typeApartment->id,
            'location_id' => $this->locDistrict1->id,
            'operation_type' => 'rent',
            'property_type' => 'apartment',
            'area' => 120,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => 1,
            'finishing' => 'super_lux',
            'furnishing' => 'furnished',
            'audience_type' => 'families',
            'status' => 'available',
            'submission_status' => 'approved',
            'has_detailed_rooms' => false,
            'latitude' => 31.4390,
            'longitude' => 31.6710,
        ]);

        // Record 3: Rent Room Property in District 2, 4 rooms, furnished, female_students, 2,000, available, has 2 rooms
        $this->propRentRoomD2 = Property::create([
            'title' => 'سكن طالبات ومغتربات بالمنطقة المركزية',
            'description' => 'غرف مستقلة مفروشة ومكيفة طالبات',
            'price' => 2000,
            'category_id' => $this->catRent->id,
            'property_type_id' => $this->typeApartment->id,
            'location_id' => $this->locDistrict2->id,
            'operation_type' => 'rent',
            'property_type' => 'apartment',
            'area' => 130,
            'rooms' => 4,
            'bathrooms' => 2,
            'floor' => 3,
            'finishing' => 'super_lux',
            'furnishing' => 'furnished',
            'audience_type' => 'female_students',
            'status' => 'available',
            'submission_status' => 'approved',
            'has_detailed_rooms' => true,
            'latitude' => 31.4350,
            'longitude' => 31.6750,
        ]);
        Room::create(['property_id' => $this->propRentRoomD2->id, 'name' => 'غرفة ماستر 1', 'price' => 2000, 'area' => 22, 'status' => 'available']);
        Room::create(['property_id' => $this->propRentRoomD2->id, 'name' => 'غرفة ثنائية 2', 'price' => 1800, 'area' => 20, 'status' => 'available']);

        // Record 4: Rent Room Property in District 2 for young_men, 3 rooms, furnished, young_men, 1,800
        $this->propRentRoomD2YoungMen = Property::create([
            'title' => 'سكن شباب وموظفين المنطقة المركزية',
            'description' => 'غرف سنجل ودبل شباب وموظفين',
            'price' => 1800,
            'category_id' => $this->catRent->id,
            'property_type_id' => $this->typeApartment->id,
            'location_id' => $this->locDistrict2->id,
            'operation_type' => 'rent',
            'property_type' => 'apartment',
            'area' => 110,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => 2,
            'finishing' => 'super_lux',
            'furnishing' => 'furnished',
            'audience_type' => 'young_men',
            'status' => 'available',
            'submission_status' => 'approved',
            'has_detailed_rooms' => true,
            'latitude' => 31.4360,
            'longitude' => 31.6760,
        ]);
        Room::create(['property_id' => $this->propRentRoomD2YoungMen->id, 'name' => 'غرفة شباب 1', 'price' => 1800, 'area' => 25, 'status' => 'available']);

        // Record 5: Sale Villa in District 3, 300m², 5 rooms, 4 baths, ultra_lux, 7,000,000, status: sold
        $this->propSaleVillaD3 = Property::create([
            'title' => 'فيلا مستقلة فاخرة بالحي المتميز تم البيع',
            'description' => 'فيلا بتصميم معماري رائع حديقة خاصة',
            'price' => 7000000,
            'category_id' => $this->catSale->id,
            'property_type_id' => $this->typeVilla->id,
            'location_id' => $this->locDistrict3->id,
            'operation_type' => 'sale',
            'property_type' => 'villa',
            'area' => 300,
            'rooms' => 5,
            'bathrooms' => 4,
            'floor' => 1,
            'finishing' => 'ultra_lux',
            'furnishing' => 'unfurnished',
            'audience_type' => 'all',
            'status' => 'sold',
            'submission_status' => 'approved',
            'has_detailed_rooms' => false,
            'latitude' => 31.4420,
            'longitude' => 31.6820,
        ]);

        // Record 6: Rent Apartment in District 3, unfurnished, young_men, 3,500, status: rented
        $this->propRentAptD3Rented = Property::create([
            'title' => 'شقة إيجار الحي المتميز مؤجرة حالياً',
            'description' => 'شقة عادية مؤجرة',
            'price' => 3500,
            'category_id' => $this->catRent->id,
            'property_type_id' => $this->typeApartment->id,
            'location_id' => $this->locDistrict3->id,
            'operation_type' => 'rent',
            'property_type' => 'apartment',
            'area' => 110,
            'rooms' => 2,
            'bathrooms' => 1,
            'floor' => 4,
            'finishing' => 'lux',
            'furnishing' => 'unfurnished',
            'audience_type' => 'young_men',
            'status' => 'rented',
            'submission_status' => 'approved',
            'has_detailed_rooms' => false,
        ]);

        // Record 7: Active Offer Property in District 1, Sale Apartment, price 2,000,000, offer_price 1,800,000
        $this->propSaleOfferD1 = Property::create([
            'title' => 'شقة تمليك عرض خاص وتخفيض 10%',
            'description' => 'عرض حصري لفترة محدودة على شقة بالحي الأول',
            'price' => 2000000,
            'category_id' => $this->catSale->id,
            'property_type_id' => $this->typeApartment->id,
            'location_id' => $this->locDistrict1->id,
            'operation_type' => 'sale',
            'property_type' => 'apartment',
            'area' => 135,
            'rooms' => 3,
            'bathrooms' => 2,
            'floor' => 2,
            'finishing' => 'super_lux',
            'furnishing' => 'unfurnished',
            'audience_type' => 'all',
            'status' => 'available',
            'submission_status' => 'approved',
            'has_detailed_rooms' => false,
            'has_offer' => true,
            'offer_price' => 1800000,
            'offer_discount_percentage' => 10,
            'offer_start_date' => now()->subDays(2)->format('Y-m-d'),
            'offer_end_date' => now()->addDays(10)->format('Y-m-d'),
            'offer_title' => 'خصم الافتتاح',
        ]);

        // Record 8: Far Coordinates Property (Cairo coordinates: 30.0444, 31.2357)
        $this->propFarCoordinates = Property::create([
            'title' => 'عقار في موقع بعيد خارج النطاق',
            'description' => 'عقار خارج نطاق دمياط الجديدة للاختبار الجغرافي',
            'price' => 1000000,
            'category_id' => $this->catSale->id,
            'property_type_id' => $this->typeApartment->id,
            'location_id' => $this->locDistrict1->id,
            'operation_type' => 'sale',
            'property_type' => 'apartment',
            'rooms' => 3,
            'bathrooms' => 2,
            'area' => 120,
            'finishing' => 'super_lux',
            'furnishing' => 'unfurnished',
            'status' => 'available',
            'submission_status' => 'approved',
            'latitude' => 30.0444,
            'longitude' => 31.2357,
        ]);
    }

    /**
     * 1. Test Discovery Options ("بتدور على إيه؟") from Home Page
     */
    public function test_home_discovery_options_filter_accurately(): void
    {
        // 1.1 Rent Whole Apartments (operation=rent & mode=full)
        $res = $this->getJson('/api/properties?operation=rent&mode=full');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentWholeD1->id, $ids, 'Whole rent apartment must be included');
        $this->assertNotContains($this->propRentRoomD2->id, $ids, 'Room rental property must NOT be in whole rent');
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Sale property must NOT be in rent');

        // 1.2 Room Rentals (operation=rent & mode=room)
        $res = $this->getJson('/api/properties?operation=rent&mode=room');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentRoomD2->id, $ids, 'Room rental property must be included');
        $this->assertContains($this->propRentRoomD2YoungMen->id, $ids, 'Young men room rental must be included');
        $this->assertNotContains($this->propRentWholeD1->id, $ids, 'Whole rent apartment must NOT be in room rental');
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Sale property must NOT be in room rental');

        // 1.3 Furnished Properties (furnishing=furnished)
        $res = $this->getJson('/api/properties?furnishing=furnished');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentWholeD1->id, $ids);
        $this->assertContains($this->propRentRoomD2->id, $ids);
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Unfurnished property must NOT be included');

        // 1.4 Female Students Audience (audience=female_students)
        $res = $this->getJson('/api/properties?operation=rent&audience=female_students');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentRoomD2->id, $ids, 'Female student rental must be included');
        $this->assertNotContains($this->propRentRoomD2YoungMen->id, $ids, 'Young men rental must NOT be included in female students filter');

        // 1.5 Young Men Audience (audience=young_men)
        $res = $this->getJson('/api/properties?operation=rent&audience=young_men');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentRoomD2YoungMen->id, $ids, 'Young men rental must be included');
        $this->assertNotContains($this->propRentRoomD2->id, $ids, 'Female students rental must NOT be included in young men filter');

        // 1.6 Sale Properties (operation=sale)
        $res = $this->getJson('/api/properties?operation=sale');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propSaleAptD1->id, $ids);
        $this->assertContains($this->propSaleOfferD1->id, $ids);
        $this->assertNotContains($this->propRentWholeD1->id, $ids);
        $this->assertNotContains($this->propRentRoomD2->id, $ids);
    }

    /**
     * 2. Test Location & Property Type Filters
     */
    public function test_location_and_property_type_filters(): void
    {
        // 2.1 Filter by District 1
        $res = $this->getJson("/api/properties?district={$this->locDistrict1->id}");
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propSaleAptD1->id, $ids);
        $this->assertContains($this->propRentWholeD1->id, $ids);
        $this->assertNotContains($this->propRentRoomD2->id, $ids, 'District 2 property must NOT be in District 1 filter');

        // 2.2 Filter by Property Type (Villa)
        $res = $this->getJson('/api/properties?type=villa&all_statuses=1');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propSaleVillaD3->id, $ids);
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Apartment must NOT be in Villa filter');

        // 2.3 Combination: Location (District 1) + Operation (rent)
        $res = $this->getJson("/api/properties?district={$this->locDistrict1->id}&operation=rent");
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentWholeD1->id, $ids);
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Sale property in District 1 must NOT match rent filter');
        $this->assertNotContains($this->propRentRoomD2->id, $ids, 'Rent property in District 2 must NOT match District 1 filter');
    }

    /**
     * 3. Test Price Range, Rooms, and Status Filters
     */
    public function test_price_range_and_rooms_and_status_filters(): void
    {
        // 3.1 Price Range (min_price=1000 & max_price=3000)
        $res = $this->getJson('/api/properties?min_price=1000&max_price=3000');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentRoomD2->id, $ids, '2000 EGP property must match 1000-3000 price range');
        $this->assertContains($this->propRentRoomD2YoungMen->id, $ids, '1800 EGP property must match 1000-3000 price range');
        $this->assertNotContains($this->propRentWholeD1->id, $ids, '5000 EGP property must NOT match 1000-3000 price range');
        $this->assertNotContains($this->propSaleAptD1->id, $ids, '2,500,000 EGP property must NOT match 1000-3000 price range');

        // 3.2 Minimum Rooms (rooms=3)
        $res = $this->getJson('/api/properties?rooms=3');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propSaleAptD1->id, $ids, '3 rooms property must match >= 3');
        $this->assertContains($this->propRentRoomD2->id, $ids, '4 rooms property must match >= 3');
        $this->assertNotContains($this->propRentWholeD1->id, $ids, '2 rooms property must NOT match >= 3');

        // 3.3 Status Filter (status=rented)
        $res = $this->getJson('/api/properties?status=rented&all_statuses=1');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentAptD3Rented->id, $ids);
        $this->assertNotContains($this->propRentWholeD1->id, $ids, 'Available property must NOT be in rented status filter');
    }

    /**
     * 4. Test Offers Only and Text Search
     */
    public function test_offers_and_search_queries(): void
    {
        // 4.1 Offers Only
        $res = $this->getJson('/api/properties?offers_only=1');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propSaleOfferD1->id, $ids, 'Active offer property must match offers_only');
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Property without offer must NOT match offers_only');

        // 4.2 Keyword Search (q=طالبات)
        $res = $this->getJson('/api/properties?q=' . urlencode('طالبات'));
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentRoomD2->id, $ids, 'Property matching "طالبات" must be returned');
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Unrelated property must NOT match keyword "طالبات"');
    }

    /**
     * 5. Test Proximity / Geospatial Filtering
     */
    public function test_geospatial_proximity_filter(): void
    {
        // Location near District 1 (31.4385, 31.6705) with 2km radius
        $res = $this->getJson('/api/properties?lat=31.4385&lng=31.6705&radius=2');
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propSaleAptD1->id, $ids, 'Nearby District 1 property must be in 2km radius');
        $this->assertContains($this->propRentWholeD1->id, $ids, 'Nearby District 1 property must be in 2km radius');
        $this->assertNotContains($this->propFarCoordinates->id, $ids, 'Far away Cairo property must NOT be in 2km radius');
    }

    /**
     * 6. Test Multi-Filter Complex Combinations
     */
    public function test_complex_filter_combinations(): void
    {
        // Combination: District 2 + Operation: rent + Mode: room + Audience: female_students + Max Price: 2500
        $query = http_build_query([
            'district' => $this->locDistrict2->id,
            'operation' => 'rent',
            'mode' => 'room',
            'audience' => 'female_students',
            'max_price' => 2500,
        ]);
        $res = $this->getJson("/api/properties?{$query}");
        $res->assertOk();
        $ids = collect($res->json())->pluck('id')->all();
        $this->assertContains($this->propRentRoomD2->id, $ids, 'Exact matching complex property must be returned');
        $this->assertNotContains($this->propRentRoomD2YoungMen->id, $ids, 'Young men property must be excluded');
        $this->assertNotContains($this->propRentWholeD1->id, $ids, 'District 1 property must be excluded');
        $this->assertNotContains($this->propSaleAptD1->id, $ids, 'Sale property must be excluded');
    }

    /**
     * 7. Test Graceful Handling of Malformed or Unsupported Filter Values
     */
    public function test_invalid_filter_inputs_handle_gracefully(): void
    {
        $res = $this->getJson('/api/properties?operation=invalid_op&district=999999&min_price=-500&rooms=abc&mode=unknown');
        $res->assertOk();
        // Should return empty array or safe result without 500 error
        $this->assertIsArray($res->json());
    }

    /**
     * 8. Test Availability Ordering (Available first before reserved/rented/sold)
     */
    public function test_availability_sorting_and_order(): void
    {
        $res = $this->getJson('/api/properties?all_statuses=1');
        $res->assertOk();
        $items = $res->json();
        
        // Find indices of available vs sold/rented properties
        $availableIndices = [];
        $nonAvailableIndices = [];
        foreach ($items as $idx => $item) {
            if ($item['status'] === 'available') {
                $availableIndices[] = $idx;
            } else {
                $nonAvailableIndices[] = $idx;
            }
        }
        
        $this->assertNotEmpty($availableIndices);
        $this->assertNotEmpty($nonAvailableIndices);
    }

    /**
     * 9. Test Filter Removal & Restoring Dataset
     */
    public function test_filter_removal_and_restoring_dataset(): void
    {
        // 9.1 Restrictive combination that yields 0 results (Sale + Mode Room)
        $res0 = $this->getJson('/api/properties?operation=sale&mode=room');
        $res0->assertOk();
        $this->assertEmpty($res0->json(), 'Sale + Mode Room should produce 0 results');

        // 9.2 Remove 'mode=room' -> returns all sale properties
        $resSale = $this->getJson('/api/properties?operation=sale');
        $resSale->assertOk();
        $idsSale = collect($resSale->json())->pluck('id')->all();
        $this->assertContains($this->propSaleAptD1->id, $idsSale);
        $this->assertContains($this->propSaleOfferD1->id, $idsSale);

        // 9.3 Remove all filters (Clear all) -> returns all public active properties
        $resAll = $this->getJson('/api/properties');
        $resAll->assertOk();
        $idsAll = collect($resAll->json())->pluck('id')->all();
        $this->assertContains($this->propSaleAptD1->id, $idsAll);
        $this->assertContains($this->propRentWholeD1->id, $idsAll);
        $this->assertContains($this->propRentRoomD2->id, $idsAll);
    }
}
