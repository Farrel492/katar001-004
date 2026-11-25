<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Admin login page (Blade view)
Route::view('/admin/login', 'admin.login')->name('admin.login');

// Admin dashboard (protected)
Route::middleware(['auth:sanctum', 'admin.active', 'admin.password_change'])
    ->group(function () {
        Route::view('/admin/dashboard', 'admin.dashboard')->name('admin.dashboard');
    });
