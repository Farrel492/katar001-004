<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\OrganizationMember;
use App\Models\OrganizationProfile;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    /**
     * Tampilkan profil organisasi untuk publik (tanpa field internal seperti updated_by / logo_path).
     */
    public function profile(): JsonResponse
    {
        $profile = OrganizationProfile::first();

        if (! $profile) {
            return response()->json([
                'data' => null,
            ])->header('Cache-Control', 'public, max-age=60');
        }

        return response()->json([
            'data' => [
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
            ],
        ])->header('Cache-Control', 'public, max-age=60');
    }

    /**
     * Tampilkan daftar pengurus publik (hanya is_visible = true dan belum dihapus),
     * diurutkan berdasarkan sort_order. Tanpa kontak pribadi anggota.
     */
    public function members(): JsonResponse
    {
        $members = OrganizationMember::query()
            ->where('is_visible', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc')
            ->get(['id', 'name', 'position', 'division', 'period', 'bio', 'photo_path']);

        $data = $members->map(fn (OrganizationMember $member) => [
            'name' => $member->name,
            'position' => $member->position,
            'division' => $member->division,
            'period' => $member->period,
            'bio' => $member->bio,
            'photo_url' => $member->photo_url,
        ]);

        return response()->json([
            'data' => $data,
        ])->header('Cache-Control', 'public, max-age=60');
    }
}
