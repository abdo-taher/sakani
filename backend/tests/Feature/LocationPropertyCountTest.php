<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Location;
use App\Models\Property;
use App\Models\PropertyType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocationPropertyCountTest extends TestCase
{
    use RefreshDatabase;

    public function test_location_counts_come_from_its_real_public_properties(): void
    {
        $category = Category::create(['name' => 'إيجار', 'slug' => 'rent']);
        $type = PropertyType::create(['category_id' => $category->id, 'name' => 'شقة']);
        $location = Location::create(['name' => 'الحي الحقيقي']);
        $otherLocation = Location::create(['name' => 'حي آخر']);

        $this->createProperty($category->id, $type->id, $location->id, 'متاح', 'available', false, 'approved', 3000);
        $this->createProperty($category->id, $type->id, $location->id, 'محجوز', 'reserved', false, 'approved', 4000);
        $this->createProperty($category->id, $type->id, $location->id, 'قيد الرفع', 'available', true, 'approved', 2000);
        $this->createProperty($category->id, $type->id, $location->id, 'غير معتمد', 'available', false, 'pending_review', 1000);
        $this->createProperty($category->id, $type->id, $otherLocation->id, 'في حي آخر', 'available', false, 'approved', 5000);

        $response = $this->getJson('/api/locations')->assertOk();
        $locationData = collect($response->json())->firstWhere('id', $location->id);

        $this->assertSame(1, $locationData['available_count']);
        $this->assertSame(2, $locationData['properties_count']);
        $this->assertSame(3000, $locationData['min_price']);
    }

    private function createProperty(
        int $categoryId,
        int $typeId,
        int $locationId,
        string $title,
        string $status,
        bool $isUploading,
        string $submissionStatus,
        float $price
    ): Property {
        return Property::create([
            'title' => $title,
            'description' => 'وصف اختباري',
            'price' => $price,
            'category_id' => $categoryId,
            'property_type_id' => $typeId,
            'location_id' => $locationId,
            'area' => 100,
            'rooms' => 2,
            'bathrooms' => 1,
            'finishing' => 'lux',
            'furnishing' => 'unfurnished',
            'status' => $status,
            'submission_status' => $submissionStatus,
            'is_uploading' => $isUploading,
        ]);
    }
}
