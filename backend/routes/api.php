<?php

use App\Http\Controllers\HealthController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\EventController;
use App\Http\Controllers\Admin\AlbumController;
use App\Http\Controllers\Admin\MemberController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Public\ProfileController as PublicProfileController;
use App\Http\Controllers\Public\EventAndAlbumController as PublicEventAndAlbumController;
use App\Http\Controllers\Public\AspirationController as PublicAspirationController;
use App\Http\Controllers\Public\FinanceController as PublicFinanceController;
use App\Http\Controllers\Admin\AspirationController as AdminAspirationController;
use App\Http\Controllers\Admin\FinanceCategoryController;
use App\Http\Controllers\Admin\FinanceSettingController;
use App\Http\Controllers\Admin\FinanceTransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

// Endpoint Publik (tanpa login, rate limit wajar)
Route::prefix('public')->name('public.')->middleware('throttle:public-api')->group(function () {
    Route::get('profile', [PublicProfileController::class, 'profile'])->name('profile');
    Route::get('members', [PublicProfileController::class, 'members'])->name('members');

    // Agenda & Dokumentasi Publik
    Route::get('events', [PublicEventAndAlbumController::class, 'events'])->name('events');
    Route::get('events/{slug}', [PublicEventAndAlbumController::class, 'eventDetail'])->name('events.show');
    Route::get('albums', [PublicEventAndAlbumController::class, 'albums'])->name('albums');
    Route::get('albums/{slug}', [PublicEventAndAlbumController::class, 'albumDetail'])->name('albums.show');

    // Aspirasi Publik
    Route::post('aspirations', [PublicAspirationController::class, 'submit'])
        ->middleware('throttle:public-aspiration-submit')
        ->name('aspirations.submit');
    Route::get('aspirations/track/{code}', [PublicAspirationController::class, 'track'])
        ->middleware('throttle:public-aspiration-track')
        ->name('aspirations.track');
    Route::get('aspirations', [PublicAspirationController::class, 'index'])
        ->name('aspirations.index');

    // Transparansi Keuangan Publik
    Route::get('finance/summary', [PublicFinanceController::class, 'summary'])->name('finance.summary');
    Route::get('finance/transactions', [PublicFinanceController::class, 'transactions'])->name('finance.transactions');
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

        // Manajemen Agenda (Events)
        Route::prefix('events')->name('events.')->group(function () {
            Route::get('', [EventController::class, 'index'])->name('index');
            Route::post('', [EventController::class, 'store'])->name('store');
            Route::get('{event}', [EventController::class, 'show'])->name('show');
            Route::patch('{event}', [EventController::class, 'update'])->name('update');
            Route::delete('{event}', [EventController::class, 'destroy'])->name('destroy');
            Route::post('{event}/cover', [EventController::class, 'uploadCover'])->name('uploadCover');
            Route::delete('{event}/cover', [EventController::class, 'deleteCover'])->name('deleteCover');
            Route::post('{event}/publish', [EventController::class, 'publish'])->name('publish');
            Route::post('{event}/unpublish', [EventController::class, 'unpublish'])->name('unpublish');
        });

        // Manajemen Galeri / Album Dokumentasi
        Route::prefix('albums')->name('albums.')->group(function () {
            Route::get('', [AlbumController::class, 'index'])->name('index');
            Route::post('', [AlbumController::class, 'store'])->name('store');
            Route::get('{album}', [AlbumController::class, 'show'])->name('show');
            Route::patch('{album}', [AlbumController::class, 'update'])->name('update');
            Route::delete('{album}', [AlbumController::class, 'destroy'])->name('destroy');
            Route::post('{album}/publish', [AlbumController::class, 'publish'])->name('publish');
            Route::post('{album}/unpublish', [AlbumController::class, 'unpublish'])->name('unpublish');

            // Manajemen Foto di Album
            Route::prefix('{album}/photos')->name('photos.')->group(function () {
                Route::post('', [AlbumController::class, 'uploadPhotos'])->name('upload');
                Route::patch('{photo}', [AlbumController::class, 'updatePhotoCaption'])->name('updateCaption');
                Route::delete('{photo}', [AlbumController::class, 'deletePhoto'])->name('destroy');
                Route::post('reorder', [AlbumController::class, 'reorderPhotos'])->name('reorder');
                Route::post('set-cover', [AlbumController::class, 'setCover'])->name('setCover');
            });
        });

        // Manajemen Aspirasi Warga (Admin & Superadmin Setara)
        Route::prefix('aspirations')->name('aspirations.')->group(function () {
            Route::get('', [AdminAspirationController::class, 'index'])->name('index');
            Route::get('stats', [AdminAspirationController::class, 'stats'])->name('stats');
            Route::get('{aspiration}', [AdminAspirationController::class, 'show'])->name('show');
            Route::patch('{aspiration}', [AdminAspirationController::class, 'update'])->name('update');
            Route::delete('{aspiration}', [AdminAspirationController::class, 'destroy'])->name('destroy');
        });

        // Manajemen Keuangan (Admin & Superadmin Setara)
        Route::prefix('finance')->name('finance.')->group(function () {
            // Pengaturan Saldo Awal
            Route::get('settings', [FinanceSettingController::class, 'show'])->name('settings.show');
            Route::put('settings', [FinanceSettingController::class, 'update'])->name('settings.update');

            // Kategori Keuangan
            Route::prefix('categories')->name('categories.')->group(function () {
                Route::get('', [FinanceCategoryController::class, 'index'])->name('index');
                Route::post('', [FinanceCategoryController::class, 'store'])->name('store');
                Route::patch('{category}', [FinanceCategoryController::class, 'update'])->name('update');
            });

            // Ekspor CSV
            Route::get('export', [FinanceTransactionController::class, 'export'])->name('export');

            // Transaksi Keuangan
            Route::prefix('transactions')->name('transactions.')->group(function () {
                Route::get('', [FinanceTransactionController::class, 'index'])->name('index');
                Route::post('', [FinanceTransactionController::class, 'store'])->name('store');
                Route::get('{transaction}', [FinanceTransactionController::class, 'show'])->name('show');
                Route::patch('{transaction}', [FinanceTransactionController::class, 'update'])->name('update');
                Route::delete('{transaction}', [FinanceTransactionController::class, 'destroy'])->name('destroy');
                Route::post('{transaction}/publish', [FinanceTransactionController::class, 'publish'])->name('publish');
                Route::post('{transaction}/correct', [FinanceTransactionController::class, 'correct'])->name('correct');

                // Bukti Nota (Disk Private)
                Route::post('{transaction}/proof', [FinanceTransactionController::class, 'uploadProof'])->name('uploadProof');
                Route::delete('{transaction}/proof', [FinanceTransactionController::class, 'deleteProof'])->name('deleteProof');
                Route::get('{transaction}/proof', [FinanceTransactionController::class, 'getProof'])->name('getProof');
            });
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
