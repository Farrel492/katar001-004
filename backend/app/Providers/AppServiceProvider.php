<?php

namespace App\Providers;

use App\Enums\UserRole;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Hanya superadmin yang aktif boleh mengelola akun.
        Gate::define('manage-users', function ($user): bool {
            return $user->role === UserRole::SUPERADMIN && (bool) $user->is_active;
        });

        $tooMany = function (Request $request, array $headers) {
            return response()->json([
                'message' => 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
            ], 429, $headers);
        };

        // Login: 5/menit per username+IP, dan 20/menit per IP.
        RateLimiter::for('admin-login', function (Request $request) use ($tooMany) {
            $username = strtolower(trim((string) $request->input('username')));

            return [
                Limit::perMinute(5)->by($username.'|'.$request->ip())->response($tooMany),
                Limit::perMinute(20)->by($request->ip())->response($tooMany),
            ];
        });

        // Ganti password: 5/menit per pengguna.
        RateLimiter::for('admin-password', function (Request $request) use ($tooMany) {
            return Limit::perMinute(5)
                ->by((string) ($request->user()?->id ?: $request->ip()))
                ->response($tooMany);
        });
    }
}