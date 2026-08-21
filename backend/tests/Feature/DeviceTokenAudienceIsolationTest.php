<?php

namespace Tests\Feature;

use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeviceTokenAudienceIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_token_without_phone_is_not_in_admin_audience(): void
    {
        $this->postJson('/api/device-tokens', [
            'token' => 'customer-without-phone',
            'device_type' => 'web',
        ])->assertOk();

        $this->assertFalse(
            DeviceToken::forAdmins()->where('token', 'customer-without-phone')->exists()
        );
    }

    public function test_public_endpoint_cannot_promote_token_to_admin(): void
    {
        $this->postJson('/api/device-tokens', [
            'token' => 'attempted-admin-token',
            'role' => 'admin',
            'device_type' => 'admin_web',
        ])->assertOk();

        $token = DeviceToken::where('token', 'attempted-admin-token')->firstOrFail();

        $this->assertNull($token->user_id);
        $this->assertSame('web', $token->device_type);
        $this->assertFalse(DeviceToken::forAdmins()->whereKey($token->id)->exists());
    }

    public function test_authenticated_admin_endpoint_registers_only_admin_audience_token(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/device-tokens', [
            'token' => 'real-admin-token',
            'device_type' => 'web',
        ])->assertOk();

        $token = DeviceToken::where('token', 'real-admin-token')->firstOrFail();

        $this->assertSame($admin->id, $token->user_id);
        $this->assertSame('admin_web', $token->device_type);
        $this->assertTrue(DeviceToken::forAdmins()->whereKey($token->id)->exists());
    }

    public function test_customer_registration_downgrades_existing_admin_token(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        DeviceToken::create([
            'token' => 'shared-browser-token',
            'user_id' => $admin->id,
            'device_type' => 'admin_web',
            'last_used_at' => now(),
        ]);

        $this->postJson('/api/device-tokens', [
            'token' => 'shared-browser-token',
            'phone' => '010 1234 5678',
            'device_type' => 'web',
        ])->assertOk();

        $token = DeviceToken::where('token', 'shared-browser-token')->firstOrFail();

        $this->assertNull($token->user_id);
        $this->assertSame('01012345678', $token->phone);
        $this->assertSame('web', $token->device_type);
        $this->assertFalse(DeviceToken::forAdmins()->whereKey($token->id)->exists());
    }
}
