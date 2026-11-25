<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Make email nullable
            $table->string('email')->nullable()->change();
            // Add username for admin login
            $table->string('username')->unique()->after('id');
            // Role enum (superadmin, admin)
            $table->string('role')->default('admin')->after('username');
            // Active flag
            $table->boolean('is_active')->default(true)->after('role');
            // Must change password flag
            $table->boolean('must_change_password')->default(false)->after('is_active');
            // Soft deletes
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['username', 'role', 'is_active', 'must_change_password']);
            $table->dropSoftDeletes();
            $table->string('email')->nullable(false)->change();
        });
    }
};
