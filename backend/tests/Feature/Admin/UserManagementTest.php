<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected array $headers = [
        'Origin' => 'http://localhost:5173',
        'Referer' => 'http://localhost:5173',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        config(['sanctum.stateful' => ['localhost:5173']]);
    }

    protected function authAs(User $user): self
    {
        Sanctum::actingAs($user, ['*']);
        $this->actingAs($user, 'web');
        return $this;
    }

    public function test_unauthenticated_request_to_all_five_routes_returns_401(): void
    {
        $dummy = User::factory()->create([
            'username' => 'targetuser',
            'role' => UserRole::ADMIN,
            'is_active' => true,
        ]);

        $this->getJson('/api/admin/users', $this->headers)->assertStatus(401);
        $this->postJson('/api/admin/users', ['name' => 'Test', 'username' => 'testuser', 'role' => 'admin'], $this->headers)->assertStatus(401);
        $this->patchJson("/api/admin/users/{$dummy->id}", ['name' => 'Updated'], $this->headers)->assertStatus(401);
        $this->postJson("/api/admin/users/{$dummy->id}/reset-password", [], $this->headers)->assertStatus(401);
        $this->deleteJson("/api/admin/users/{$dummy->id}", [], $this->headers)->assertStatus(401);
    }

    public function test_regular_admin_access_to_all_five_routes_returns_403(): void
    {
        $admin = User::factory()->create([
            'username' => 'regularadmin',
            'role' => UserRole::ADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $target = User::factory()->create([
            'username' => 'targetadmin',
            'role' => UserRole::ADMIN,
            'is_active' => true,
        ]);

        $this->authAs($admin);

        $this->getJson('/api/admin/users', $this->headers)->assertStatus(403);
        $this->postJson('/api/admin/users', ['name' => 'Baru', 'username' => 'barutanpaakses', 'role' => 'admin'], $this->headers)->assertStatus(403);
        $this->patchJson("/api/admin/users/{$target->id}", ['name' => 'Coba Ubah'], $this->headers)->assertStatus(403);
        $this->postJson("/api/admin/users/{$target->id}/reset-password", [], $this->headers)->assertStatus(403);
        $this->deleteJson("/api/admin/users/{$target->id}", [], $this->headers)->assertStatus(403);
    }

    public function test_index_lists_users_ordered_without_sensitive_fields(): void
    {
        $super = User::factory()->create([
            'name' => 'Budi Super',
            'username' => 'budisuper',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $adminA = User::factory()->create([
            'name' => 'Anton Admin',
            'username' => 'antonadmin',
            'role' => UserRole::ADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $adminZ = User::factory()->create([
            'name' => 'Zainal Admin',
            'username' => 'zainaladmin',
            'role' => UserRole::ADMIN,
            'is_active' => false,
            'must_change_password' => true,
        ]);

        $this->authAs($super);

        $response = $this->getJson('/api/admin/users', $this->headers);
        $response->assertOk();
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'name',
                    'username',
                    'role',
                    'is_active',
                    'must_change_password',
                    'last_login_at',
                    'created_at',
                    'is_self',
                ],
            ],
        ]);

        $json = $response->json('data');
        $this->assertNotEmpty($json);

        // Pastikan tidak ada data sensitif
        foreach ($json as $item) {
            $this->assertArrayNotHasKey('password', $item);
            $this->assertArrayNotHasKey('remember_token', $item);
            $this->assertArrayNotHasKey('email_verified_at', $item);
        }

        // Akun superadmin harus ada di depan
        $this->assertEquals('budisuper', $json[0]['username']);
        $this->assertTrue($json[0]['is_self']);
        $this->assertFalse($json[1]['is_self']);
    }

    public function test_create_user_success_generates_temporary_password_and_audits_without_password(): void
    {
        $super = User::factory()->create([
            'username' => 'supercreator',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->authAs($super);

        $payload = [
            'name' => 'Admin Baru Karang Taruna',
            'username' => 'admin.baru01',
            'role' => 'admin',
        ];

        $response = $this->postJson('/api/admin/users', $payload, $this->headers);
        $response->assertStatus(201);
        $response->assertHeader('Cache-Control');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));

        $data = $response->json();
        $this->assertArrayHasKey('data', $data);
        $this->assertArrayHasKey('temporary_password', $data);

        $tempPassword = $data['temporary_password'];
        // Format harus 4 kelompok x 4 karakter alfabet yang ditentukan dipisah strip: xxxx-xxxx-xxxx-xxxx
        $this->assertMatchesRegularExpression('/^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$/', $tempPassword);
        // Sandi sementara tidak boleh mengandung username
        $this->assertFalse(str_contains(strtolower($tempPassword), 'admin.baru01'));

        $createdUser = User::where('username', 'admin.baru01')->first();
        $this->assertNotNull($createdUser);
        $this->assertTrue($createdUser->is_active);
        $this->assertTrue($createdUser->must_change_password);
        $this->assertTrue(Hash::check($tempPassword, $createdUser->password));

        // Verifikasi audit log ada dan TANPA kata sandi
        $auditLog = DB::table('audit_logs')
            ->where('action', 'user_created')
            ->where('user_id', $super->id)
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertStringNotContainsString($tempPassword, (string) $auditLog->metadata);
    }

    public function test_create_user_validation_fails_for_invalid_or_duplicate_username_including_soft_deleted(): void
    {
        $super = User::factory()->create([
            'username' => 'superadminvalid',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        // Akun aktif
        User::factory()->create([
            'username' => 'existing.user',
            'role' => UserRole::ADMIN,
        ]);

        // Akun yang sudah dihapus (soft-deleted)
        $softDeleted = User::factory()->create([
            'username' => 'deleted.user',
            'role' => UserRole::ADMIN,
        ]);
        $softDeleted->delete();

        $this->authAs($super);

        // Username regex tidak valid (mengandung spasi atau simbol terlarang)
        $this->postJson('/api/admin/users', [
            'name' => 'Nama Test',
            'username' => 'user invalid!',
            'role' => 'admin',
        ], $this->headers)->assertStatus(422)->assertJsonValidationErrors(['username']);

        // Username terlalu pendek
        $this->postJson('/api/admin/users', [
            'name' => 'Nama Test',
            'username' => 'ab',
            'role' => 'admin',
        ], $this->headers)->assertStatus(422)->assertJsonValidationErrors(['username']);

        // Username ganda dengan akun aktif
        $this->postJson('/api/admin/users', [
            'name' => 'Nama Test',
            'username' => 'existing.user',
            'role' => 'admin',
        ], $this->headers)->assertStatus(422)->assertJsonValidationErrors(['username']);

        // Username ganda dengan akun soft-deleted
        $this->postJson('/api/admin/users', [
            'name' => 'Nama Test',
            'username' => 'deleted.user',
            'role' => 'admin',
        ], $this->headers)->assertStatus(422)->assertJsonValidationErrors(['username']);
    }

    public function test_update_other_user_success(): void
    {
        $super = User::factory()->create([
            'username' => 'superupdater',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $target = User::factory()->create([
            'name' => 'Nama Lama',
            'username' => 'targettoupdate',
            'role' => UserRole::ADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->authAs($super);

        $response = $this->patchJson("/api/admin/users/{$target->id}", [
            'name' => 'Nama Baru Diedit',
            'role' => 'admin',
            'is_active' => false,
        ], $this->headers);

        $response->assertOk();
        $this->assertEquals('Nama Baru Diedit', $response->json('data.name'));
        $this->assertFalse($response->json('data.is_active'));

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'user_updated',
            'user_id' => $super->id,
        ]);
    }

    public function test_user_cannot_change_own_role_or_deactivate_self(): void
    {
        $super = User::factory()->create([
            'username' => 'selfsuper',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->authAs($super);

        // Mencoba menurunkan role sendiri
        $response1 = $this->patchJson("/api/admin/users/{$super->id}", [
            'role' => 'admin',
        ], $this->headers);
        $response1->assertStatus(422);
        $response1->assertJson(['message' => 'Anda tidak dapat mengubah peran akun Anda sendiri.']);

        // Mencoba menonaktifkan akun sendiri
        $response2 = $this->patchJson("/api/admin/users/{$super->id}", [
            'is_active' => false,
        ], $this->headers);
        $response2->assertStatus(422);
        $response2->assertJson(['message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.']);
    }

    public function test_cannot_demote_or_deactivate_last_active_superadmin(): void
    {
        // Target adalah satu-satunya superadmin aktif di database
        $targetSuper = User::factory()->create([
            'username' => 'targetsuperone',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        // Akun pemanggil aktif
        $caller = User::factory()->create([
            'username' => 'calleradmin',
            'role' => UserRole::ADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        // Izinkan gate manage-users untuk pemanggil dalam pengujian batas ini
        \Illuminate\Support\Facades\Gate::define('manage-users', fn() => true);

        $this->authAs($caller);

        $res = $this->patchJson("/api/admin/users/{$targetSuper->id}", [
            'role' => 'admin',
        ], $this->headers);
        $res->assertStatus(422);
        $res->assertJson(['message' => 'Tidak dapat menurunkan peran superadmin aktif terakhir.']);

        $res2 = $this->patchJson("/api/admin/users/{$targetSuper->id}", [
            'is_active' => false,
        ], $this->headers);
        $res2->assertStatus(422);
        $res2->assertJson(['message' => 'Tidak dapat menonaktifkan superadmin aktif terakhir.']);

        // Uji juga pada destroy: tidak boleh hapus superadmin aktif terakhir
        $res3 = $this->deleteJson("/api/admin/users/{$targetSuper->id}", [], $this->headers);
        $res3->assertStatus(422);
        $res3->assertJson(['message' => 'Tidak dapat menghapus superadmin aktif terakhir.']);
    }

    public function test_reset_password_generates_new_temp_password_and_cannot_reset_self(): void
    {
        $super = User::factory()->create([
            'username' => 'superresetter',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $target = User::factory()->create([
            'username' => 'targettoreset',
            'role' => UserRole::ADMIN,
            'password' => Hash::make('OldHash123'),
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->authAs($super);

        // Reset akun sendiri harus gagal 422
        $selfReset = $this->postJson("/api/admin/users/{$super->id}/reset-password", [], $this->headers);
        $selfReset->assertStatus(422);

        // Reset target berhasil
        $response = $this->postJson("/api/admin/users/{$target->id}/reset-password", [], $this->headers);
        $response->assertOk();
        $response->assertHeader('Cache-Control');
        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));

        $data = $response->json();
        $this->assertArrayHasKey('temporary_password', $data);
        $newTempPassword = $data['temporary_password'];

        $targetFresh = $target->fresh();
        $this->assertTrue($targetFresh->must_change_password);
        $this->assertTrue(Hash::check($newTempPassword, $targetFresh->password));

        // Audit log
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'user_password_reset',
            'user_id' => $super->id,
        ]);
    }

    public function test_soft_delete_cannot_delete_self_and_deleted_user_returns_404_on_patch(): void
    {
        $super = User::factory()->create([
            'username' => 'superdestroyer',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $target = User::factory()->create([
            'username' => 'targettodelete',
            'role' => UserRole::ADMIN,
            'is_active' => true,
        ]);

        $this->authAs($super);

        // Tidak bisa hapus diri sendiri
        $selfDelete = $this->deleteJson("/api/admin/users/{$super->id}", [], $this->headers);
        $selfDelete->assertStatus(422);
        $selfDelete->assertJson(['message' => 'Anda tidak dapat menghapus akun Anda sendiri.']);

        // Hapus target
        $response = $this->deleteJson("/api/admin/users/{$target->id}", [], $this->headers);
        $response->assertOk();
        $response->assertJson(['message' => 'Akun berhasil dihapus.']);

        $this->assertSoftDeleted('users', ['id' => $target->id]);
        $this->assertFalse($target->fresh()->is_active);

        // Akun terhapus -> 404 pada PATCH
        $this->patchJson("/api/admin/users/{$target->id}", [
            'name' => 'Nama Baru',
        ], $this->headers)->assertStatus(404);
    }
}
