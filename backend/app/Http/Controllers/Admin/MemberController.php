<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderMembersRequest;
use App\Http\Requests\Admin\StoreMemberRequest;
use App\Http\Requests\Admin\UpdateMemberRequest;
use App\Http\Requests\Admin\UploadImageRequest;
use App\Models\OrganizationMember;
use App\Services\AuditLogger;
use App\Services\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MemberController extends Controller
{
    public function __construct(
        private readonly ImageUploader $imageUploader,
    ) {}

    /**
     * Daftar semua pengurus (belum terhapus), diurutkan berdasarkan sort_order.
     */
    public function index(): JsonResponse
    {
        $members = OrganizationMember::query()
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $members->map(fn (OrganizationMember $m) => $this->formatMember($m)),
        ]);
    }

    /**
     * Tambah pengurus baru.
     */
    public function store(StoreMemberRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $nextOrder = ((int) OrganizationMember::max('sort_order')) + 1;

        $member = OrganizationMember::create([
            'name' => $validated['name'],
            'position' => $validated['position'],
            'division' => $validated['division'] ?? null,
            'period' => $validated['period'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'is_visible' => array_key_exists('is_visible', $validated) ? (bool) $validated['is_visible'] : true,
            'sort_order' => $nextOrder,
        ]);

        AuditLogger::log($request->user(), 'member_created', $request, [
            'member_id' => $member->id,
            'name' => $member->name,
        ]);

        return response()->json([
            'data' => $this->formatMember($member),
            'message' => 'Pengurus baru berhasil ditambahkan.',
        ], 201);
    }

    /**
     * Perbarui data pengurus.
     */
    public function update(UpdateMemberRequest $request, OrganizationMember $member): JsonResponse
    {
        $validated = $request->validated();
        $changedFields = [];

        foreach ($validated as $key => $value) {
            if ($member->{$key} !== $value) {
                $changedFields[] = $key;
            }
        }

        $member->fill($validated);
        $member->save();

        if (! empty($changedFields)) {
            AuditLogger::log($request->user(), 'member_updated', $request, [
                'member_id' => $member->id,
                'changed_fields' => $changedFields,
            ]);
        }

        return response()->json([
            'data' => $this->formatMember($member->fresh()),
            'message' => 'Data pengurus berhasil diperbarui.',
        ]);
    }

    /**
     * Hapus pengurus (soft delete) dan bersihkan fotonya.
     */
    public function destroy(Request $request, OrganizationMember $member): JsonResponse
    {
        if ($member->photo_path) {
            $this->imageUploader->delete($member->photo_path);
            $member->photo_path = null;
            $member->save();
        }

        $member->delete();

        AuditLogger::log($request->user(), 'member_deleted', $request, [
            'member_id' => $member->id,
            'name' => $member->name,
        ]);

        return response()->json([
            'message' => 'Pengurus berhasil dihapus.',
        ]);
    }

    /**
     * Unggah atau ganti foto pengurus.
     */
    public function uploadPhoto(UploadImageRequest $request, OrganizationMember $member): JsonResponse
    {
        $newPath = $this->imageUploader->upload(
            $request->file('image'),
            'members',
            $member->photo_path,
            'image'
        );

        $member->photo_path = $newPath;
        $member->save();

        AuditLogger::log($request->user(), 'photo_changed', $request, [
            'member_id' => $member->id,
            'action' => 'uploaded',
        ]);

        return response()->json([
            'data' => $this->formatMember($member->fresh()),
            'message' => 'Foto pengurus berhasil diperbarui.',
        ]);
    }

    /**
     * Hapus foto pengurus.
     */
    public function deletePhoto(Request $request, OrganizationMember $member): JsonResponse
    {
        if ($member->photo_path) {
            $this->imageUploader->delete($member->photo_path);
            $member->photo_path = null;
            $member->save();

            AuditLogger::log($request->user(), 'photo_changed', $request, [
                'member_id' => $member->id,
                'action' => 'deleted',
            ]);
        }

        return response()->json([
            'data' => $this->formatMember($member->fresh()),
            'message' => 'Foto pengurus berhasil dihapus.',
        ]);
    }

    /**
     * Atur ulang urutan tampil pengurus berdasarkan daftar ID.
     */
    public function reorder(ReorderMembersRequest $request): JsonResponse
    {
        $ids = $request->validated('ids');

        DB::transaction(function () use ($ids) {
            foreach ($ids as $index => $id) {
                OrganizationMember::where('id', $id)->update(['sort_order' => $index + 1]);
            }
        });

        AuditLogger::log($request->user(), 'member_reordered', $request, [
            'count' => count($ids),
            'ids' => $ids,
        ]);

        $members = OrganizationMember::query()
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'data' => $members->map(fn (OrganizationMember $m) => $this->formatMember($m)),
            'message' => 'Urutan pengurus berhasil disimpan.',
        ]);
    }

    private function formatMember(OrganizationMember $member): array
    {
        return [
            'id' => $member->id,
            'name' => $member->name,
            'position' => $member->position,
            'division' => $member->division,
            'period' => $member->period,
            'bio' => $member->bio,
            'photo_url' => $member->photo_url,
            'sort_order' => (int) $member->sort_order,
            'is_visible' => (bool) $member->is_visible,
            'created_at' => $member->created_at?->toIso8601String(),
            'updated_at' => $member->updated_at?->toIso8601String(),
        ];
    }
}
