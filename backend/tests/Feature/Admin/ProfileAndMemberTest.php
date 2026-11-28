<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\OrganizationMember;
use App\Models\OrganizationProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileAndMemberTest extends TestCase
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
        Storage::fake('public');
    }

    protected function authAs(User $user): self
    {
        Sanctum::actingAs($user, ['*']);
        $this->actingAs($user, 'web');

        return $this;
    }

    public function test_public_can_read_profile_and_visible_members_without_login(): void
    {
        OrganizationProfile::create([
            'name' => 'Karang Taruna RT 001',
            'short_name' => 'Katar 01',
            'tagline' => 'Bersatu Maju',
            'about' => 'Tentang kami',
            'history' => 'Sejarah kami',
            'vision' => 'Visi kami',
            'missions' => ['Misi 1', 'Misi 2'],
            'values' => ['Kebersamaan'],
            'address' => 'Jl. Contoh No. 1',
            'region_label' => 'RT 001 RW 004',
            'whatsapp' => '6281200000000',
            'email' => 'katar@example.org',
            'updated_by' => null,
        ]);

        OrganizationMember::create([
            'name' => 'Budi Ketua',
            'position' => 'Ketua',
            'division' => 'Harian',
            'period' => '2025-2028',
            'bio' => 'Bio singkat',
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        // Anggota tersembunyi tidak boleh muncul di publik
        OrganizationMember::create([
            'name' => 'Siti Tersembunyi',
            'position' => 'Anggota',
            'sort_order' => 2,
            'is_visible' => false,
        ]);

        // Anggota terhapus tidak boleh muncul di publik
        $deletedMember = OrganizationMember::create([
            'name' => 'Andi Terhapus',
            'position' => 'Humas',
            'sort_order' => 3,
            'is_visible' => true,
        ]);
        $deletedMember->delete();

        // Uji GET /api/public/profile
        $profileRes = $this->getJson('/api/public/profile');
        $profileRes->assertOk();
        $profileRes->assertHeader('Cache-Control');
        $profileData = $profileRes->json('data');
        $this->assertEquals('Karang Taruna RT 001', $profileData['name']);
        // Pastikan updated_by dan field internal tidak bocor
        $this->assertArrayNotHasKey('updated_by', $profileData);
        $this->assertArrayNotHasKey('logo_path', $profileData);
        $this->assertArrayNotHasKey('id', $profileData);

        // Uji GET /api/public/members
        $membersRes = $this->getJson('/api/public/members');
        $membersRes->assertOk();
        $membersData = $membersRes->json('data');
        $this->assertCount(1, $membersData);
        $this->assertEquals('Budi Ketua', $membersData[0]['name']);
        // Pastikan tidak ada field kontak pribadi atau internal
        $this->assertArrayNotHasKey('id', $membersData[0]);
        $this->assertArrayNotHasKey('is_visible', $membersData[0]);
        $this->assertArrayNotHasKey('photo_path', $membersData[0]);
    }

    public function test_unauthenticated_requests_to_admin_profile_and_member_routes_return_401(): void
    {
        $member = OrganizationMember::create([
            'name' => 'Test',
            'position' => 'Anggota',
            'sort_order' => 1,
            'is_visible' => true,
        ]);

        $this->getJson('/api/admin/profile', $this->headers)->assertStatus(401);
        $this->putJson('/api/admin/profile', [], $this->headers)->assertStatus(401);
        $this->postJson('/api/admin/profile/logo', [], $this->headers)->assertStatus(401);
        $this->deleteJson('/api/admin/profile/logo', [], $this->headers)->assertStatus(401);

        $this->getJson('/api/admin/members', $this->headers)->assertStatus(401);
        $this->postJson('/api/admin/members', [], $this->headers)->assertStatus(401);
        $this->patchJson("/api/admin/members/{$member->id}", [], $this->headers)->assertStatus(401);
        $this->deleteJson("/api/admin/members/{$member->id}", [], $this->headers)->assertStatus(401);
        $this->postJson("/api/admin/members/{$member->id}/photo", [], $this->headers)->assertStatus(401);
        $this->deleteJson("/api/admin/members/{$member->id}/photo", [], $this->headers)->assertStatus(401);
        $this->postJson('/api/admin/members/reorder', ['ids' => [$member->id]], $this->headers)->assertStatus(401);
    }

    public function test_both_admin_and_superadmin_can_update_profile_with_validation_and_audit(): void
    {
        $admin = User::factory()->create([
            'username' => 'adminbiasa',
            'role' => UserRole::ADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $super = User::factory()->create([
            'username' => 'superadminnya',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $validPayload = [
            'name' => '<b>Karang Taruna</b> RT 001 RW 004',
            'short_name' => 'Katar 01',
            'tagline' => 'Bersatu Membangun',
            'about' => '<script>alert(1)</script>Tentang organisasi.',
            'history' => 'Sejarah singkat.',
            'vision' => 'Visi hebat.',
            'missions' => ['Misi pertama', 'Misi kedua'],
            'values' => ['Gotong Royong'],
            'address' => 'Jl. Kemang Sari',
            'region_label' => 'RT 001 RW 004',
            'whatsapp' => '6281234567890',
            'email' => 'katar@example.org',
            'instagram' => 'https://instagram.com/katar0104',
            'facebook' => 'https://facebook.com/katar0104',
            'youtube' => 'https://youtube.com/@katar0104',
        ];

        // Admin biasa dapat membaca dan memperbarui profil
        $this->authAs($admin);
        $this->getJson('/api/admin/profile', $this->headers)->assertOk();

        $resAdmin = $this->putJson('/api/admin/profile', $validPayload, $this->headers);
        $resAdmin->assertOk();
        // HTML strip_tags harus berjalan
        $this->assertEquals('Karang Taruna RT 001 RW 004', $resAdmin->json('data.name'));
        $this->assertEquals('alert(1)Tentang organisasi.', $resAdmin->json('data.about'));

        // Validasi domain media sosial dan format WhatsApp ditolak (422)
        $invalidPayload = $validPayload;
        $invalidPayload['whatsapp'] = '+62812-345';
        $invalidPayload['instagram'] = 'http://evil.com/katar';
        $this->putJson('/api/admin/profile', $invalidPayload, $this->headers)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['whatsapp', 'instagram']);

        // Superadmin juga bisa memperbarui
        $this->authAs($super);
        $validPayload['tagline'] = 'Tagline Superadmin';
        $this->putJson('/api/admin/profile', $validPayload, $this->headers)->assertOk();

        // Audit tercatat
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'profile_updated',
            'user_id' => $super->id,
        ]);
    }

    public function test_image_upload_rejects_non_image_oversized_and_fake_extension_files(): void
    {
        $admin = User::factory()->create([
            'username' => 'uploaderadmin',
            'role' => UserRole::ADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->authAs($admin);

        // 1. File teks/exe yang diganti ekstensi menjadi .jpg -> harus ditolak 422
        $fakeImage = UploadedFile::fake()->createWithContent('malicious.jpg', 'MZ_THIS_IS_NOT_AN_IMAGE_EXE');
        $this->postJson('/api/admin/profile/logo', ['image' => $fakeImage], $this->headers)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // 2. File melebihi batas 2 MB (mis. 3072 KB) -> harus ditolak 422
        $oversized = UploadedFile::fake()->create('huge.jpg', 3072, 'image/jpeg');
        $this->postJson('/api/admin/profile/logo', ['image' => $oversized], $this->headers)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['image']);

        // 3. File gambar valid -> berhasil, tersimpan nama acak, audit logo_changed tercatat
        $validImage = UploadedFile::fake()->image('original_logo_name.png', 300, 300);
        $res = $this->postJson('/api/admin/profile/logo', ['image' => $validImage], $this->headers);
        $res->assertOk();

        $profile = OrganizationProfile::first();
        $this->assertNotNull($profile->logo_path);
        $this->assertStringNotContainsString('original_logo_name', $profile->logo_path);
        Storage::disk('public')->assertExists($profile->logo_path);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'logo_changed',
            'user_id' => $admin->id,
        ]);

        // 4. Hapus logo -> file lama terhapus dari disk
        $oldLogo = $profile->logo_path;
        $this->deleteJson('/api/admin/profile/logo', [], $this->headers)->assertOk();
        Storage::disk('public')->assertMissing($oldLogo);
    }

    public function test_member_crud_photo_upload_soft_delete_and_reorder_with_audit(): void
    {
        $admin = User::factory()->create([
            'username' => 'memberadmin',
            'role' => UserRole::ADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);

        $this->authAs($admin);

        // 1. Tambah 2 anggota
        $res1 = $this->postJson('/api/admin/members', [
            'name' => 'Pengurus Satu',
            'position' => 'Ketua',
            'division' => 'Harian',
            'period' => '2025-2028',
            'bio' => 'Bio satu',
            'is_visible' => true,
        ], $this->headers)->assertStatus(201);

        $res2 = $this->postJson('/api/admin/members', [
            'name' => 'Pengurus Dua',
            'position' => 'Sekretaris',
            'is_visible' => true,
        ], $this->headers)->assertStatus(201);

        $id1 = $res1->json('data.id');
        $id2 = $res2->json('data.id');

        // 2. Unggah foto untuk anggota 1
        $photo = UploadedFile::fake()->image('ketua.jpg', 400, 400);
        $this->postJson("/api/admin/members/{$id1}/photo", ['image' => $photo], $this->headers)
            ->assertOk();

        $member1 = OrganizationMember::find($id1);
        $this->assertNotNull($member1->photo_path);
        Storage::disk('public')->assertExists($member1->photo_path);

        // 3. Reorder: ubah urutan menjadi [id2, id1]
        $reorderRes = $this->postJson('/api/admin/members/reorder', [
            'ids' => [$id2, $id1],
        ], $this->headers);
        $reorderRes->assertOk();

        $this->assertEquals(1, OrganizationMember::find($id2)->sort_order);
        $this->assertEquals(2, OrganizationMember::find($id1)->sort_order);

        // Cek urutan pada endpoint publik
        $publicMembers = $this->getJson('/api/public/members')->json('data');
        $this->assertEquals('Pengurus Dua', $publicMembers[0]['name']);
        $this->assertEquals('Pengurus Satu', $publicMembers[1]['name']);

        // 4. Update & sembunyikan anggota 2
        $this->patchJson("/api/admin/members/{$id2}", [
            'is_visible' => false,
        ], $this->headers)->assertOk();

        $publicAfterHide = $this->getJson('/api/public/members')->json('data');
        $this->assertCount(1, $publicAfterHide);
        $this->assertEquals('Pengurus Satu', $publicAfterHide[0]['name']);

        // 5. Hapus anggota 1 -> soft delete + foto terhapus dari disk
        $photoPathToClean = $member1->photo_path;
        $this->deleteJson("/api/admin/members/{$id1}", [], $this->headers)->assertOk();
        $this->assertSoftDeleted('organization_members', ['id' => $id1]);
        Storage::disk('public')->assertMissing($photoPathToClean);

        // Verifikasi seluruh audit log tercatat
        $actions = DB::table('audit_logs')->pluck('action')->all();
        $this->assertContains('member_created', $actions);
        $this->assertContains('photo_changed', $actions);
        $this->assertContains('member_reordered', $actions);
        $this->assertContains('member_updated', $actions);
        $this->assertContains('member_deleted', $actions);
    }

    public function test_jpeg_with_exif_orientation_6_is_rotated_and_stored_without_metadata(): void
    {
        if (! function_exists('exif_read_data')) {
            $this->markTestSkipped('Ekstensi PHP exif tidak tersedia; tes rotasi EXIF dilewati.');
        }

        $admin = User::factory()->create([
            'username' => 'superforphoto',
            'role' => UserRole::SUPERADMIN,
            'is_active' => true,
            'must_change_password' => false,
        ]);
        $this->authAs($admin);

        // Buat gambar 200x100 (landscape: lebar=200, tinggi=100)
        $gd = imagecreatetruecolor(200, 100);
        imagefilledrectangle($gd, 0, 0, 199, 99, (int) imagecolorallocate($gd, 50, 100, 150));
        ob_start();
        imagejpeg($gd, null, 90);
        $jpegBytes = ob_get_clean();
        imagedestroy($gd);

        // Sisipkan segmen APP1 EXIF dengan tag Orientation = 6 (90 CW)
        // Panjang segmen: 50 bytes (0x0032)
        $exifApp1 = hex2bin(
            'ffe1' .
            '0032' .
            '45786966' . '0000' . // "Exif\0\0"
            '4949' .             // Little-endian TIFF (II)
            '2a00' .             // 42
            '08000000' .         // Offset to 0th IFD
            '0100' .             // 1 tag
            '1201' .             // Tag 0x0112 (Orientation)
            '0300' .             // Type 3 = SHORT
            '01000000' .         // Count = 1
            '0600' . '0000' .     // Value = 6, padding
            '00000000' .         // Next IFD offset = 0
            '0000000000000000' .
            '0000000000000000'
        );

        // Sisipkan setelah marker SOI (2 byte pertama: 0xFF, 0xD8)
        $soi = substr($jpegBytes, 0, 2);
        $rest = substr($jpegBytes, 2);
        $jpegWithExif = $soi . $exifApp1 . $rest;

        $tempFile = tempnam(sys_get_temp_dir(), 'test_exif_') . '.jpg';
        file_put_contents($tempFile, $jpegWithExif);

        $uploadedFile = new UploadedFile(
            $tempFile,
            'portrait_phone.jpg',
            'image/jpeg',
            null,
            true
        );

        $uploader = app(\App\Services\ImageUploader::class);
        $storedPath = $uploader->upload($uploadedFile, 'members', 'image');

        @unlink($tempFile);

        $this->assertNotNull($storedPath);
        Storage::disk('public')->assertExists($storedPath);

        // Gambar asli 200x100 dengan Orientation=6 (putar 90 derajat CW)
        // setelah dikoreksi harus memiliki dimensi 100x200 (lebar=100, tinggi=200, tertukar)
        $fullStoredPath = Storage::disk('public')->path($storedPath);
        $storedSize = getimagesize($fullStoredPath);

        $this->assertEquals(100, $storedSize[0], 'Lebar harus menjadi 100 piksel setelah rotasi.');
        $this->assertEquals(200, $storedSize[1], 'Tinggi harus menjadi 200 piksel setelah rotasi.');
    }
}
