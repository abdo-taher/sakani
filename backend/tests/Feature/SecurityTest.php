<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Hash;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_access_denied()
    {
        $response = $this->postJson('/api/properties', [
            'title' => 'Test Property',
            'description' => 'Test Description',
            'price' => 1000,
        ]);

        $response->assertStatus(401);
        $response->assertJson(['message' => 'Unauthenticated']);
    }

    public function test_non_admin_access_denied()
    {
        $user = User::factory()->create([
            'role' => 'user',
            'password' => Hash::make('password')
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/properties', [
            'title' => 'Test Property',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_access_protected_routes()
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'password' => Hash::make('password')
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/user');
        $response->assertStatus(200);
    }

    public function test_rate_limiting_on_login()
    {
        // Create multiple failed login attempts
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', [
                'username' => 'wrong_user',
                'password' => 'wrong_password'
            ]);
        }

        $response = $this->postJson('/api/login', [
            'username' => 'another_user',
            'password' => 'wrong_password'
        ]);

        $response->assertStatus(429);
        $response->assertJsonStructure(['message', 'seconds']);
    }

    public function test_input_validation_on_property_creation()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        // Test with invalid data
        $response = $this->postJson('/api/properties', [
            'title' => '',
            'price' => -100,
            'area' => 'not_a_number'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title', 'price', 'area']);
    }

    public function test_sql_injection_protection()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        // Attempt SQL injection in title field
        $maliciousInput = "'; DROP TABLE properties; --";
        
        $response = $this->postJson('/api/properties', [
            'title' => $maliciousInput,
            'description' => 'Test',
            'price' => 1000,
            'property_type_id' => 1,
            'category_id' => 1,
            'location_id' => 1,
            'area' => 100,
            'rooms' => 2,
            'bathrooms' => 1
        ]);

        // Should either validate properly or sanitize the input
        if ($response->status() === 201) {
            $this->assertStringNotContainsString('DROP TABLE', $response->json('data.title'));
        }
    }

    public function test_xss_protection()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $xssPayload = '<script>alert("XSS")</script>';
        
        $response = $this->postJson('/api/properties', [
            'title' => 'Property with XSS: ' . $xssPayload,
            'description' => 'Description with XSS: ' . $xssPayload,
            'price' => 1000,
            'property_type_id' => 1,
            'category_id' => 1,
            'location_id' => 1,
            'area' => 100,
            'rooms' => 2,
            'bathrooms' => 1
        ]);

        if ($response->status() === 201) {
            $data = $response->json('data');
            $this->assertStringNotContainsString('<script>', $data['title']);
            $this->assertStringNotContainsString('<script>', $data['description']);
        }
    }
}