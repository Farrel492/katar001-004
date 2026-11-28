<?php

use App\Http\Controllers\HealthController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Public\ProfileController as PublicProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

// Endpoint Publik (tanpa login, rate limit wajar)
Route::prefix('public')->name('public.')->middleware('throttle:public-api')->group(function () {
    Route::get('profile', [PublicProfileController::class, 'profile'])->name('profile');
    Route::get('members', [PublicProfileController::class, 'members'])->name('members');
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Admin authentication routes
Route::prefix('admin')->name('admin.')->group(function () {
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:admin-login')
        ->name('login');

    Route::middleware(['auth:sanctum', 'admin.active', 'admin.password_change'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
        Route::put('me/password', [AuthController::class, 'changePassword'])
            ->middleware('throttle:admin-password')
            ->name('changePassword');

        // Manajemen Profil Organisasi & Struktur Pengurus (Admin & Superadmin)
        Route::get('profile', [AdminProfileController::class, 'show'])->name('profile.show');
        Route::put('profile', [AdminProfileController::class, 'update'])->name('profile.update');
        Route::post('profile/logo', [AdminProfileController::class, 'uploadLogo'])->name('profile.uploadLogo');
        Route::delete('profile/logo', [AdminProfileController::class, 'deleteLogo'])->name('profile.deleteLogo');

        Route::prefix('members')->name('members.')->group(function () {
            Route::get('', [MemberController::class, 'index'])->name('index');
            Route::post('', [MemberController::class, 'store'])->name('store');
            Route::post('reorder', [MemberController::class, 'reorder'])->name('reorder');
            Route::patch('{member}', [MemberController::class, 'update'])->name('update');
            Route::delete('{member}', [MemberController::class, 'destroy'])->name('destroy');
            Route::post('{member}/photo', [MemberController::class, 'uploadPhoto'])->name('uploadPhoto');
            Route::delete('{member}/photo', [MemberController::class, 'deletePhoto'])->name('deletePhoto');
        });

        // Manajemen Akun Pengguna (Hanya Superadmin Aktif)
        Route::middleware('can:manage-users')->prefix('users')->name('users.')->group(function () {
            Route::get('', [UserController::class, 'index'])->name('index');
            Route::post('', [UserController::class, 'store'])->name('store');
            Route::patch('{user}', [UserController::class, 'update'])->name('update');
            Route::post('{user}/reset-password', [UserController::class, 'resetPassword'])->name('resetPassword');
            Route::delete('{user}', [UserController::class, 'destroy'])->name('destroy');
        });
    });
});
