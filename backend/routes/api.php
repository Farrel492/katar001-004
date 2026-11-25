<?php

use App\Http\Controllers\HealthController;
use App\Http\Controllers\Admin\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

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
    });
});
