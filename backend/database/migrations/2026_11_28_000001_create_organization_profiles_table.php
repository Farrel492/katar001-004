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
        Schema::create('organization_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('short_name');
            $table->string('tagline')->nullable();
            $table->text('about');
            $table->text('history')->nullable();
            $table->text('vision');
            $table->json('missions');
            $table->json('values')->nullable(); // Nilai utama sesuai PRD
            $table->text('address');
            $table->string('region_label')->default('RT 001 RW 004, Kel. Jatibening Baru, Pondok Gede, Bekasi');
            $table->string('whatsapp');
            $table->string('email');
            $table->string('instagram')->nullable();
            $table->string('facebook')->nullable();
            $table->string('youtube')->nullable();
            $table->string('logo_path')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organization_profiles');
    }
};
