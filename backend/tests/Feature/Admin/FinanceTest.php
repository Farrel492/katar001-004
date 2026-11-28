<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\FinanceCategory;
use App\Models\FinanceSetting;
use App\Models\FinanceTransaction;
use App\Models\User;
use Database\Seeders\FinanceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FinanceTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $superadmin;
    private FinanceCategory $catIncome;
    private FinanceCategory $catExpense;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(FinanceSeeder::class);

        $this->admin = User::factory()->create([
            'username' => 'admin_' . uniqid(),
            'role' => UserRole::ADMIN->value,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->superadmin = User::factory()->create([
            'username' => 'superadmin_' . uniqid(),
            'role' => UserRole::SUPERADMIN->value,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->catIncome = FinanceCategory::where('type', 'income')->first();
        $this->catExpense = FinanceCategory::where('type', 'expense')->first();
    }

    /** 1. Saldo benar (integer) dihitung dari opening + published income - published expense. */
    public function test_balance_calculation_exact_integer(): void
    {
        FinanceSetting::getSettings()->update(['opening_balance' => 500000]);

        // Income published: 1.000.000
        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 1000000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Iuran Warga Periode 1',
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Expense published: 300.000
        FinanceTransaction::create([
            'type' => 'expense',
            'category_id' => $this->catExpense->id,
            'amount' => 300000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Beli Perlengkapan Rapat',
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Draft: 2.000.000 (tidak boleh masuk hitungan saldo)
        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 2000000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Draft Belum Disetujui',
            'status' => 'draft',
        ]);

        // Saldo = 500.000 + 1.000.000 - 300.000 = 1.200.000
        $this->assertEquals(1200000, FinanceTransaction::calculateCurrentBalance());

        $response = $this->getJson('/api/public/finance/summary');
        $response->assertStatus(200)
            ->assertJson([
                'balance' => 1200000,
                'total_income_year' => 1000000,
                'total_expense_year' => 300000,
                'net_year' => 700000,
            ]);
    }

    /** 2. Draft tidak muncul di publik / summary. */
    public function test_draft_does_not_appear_in_public(): void
    {
        $draft = FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 750000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Pemasukan Rahasia Draft',
            'status' => 'draft',
        ]);

        $pubTxResponse = $this->getJson('/api/public/finance/transactions');
        $pubTxResponse->assertStatus(200);
        $data = $pubTxResponse->json('data');
        $this->assertCount(0, $data);
    }

    /** 3. Transaksi published tidak bisa diubah atau dihapus (422). */
    public function test_published_transaction_cannot_be_updated_or_deleted(): void
    {
        $tx = FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 100000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Transaksi Terbit',
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Coba Update -> tolak 422
        $this->actingAs($this->admin)
            ->patchJson("/api/admin/finance/transactions/{$tx->id}", [
                'amount' => 200000,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        // Coba Delete -> tolak 422
        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/finance/transactions/{$tx->id}")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);

        $this->assertDatabaseHas('finance_transactions', ['id' => $tx->id, 'deleted_at' => null]);
    }

    /** 4. Koreksi membuat entri pembalik + pengganti atomik & saldo tepat. */
    public function test_correction_creates_reversing_and_replacement_atomically(): void
    {
        FinanceSetting::getSettings()->update(['opening_balance' => 0]);

        // Transaksi awal salah: Pemasukan 500.000 (seharusnya 350.000)
        $tx = FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 500000,
            'transaction_date' => '2026-05-10',
            'description' => 'Iuran Warga RT Awal',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->assertEquals(500000, FinanceTransaction::calculateCurrentBalance());

        $response = $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$tx->id}/correct", [
                'correction_reason' => 'Salah input nominal slip bank',
                'replacement' => [
                    'type' => 'income',
                    'category_id' => $this->catIncome->id,
                    'amount' => 350000,
                    'transaction_date' => '2026-05-10',
                    'description' => 'Iuran Warga RT Revisi',
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'reversing_transaction', 'replacement_transaction']);

        // Cek entri pembalik di DB: type = expense (karena aslinya income), amount = 500.000, published
        $this->assertDatabaseHas('finance_transactions', [
            'corrects_id' => $tx->id,
            'type' => 'expense',
            'amount' => 500000,
            'status' => 'published',
            'correction_reason' => 'Salah input nominal slip bank',
        ]);

        // Cek entri pengganti di DB: type = income, amount = 350.000, published
        $this->assertDatabaseHas('finance_transactions', [
            'corrects_id' => $tx->id,
            'type' => 'income',
            'amount' => 350000,
            'status' => 'published',
            'description' => 'Iuran Warga RT Revisi',
        ]);

        // Saldo sekarang = 500.000 - 500.000 (pembalik) + 350.000 (pengganti) = 350.000
        $this->assertEquals(350000, FinanceTransaction::calculateCurrentBalance());
    }

    /** 5. Koreksi ganda ditolak & koreksi atas pembalik ditolak (422). */
    public function test_duplicate_correction_and_correcting_reversal_entry_rejected(): void
    {
        $tx = FinanceTransaction::create([
            'type' => 'expense',
            'category_id' => $this->catExpense->id,
            'amount' => 200000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Biaya Konsumsi',
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Koreksi pertama kali -> sukses
        $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$tx->id}/correct", [
                'correction_reason' => 'Koreksi pertama',
            ])
            ->assertStatus(201);

        // Koreksi kedua kali pada transaksi yang sama -> tolak 422
        $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$tx->id}/correct", [
                'correction_reason' => 'Koreksi kedua kali tidak diizinkan',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['corrects_id']);

        // Ambil entri pembalik yang baru dibuat
        $reversal = FinanceTransaction::where('corrects_id', $tx->id)->first();
        $this->assertNotNull($reversal);

        // Coba koreksi entri pembalik -> tolak 422
        $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$reversal->id}/correct", [
                'correction_reason' => 'Mencoba koreksi pembalik',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['corrects_id']);
    }

    /** 6. Alasan koreksi wajib diisi. */
    public function test_correction_reason_is_required(): void
    {
        $tx = FinanceTransaction::create([
            'type' => 'expense',
            'category_id' => $this->catExpense->id,
            'amount' => 150000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Biaya Spanduk',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$tx->id}/correct", [
                'correction_reason' => '',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['correction_reason']);
    }

    /** 7. Nominal 0, negatif, desimal, atau berlebih (> 1 milyar) ditolak. */
    public function test_invalid_amounts_are_rejected(): void
    {
        // 0 rupiah
        $this->actingAs($this->admin)->postJson('/api/admin/finance/transactions', [
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 0,
            'transaction_date' => now()->toDateString(),
            'description' => 'Test 0',
        ])->assertStatus(422)->assertJsonValidationErrors(['amount']);

        // Negatif
        $this->actingAs($this->admin)->postJson('/api/admin/finance/transactions', [
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => -50000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Test Negatif',
        ])->assertStatus(422)->assertJsonValidationErrors(['amount']);

        // Melebihi 1 milyar
        $this->actingAs($this->admin)->postJson('/api/admin/finance/transactions', [
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 1000000001,
            'transaction_date' => now()->toDateString(),
            'description' => 'Test Melebihi 1M',
        ])->assertStatus(422)->assertJsonValidationErrors(['amount']);

        // Desimal string / float
        $this->actingAs($this->admin)->postJson('/api/admin/finance/transactions', [
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 15000.75,
            'transaction_date' => now()->toDateString(),
            'description' => 'Test Desimal',
        ])->assertStatus(422)->assertJsonValidationErrors(['amount']);
    }

    /** 8. Admin biasa DAN superadmin sama-sama bisa mengubah saldo awal & kategori (audit mencatat nilai lama/baru). */
    public function test_both_admin_and_superadmin_can_update_settings_and_categories(): void
    {
        // 1. Admin biasa ubah saldo awal
        $this->actingAs($this->admin)
            ->putJson('/api/admin/finance/settings', [
                'opening_balance' => 1500000,
                'opening_date' => '2026-01-01',
            ])
            ->assertStatus(200)
            ->assertJson(['opening_balance' => 1500000]);

        $logAdmin = DB::table('audit_logs')->where('action', 'finance_opening_changed')->latest()->first();
        $this->assertNotNull($logAdmin);
        $metaAdmin = json_decode($logAdmin->metadata, true);
        $this->assertEquals(0, $metaAdmin['old_balance']);
        $this->assertEquals(1500000, $metaAdmin['new_balance']);

        // 2. Superadmin ubah saldo awal lagi
        $this->actingAs($this->superadmin)
            ->putJson('/api/admin/finance/settings', [
                'opening_balance' => 2000000,
                'opening_date' => '2026-01-01',
            ])
            ->assertStatus(200)
            ->assertJson(['opening_balance' => 2000000]);

        $logSuper = DB::table('audit_logs')->where('action', 'finance_opening_changed')->orderBy('id', 'desc')->first();
        $metaSuper = json_decode($logSuper->metadata, true);
        $this->assertEquals(1500000, $metaSuper['old_balance']);
        $this->assertEquals(2000000, $metaSuper['new_balance']);

        // 3. Admin biasa dan Superadmin buat & ubah kategori
        $this->actingAs($this->admin)
            ->postJson('/api/admin/finance/categories', [
                'name' => 'Sponsorship Khusus',
                'type' => 'income',
                'is_active' => true,
            ])
            ->assertStatus(201);

        $cat = FinanceCategory::where('name', 'Sponsorship Khusus')->first();

        $this->actingAs($this->superadmin)
            ->patchJson("/api/admin/finance/categories/{$cat->id}", [
                'is_active' => false,
            ])
            ->assertStatus(200)
            ->assertJson(['is_active' => false]);
    }

    /** 9. Counterparty tidak bocor kecuali counterparty_public=true. */
    public function test_counterparty_visibility_policy(): void
    {
        // 1. counterparty_public = false
        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 500000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Sumbangan Warga',
            'counterparty' => 'Bapak Hartono Rumah No 5',
            'counterparty_public' => false,
            'status' => 'published',
            'published_at' => now(),
        ]);

        // 2. counterparty_public = true
        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 1000000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Sponsorship Perusahaan',
            'counterparty' => 'PT Sumber Rejeki Berkah',
            'counterparty_public' => true,
            'status' => 'published',
            'published_at' => now(),
        ]);

        $res = $this->getJson('/api/public/finance/transactions');
        $res->assertStatus(200);
        $data = $res->json('data');

        $this->assertCount(2, $data);
        // Transaksi 1: disamarkan jadi Warga/Donatur
        $this->assertEquals('Warga/Donatur', $data[1]['counterparty_label']);
        $this->assertStringNotContainsString('Hartono', json_encode($data[1]));

        // Transaksi 2: tampil nama perusahaannya
        $this->assertEquals('PT Sumber Rejeki Berkah', $data[0]['counterparty_label']);
    }

    /** 10. Bukti nota tersimpan di disk private dan hanya dapat diakses admin login. */
    public function test_proof_storage_private_and_access_controlled(): void
    {
        Storage::fake('local');

        $tx = FinanceTransaction::create([
            'type' => 'expense',
            'category_id' => $this->catExpense->id,
            'amount' => 125000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Beli Baterai Mic Balai RT',
            'status' => 'draft',
            'proof_path' => 'finance_proofs/dummy.jpg',
        ]);
        Storage::disk('local')->put('finance_proofs/dummy.jpg', 'binary_content');

        // 1. Publik (tanpa login) mencoba ambil bukti -> 401
        $this->getJson("/api/admin/finance/transactions/{$tx->id}/proof")
            ->assertStatus(401);

        // 2. Admin login dapat mengambil bukti nota
        $streamRes = $this->actingAs($this->admin)
            ->get("/api/admin/finance/transactions/{$tx->id}/proof");
        $streamRes->assertStatus(200);

        // 3. Upload bukti nota baru menggantikan yang lama
        $fakeImage = UploadedFile::fake()->image('nota.jpg', 600, 600);
        $uploadRes = $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$tx->id}/proof", [
                'proof' => $fakeImage,
            ]);
        $uploadRes->assertStatus(200);

        $tx->refresh();
        $this->assertNotNull($tx->proof_path);
        // Pastikan tersimpan di disk local (private), BUKAN di disk public
        Storage::disk('local')->assertExists($tx->proof_path);
        Storage::disk('public')->assertMissing($tx->proof_path);

        // 4. Hapus bukti nota
        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/finance/transactions/{$tx->id}/proof")
            ->assertStatus(200);

        $tx->refresh();
        $this->assertNull($tx->proof_path);
    }

    /** 11. Unggahan bukti palsu / non-gambar / > 2MB ditolak. */
    public function test_invalid_proof_upload_rejected(): void
    {
        Storage::fake('local');

        $tx = FinanceTransaction::create([
            'type' => 'expense',
            'category_id' => $this->catExpense->id,
            'amount' => 50000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Beli Alat Tulis',
            'status' => 'draft',
        ]);

        // Berkas teks palsu dinamai jpg
        $fakeTxt = UploadedFile::fake()->create('fake_nota.jpg', 10, 'text/plain');
        $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$tx->id}/proof", ['proof' => $fakeTxt])
            ->assertStatus(422);

        // Berkas lebih dari 2MB
        $oversized = UploadedFile::fake()->image('big_nota.jpg')->size(2500);
        $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$tx->id}/proof", ['proof' => $oversized])
            ->assertStatus(422);
    }

    /** 12. Ekspor CSV melindungi formula injection dan menyertakan UTF-8 BOM. */
    public function test_csv_export_protects_formula_injection_and_includes_bom(): void
    {
        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 100000,
            'transaction_date' => '2026-06-15',
            'description' => '=1+1 DDE Command Test',
            'counterparty' => '@MaliciousUser',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)
            ->get('/api/admin/finance/export?year=2026');

        $response->assertStatus(200);
        $this->assertTrue($response->headers->contains('content-type', 'text/csv; charset=UTF-8'));

        $content = $response->streamedContent();

        // 1. Cek adanya BOM UTF-8 di byte awal
        $this->assertStringStartsWith("\xEF\xBB\xBF", $content);

        // 2. Cek formula injection disanitasi dengan awalan single quote (')
        $this->assertStringContainsString("'=1+1 DDE Command Test", $content);
        $this->assertStringContainsString("'@MaliciousUser", $content);
    }

    /** 13. Unauthenticated requests to admin routes return 401. */
    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/admin/finance/categories')->assertStatus(401);
        $this->getJson('/api/admin/finance/settings')->assertStatus(401);
        $this->getJson('/api/admin/finance/transactions')->assertStatus(401);
        $this->getJson('/api/admin/finance/export')->assertStatus(401);
    }

    /** 14. Admin dan Superadmin sama-sama bisa CRUD, publish, dan koreksi transaksi. */
    public function test_both_admin_and_superadmin_can_crud_publish_and_correct(): void
    {
        // Admin membuat draft
        $resStore = $this->actingAs($this->admin)
            ->postJson('/api/admin/finance/transactions', [
                'type' => 'income',
                'category_id' => $this->catIncome->id,
                'amount' => 250000,
                'transaction_date' => '2026-07-01',
                'description' => 'Iuran Warga Gang 4',
                'status' => 'draft',
            ]);
        $resStore->assertStatus(201);
        $txId = $resStore->json('id');

        // Superadmin mengubah draft
        $this->actingAs($this->superadmin)
            ->patchJson("/api/admin/finance/transactions/{$txId}", [
                'amount' => 300000,
            ])
            ->assertStatus(200);

        // Admin menerbitkan transaksi
        $this->actingAs($this->admin)
            ->postJson("/api/admin/finance/transactions/{$txId}/publish")
            ->assertStatus(200)
            ->assertJson(['status' => 'published']);

        // Superadmin mengoreksi transaksi
        $this->actingAs($this->superadmin)
            ->postJson("/api/admin/finance/transactions/{$txId}/correct", [
                'correction_reason' => 'Perbaikan data oleh superadmin',
            ])
            ->assertStatus(201);
    }

    /** 15. Summary tahunan per bulan dan per kategori dihitung akurat. */
    public function test_summary_monthly_and_category_breakdown(): void
    {
        // Pemasukan Mei: 500.000
        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 500000,
            'transaction_date' => '2026-05-15',
            'description' => 'Pemasukan Mei',
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Pengeluaran Mei: 200.000
        FinanceTransaction::create([
            'type' => 'expense',
            'category_id' => $this->catExpense->id,
            'amount' => 200000,
            'transaction_date' => '2026-05-20',
            'description' => 'Pengeluaran Mei',
            'status' => 'published',
            'published_at' => now(),
        ]);

        // Pemasukan Juni: 300.000
        FinanceTransaction::create([
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 300000,
            'transaction_date' => '2026-06-10',
            'description' => 'Pemasukan Juni',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $res = $this->getJson('/api/public/finance/summary?year=2026');
        $res->assertStatus(200);

        $monthly = $res->json('monthly');
        // Bulan Mei (index 4)
        $this->assertEquals(500000, $monthly[4]['income']);
        $this->assertEquals(200000, $monthly[4]['expense']);
        $this->assertEquals(300000, $monthly[4]['net']);

        // Bulan Juni (index 5)
        $this->assertEquals(300000, $monthly[5]['income']);
        $this->assertEquals(0, $monthly[5]['expense']);
        $this->assertEquals(300000, $monthly[5]['net']);

        $byCategory = $res->json('by_category');
        $this->assertNotEmpty($byCategory['income']);
        $this->assertNotEmpty($byCategory['expense']);
    }

    /** 16. Audit log tercatat untuk aksi-aksi keuangan. */
    public function test_audit_logs_recorded_for_finance_actions(): void
    {
        $this->actingAs($this->admin)->postJson('/api/admin/finance/transactions', [
            'type' => 'income',
            'category_id' => $this->catIncome->id,
            'amount' => 100000,
            'transaction_date' => now()->toDateString(),
            'description' => 'Uji Audit Keuangan',
            'status' => 'draft',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'finance_tx_created',
        ]);
    }
}
