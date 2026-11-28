<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImageUploader
{
    private const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
    private const MAX_DIMENSION = 4000;

    private const ALLOWED_MIMES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /**
     * Validasi gambar secara ketat (MIME asli, ukuran, dimensi), hilangkan metadata EXIF
     * dengan me-reencode melalui GD, lalu simpan ke disk `public` dengan nama acak.
     *
     * @throws ValidationException
     */
    public function upload(UploadedFile $file, string $directory, ?string $oldPath = null, string $field = 'image', string $disk = 'public'): string
    {
        if (! $file->isValid()) {
            throw ValidationException::withMessages([
                $field => ['Berkas gambar gagal diunggah atau rusak.'],
            ]);
        }

        if ($file->getSize() > self::MAX_BYTES) {
            throw ValidationException::withMessages([
                $field => ['Ukuran gambar maksimal adalah 2 MB.'],
            ]);
        }

        $realPath = $file->getRealPath();
        if (! $realPath || ! is_file($realPath)) {
            throw ValidationException::withMessages([
                $field => ['Berkas gambar tidak dapat dibaca.'],
            ]);
        }

        // Validasi MIME sebenarnya menggunakan finfo (bukan sekadar ekstensi)
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($realPath);

        if (! is_string($detectedMime) || ! array_key_exists($detectedMime, self::ALLOWED_MIMES)) {
            throw ValidationException::withMessages([
                $field => ['Format berkas harus berupa gambar JPG, PNG, atau WebP yang valid.'],
            ]);
        }

        // Validasi dimensi & integritas gambar lewat getimagesize
        $imageInfo = @getimagesize($realPath);
        if ($imageInfo === false || empty($imageInfo[0]) || empty($imageInfo[1])) {
            throw ValidationException::withMessages([
                $field => ['Berkas bukan gambar yang valid atau tidak dapat diproses.'],
            ]);
        }

        [$width, $height] = $imageInfo;
        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            throw ValidationException::withMessages([
                $field => ['Dimensi gambar maksimal adalah 4000 x 4000 piksel.'],
            ]);
        }

        // Re-encode menggunakan GD untuk menghilangkan metadata EXIF / payload tersembunyi
        $encodedBinary = $this->reencodeWithGd($realPath, $detectedMime, $field);

        // Simpan ke disk yang ditentukan dengan nama acak
        $cleanDir = trim($directory, '/\\');
        $extension = self::ALLOWED_MIMES[$detectedMime];
        $filename = Str::random(40) . '.' . $extension;
        $targetPath = $cleanDir !== '' ? "{$cleanDir}/{$filename}" : $filename;

        Storage::disk($disk)->put($targetPath, $encodedBinary);

        // Hapus file lama jika ada
        if ($oldPath) {
            $this->delete($oldPath, $disk);
        }

        return $targetPath;
    }

    /**
     * Hapus berkas dari disk jika ada.
     */
    public function delete(?string $path, string $disk = 'public'): void
    {
        if (! $path) {
            return;
        }

        if (Storage::disk($disk)->exists($path)) {
            Storage::disk($disk)->delete($path);
        }
    }

    /**
     * Re-encode gambar memakai GD agar EXIF/komentar/payload dihilangkan.
     */
    private function reencodeWithGd(string $realPath, string $mime, string $field): string
    {
        $image = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($realPath),
            'image/png' => @imagecreatefrompng($realPath),
            'image/webp' => @imagecreatefromwebp($realPath),
            default => false,
        };

        if ($image === false) {
            throw ValidationException::withMessages([
                $field => ['Gambar rusak atau gagal diproses oleh sistem.'],
            ]);
        }

        // Koreksi orientasi EXIF untuk JPEG sebelum re-encode
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            try {
                $exifData = @exif_read_data($realPath, 'IFD0', false);
                $orientation = isset($exifData['Orientation']) ? (int) $exifData['Orientation'] : 1;

                if ($orientation === 2) {
                    imageflip($image, IMG_FLIP_HORIZONTAL);
                } elseif ($orientation === 3) {
                    $rotated = imagerotate($image, 180, 0);
                    imagedestroy($image);
                    $image = $rotated;
                } elseif ($orientation === 4) {
                    imageflip($image, IMG_FLIP_VERTICAL);
                } elseif ($orientation === 5) {
                    $rotated = imagerotate($image, -90, 0);
                    imagedestroy($image);
                    $image = $rotated;
                    imageflip($image, IMG_FLIP_HORIZONTAL);
                } elseif ($orientation === 6) {
                    // 90 derajat searah jarum jam (imagerotate berlawanan arah jarum jam, jadi gunakan -90 atau 270)
                    $rotated = imagerotate($image, -90, 0);
                    imagedestroy($image);
                    $image = $rotated;
                } elseif ($orientation === 7) {
                    $rotated = imagerotate($image, 90, 0);
                    imagedestroy($image);
                    $image = $rotated;
                    imageflip($image, IMG_FLIP_HORIZONTAL);
                } elseif ($orientation === 8) {
                    // 90 derajat berlawanan jarum jam
                    $rotated = imagerotate($image, 90, 0);
                    imagedestroy($image);
                    $image = $rotated;
                }
            } catch (\Throwable $e) {
                // Jangan telan error tak terduga selain pengecualian baca metadata
                if (! str_contains(strtolower($e->getMessage()), 'exif') && ! str_contains(strtolower($e->getMessage()), 'read')) {
                    throw $e;
                }
            }
        }

        ob_start();
        $success = false;

        try {
            if ($mime === 'image/jpeg') {
                $success = imagejpeg($image, null, 88);
            } elseif ($mime === 'image/png') {
                imagealphablending($image, false);
                imagesavealpha($image, true);
                $success = imagepng($image, null, 6);
            } elseif ($mime === 'image/webp') {
                imagealphablending($image, false);
                imagesavealpha($image, true);
                $success = imagewebp($image, null, 88);
            }
            $binary = ob_get_contents();
        } finally {
            ob_end_clean();
            imagedestroy($image);
        }

        if (! $success || ! is_string($binary) || $binary === '') {
            throw ValidationException::withMessages([
                $field => ['Gagal mengolah ulang gambar yang diunggah.'],
            ]);
        }

        return $binary;
    }
}
