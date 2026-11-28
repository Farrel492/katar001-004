<?php

namespace Database\Seeders;

use App\Models\Album;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class EventAndAlbumSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Acara Mendatang (Upcoming)
        $event1 = Event::firstOrCreate(
            ['slug' => 'kerja-bakti-lingkungan-rt-001'],
            [
                'title' => 'Kerja Bakti Lingkungan RT 001',
                'summary' => 'Kegiatan bersih-bersih rutin lingkungan menjelang musim penghujan dan pencegahan genangan.',
                'description' => "Kegiatan kerja bakti berkala warga RT 001 RW 004 untuk membersihkan saluran air, merapikan tanaman liar di jalan utama lingkungan, dan membersihkan area pos ronda bersama pemuda Karang Taruna.\n\nWarga diharapkan membawa peralatan kebersihan masing-masing. Disediakan konsumsi ringan dan minuman di posko.",
                'category' => 'Bakti Sosial',
                'starts_at' => $now->copy()->addDays(7)->setTime(7, 30, 0),
                'ends_at' => $now->copy()->addDays(7)->setTime(11, 0, 0),
                'location' => 'Sepanjang Jalan Utama RT 001 & Pos Ronda',
                'status' => 'published',
            ]
        );

        $event2 = Event::firstOrCreate(
            ['slug' => 'rapat-koordinasi-pengurus-bulanan'],
            [
                'title' => 'Rapat Koordinasi Pengurus Bulanan',
                'summary' => 'Pertemuan rutin evaluasi program kerja pemuda dan pemaparan laporan kas Karang Taruna.',
                'description' => "Rapat koordinasi rutin seluruh pengurus divisi Karang Taruna membahas persiapan agenda akhir tahun, pelaporan kas keuangan bulan berjalan, serta penerimaan aspirasi terbaru warga lingkungan RT 001.",
                'category' => 'Rapat',
                'starts_at' => $now->copy()->addDays(14)->setTime(19, 30, 0),
                'ends_at' => $now->copy()->addDays(14)->setTime(21, 30, 0),
                'location' => 'Balai Warga RW 004',
                'status' => 'published',
            ]
        );

        // 2. Acara Selesai (Past)
        $pastEvent = Event::firstOrCreate(
            ['slug' => 'turnamen-futsal-pemuda-antarrt'],
            [
                'title' => 'Turnamen Futsal Pemuda Antar-RT',
                'summary' => 'Ajang olahraga persahabatan pemuda dalam mempererat kebersamaan dan sportivitas antarlingkungan.',
                'description' => "Kompetisi futsal persahabatan antar pemuda RT di lingkungan RW 004 dalam rangka menyambut peringatan Sumpah Pemuda. Kegiatan berlangsung meriah dengan partisipasi aktif generasi muda.",
                'category' => 'Olahraga',
                'starts_at' => $now->copy()->subDays(20)->setTime(8, 0, 0),
                'ends_at' => $now->copy()->subDays(20)->setTime(16, 0, 0),
                'location' => 'Lapangan Olahraga Serbaguna',
                'status' => 'published',
            ]
        );

        // 3. Album Dokumentasi untuk Past Event
        Album::firstOrCreate(
            ['slug' => 'dokumentasi-turnamen-futsal-pemuda'],
            [
                'title' => 'Dokumentasi Turnamen Futsal Pemuda',
                'description' => 'Koleksi momen pertandingan persahabatan futsal pemuda RT 001 RW 004 dan penyerahan piala.',
                'event_id' => $pastEvent->id,
                'taken_at' => $now->copy()->subDays(20)->toDateString(),
                'status' => 'published',
            ]
        );

        // 4. Draft Event (Tidak tampil di publik)
        Event::firstOrCreate(
            ['slug' => 'draf-perencanaan-pelatihan-digital'],
            [
                'title' => 'Perencanaan Pelatihan Digital Pemuda (Draft)',
                'summary' => 'Rencana workshop literasi teknologi untuk pemuda dan pelaku UMKM lokal.',
                'description' => 'Materi pelatihan masih dalam tahap perumusan bersama pembicara.',
                'category' => 'Kegiatan',
                'starts_at' => $now->copy()->addDays(30)->setTime(9, 0, 0),
                'ends_at' => $now->copy()->addDays(30)->setTime(12, 0, 0),
                'location' => 'Ruang Komputer Balai Warga',
                'status' => 'draft',
            ]
        );
    }
}
