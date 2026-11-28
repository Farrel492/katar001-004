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
        Schema::create('aspirations', function (Blueprint $table) {
            $table->id();
            $table->string('tracking_code', 30)->unique();
            $table->string('name', 80)->nullable();
            $table->string('contact', 100)->nullable();
            $table->string('category', 30); // saran, keluhan, pertanyaan, usulan_kegiatan, lainnya
            $table->string('subject', 120);
            $table->text('message'); // min 10, max 2000
            $table->string('status', 20)->default('new'); // new, read, in_progress, done, rejected, spam
            $table->text('internal_note')->nullable(); // maks 1000
            $table->text('public_reply')->nullable(); // maks 1000
            $table->boolean('is_public')->default(false);
            $table->string('ip_hash', 64); // HMAC-SHA256 IP dengan APP_KEY
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index(['is_public', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('aspirations');
    }
};
