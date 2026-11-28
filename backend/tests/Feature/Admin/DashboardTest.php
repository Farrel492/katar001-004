<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Album;
use App\Models\Aspiration;
use App\Models\Event;
use App\Models\FinanceCategory;
use App\Models\FinanceSetting;
use App\Models\FinanceTransaction;
use App\Models\User;
use App\Services\AuditLogger;
use Database\Seeders\FinanceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(FinanceSeeder::class);

        $this->admin = User::factory()->create([
            'name' => 'Admin Pengurus',
            'username' => 'admin_' . uniqid(),
            'role' => UserRole::ADMIN->value,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->superadmin = User::factory()->create([
            'name' => 'Superadmin RT',
            'username' => 'superadmin_' . uniqid(),
            'role' => UserRole::SUPERADMIN->value,
            'is_active' => true,
            'must_change_password' => false,
        ]);
    }

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
    }

    public function test_admin_and_superadmin_can_access_dashboard_with_accurate_data_and_no_sensitive_fields(): void
    {
        FinanceSetting::getSettings()->update(['opening_balance' => 1000000]);

        $catIncome = FinanceCategory::where('type', 'income')->first();
        $catExpense = FinanceCategory::where('type', 'expense')->first();

        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $catIncome->id,
            'amount' => 250000,
            'transaction_date' => now('Asia/Jakarta')->toDateString(),
            'description' => 'Iuran Bulanan',
            'status' => 'published',
            'published_at' => now(),
        ]);

        FinanceTransaction::create([
            'type' => 'expense',
            'category_id' => $catExpense->id,
            'amount' => 50000,
            'transaction_date' => now('Asia/Jakarta')->toDateString(),
            'description' => 'Konsumsi Rapat',
            'status' => 'published',
            'published_at' => now(),
        ]);

        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $catIncome->id,
            'amount' => 999999,
            'transaction_date' => now('Asia/Jakarta')->toDateString(),
            'description' => 'Draft belum terbit',
            'status' => 'draft',
        ]);

        Aspiration::create([
            'tracking_code' => 'ASP-TEST-1234',
            'category' => 'saran',
            'subject' => 'Usulan Lampu Jalan',
            'message' => 'Mohon tambah lampu di gang sebelah pos ronda.',
            'status' => 'new',
            'ip_hash' => hash('sha256', '127.0.0.1'),
        ]);

        Event::create([
            'title' => 'Kerja Bakti',
            'slug' => 'kerja-bakti',
            'summary' => 'Bersih lingkungan',
            'description' => 'Detail kerja bakti',
            'category' => 'Kegiatan',
            'starts_at' => now()->addDays(2),
            'status' => 'draft',
        ]);

        Album::create([
            'title' => 'Dokumentasi Draft',
            'slug' => 'dokumentasi-draft',
            'status' => 'draft',
        ]);

        AuditLogger::log($this->admin, 'finance_tx_published', null, [
            'secret_note' => 'tidak boleh bocor',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/api/admin/dashboard')
            ->assertStatus(200)
            ->assertJsonPath('attention.aspirations_new', 1)
            ->assertJsonPath('attention.events_draft', 1)
            ->assertJsonPath('attention.albums_draft', 1)
            ->assertJsonPath('attention.finance_draft', 1)
            ->assertJsonPath('finance.balance', 1200000)
            ->assertJsonPath('finance.income_month', 250000)
            ->assertJsonPath('finance.expense_month', 50000);

        $json = $response->json();
        $this->assertNotNull($json['finance']['last_published_at']);
        $this->assertCount(1, $json['upcoming_events']);
        $this->assertNotEmpty($json['recent_activity']);

        $firstActivity = $json['recent_activity'][0];
        $this->assertArrayHasKey('action', $firstActivity);
        $this->assertArrayHasKey('label_id', $firstActivity);
        $this->assertArrayHasKey('actor_name', $firstActivity);
        $this->assertArrayHasKey('created_at', $firstActivity);
        $this->assertArrayNotHasKey('ip_address', $firstActivity);
        $this->assertArrayNotHasKey('metadata', $firstActivity);

        // Superadmin juga bisa mengakses dashboard
        $this->actingAs($this->superadmin)
            ->getJson('/api/admin/dashboard')
            ->assertStatus(200)
            ->assertJsonPath('finance.balance', 1200000);
    }
}
