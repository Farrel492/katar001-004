<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreEventRequest;
use App\Http\Requests\Admin\UpdateEventRequest;
use App\Http\Requests\Admin\UploadImageRequest;
use App\Models\Event;
use App\Services\AuditLogger;
use App\Services\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::query()->with(['creator:id,name,username', 'updater:id,name,username']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where('title', 'like', $search);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $events = $query->orderBy('starts_at', 'desc')->paginate(15);

        return response()->json($events);
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $validated['slug'] = Event::generateUniqueSlug($validated['title']);
        $validated['status'] = $validated['status'] ?? 'draft';
        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;

        $event = Event::create($validated);

        AuditLogger::log($request->user(), 'event_created', $request, [
            'event_id' => $event->id,
            'title' => $event->title,
            'status' => $event->status,
        ]);

        return response()->json([
            'message' => 'Agenda berhasil dibuat.',
            'data' => $event,
        ], 201);
    }

    public function show(Event $event): JsonResponse
    {
        $event->load(['creator:id,name,username', 'updater:id,name,username', 'albums:id,title,slug,event_id,status']);

        return response()->json([
            'data' => $event,
        ]);
    }

    public function update(UpdateEventRequest $request, Event $event): JsonResponse
    {
        $validated = $request->validated();
        $validated['updated_by'] = $request->user()->id;

        // Jika judul diubah dan diminta perbarui slug (atau opsional), pertahankan slug stabil kecuali diminta
        if ($request->boolean('regenerate_slug') && isset($validated['title'])) {
            $validated['slug'] = Event::generateUniqueSlug($validated['title'], $event->id);
        }

        $event->update($validated);

        AuditLogger::log($request->user(), 'event_updated', $request, [
            'event_id' => $event->id,
            'updated_fields' => array_keys($validated),
        ]);

        return response()->json([
            'message' => 'Agenda berhasil diperbarui.',
            'data' => $event->fresh(['creator:id,name,username', 'updater:id,name,username']),
        ]);
    }

    public function destroy(Request $request, Event $event): JsonResponse
    {
        $eventTitle = $event->title;
        $eventId = $event->id;

        $event->delete();

        AuditLogger::log($request->user(), 'event_deleted', $request, [
            'event_id' => $eventId,
            'title' => $eventTitle,
        ]);

        return response()->json([
            'message' => 'Agenda berhasil dihapus.',
        ]);
    }

    public function uploadCover(UploadImageRequest $request, Event $event, ImageUploader $uploader): JsonResponse
    {
        $path = $uploader->upload(
            file: $request->file('image'),
            directory: 'events',
            field: 'image',
            oldPath: $event->cover_path
        );

        $event->update([
            'cover_path' => $path,
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), 'event_updated', $request, [
            'event_id' => $event->id,
            'action_type' => 'cover_uploaded',
        ]);

        return response()->json([
            'message' => 'Sampul agenda berhasil diunggah.',
            'data' => $event->fresh(),
        ]);
    }

    public function deleteCover(Request $request, Event $event, ImageUploader $uploader): JsonResponse
    {
        if ($event->cover_path) {
            $uploader->delete($event->cover_path);
            $event->update([
                'cover_path' => null,
                'updated_by' => $request->user()->id,
            ]);

            AuditLogger::log($request->user(), 'event_updated', $request, [
                'event_id' => $event->id,
                'action_type' => 'cover_deleted',
            ]);
        }

        return response()->json([
            'message' => 'Sampul agenda berhasil dihapus.',
            'data' => $event->fresh(),
        ]);
    }

    public function publish(Request $request, Event $event): JsonResponse
    {
        $event->update([
            'status' => 'published',
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), 'event_published', $request, [
            'event_id' => $event->id,
            'title' => $event->title,
        ]);

        return response()->json([
            'message' => 'Agenda berhasil diterbitkan.',
            'data' => $event->fresh(),
        ]);
    }

    public function unpublish(Request $request, Event $event): JsonResponse
    {
        $event->update([
            'status' => 'draft',
            'updated_by' => $request->user()->id,
        ]);

        AuditLogger::log($request->user(), 'event_unpublished', $request, [
            'event_id' => $event->id,
            'title' => $event->title,
        ]);

        return response()->json([
            'message' => 'Publikasi agenda berhasil dibatalkan (disimpan sebagai draft).',
            'data' => $event->fresh(),
        ]);
    }
}
