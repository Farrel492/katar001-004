<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Enums\UserRole;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Tampilkan daftar akun pengguna.
     * Hanya akun belum terhapus (soft delete), superadmin duluan lalu urut nama, maksimal 200.
     */
    public function index(Request $request)
    {
        $currentUserId = $request->user()->id;

        $users = User::orderByRaw("CASE WHEN role = 'superadmin' THEN 0 ELSE 1 END")
            ->orderBy('name', 'asc')
            ->limit(200)
            ->get();

        $data = $users->map(fn (User $user) => $this->formatUser($user, $currentUserId));

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Buat akun baru dengan kata sandi sementara otomatis dari sistem.
     */
    public function store(Request $request)
    {
        // Normalisasi username: lowercase + trim
        $usernameInput = strtolower(trim((string) $request->input('username')));
        $request->merge(['username' => $usernameInput]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'username' => [
                'required',
                'string',
                'regex:/^[a-z0-9._-]{3,50}$/',
                Rule::unique('users', 'username'),
            ],
            'role' => ['required', 'string', Rule::in(['admin', 'superadmin'])],
        ], [
            'name.required' => 'Nama pengguna wajib diisi.',
            'name.max' => 'Nama pengguna maksimal 100 karakter.',
            'username.required' => 'Username wajib diisi.',
            'username.regex' => 'Username hanya boleh terdiri dari huruf kecil, angka, titik, strip, dan garis bawah (3-50 karakter).',
            'username.unique' => 'Username sudah digunakan, termasuk oleh akun yang dinonaktifkan.',
            'role.required' => 'Peran akun wajib dipilih.',
            'role.in' => 'Peran akun harus berupa admin atau superadmin.',
        ]);

        $tempPassword = $this->generateTemporaryPassword($validated['username']);

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'role' => $validated['role'],
            'password' => Hash::make($tempPassword),
            'is_active' => true,
            'must_change_password' => true,
        ]);

        // Audit log (TANPA kata sandi)
        AuditLogger::log($request->user(), 'user_created', $request, [
            'target_user_id' => $user->id,
        ]);

        return response()->json([
            'data' => $this->formatUser($user, $request->user()->id),
            'temporary_password' => $tempPassword,
        ], 201)->header('Cache-Control', 'no-store, private');
    }

    /**
     * Perbarui data akun (nama, peran, status aktif).
     */
    public function update(Request $request, User $user)
    {
        $currentUserId = $request->user()->id;
        $currentUserRole = $this->extractRoleString($request->user());
        $targetUserRole = $this->extractRoleString($user);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'role' => ['sometimes', 'required', 'string', Rule::in(['admin', 'superadmin'])],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ], [
            'name.required' => 'Nama pengguna wajib diisi.',
            'name.max' => 'Nama pengguna maksimal 100 karakter.',
            'role.required' => 'Peran akun wajib dipilih.',
            'role.in' => 'Peran akun harus berupa admin atau superadmin.',
            'is_active.required' => 'Status aktif akun wajib ditentukan.',
            'is_active.boolean' => 'Status aktif harus bernilai benar atau salah.',
        ]);

        // 1. Akun sendiri tidak boleh ubah role atau menonaktifkan diri
        if ($user->id === $currentUserId) {
            if ($request->has('role') && $validated['role'] !== $currentUserRole) {
                return response()->json([
                    'message' => 'Anda tidak dapat mengubah peran akun Anda sendiri.',
                ], 422);
            }

            if ($request->has('is_active') && ! (bool) $validated['is_active']) {
                return response()->json([
                    'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
                ], 422);
            }
        }

        // 2. Proteksi Superadmin Aktif Terakhir
        $isTargetActiveSuperadmin = ($targetUserRole === 'superadmin') && (bool) $user->is_active;
        if ($isTargetActiveSuperadmin) {
            $activeSuperadminCount = User::where('role', 'superadmin')->where('is_active', true)->count();

            if ($activeSuperadminCount <= 1) {
                if ($request->has('role') && $validated['role'] !== 'superadmin') {
                    return response()->json([
                        'message' => 'Tidak dapat menurunkan peran superadmin aktif terakhir.',
                    ], 422);
                }

                if ($request->has('is_active') && ! (bool) $validated['is_active']) {
                    return response()->json([
                        'message' => 'Tidak dapat menonaktifkan superadmin aktif terakhir.',
                    ], 422);
                }
            }
        }

        $from = [];
        $to = [];

        if ($request->has('name') && $validated['name'] !== $user->name) {
            $from['name'] = $user->name;
            $to['name'] = $validated['name'];
            $user->name = $validated['name'];
        }

        if ($request->has('role') && $validated['role'] !== $targetUserRole) {
            $from['role'] = $targetUserRole;
            $to['role'] = $validated['role'];
            $user->role = $validated['role'];
        }

        if ($request->has('is_active') && (bool) $validated['is_active'] !== (bool) $user->is_active) {
            $from['is_active'] = (bool) $user->is_active;
            $to['is_active'] = (bool) $validated['is_active'];
            $user->is_active = (bool) $validated['is_active'];

            // Jika dinonaktifkan, hapus semua sesi akun tersebut
            if (! (bool) $validated['is_active']) {
                $this->invalidateUserSessions($user->id);
            }
        }

        $user->save();

        if (! empty($to)) {
            AuditLogger::log($request->user(), 'user_updated', $request, [
                'target_user_id' => $user->id,
                'from' => $from,
                'to' => $to,
            ]);
        }

        return response()->json([
            'data' => $this->formatUser($user, $currentUserId),
        ]);
    }

    /**
     * Reset kata sandi akun pengguna lain dan buat kata sandi sementara baru.
     */
    public function resetPassword(Request $request, User $user)
    {
        $currentUserId = $request->user()->id;

        // Tidak boleh reset kata sandi akun sendiri lewat endpoint ini
        if ($user->id === $currentUserId) {
            return response()->json([
                'message' => 'Tidak dapat mereset kata sandi akun sendiri melalui fitur ini. Silakan gunakan menu ganti kata sandi.',
            ], 422);
        }

        $tempPassword = $this->generateTemporaryPassword($user->username);

        $user->password = Hash::make($tempPassword);
        $user->must_change_password = true;
        $user->save();

        // Hapus semua sesi akun target
        $this->invalidateUserSessions($user->id);

        // Audit log (TANPA kata sandi)
        AuditLogger::log($request->user(), 'user_password_reset', $request, [
            'target_user_id' => $user->id,
        ]);

        return response()->json([
            'data' => $this->formatUser($user, $currentUserId),
            'temporary_password' => $tempPassword,
        ])->header('Cache-Control', 'no-store, private');
    }

    /**
     * Hapus akun pengguna (soft delete).
     */
    public function destroy(Request $request, User $user)
    {
        $currentUserId = $request->user()->id;
        $targetUserRole = $this->extractRoleString($user);

        // Tidak boleh menghapus akun sendiri
        if ($user->id === $currentUserId) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        // Proteksi Superadmin Aktif Terakhir
        $isTargetActiveSuperadmin = ($targetUserRole === 'superadmin') && (bool) $user->is_active;
        if ($isTargetActiveSuperadmin) {
            $activeSuperadminCount = User::where('role', 'superadmin')->where('is_active', true)->count();
            if ($activeSuperadminCount <= 1) {
                return response()->json([
                    'message' => 'Tidak dapat menghapus superadmin aktif terakhir.',
                ], 422);
            }
        }

        // Soft delete + is_active = false
        $user->is_active = false;
        $user->save();
        $user->delete();

        // Hapus semua sesi akun target
        $this->invalidateUserSessions($user->id);

        AuditLogger::log($request->user(), 'user_deleted', $request, [
            'target_user_id' => $user->id,
        ]);

        return response()->json([
            'message' => 'Akun berhasil dihapus.',
        ]);
    }

    /**
     * Buat format kata sandi sementara yang acak dan aman.
     * 4 kelompok x 4 karakter alfabet abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789 dipisah strip.
     * Tidak boleh mengandung username.
     */
    private function generateTemporaryPassword(string $username): string
    {
        $alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $alphaLen = strlen($alphabet);
        $cleanUsername = strtolower(trim($username));

        do {
            $groups = [];
            for ($g = 0; $g < 4; $g++) {
                $group = '';
                for ($c = 0; $c < 4; $c++) {
                    $group .= $alphabet[random_int(0, $alphaLen - 1)];
                }
                $groups[] = $group;
            }
            $tempPassword = implode('-', $groups);
        } while (str_contains(strtolower($tempPassword), $cleanUsername));

        return $tempPassword;
    }

    /**
     * Hapus semua sesi login pengguna jika driver database aktif atau tabel sessions tersedia.
     */
    private function invalidateUserSessions(int $userId): void
    {
        try {
            if (config('session.driver') === 'database' || Schema::hasTable('sessions')) {
                DB::table('sessions')->where('user_id', $userId)->delete();
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Dapatkan representasi string role pengguna (enum atau string).
     */
    private function extractRoleString(User $user): string
    {
        return $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;
    }

    /**
     * Format payload pengguna yang aman (tanpa password / remember_token).
     */
    private function formatUser(User $user, int $currentUserId): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'role' => $this->extractRoleString($user),
            'is_active' => (bool) $user->is_active,
            'must_change_password' => (bool) $user->must_change_password,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'created_at' => $user->created_at?->toIso8601String(),
            'is_self' => $user->id === $currentUserId,
        ];
    }
}
