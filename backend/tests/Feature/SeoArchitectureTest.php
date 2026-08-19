<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Property;
use App\Models\Location;
use App\Models\Category;
use App\Models\PropertyType;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SeoArchitectureTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_xml_returns_valid_response_and_public_urls()
    {
        $category = Category::create(['name' => 'إيجار', 'slug' => 'rent']);
        $propType = PropertyType::create(['name' => 'شقة', 'slug' => 'apartment', 'category_id' => $category->id]);
        $location = Location::create(['name' => 'الحي المتميز', 'slug' => 'hay-motamayez']);

        $publishedProperty = Property::create([
            'title' => 'شقة فاخرة للإيجار بالحي المتميز',
            'description' => 'شقة سكنية ممتازة كاملة التشطيب في الحي المتميز دمياط الجديدة',
            'price' => 5000,
            'area' => 140,
            'rooms' => 3,
            'bathrooms' => 2,
            'finishing' => 'super_lux',
            'furnishing' => 'furnished',
            'category_id' => $category->id,
            'property_type_id' => $propType->id,
            'location_id' => $location->id,
            'status' => 'available',
            'submission_status' => 'approved',
            'is_uploading' => false,
        ]);

        $pendingProperty = Property::create([
            'title' => 'شقة قيد المراجعة',
            'description' => 'شقة لا تزال تحت المراجعة الفنية',
            'price' => 3000,
            'area' => 100,
            'rooms' => 2,
            'bathrooms' => 1,
            'finishing' => 'lux',
            'furnishing' => 'unfurnished',
            'category_id' => $category->id,
            'property_type_id' => $propType->id,
            'location_id' => $location->id,
            'status' => 'pending_review',
            'submission_status' => 'pending_review',
            'is_uploading' => false,
        ]);

        $response = $this->get('/sitemap.xml');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/xml; charset=utf-8');

        $content = $response->getContent();
        $this->assertStringContainsString('https://sakani.site/', $content);
        $this->assertStringContainsString('https://sakani.site/rent', $content);
        $this->assertStringContainsString('https://sakani.site/buy', $content);
        $this->assertStringContainsString('https://sakani.site/places/hay-motamayez', $content);
        $this->assertStringContainsString((string)$publishedProperty->id, $content);
        $this->assertStringNotContainsString('شقة قيد المراجعة', $content);
        $this->assertStringNotContainsString('/admin', $content);
        $this->assertStringNotContainsString('/my-reservations', $content);
    }

    public function test_robots_txt_returns_valid_directives()
    {
        $response = $this->get('/robots.txt');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/plain; charset=utf-8');

        $content = $response->getContent();
        $this->assertStringContainsString('User-agent: *', $content);
        $this->assertStringContainsString('Allow: /', $content);
        $this->assertStringContainsString('Disallow: /admin', $content);
        $this->assertStringContainsString('Disallow: /my-reservations', $content);
        $this->assertStringContainsString('Sitemap: https://sakani.site/sitemap.xml', $content);
    }

    public function test_property_generates_unique_slug_and_canonical_url()
    {
        $category = Category::create(['name' => 'بيع', 'slug' => 'sale']);
        $propType = PropertyType::create(['name' => 'شقة', 'slug' => 'apartment', 'category_id' => $category->id]);
        $location = Location::create(['name' => 'المنطقة المركزية', 'slug' => 'markazia']);

        $property = Property::create([
            'title' => 'شقة للبيع بالمنطقة المركزية',
            'description' => 'شقة تمليك واجهة بحرية في المنطقة المركزية',
            'price' => 1500000,
            'area' => 120,
            'rooms' => 3,
            'bathrooms' => 2,
            'finishing' => 'super_lux',
            'furnishing' => 'unfurnished',
            'category_id' => $category->id,
            'property_type_id' => $propType->id,
            'location_id' => $location->id,
            'status' => 'available',
            'submission_status' => 'approved',
            'is_uploading' => false,
        ]);

        $this->assertNotEmpty($property->slug);
        $this->assertStringContainsString((string)$property->id, $property->slug);
        $this->assertNotEmpty($property->canonical_url);
        $this->assertStringContainsString('https://sakani.site/properties/', $property->canonical_url);
    }
}
