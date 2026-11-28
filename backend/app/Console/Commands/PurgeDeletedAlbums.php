<?php

namespace App\Console\Commands;

use App\Models\Album;
use App\Services\ImageUploader;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PurgeDeletedAlbums extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'albums:purge {--days=30 : Batas hari album dihapus (soft-deleted) sebelum dibersihkan permanen}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Menghapus permanen (purge) album yang telah di-soft-delete melebihi batas hari beserta file foto fisiknya';

    /**
     * Execute the console command.
     */
    public function handle(ImageUploader $uploader): int
    {
        $days = (int) $this->option('days');
        if ($days < 0) {
            $this->error('Jumlah hari tidak boleh negatif.');
            return self::FAILURE;
        }

        $threshold = Carbon::now()->subDays($days);

        $expiredAlbums = Album::onlyTrashed()
            ->where('deleted_at', '<=', $threshold)
            ->with('photos')
            ->get();

        if ($expiredAlbums->isEmpty()) {
            $this->info("Tidak ada album terhapus yang melebihi batas {$days} hari.");
            return self::SUCCESS;
        }

        $totalAlbums = 0;
        $totalPhotos = 0;

        foreach ($expiredAlbums as $album) {
            foreach ($album->photos as $photo) {
                if ($photo->path) {
                    $uploader->delete($photo->path);
                    $totalPhotos++;
                }
            }

            // Bersihkan direktori album jika kosong
            $albumDir = 'albums/' . $album->id;
            if (Storage::disk('public')->exists($albumDir)) {
                Storage::disk('public')->deleteDirectory($albumDir);
            }

            // Hapus permanen dari database
            $album->forceDelete();
            $totalAlbums++;
        }

        $this->info("Berhasil membersihkan {$totalAlbums} album dan {$totalPhotos} berkas foto fisik (batas: {$days} hari).");

        return self::SUCCESS;
    }
}
