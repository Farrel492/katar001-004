<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateProfileRequest;
use App\Http\Requests\Admin\UploadImageRequest;
use App\Models\OrganizationProfile;
use App\Services\AuditLogger;
use App\Services\ImageUploader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ImageUploader $imageUploader,
    ) {}

    /**
     * Ambil data profil organisasi (atau buat singleton default jika belum ada).
     */
    public function show(): JsonResponse
    {
        $profile = $this->getOrCreateSingleton();

        return response()->json([
            'data' => $this->formatProfile($profile),
        ]);
    }

    /**
     * Perbarui data profil organisasi.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $profile = $this->getOrCreateSingleton();
        $validated = $request->validated();

        $changedFields = [];
        foreach ($validated as $key => $value) {
            if ($profile->{$key} !== $value) {
                $changedFields[] = $key;
            }
        }

        $profile->fill($validated);
        $profile->updated_by = $request->user()->id;
        $profile->save();

        if (! empty($changedFields)) {
            AuditLogger::log($request->user(), 'profile_updated', $request, [
                'profile_id' => $profile->id,
                'changed_fields' => $changedFields,
            ]);
        }

        return response()->json([
            'data' => $this->formatProfile($profile->fresh()),
            'message' => 'Profil organisasi berhasil diperbarui.',
        ]);
    }

    /**
     * Unggah atau ganti logo organisasi.
     */
    public function uploadLogo(UploadImageRequest $request): JsonResponse
    {
        $profile = $this->getOrCreateSingleton();

        $newPath = $this->imageUploader->upload(
            $request->file('image'),
            'profile',
            $profile->logo_path,
            'image'
        );

        $profile->logo_path = $newPath;
        $profile->updated_by = $request->user()->id;
        $profile->save();

        AuditLogger::log($request->user(), 'logo_changed', $request, [
            'profile_id' => $profile->id,
            'action' => 'uploaded',
        ]);

        return response()->json([
            'data' => $this->formatProfile($profile->fresh()),
            'message' => 'Logo organisasi berhasil diperbarui.',
        ]);
    }

    /**
     * Hapus logo organisasi.
     */
    public function deleteLogo(Request $request): JsonResponse
    {
        $profile = $this->getOrCreateSingleton();

        if ($profile->logo_path) {
            $this->imageUploader->delete($profile->logo_path);
            $profile->logo_path = null;
            $profile->updated_by = $request->user()->id;
            $profile->save();

            AuditLogger::log($request->user(), 'logo_changed', $request, [
                'profile_id' => $profile->id,
                'action' => 'deleted',
            ]);
        }

        return response()->json([
            'data' => $this->formatProfile($profile->fresh()),
            'message' => 'Logo organisasi berhasil dihapus.',
        ]);
    }

    private function getOrCreateSingleton(): OrganizationProfile
    {
        return OrganizationProfile::firstOrCreate(
            ['id' => 1],
            [
                'name' => 'Karang Taruna RT 001 RW 004',
                'short_name' => 'Katar 01/04',
                'tagline' => 'Generasi Muda Berkarya, Membangun Lingkungan Berdaya',
                'about' => 'Wadah pembinaan dan pengembangan generasi muda di lingkungan RT 001 RW 004.',
                'history' => '',
                'vision' => 'Mewujudkan pemuda yang berakhlak mulia, mandiri, dan peduli lingkungan.',
                'missions' => ['Mengembangkan potensi generasi muda.'],
                'values' => ['Kebersamaan', 'Transparansi'],
                'address' => 'RT 001 RW 004, Kel. Jatibening Baru, Kec. Pondok Gede, Kota Bekasi',
                'region_label' => 'RT 001 RW 004, Kel. Jatibening Baru, Pondok Gede, Bekasi',
                'whatsapp' => '6281200000000',
                'email' => 'katar0104@example.org',
            ]
        );
    }

    private function formatProfile(OrganizationProfile $profile): array
    {
        return [
            'id' => $profile->id,
            'name' => $profile->name,
            'short_name' => $profile->short_name,
            'tagline' => $profile->tagline,
            'about' => $profile->about,
            'history' => $profile->history,
            'vision' => $profile->vision,
            'missions' => $profile->missions ?? [],
            'values' => $profile->values ?? [],
            'address' => $profile->address,
            'region_label' => $profile->region_label,
            'whatsapp' => $profile->whatsapp,
            'email' => $profile->email,
            'instagram' => $profile->instagram,
            'facebook' => $profile->facebook,
            'youtube' => $profile->youtube,
            'logo_url' => $profile->logo_url,
            'updated_at' => $profile->updated_at?->toIso8601String(),
        ];
    }
}
