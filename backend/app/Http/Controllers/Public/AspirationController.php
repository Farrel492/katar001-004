<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\SubmitAspirationRequest;
use App\Models\Aspiration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AspirationController extends Controller
{
    public function submit(SubmitAspirationRequest $request): JsonResponse
    {
        // Honeypot check: bila terisi bot, balas 201 seolah berhasil tanpa menyimpan
        if ($request->filled('website')) {
            $fakeCode = 'ASP-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
            return response()->json([
                'message' => 'Aspirasi Anda berhasil dikirim. Catat dan simpan kode pelacakan ini.',
                'tracking_code' => $fakeCode,
            ], 201);
        }

        $validated = $request->validated();
        $trackingCode = Aspiration::generateTrackingCode();
        $ipHash = Aspiration::hashIp($request->ip() ?? '127.0.0.1');

        $aspiration = Aspiration::create([
            'tracking_code' => $trackingCode,
            'name' => $validated['name'] ?? null,
            'contact' => $validated['contact'] ?? null,
            'category' => $validated['category'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'status' => 'new',
            'is_public' => false,
            'ip_hash' => $ipHash,
        ]);

        return response()->json([
            'message' => 'Aspirasi Anda berhasil dikirim. Catat dan simpan kode pelacakan ini.',
            'tracking_code' => $aspiration->tracking_code,
        ], 201);
    }

    public function track(Request $request, string $code): JsonResponse
    {
        $aspiration = Aspiration::where('tracking_code', $code)->first();

        if (! $aspiration) {
            return response()->json([
                'message' => 'Kode pelacakan aspirasi tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'tracking_code' => $aspiration->tracking_code,
            'status' => $aspiration->status,
            'category' => $aspiration->category,
            'subject' => $aspiration->subject,
            'public_reply' => $aspiration->public_reply,
            'created_at' => $aspiration->created_at->toISOString(),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $aspirations = Aspiration::where('is_public', true)
            ->whereNotIn('status', ['spam', 'rejected'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $aspirations->getCollection()->transform(function ($item) {
            return [
                'id' => $item->id,
                'author_name' => 'Warga',
                'category' => $item->category,
                'subject' => $item->subject,
                'message' => $item->message,
                'public_reply' => $item->public_reply,
                'created_at' => $item->created_at->toISOString(),
            ];
        });

        return response()->json($aspirations)
            ->header('Cache-Control', 'public, max-age=60');
    }
}
