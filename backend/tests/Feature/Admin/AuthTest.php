<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Ensure rate limiter is reset for each test
        $this->artisan('cache:clear');
    }

    /** @test */
    public function login_success_without_token_and_audit_logged()
    {
        $user = User::factory()->create([
            'username' => 'adminuser',
            'password' => Hash::make('StrongPass123'),
            'must_change_password' => false,
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/admin/login', [
            'username' => 'adminuser',
            'password' => 'StrongPass123',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ]);

        $response->assertOk();
        $response->assertJson(['must_change_password' => false]);
        $this->assertNotNull($user->fresh()->last_login_at);
        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $user->id,
            'action' => 'login_success',
        ]);
    }

    /** @test */
    public function login_fails_with_generic_message_for_invalid_credentials_and_audit_logged()
    {
        // User does not exist
        $response = $this->postJson('/api/admin/login', [
            'username' => 'nosuch',
            'password' => 'any',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ]);
        $response->assertStatus(401);
        $response->assertJson(['message' => 'Username atau kata sandi salah.']);
        $this->assertDatabaseMissing('audit_logs', ['action' => 'login_success']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'login_failed', 'user_id' => null]);

        // Wrong password
        $user = User::factory()->create([
            'username' => 'adminuser',
            'password' => Hash::make('CorrectPass'),
        ]);
        $response = $this->postJson('/api/admin/login', [
            'username' => 'adminuser',
            'password' => 'WrongPass',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ]);
        $response->assertStatus(401);
        $response->assertJson(['message' => 'Username atau kata sandi salah.']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'login_failed', 'user_id' => $user->id]);

        // Inactive account
        $inactive = User::factory()->create([
            'username' => 'inactive',
            'password' => Hash::make('Pass12345'),
            'is_active' => false,
        ]);
        $response = $this->postJson('/api/admin/login', [
            'username' => 'inactive',
            'password' => 'Pass12345',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ]);
        $response->assertStatus(401);
        $response->assertJson(['message' => 'Username atau kata sandi salah.']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'login_failed', 'user_id' => $inactive->id]);

        // Soft‑deleted account
        $deleted = User::factory()->create([
            'username' => 'deleted',
            'password' => Hash::make('Pass12345'),
        ]);
        $deleted->delete();
        $response = $this->postJson('/api/admin/login', [
            'username' => 'deleted',
            'password' => 'Pass12345',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ]);
        $response->assertStatus(401);
        $response->assertJson(['message' => 'Username atau kata sandi salah.']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'login_failed', 'user_id' => $deleted->id]);
    }

    /** @test */
    public function login_is_rate_limited_after_five_failed_attempts()
    {
        $user = User::factory()->create([
            'username' => 'ratelimit',
            'password' => Hash::make('CorrectPass'),
        ]);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/login', [
                'username' => 'ratelimit',
                'password' => 'Wrong'.$i,
            ], [
                'Origin' => 'http://localhost:5173',
                'Referer' => 'http://localhost:5173',
            ])->assertStatus(401);
        }
        $response = $this->postJson('/api/admin/login', [
            'username' => 'ratelimit',
            'password' => 'Wrong5',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ]);
        $response->assertStatus(429);
        $response->assertHeader('Retry-After');
    }

    /** @test */
    public function me_endpoint_requires_authentication()
    {
        $this->getJson('/api/admin/me')->assertStatus(401);
    }

    /** @test */
    public function logout_invalidates_session_and_audit_logged()
    {
        $user = User::factory()->create([
            'username' => 'logoutuser',
            'password' => Hash::make('Pass123'),
        ]);
        $this->postJson('/api/admin/login', [
            'username' => 'logoutuser',
            'password' => 'Pass123',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ])->assertOk();

        $response = $this->postJson('/api/admin/logout');
        $response->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'logout', 'user_id' => $user->id]);
        // Subsequent protected request should be unauthenticated
        $this->getJson('/api/admin/me')->assertStatus(401);
    }

    /** @test */
    public function must_change_password_blocks_other_admin_routes()
    {
        $user = User::factory()->create([
            'username' => 'mustchange',
            'password' => Hash::make('Pass123'),
            'must_change_password' => true,
        ]);
        $this->postJson('/api/admin/login', [
            'username' => 'mustchange',
            'password' => 'Pass123',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ])->assertOk();

        // Attempt a protected route not in whitelist
        $response = $this->getJson('/api/admin/me'); // whitelisted, should pass
        $response->assertOk();

        // Simulate another route (e.g., /admin/some-other) – we just call middleware directly
        $response = $this->postJson('/api/admin/logout'); // whitelisted, should pass
        $response->assertOk();

        // Custom route to test block (use dummy route)
        Route::middleware(['auth:sanctum', 'admin.active', 'admin.password_change'])->get('/api/admin/blocked', fn() => []);
        $response = $this->getJson('/api/admin/blocked');
        $response->assertStatus(403);
        $response->assertJson(['code' => 'password_change_required']);
    }

    /** @test */
    public function change_password_validation_and_success()
    {
        $user = User::factory()->create([
            'username' => 'changepass',
            'password' => Hash::make('OldPass123'),
            'must_change_password' => true,
        ]);
        $this->postJson('/api/admin/login', [
            'username' => 'changepass',
            'password' => 'OldPass123',
        ], [
            'Origin' => 'http://localhost:5173',
            'Referer' => 'http://localhost:5173',
        ])->assertOk();

        // Old password wrong
        $this->putJson('/api/admin/me/password', [
            'old_password' => 'WrongOld',
            'password' => 'NewStrong123',
            'password_confirmation' => 'NewStrong123',
        ])->assertStatus(422);

        // Too short
        $this->putJson('/api/admin/me/password', [
            'old_password' => 'OldPass123',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertStatus(422);

        // Contains username
        $this->putJson('/api/admin/me/password', [
            'old_password' => 'OldPass123',
            'password' => 'changepass123',
            'password_confirmation' => 'changepass123',
        ])->assertStatus(422);

        // Same as old
        $this->putJson('/api/admin/me/password', [
            'old_password' => 'OldPass123',
            'password' => 'OldPass123',
            'password_confirmation' => 'OldPass123',
        ])->assertStatus(422);

        // Successful change
        $response = $this->putJson('/api/admin/me/password', [
            'old_password' => 'OldPass123',
            'password' => 'NewStrong123',
            'password_confirmation' => 'NewStrong123',
        ]);
        $response->assertOk();
        $this->assertFalse($user->fresh()->must_change_password);
        $this->assertDatabaseHas('audit_logs', ['action' => 'password_changed', 'user_id' => $user->id]);
    }

    /** @test */
    public function gate_manage_users_allows_only_active_superadmin()
    {
        $super = User::factory()->create([
            'username' => 'superadmin',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
        ]);
        $admin = User::factory()->create([
            'username' => 'admin',
            'role' => UserRole::ADMIN,
            'is_active' => true,
        ]);
        $inactiveSuper = User::factory()->create([
            'username' => 'inactiveSuper',
            'role' => UserRole::SUPERADMIN,
            'is_active' => false,
        ]);

        $this->assertTrue(gate()->allows('manage-users', $super));
        $this->assertFalse(gate()->allows('manage-users', $admin));
        $this->assertFalse(gate()->allows('manage-users', $inactiveSuper));
    }

    /** @test */
    public function admin_create_command_creates_user_and_respects_rules()
    {
        // Successful creation
        $this->artisan('admin:create testuser', ['--role' => 'admin'])
            ->expectsQuestion('Password', 'StrongPass123')
            ->expectsQuestion('Confirm password', 'StrongPass123')
            ->expectsOutput('User \"testuser\" dengan role \"admin\" berhasil dibuat.')
            ->assertSuccessful();

        $this->assertDatabaseHas('users', ['username' => 'testuser', 'role' => UserRole::ADMIN->value]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'user_created_cli']);

        // Duplicate username
        $this->artisan('admin:create testuser')
            ->expectsOutput('Username sudah dipakai (termasuk yang soft‑deleted).')
            ->assertFailed();

        // Weak password (policy enforced)
        $this->artisan('admin:create weakuser')
            ->expectsQuestion('Password', 'short')
            ->expectsQuestion('Confirm password', 'short')
            ->expectsOutput('Password tidak memenuhi kebijakan keamanan.')
            ->assertFailed();
    }

    /** @test */
    public function health_endpoint_is_accessible()
    {
        $this->getJson('/api/health')->assertOk();
    }
}
