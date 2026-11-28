<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Aspiration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AspirationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();

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
    }

    /** 1. Kirim sukses dan format tracking_code benar (ASP-XXXX-YYYY). */
    public function test_submit_aspiration_success_and_tracking_code_format(): void
    {
        $response = $this->postJson('/api/public/aspirations', [
            'name' => 'Budi Santoso',
            'contact' => '081234567890',
            'category' => 'saran',
            'subject' => 'Penerangan Jalan RT',
            'message' => 'Mohon ditambah lampu jalan di gang 3 agar lebih terang dan aman di malam hari.',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['tracking_code', 'message']);

        $code = $response->json('tracking_code');
        $this->assertMatchesRegularExpression('/^ASP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/', $code);

        $this->assertDatabaseHas('aspirations', [
            'tracking_code' => $code,
            'name' => 'Budi Santoso',
            'contact' => '081234567890',
            'subject' => 'Penerangan Jalan RT',
            'status' => 'new',
            'is_public' => false,
        ]);

        // Verifikasi IP tidak disimpan mentah melainkan di-hash
        $stored = Aspiration::where('tracking_code', $code)->first();
        $this->assertNotNull($stored->ip_hash);
        $this->assertNotEquals('127.0.0.1', $stored->ip_hash);
        $this->assertEquals(Aspiration::hashIp('127.0.0.1'), $stored->ip_hash);
    }

    /** 2. Kontak dan nama opsional (boleh kosong). */
    public function test_submit_aspiration_optional_name_and_contact(): void
    {
        $response = $this->postJson('/api/public/aspirations', [
            'category' => 'keluhan',
            'subject' => 'Sampah Belum Diangkut',
            'message' => 'Sudah 3 hari sampah di depan rumah belum diambil petugas.',
        ]);

        $response->assertStatus(201);
        $code = $response->json('tracking_code');

        $this->assertDatabaseHas('aspirations', [
            'tracking_code' => $code,
            'name' => null,
            'contact' => null,
        ]);
    }

    /** 3. Validasi gagal jika pesan terlalu pendek / subject kosong / format kontak salah. */
    public function test_submit_aspiration_validation_fails(): void
    {
        // Pesan < 10 karakter & subjek kosong
        $response = $this->postJson('/api/public/aspirations', [
            'category' => 'saran',
            'subject' => '',
            'message' => 'pendek',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['subject', 'message']);

        // Format kontak salah (bukan email dan bukan nomor HP 8-15 digit)
        $response2 = $this->postJson('/api/public/aspirations', [
            'category' => 'saran',
            'subject' => 'Valid Subject Disini',
            'message' => 'Pesan ini cukup panjang untuk memenuhi syarat.',
            'contact' => 'abc',
        ]);
        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['contact']);
    }

    /** 4. Honeypot tidak menyimpan data ke database tetapi balas 201. */
    public function test_submit_honeypot_does_not_save_to_database(): void
    {
        $countBefore = Aspiration::count();

        $response = $this->postJson('/api/public/aspirations', [
            'website' => 'http://spambot.example.com',
            'category' => 'saran',
            'subject' => 'Penawaran Bot Spam',
            'message' => 'Beli followers murah sekarang juga di website kami.',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['tracking_code', 'message']);

        $this->assertEquals($countBefore, Aspiration::count());
    }

    /** 5. Rate limit 429 pada pengiriman aspirasi (3/jam per IP). */
    public function test_submit_aspiration_rate_limit_exceeded(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/public/aspirations', [
                'category' => 'pertanyaan',
                'subject' => "Pertanyaan ke-{$i}",
                'message' => "Isi pertanyaan ke-{$i} dengan panjang yang cukup.",
            ])->assertStatus(201);
        }

        // Percobaan ke-4 ditolak 429
        $response = $this->postJson('/api/public/aspirations', [
            'category' => 'pertanyaan',
            'subject' => 'Pertanyaan ke-4',
            'message' => 'Pertanyaan yang melebihi batas percobaan per jam.',
        ]);

        $response->assertStatus(429)
            ->assertJson(['message' => 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.']);
    }

    /** 6. Pelacakan kode benar dan salah (404). */
    public function test_track_aspiration_found_and_not_found(): void
    {
        $aspiration = Aspiration::create([
            'tracking_code' => 'ASP-TEST-CODE',
            'name' => 'Warga Rahasia',
            'contact' => 'warga@gmail.com',
            'category' => 'usulan_kegiatan',
            'subject' => 'Lomba Futsal Antar RT',
            'message' => 'Kami mengusulkan turnamen futsal untuk menyambut HUT RI.',
            'status' => 'in_progress',
            'public_reply' => 'Usulan sedang dibahas dalam rapat pengurus.',
            'ip_hash' => 'dummy_hash',
        ]);

        // Kode benar
        $response = $this->getJson('/api/public/aspirations/track/ASP-TEST-CODE');
        $response->assertStatus(200)
            ->assertJson([
                'tracking_code' => 'ASP-TEST-CODE',
                'status' => 'in_progress',
                'category' => 'usulan_kegiatan',
                'subject' => 'Lomba Futsal Antar RT',
                'public_reply' => 'Usulan sedang dibahas dalam rapat pengurus.',
            ]);

        // Pastikan tidak bocor nama, kontak, message, atau ip_hash di pelacakan
        $response->assertJsonMissing(['name', 'contact', 'message', 'ip_hash']);

        // Kode salah
        $this->getJson('/api/public/aspirations/track/ASP-NOT-FOUND')
            ->assertStatus(404)
            ->assertJson(['message' => 'Kode pelacakan aspirasi tidak ditemukan.']);
    }

    /** 7 & 8. Publik tidak bocor kontak/nama/catatan internal; hanya is_public & bukan spam/rejected. */
    public function test_public_index_only_shows_public_non_spam_without_sensitive_data(): void
    {
        // 1. Publik & done -> tampil
        Aspiration::create([
            'tracking_code' => 'ASP-PUB1-DONE',
            'name' => 'Budi Rahasia',
            'contact' => '081233344455',
            'category' => 'saran',
            'subject' => 'Aspirasi Ditampilkan',
            'message' => 'Ini isi pesan aspirasi yang sudah disetujui publik.',
            'status' => 'done',
            'internal_note' => 'Catatan admin yang sangat rahasia.',
            'public_reply' => 'Terima kasih, sudah terealisasi.',
            'is_public' => true,
            'ip_hash' => 'hash1',
        ]);

        // 2. Publik tapi status spam -> TIDAK boleh tampil
        Aspiration::create([
            'tracking_code' => 'ASP-PUB2-SPAM',
            'category' => 'saran',
            'subject' => 'Spam Subject',
            'message' => 'Isi spam yang tidak boleh keluar ke warga.',
            'status' => 'spam',
            'is_public' => true,
            'ip_hash' => 'hash2',
        ]);

        // 3. Publik tapi status rejected -> TIDAK boleh tampil
        Aspiration::create([
            'tracking_code' => 'ASP-PUB3-REJC',
            'category' => 'keluhan',
            'subject' => 'Ditolak Subject',
            'message' => 'Isi keluhan yang ditolak tidak boleh tampil.',
            'status' => 'rejected',
            'is_public' => true,
            'ip_hash' => 'hash3',
        ]);

        // 4. Belum is_public -> TIDAK boleh tampil
        Aspiration::create([
            'tracking_code' => 'ASP-PRIV-NEWW',
            'category' => 'pertanyaan',
            'subject' => 'Belum Dipublikasikan',
            'message' => 'Isi aspirasi yang belum disetujui tampil publik.',
            'status' => 'new',
            'is_public' => false,
            'ip_hash' => 'hash4',
        ]);

        $response = $this->getJson('/api/public/aspirations');
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Aspirasi Ditampilkan', $data[0]['subject']);
        $this->assertEquals('Warga', $data[0]['author_name']); // Selalu "Warga"
        $this->assertArrayNotHasKey('contact', $data[0]);
        $this->assertArrayNotHasKey('internal_note', $data[0]);
        $this->assertArrayNotHasKey('ip_hash', $data[0]);
    }

    /** 9. Unauthenticated requests to admin routes return 401. */
    public function test_admin_routes_require_authentication(): void
    {
        $this->getJson('/api/admin/aspirations')->assertStatus(401);
        $this->getJson('/api/admin/aspirations/stats')->assertStatus(401);
        $this->getJson('/api/admin/aspirations/1')->assertStatus(401);
        $this->patchJson('/api/admin/aspirations/1', ['status' => 'read'])->assertStatus(401);
        $this->deleteJson('/api/admin/aspirations/1')->assertStatus(401);
    }

    /** 10. Admin dan Superadmin sama-sama bisa membaca dan mengubah aspirasi. */
    public function test_both_admin_and_superadmin_can_manage_aspirations(): void
    {
        $aspiration = Aspiration::create([
            'tracking_code' => 'ASP-MNG1-TEST',
            'category' => 'saran',
            'subject' => 'Uji Akses Admin',
            'message' => 'Pesan untuk menguji kemampuan admin biasa dan superadmin.',
            'status' => 'new',
            'ip_hash' => 'hash',
        ]);

        // Admin biasa update status
        $this->actingAs($this->admin)
            ->patchJson("/api/admin/aspirations/{$aspiration->id}", [
                'status' => 'in_progress',
                'internal_note' => 'Ditangani oleh admin biasa.',
            ])
            ->assertStatus(200)
            ->assertJson(['status' => 'in_progress', 'internal_note' => 'Ditangani oleh admin biasa.']);

        // Superadmin update status dan public reply
        $this->actingAs($this->superadmin)
            ->patchJson("/api/admin/aspirations/{$aspiration->id}", [
                'status' => 'done',
                'public_reply' => 'Selesai dikerjakan.',
                'is_public' => true,
            ])
            ->assertStatus(200)
            ->assertJson(['status' => 'done', 'public_reply' => 'Selesai dikerjakan.', 'is_public' => true]);
    }

    /** 11. is_public=true ditolak 422 bila status spam atau rejected. */
    public function test_is_public_rejected_for_spam_and_rejected_status(): void
    {
        $aspiration = Aspiration::create([
            'tracking_code' => 'ASP-SPAM-TEST',
            'category' => 'saran',
            'subject' => 'Spam Subject',
            'message' => 'Ini isi spam yang tidak boleh dipublikasikan.',
            'status' => 'spam',
            'is_public' => false,
            'ip_hash' => 'hash',
        ]);

        // Coba jadikan is_public=true pada aspirasi spam
        $this->actingAs($this->admin)
            ->patchJson("/api/admin/aspirations/{$aspiration->id}", [
                'is_public' => true,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['is_public']);

        // Coba ubah status jadi rejected sambil is_public=true
        $this->actingAs($this->admin)
            ->patchJson("/api/admin/aspirations/{$aspiration->id}", [
                'status' => 'rejected',
                'is_public' => true,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['is_public']);
    }

    /** 12. Buka detail menandai status otomatis dari new -> read. */
    public function test_show_auto_marks_new_to_read(): void
    {
        $aspiration = Aspiration::create([
            'tracking_code' => 'ASP-READ-TEST',
            'category' => 'pertanyaan',
            'subject' => 'Kapan Kerja Bakti?',
            'message' => 'Ingin tahu jadwal kerja bakti lingkungan bulan ini.',
            'status' => 'new',
            'ip_hash' => 'hash',
        ]);

        $this->actingAs($this->admin)
            ->getJson("/api/admin/aspirations/{$aspiration->id}")
            ->assertStatus(200)
            ->assertJson(['status' => 'read']);

        $this->assertDatabaseHas('aspirations', [
            'id' => $aspiration->id,
            'status' => 'read',
            'handled_by' => $this->admin->id,
        ]);
    }

    /** 13. Endpoint stats mengembalikan jumlah per status dengan benar. */
    public function test_stats_returns_accurate_counts(): void
    {
        Aspiration::create([
            'tracking_code' => 'ASP-ST1-NEW1',
            'category' => 'saran',
            'subject' => 'Sub 1',
            'message' => 'Pesan 1 panjang cukup.',
            'status' => 'new',
            'ip_hash' => 'h1',
        ]);
        Aspiration::create([
            'tracking_code' => 'ASP-ST2-NEW2',
            'category' => 'saran',
            'subject' => 'Sub 2',
            'message' => 'Pesan 2 panjang cukup.',
            'status' => 'new',
            'ip_hash' => 'h2',
        ]);
        Aspiration::create([
            'tracking_code' => 'ASP-ST3-DONE',
            'category' => 'keluhan',
            'subject' => 'Sub 3',
            'message' => 'Pesan 3 panjang cukup.',
            'status' => 'done',
            'ip_hash' => 'h3',
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/admin/aspirations/stats');
        $response->assertStatus(200)
            ->assertJson([
                'new' => 2,
                'read' => 0,
                'in_progress' => 0,
                'done' => 1,
                'rejected' => 0,
                'spam' => 0,
                'total' => 3,
            ]);
    }

    /** 14. Purge command menghapus permanen aspirasi done/spam/rejected lebih tua dari N bulan. */
    public function test_purge_command_removes_old_done_spam_rejected_aspirations(): void
    {
        // 1. Aspirasi done umur 13 bulan -> harus terhapus
        $oldDone = Aspiration::create([
            'tracking_code' => 'ASP-OLD1-DONE',
            'category' => 'saran',
            'subject' => 'Old Done',
            'message' => 'Pesan lama yang sudah selesai dikerjakan.',
            'status' => 'done',
            'ip_hash' => 'h',
            'created_at' => now()->subMonths(13),
        ]);
        // Update timestamps langsung di DB agar tidak dioverwrite Eloquent
        DB::table('aspirations')->where('id', $oldDone->id)->update(['created_at' => now()->subMonths(13)]);

        // 2. Aspirasi spam umur 14 bulan -> harus terhapus
        $oldSpam = Aspiration::create([
            'tracking_code' => 'ASP-OLD2-SPAM',
            'category' => 'saran',
            'subject' => 'Old Spam',
            'message' => 'Pesan spam lama yang harus dibersihkan.',
            'status' => 'spam',
            'ip_hash' => 'h',
        ]);
        DB::table('aspirations')->where('id', $oldSpam->id)->update(['created_at' => now()->subMonths(14)]);

        // 3. Aspirasi baru umur 2 bulan (done) -> TIDAK boleh terhapus
        $recentDone = Aspiration::create([
            'tracking_code' => 'ASP-NEW1-DONE',
            'category' => 'saran',
            'subject' => 'Recent Done',
            'message' => 'Pesan baru selesai yang tidak boleh terhapus.',
            'status' => 'done',
            'ip_hash' => 'h',
        ]);
        DB::table('aspirations')->where('id', $recentDone->id)->update(['created_at' => now()->subMonths(2)]);

        // 4. Aspirasi new umur 13 bulan -> TIDAK boleh terhapus (bukan done/spam/rejected)
        $oldNew = Aspiration::create([
            'tracking_code' => 'ASP-OLD3-NEWW',
            'category' => 'saran',
            'subject' => 'Old New',
            'message' => 'Pesan belum dibaca tidak boleh terhapus walau lama.',
            'status' => 'new',
            'ip_hash' => 'h',
        ]);
        DB::table('aspirations')->where('id', $oldNew->id)->update(['created_at' => now()->subMonths(13)]);

        $this->artisan('aspirations:purge --months=12')
            ->assertExitCode(0);

        $this->assertDatabaseMissing('aspirations', ['id' => $oldDone->id]);
        $this->assertDatabaseMissing('aspirations', ['id' => $oldSpam->id]);
        $this->assertDatabaseHas('aspirations', ['id' => $recentDone->id]);
        $this->assertDatabaseHas('aspirations', ['id' => $oldNew->id]);
    }

    /** 15. Audit log mencatat aktivitas status_changed, published, deleted tanpa membocorkan pesan/kontak. */
    public function test_audit_logs_recorded_without_sensitive_message_content(): void
    {
        $aspiration = Aspiration::create([
            'tracking_code' => 'ASP-AUD1-TEST',
            'name' => 'Warga Rahasia',
            'contact' => 'kontakrahasia@email.com',
            'category' => 'saran',
            'subject' => 'Perbaikan Drainase',
            'message' => 'Pesan rahasia warga yang sangat sensitif dan pribadi.',
            'status' => 'read',
            'ip_hash' => 'h',
        ]);

        // Update status dan publikasikan
        $this->actingAs($this->admin)->patchJson("/api/admin/aspirations/{$aspiration->id}", [
            'status' => 'in_progress',
            'is_public' => true,
        ]);

        // Hapus aspirasi
        $this->actingAs($this->admin)->deleteJson("/api/admin/aspirations/{$aspiration->id}");

        // Cek log status_changed
        $statusLog = DB::table('audit_logs')->where('action', 'aspiration_status_changed')->latest()->first();
        $this->assertNotNull($statusLog);
        $this->assertStringNotContainsString('Pesan rahasia', $statusLog->metadata);
        $this->assertStringNotContainsString('kontakrahasia', $statusLog->metadata);
        $metaStatus = json_decode($statusLog->metadata, true);
        $this->assertEquals($aspiration->id, $metaStatus['aspiration_id']);
        $this->assertEquals('in_progress', $metaStatus['to']);

        // Cek log published
        $pubLog = DB::table('audit_logs')->where('action', 'aspiration_published')->latest()->first();
        $this->assertNotNull($pubLog);
        $this->assertStringNotContainsString('Pesan rahasia', $pubLog->metadata);

        // Cek log deleted
        $delLog = DB::table('audit_logs')->where('action', 'aspiration_deleted')->latest()->first();
        $this->assertNotNull($delLog);
        $this->assertStringNotContainsString('Pesan rahasia', $delLog->metadata);
    }
}
