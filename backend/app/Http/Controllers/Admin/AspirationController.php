<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateAspirationRequest;
use App\Models\Aspiration;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AspirationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Aspiration::query()->with('handler:id,name,username');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->query('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', $search)
                  ->orWhere('message', 'like', $search)
                  ->orWhere('tracking_code', 'like', $search);
            });
        }

        $aspirations = $query->orderBy('created_at', 'desc')->paginate(15);

        // Jangan kirim ip_hash ke frontend
        $aspirations->getCollection()->makeHidden(['ip_hash']);

        return response()->json($aspirations);
    }

    public function stats(): JsonResponse
    {
        $stats = [
            'new' => Aspiration::where('status', 'new')->count(),
            'read' => Aspiration::where('status', 'read')->count(),
            'in_progress' => Aspiration::where('status', 'in_progress')->count(),
            'done' => Aspiration::where('status', 'done')->count(),
            'rejected' => Aspiration::where('status', 'rejected')->count(),
            'spam' => Aspiration::where('status', 'spam')->count(),
            'total' => Aspiration::count(),
        ];

        return response()->json($stats);
    }

    public function show(Request $request, Aspiration $aspiration): JsonResponse
    {
        // Tandai otomatis new -> read bila admin membuka detail
        if ($aspiration->status === 'new') {
            $aspiration->update([
                'status' => 'read',
                'handled_by' => $request->user()->id,
            ]);

            AuditLogger::log($request->user(), 'aspiration_status_changed', $request, [
                'aspiration_id' => $aspiration->id,
                'from' => 'new',
                'to' => 'read',
            ]);
        }

        $aspiration->load('handler:id,name,username');
        $aspiration->makeHidden(['ip_hash']);

        return response()->json($aspiration);
    }

    public function update(UpdateAspirationRequest $request, Aspiration $aspiration): JsonResponse
    {
        $oldStatus = $aspiration->status;
        $oldIsPublic = (bool) $aspiration->is_public;

        $newStatus = $request->has('status') ? $request->status : $oldStatus;
        $newIsPublic = $request->has('is_public') ? (bool) $request->is_public : $oldIsPublic;

        // is_public=true ditolak 422 bila status spam/rejected
        if ($newIsPublic && in_array($newStatus, ['spam', 'rejected'], true)) {
            throw ValidationException::withMessages([
                'is_public' => ['Aspirasi dengan status spam atau ditolak tidak boleh ditampilkan ke publik.'],
            ]);
        }

        $payload = [];
        if ($request->has('status')) {
            $payload['status'] = $newStatus;
        }
        if ($request->has('internal_note')) {
            $payload['internal_note'] = $request->internal_note;
        }
        if ($request->has('public_reply')) {
            $payload['public_reply'] = $request->public_reply;
        }
        if ($request->has('is_public')) {
            $payload['is_public'] = $newIsPublic;
        }
        $payload['handled_by'] = $request->user()->id;

        $aspiration->update($payload);

        // Audit status changed jika ada perubahan status
        if ($newStatus !== $oldStatus) {
            AuditLogger::log($request->user(), 'aspiration_status_changed', $request, [
                'aspiration_id' => $aspiration->id,
                'from' => $oldStatus,
                'to' => $newStatus,
            ]);
        }

        // Audit publication changed jika ada perubahan is_public
        if ($newIsPublic !== $oldIsPublic) {
            $action = $newIsPublic ? 'aspiration_published' : 'aspiration_unpublished';
            AuditLogger::log($request->user(), $action, $request, [
                'aspiration_id' => $aspiration->id,
            ]);
        }

        $aspiration->load('handler:id,name,username');
        $aspiration->makeHidden(['ip_hash']);

        return response()->json($aspiration);
    }

    public function destroy(Request $request, Aspiration $aspiration): JsonResponse
    {
        $id = $aspiration->id;
        $aspiration->delete();

        AuditLogger::log($request->user(), 'aspiration_deleted', $request, [
            'aspiration_id' => $id,
        ]);

        return response()->json([
            'message' => 'Aspirasi berhasil dihapus.',
        ]);
    }
}
