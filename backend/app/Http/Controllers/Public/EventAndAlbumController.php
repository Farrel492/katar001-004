<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Event;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventAndAlbumController extends Controller
{
    public function events(Request $request): JsonResponse
    {
        $query = Event::query()
            ->published()
            ->select([
                'id',
                'title',
                'slug',
                'summary',
                'description',
                'category',
                'starts_at',
                'ends_at',
                'location',
                'cover_path',
                'created_at',
            ]);

        $now = Carbon::now();
        $scope = $request->query('scope', 'upcoming');

        if ($scope === 'past') {
            // Selesai atau dimulai sebelum sekarang
            $query->where(function ($q) use ($now) {
                $q->whereNotNull('ends_at')->where('ends_at', '<', $now)
                    ->orWhere(function ($sub) use ($now) {
                        $sub->whereNull('ends_at')->where('starts_at', '<', $now);
                    });
            })->orderBy('starts_at', 'desc');
        } else {
            // Upcoming: belum selesai atau akan mulai
            $query->where(function ($q) use ($now) {
                $q->whereNotNull('ends_at')->where('ends_at', '>=', $now)
                    ->orWhere(function ($sub) use ($now) {
                        $sub->whereNull('ends_at')->where('starts_at', '>=', $now);
                    });
            })->orderBy('starts_at', 'asc');
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        $events = $query->paginate(9);

        return response()->json($events)
            ->header('Cache-Control', 'public, max-age=60');
    }

    public function eventDetail(string $slug): JsonResponse
    {
        $event = Event::query()
            ->published()
            ->where('slug', $slug)
            ->with(['albums' => function ($q) {
                $q->published()->select(['id', 'event_id', 'title', 'slug', 'description', 'taken_at', 'cover_photo_id', 'created_at'])->with('coverPhoto');
            }])
            ->first();

        if (! $event) {
            return response()->json(['message' => 'Agenda kegiatan tidak ditemukan atau belum diterbitkan.'], 404);
        }

        return response()->json([
            'data' => [
                'title' => $event->title,
                'slug' => $event->slug,
                'summary' => $event->summary,
                'description' => $event->description,
                'category' => $event->category,
                'starts_at' => $event->starts_at->toISOString(),
                'ends_at' => $event->ends_at?->toISOString(),
                'location' => $event->location,
                'cover_url' => $event->cover_url,
                'albums' => $event->albums->map(fn ($album) => [
                    'title' => $album->title,
                    'slug' => $album->slug,
                    'description' => $album->description,
                    'taken_at' => $album->taken_at?->toDateString(),
                    'cover_url' => $album->cover_url,
                    'photos_count' => $album->photos_count,
                ]),
            ],
        ])->header('Cache-Control', 'public, max-age=60');
    }

    public function albums(Request $request): JsonResponse
    {
        $albums = Album::query()
            ->published()
            ->select(['id', 'title', 'slug', 'description', 'event_id', 'taken_at', 'cover_photo_id', 'created_at'])
            ->with(['coverPhoto', 'event:id,title,slug'])
            ->withCount('photos')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        $albums->getCollection()->transform(function ($album) {
            return [
                'title' => $album->title,
                'slug' => $album->slug,
                'description' => $album->description,
                'taken_at' => $album->taken_at?->toDateString(),
                'cover_url' => $album->cover_url,
                'photos_count' => $album->photos_count,
                'event' => $album->event ? [
                    'title' => $album->event->title,
                    'slug' => $album->event->slug,
                ] : null,
            ];
        });

        return response()->json($albums)
            ->header('Cache-Control', 'public, max-age=60');
    }

    public function albumDetail(string $slug): JsonResponse
    {
        $album = Album::query()
            ->published()
            ->where('slug', $slug)
            ->with([
                'photos' => fn ($q) => $q->select(['id', 'album_id', 'path', 'caption', 'sort_order']),
                'event:id,title,slug',
            ])
            ->first();

        if (! $album) {
            return response()->json(['message' => 'Album dokumentasi tidak ditemukan atau belum diterbitkan.'], 404);
        }

        return response()->json([
            'data' => [
                'title' => $album->title,
                'slug' => $album->slug,
                'description' => $album->description,
                'taken_at' => $album->taken_at?->toDateString(),
                'cover_url' => $album->cover_url,
                'event' => $album->event ? [
                    'title' => $album->event->title,
                    'slug' => $album->event->slug,
                ] : null,
                'photos' => $album->photos->map(fn ($photo) => [
                    'id' => $photo->id,
                    'photo_url' => $photo->photo_url,
                    'caption' => $photo->caption,
                    'sort_order' => $photo->sort_order,
                ]),
            ],
        ])->header('Cache-Control', 'public, max-age=60');
    }
}
