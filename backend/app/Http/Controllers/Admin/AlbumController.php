<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAlbumRequest;
use App\Http\Requests\Admin\UpdateAlbumRequest;
use App\Http\Requests\Admin\UploadPhotosRequest;
use App\Models\Album;
use App\Models\AlbumPhoto;
use App\Services\AuditLogger;
use App\Services\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AlbumController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Album::query()
            ->with(['creator:id,name,username', 'event:id,title,slug', 'coverPhoto'])
            ->withCount('photos');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where('title', 'like', $search);
        }

        $albums = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json($albums);
    }

    public function store(StoreAlbumRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['slug'] = Album::generateUniqueSlug($validated['title']);
        $validated['status'] = $validated['status'] ?? 'draft';
        $validated['created_by'] = $request->user()->id;

        $album = Album::create($validated);

        AuditLogger::log($request->user(), 'album_created', $request, [
            'album_id' => $album->id,
            'title' => $album->title,
            'status' => $album->status,
        ]);

        return response()->json([
            'message' => 'Album dokumentasi berhasil dibuat.',
            'data' => $album->load(['event:id,title,slug']),
        ], 201);
    }

    public function show(Album $album): JsonResponse
    {
        $album->load([
            'creator:id,name,username',
            'event:id,title,slug',
            'photos',
            'coverPhoto',
        ]);

        return response()->json([
            'data' => $album,
        ]);
    }

    public function update(UpdateAlbumRequest $request, Album $album): JsonResponse
    {
        $validated = $request->validated();

        if ($request->boolean('regenerate_slug') && isset($validated['title'])) {
            $validated['slug'] = Album::generateUniqueSlug($validated['title'], $album->id);
        }

        $album->update($validated);

        AuditLogger::log($request->user(), 'album_updated', $request, [
            'album_id' => $album->id,
            'updated_fields' => array_keys($validated),
        ]);

        return response()->json([
            'message' => 'Album dokumentasi berhasil diperbarui.',
            'data' => $album->fresh(['creator:id,name,username', 'event:id,title,slug', 'coverPhoto']),
        ]);
    }

    public function destroy(Request $request, Album $album): JsonResponse
    {
        $albumTitle = $album->title;
        $albumId = $album->id;

        // Pilihan arsitektur: Soft delete album. Berkas foto fisik dipertahankan sampai purge permanen
        // untuk mencegah kehilangan data tidak sengaja dan menjaga integritas riwayat.
        $album->delete();

        AuditLogger::log($request->user(), 'album_deleted', $request, [
            'album_id' => $albumId,
            'title' => $albumTitle,
        ]);

        return response()->json([
            'message' => 'Album dokumentasi berhasil dihapus.',
        ]);
    }

    public function publish(Request $request, Album $album): JsonResponse
    {
        $album->update(['status' => 'published']);

        AuditLogger::log($request->user(), 'album_published', $request, [
            'album_id' => $album->id,
            'title' => $album->title,
        ]);

        return response()->json([
            'message' => 'Album dokumentasi berhasil diterbitkan.',
            'data' => $album->fresh(),
        ]);
    }

    public function unpublish(Request $request, Album $album): JsonResponse
    {
        $album->update(['status' => 'draft']);

        AuditLogger::log($request->user(), 'album_unpublished', $request, [
            'album_id' => $album->id,
            'title' => $album->title,
        ]);

        return response()->json([
            'message' => 'Publikasi album berhasil dibatalkan (disimpan sebagai draft).',
            'data' => $album->fresh(),
        ]);
    }

    public function uploadPhotos(UploadPhotosRequest $request, Album $album, ImageUploader $uploader): JsonResponse
    {
        $files = $request->file('photos');
        $captions = $request->input('captions', []);

        $successList = [];
        $failedList = [];

        $currentMaxSort = $album->photos()->max('sort_order') ?? 0;

        foreach ($files as $index => $file) {
            $originalName = $file->getClientOriginalName();
            try {
                $path = $uploader->upload(
                    file: $file,
                    directory: 'albums/' . $album->id,
                    field: "photos.{$index}"
                );

                $currentMaxSort++;
                $caption = isset($captions[$index]) ? strip_tags(trim($captions[$index])) : null;

                $photo = $album->photos()->create([
                    'path' => $path,
                    'caption' => $caption,
                    'sort_order' => $currentMaxSort,
                ]);

                // Jika belum ada cover_photo_id, set otomatis ke foto pertama ini
                if (! $album->cover_photo_id) {
                    $album->update(['cover_photo_id' => $photo->id]);
                }

                $successList[] = $photo;
            } catch (\Throwable $e) {
                $failedList[] = [
                    'file' => $originalName,
                    'error' => $e->getMessage(),
                ];
            }
        }

        if (! empty($successList)) {
            AuditLogger::log($request->user(), 'photo_uploaded', $request, [
                'album_id' => $album->id,
                'uploaded_count' => count($successList),
                'failed_count' => count($failedList),
            ]);
        }

        return response()->json([
            'message' => sprintf('%d foto berhasil diunggah.%s', count($successList), count($failedList) > 0 ? sprintf(' %d file gagal diproses.', count($failedList)) : ''),
            'uploaded' => $successList,
            'failed' => $failedList,
            'album' => $album->fresh(['photos', 'coverPhoto']),
        ], count($successList) > 0 ? 200 : 422);
    }

    public function updatePhotoCaption(Request $request, Album $album, AlbumPhoto $photo): JsonResponse
    {
        if ($photo->album_id !== $album->id) {
            return response()->json(['message' => 'Foto tidak termasuk dalam album ini.'], 404);
        }

        $request->validate([
            'caption' => ['nullable', 'string', 'max:200'],
        ], [
            'caption.max' => 'Keterangan foto maksimal 200 karakter.',
        ]);

        $caption = $request->filled('caption') ? strip_tags(trim($request->input('caption'))) : null;
        $photo->update(['caption' => $caption]);

        AuditLogger::log($request->user(), 'album_updated', $request, [
            'album_id' => $album->id,
            'photo_id' => $photo->id,
            'action_type' => 'caption_updated',
        ]);

        return response()->json([
            'message' => 'Keterangan foto berhasil diperbarui.',
            'data' => $photo->fresh(),
        ]);
    }

    public function deletePhoto(Request $request, Album $album, AlbumPhoto $photo, ImageUploader $uploader): JsonResponse
    {
        if ($photo->album_id !== $album->id) {
            return response()->json(['message' => 'Foto tidak termasuk dalam album ini.'], 404);
        }

        $photoId = $photo->id;
        $photoPath = $photo->path;

        // Hapus berkas fisik
        $uploader->delete($photoPath);
        $photo->delete();

        // Jika foto yang dihapus adalah cover album, alihkan cover
        if ($album->cover_photo_id === $photoId) {
            $nextPhoto = $album->photos()->first();
            $album->update(['cover_photo_id' => $nextPhoto?->id]);
        }

        AuditLogger::log($request->user(), 'photo_deleted', $request, [
            'album_id' => $album->id,
            'photo_id' => $photoId,
        ]);

        return response()->json([
            'message' => 'Foto berhasil dihapus.',
            'album' => $album->fresh(['photos', 'coverPhoto']),
        ]);
    }

    public function reorderPhotos(Request $request, Album $album): JsonResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:album_photos,id'],
        ], [
            'ids.required' => 'Daftar id foto wajib disertakan.',
            'ids.array' => 'Format urutan id tidak valid.',
        ]);

        $ids = $request->input('ids');

        DB::transaction(function () use ($album, $ids) {
            foreach ($ids as $index => $id) {
                AlbumPhoto::where('id', $id)
                    ->where('album_id', $album->id)
                    ->update(['sort_order' => $index + 1]);
            }
        });

        AuditLogger::log($request->user(), 'photo_reordered', $request, [
            'album_id' => $album->id,
            'count' => count($ids),
        ]);

        return response()->json([
            'message' => 'Urutan foto berhasil diperbarui.',
            'photos' => $album->photos()->get(),
        ]);
    }

    public function setCover(Request $request, Album $album): JsonResponse
    {
        $request->validate([
            'photo_id' => ['required', 'integer', 'exists:album_photos,id'],
        ], [
            'photo_id.required' => 'ID foto sampul wajib disertakan.',
            'photo_id.exists' => 'Foto tidak ditemukan.',
        ]);

        $photoId = (int) $request->input('photo_id');

        $existsInAlbum = $album->photos()->where('id', $photoId)->exists();
        if (! $existsInAlbum) {
            return response()->json([
                'message' => 'Foto terpilih tidak termasuk dalam album ini.',
            ], 422);
        }

        $album->update(['cover_photo_id' => $photoId]);

        AuditLogger::log($request->user(), 'album_updated', $request, [
            'album_id' => $album->id,
            'cover_photo_id' => $photoId,
            'action_type' => 'cover_set',
        ]);

        return response()->json([
            'message' => 'Foto sampul album berhasil disetel.',
            'data' => $album->fresh(['coverPhoto', 'photos']),
        ]);
    }
}
