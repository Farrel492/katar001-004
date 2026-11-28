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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('slug')->unique();
            $table->string('summary', 300);
            $table->text('description');
            $table->string('category', 50)->default('Kegiatan');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();
            $table->string('location', 150)->nullable();
            $table->string('cover_path')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'starts_at']);
        });

        Schema::create('albums', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->string('slug')->unique();
            $table->string('description', 500)->nullable();
            $table->foreignId('event_id')->nullable()->constrained('events')->nullOnDelete();
            $table->date('taken_at')->nullable();
            $table->unsignedBigInteger('cover_photo_id')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
        });

        Schema::create('album_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained('albums')->cascadeOnDelete();
            $table->string('path');
            $table->string('caption', 200)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['album_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('album_photos');
        Schema::dropIfExists('albums');
        Schema::dropIfExists('events');
    }
};
