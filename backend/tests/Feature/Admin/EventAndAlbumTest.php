<?php

namespace Tests\Feature\Admin;

use App\Enums\UserRole;
use App\Models\Album;
use App\Models\AlbumPhoto;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EventAndAlbumTest extends TestCase
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

    protected function createAdmin(UserRole $role = UserRole::ADMIN): User
    {
        return User::factory()->create([
            'username' => 'admin_' . uniqid(),
            'role' => $role,
            'is_active' => true,
            'must_change_password' => false,
        ]);
    }

    // 1. Tes Publik: Draft & Terhapus Tidak Bocor di Endpoint Publik (Event & Album)
    public function test_public_cannot_view_draft_and_soft_deleted_events_and_albums(): void
    {
        $draftEvent = Event::create([
            'title' => 'Draft Event',
            'slug' => 'draft-event',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Kegiatan',
            'starts_at' => Carbon::now()->addDays(2),
            'status' => 'draft',
        ]);

        $deletedEvent = Event::create([
            'title' => 'Deleted Event',
            'slug' => 'deleted-event',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Kegiatan',
            'starts_at' => Carbon::now()->addDays(2),
            'status' => 'published',
        ]);
        $deletedEvent->delete();

        $draftAlbum = Album::create([
            'title' => 'Draft Album',
            'slug' => 'draft-album',
            'status' => 'draft',
        ]);

        $deletedAlbum = Album::create([
            'title' => 'Deleted Album',
            'slug' => 'deleted-album',
            'status' => 'published',
        ]);
        $deletedAlbum->delete();

        // Verifikasi tidak muncul di list publik
        $this->getJson('/api/public/events')
            ->assertOk()
            ->assertJsonMissing(['slug' => 'draft-event'])
            ->assertJsonMissing(['slug' => 'deleted-event']);

        $this->getJson('/api/public/albums')
            ->assertOk()
            ->assertJsonMissing(['slug' => 'draft-album'])
            ->assertJsonMissing(['slug' => 'deleted-album']);

        // Verifikasi 404 pada detail publik
        $this->getJson('/api/public/events/draft-event')->assertNotFound();
        $this->getJson('/api/public/events/deleted-event')->assertNotFound();
        $this->getJson('/api/public/albums/draft-album')->assertNotFound();
        $this->getJson('/api/public/albums/deleted-album')->assertNotFound();
    }

    // 2. Tes Scope Upcoming & Past pada Events Publik
    public function test_public_event_scope_upcoming_and_past_sorting(): void
    {
        $now = Carbon::now();

        $upcoming1 = Event::create([
            'title' => 'Besok Acara',
            'slug' => 'besok-acara',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Kegiatan',
            'starts_at' => $now->copy()->addDay(),
            'status' => 'published',
        ]);

        $upcoming2 = Event::create([
            'title' => 'Minggu Depan Acara',
            'slug' => 'minggu-depan-acara',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Kegiatan',
            'starts_at' => $now->copy()->addDays(7),
            'status' => 'published',
        ]);

        $past = Event::create([
            'title' => 'Kemarin Acara',
            'slug' => 'kemarin-acara',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Olahraga',
            'starts_at' => $now->copy()->subDays(5),
            'ends_at' => $now->copy()->subDays(5)->addHours(2),
            'status' => 'published',
        ]);

        // Upcoming urut starts_at naik
        $resUpcoming = $this->getJson('/api/public/events?scope=upcoming')->assertOk();
        $this->assertCount(2, $resUpcoming->json('data'));
        $this->assertEquals('Besok Acara', $resUpcoming->json('data.0.title'));
        $this->assertEquals('Minggu Depan Acara', $resUpcoming->json('data.1.title'));

        // Past urut starts_at turun
        $resPast = $this->getJson('/api/public/events?scope=past')->assertOk();
        $this->assertCount(1, $resPast->json('data'));
        $this->assertEquals('Kemarin Acara', $resPast->json('data.0.title'));
    }

    // 3. Tes Paginasi Publik
    public function test_public_pagination_events_and_albums(): void
    {
        for ($i = 1; $i <= 11; $i++) {
            Event::create([
                'title' => "Acara {$i}",
                'slug' => "acara-{$i}",
                'summary' => "Ringkasan {$i}",
                'description' => "Deskripsi {$i}",
                'category' => 'Kegiatan',
                'starts_at' => Carbon::now()->addDays($i),
                'status' => 'published',
            ]);
        }

        for ($j = 1; $j <= 14; $j++) {
            Album::create([
                'title' => "Album {$j}",
                'slug' => "album-{$j}",
                'status' => 'published',
            ]);
        }

        // Event paginate 9
        $resEvents = $this->getJson('/api/public/events?scope=upcoming')->assertOk();
        $this->assertEquals(9, count($resEvents->json('data')));
        $this->assertEquals(11, $resEvents->json('total'));
        $this->assertEquals(2, $resEvents->json('last_page'));

        // Album paginate 12
        $resAlbums = $this->getJson('/api/public/albums')->assertOk();
        $this->assertEquals(12, count($resAlbums->json('data')));
        $this->assertEquals(14, $resAlbums->json('total'));
        $this->assertEquals(2, $resAlbums->json('last_page'));
    }

    // 4. Tes Autentikasi: Rute Admin Mengembalikan 401 Tanpa Login
    public function test_unauthenticated_requests_to_admin_routes_return_401(): void
    {
        $this->getJson('/api/admin/events', $this->headers)->assertStatus(401);
        $this->postJson('/api/admin/events', [], $this->headers)->assertStatus(401);
        $this->patchJson('/api/admin/events/1', [], $this->headers)->assertStatus(401);
        $this->deleteJson('/api/admin/events/1', [], $this->headers)->assertStatus(401);

        $this->getJson('/api/admin/albums', $this->headers)->assertStatus(401);
        $this->postJson('/api/admin/albums', [], $this->headers)->assertStatus(401);
        $this->patchJson('/api/admin/albums/1', [], $this->headers)->assertStatus(401);
        $this->deleteJson('/api/admin/albums/1', [], $this->headers)->assertStatus(401);
    }

    // 5. Tes Otorisasi: Admin Biasa & Superadmin Sama-Sama Bisa CRUD Events & Albums
    public function test_both_admin_and_superadmin_can_crud_events_and_albums(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $resEvent = $this->postJson('/api/admin/events', [
            'title' => 'Event Dibuat Admin',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Kegiatan',
            'starts_at' => Carbon::now()->addDays(3)->toDateTimeString(),
        ], $this->headers)->assertCreated();

        $eventId = $resEvent->json('data.id');

        $superadmin = $this->createAdmin(UserRole::SUPERADMIN);
        $this->authAs($superadmin);

        $this->patchJson("/api/admin/events/{$eventId}", [
            'summary' => 'Ringkasan diubah superadmin',
        ], $this->headers)->assertOk();

        $this->assertEquals('Ringkasan diubah superadmin', Event::find($eventId)->summary);
    }

    // 6. Tes Validasi: ends_at < starts_at Ditolak (422)
    public function test_event_fails_when_ends_at_is_before_starts_at(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $payload = [
            'title' => 'Waktu Selesai Tidak Logis',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Kegiatan',
            'starts_at' => Carbon::now()->addDays(5)->toDateTimeString(),
            'ends_at' => Carbon::now()->addDays(4)->toDateTimeString(),
        ];

        $this->postJson('/api/admin/events', $payload, $this->headers)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['ends_at']);
    }

    // 7. Tes Keunikan Slug Otomatis pada Event & Album
    public function test_unique_slug_generation_when_title_conflicts(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $payload1 = [
            'title' => 'Kerja Bakti Akbar',
            'summary' => 'Ringkasan 1',
            'description' => 'Deskripsi 1',
            'category' => 'Kegiatan',
            'starts_at' => Carbon::now()->addDays(2)->toDateTimeString(),
        ];
        $res1 = $this->postJson('/api/admin/events', $payload1, $this->headers)->assertCreated();
        $this->assertEquals('kerja-bakti-akbar', $res1->json('data.slug'));

        $payload2 = [
            'title' => 'Kerja Bakti Akbar',
            'summary' => 'Ringkasan 2',
            'description' => 'Deskripsi 2',
            'category' => 'Kegiatan',
            'starts_at' => Carbon::now()->addDays(4)->toDateTimeString(),
        ];
        $res2 = $this->postJson('/api/admin/events', $payload2, $this->headers)->assertCreated();
        $this->assertEquals('kerja-bakti-akbar-1', $res2->json('data.slug'));
    }

    // 8. Tes Validasi Upload: Non-gambar, Ekstensi Palsu, >2MB, >10 File Ditolak
    public function test_upload_photos_rejects_non_image_oversized_and_excessive_files(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $album = Album::create(['title' => 'Album Uji Validasi Upload', 'slug' => 'album-uji']);

        // Non-gambar (txt)
        $txt = UploadedFile::fake()->create('script.txt', 100);
        $this->postJson("/api/admin/albums/{$album->id}/photos", ['photos' => [$txt]], $this->headers)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['photos.0']);

        // File > 2 MB (2500 KB)
        $oversized = UploadedFile::fake()->create('huge.jpg', 2500, 'image/jpeg');
        $this->postJson("/api/admin/albums/{$album->id}/photos", ['photos' => [$oversized]], $this->headers)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['photos.0']);

        // Lebih dari 10 file (11 file)
        $elevenFiles = [];
        for ($i = 0; $i < 11; $i++) {
            $elevenFiles[] = UploadedFile::fake()->image("img_{$i}.jpg", 100, 100);
        }
        $this->postJson("/api/admin/albums/{$album->id}/photos", ['photos' => $elevenFiles], $this->headers)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['photos']);
    }

    // 9. Tes Reorder Foto Album
    public function test_reorder_album_photos_updates_sort_order(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $album = Album::create(['title' => 'Album Reorder', 'slug' => 'album-reorder']);
        $p1 = $album->photos()->create(['path' => 'p1.jpg', 'sort_order' => 1]);
        $p2 = $album->photos()->create(['path' => 'p2.jpg', 'sort_order' => 2]);
        $p3 = $album->photos()->create(['path' => 'p3.jpg', 'sort_order' => 3]);

        // Ubah urutan: [p3, p1, p2]
        $this->postJson("/api/admin/albums/{$album->id}/photos/reorder", [
            'ids' => [$p3->id, $p1->id, $p2->id],
        ], $this->headers)->assertOk();

        $this->assertEquals(1, $p3->fresh()->sort_order);
        $this->assertEquals(2, $p1->fresh()->sort_order);
        $this->assertEquals(3, $p2->fresh()->sort_order);
    }

    // 10. Tes Set Cover Album & Penyesuaian Saat Foto Cover Dihapus
    public function test_set_album_cover_photo_and_fallback(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $album = Album::create(['title' => 'Album Cover', 'slug' => 'album-cover']);
        $p1 = $album->photos()->create(['path' => 'c1.jpg', 'sort_order' => 1]);
        $p2 = $album->photos()->create(['path' => 'c2.jpg', 'sort_order' => 2]);

        $this->postJson("/api/admin/albums/{$album->id}/photos/set-cover", [
            'photo_id' => $p2->id,
        ], $this->headers)->assertOk();

        $this->assertEquals($p2->id, $album->fresh()->cover_photo_id);
    }

    // 11. Tes Hapus Foto Satuan: File Fisik Dihapus dari Storage
    public function test_deleting_single_photo_removes_physical_file_from_storage(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $album = Album::create(['title' => 'Album Hapus Foto', 'slug' => 'album-hapus-foto']);
        $fakeImg = UploadedFile::fake()->image('hapus.jpg', 200, 200);

        $resUpload = $this->postJson("/api/admin/albums/{$album->id}/photos", [
            'photos' => [$fakeImg],
        ], $this->headers)->assertOk();

        $photoId = $resUpload->json('uploaded.0.id');
        $photo = AlbumPhoto::find($photoId);
        $filePath = $photo->path;

        Storage::disk('public')->assertExists($filePath);

        $this->deleteJson("/api/admin/albums/{$album->id}/photos/{$photoId}", [], $this->headers)
            ->assertOk();

        $this->assertDatabaseMissing('album_photos', ['id' => $photoId]);
        Storage::disk('public')->assertMissing($filePath);
    }

    // 12. Tes Seluruh Audit Log Tercatat untuk Agenda & Album
    public function test_audit_logs_recorded_for_all_event_and_album_actions(): void
    {
        $admin = $this->createAdmin(UserRole::ADMIN);
        $this->authAs($admin);

        $resEvent = $this->postJson('/api/admin/events', [
            'title' => 'Acara Audit',
            'summary' => 'Ringkasan',
            'description' => 'Deskripsi',
            'category' => 'Kegiatan',
            'starts_at' => Carbon::now()->addDays(1)->toDateTimeString(),
        ], $this->headers)->assertCreated();
        $eventId = $resEvent->json('data.id');

        $this->postJson("/api/admin/events/{$eventId}/publish", [], $this->headers)->assertOk();
        $this->postJson("/api/admin/events/{$eventId}/unpublish", [], $this->headers)->assertOk();
        $this->deleteJson("/api/admin/events/{$eventId}", [], $this->headers)->assertOk();

        $actions = DB::table('audit_logs')->pluck('action')->all();
        $this->assertContains('event_created', $actions);
        $this->assertContains('event_published', $actions);
        $this->assertContains('event_unpublished', $actions);
        $this->assertContains('event_deleted', $actions);
    }

    // 13. Tes Command albums:purge Menghapus Permanen Album > 30 Hari dan File Fisiknya
    public function test_purge_command_removes_expired_soft_deleted_albums_and_files(): void
    {
        // 1. Album yang di-soft-delete 35 hari lalu (melebihi batas 30 hari)
        $expiredAlbum = Album::create([
            'title' => 'Album Usang 35 Hari',
            'slug' => 'album-usang-35-hari',
        ]);
        Storage::disk('public')->put('albums/' . $expiredAlbum->id . '/foto_usang.jpg', 'dummy');
        $photoExpired = $expiredAlbum->photos()->create([
            'path' => 'albums/' . $expiredAlbum->id . '/foto_usang.jpg',
            'sort_order' => 1,
        ]);
        $expiredAlbum->delete();
        // Set deleted_at ke 35 hari lalu langsung via query builder
        Album::withTrashed()->where('id', $expiredAlbum->id)->update(['deleted_at' => Carbon::now()->subDays(35)]);

        // 2. Album yang baru di-soft-delete 5 hari lalu (TIDAK boleh dibersihkan)
        $recentAlbum = Album::create([
            'title' => 'Album Baru Dihapus',
            'slug' => 'album-baru-dihapus',
        ]);
        Storage::disk('public')->put('albums/' . $recentAlbum->id . '/foto_baru.jpg', 'dummy');
        $photoRecent = $recentAlbum->photos()->create([
            'path' => 'albums/' . $recentAlbum->id . '/foto_baru.jpg',
            'sort_order' => 1,
        ]);
        $recentAlbum->delete();
        Album::withTrashed()->where('id', $recentAlbum->id)->update(['deleted_at' => Carbon::now()->subDays(5)]);

        Storage::disk('public')->assertExists($photoExpired->path);
        Storage::disk('public')->assertExists($photoRecent->path);

        // Jalankan artisan command albums:purge
        Artisan::call('albums:purge', ['--days' => 30]);

        // Album usang harus terhapus permanen dan berkasnya dibersihkan
        $this->assertDatabaseMissing('albums', ['id' => $expiredAlbum->id]);
        Storage::disk('public')->assertMissing($photoExpired->path);

        // Album yang baru dihapus 5 hari lalu tetap ada di database (soft delete) & filenya aman
        $this->assertSoftDeleted('albums', ['id' => $recentAlbum->id]);
        Storage::disk('public')->assertExists($photoRecent->path);
    }
}
