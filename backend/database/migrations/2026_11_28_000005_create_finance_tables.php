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
        Schema::create('finance_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('type', 20); // income, expense
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['name', 'type']);
            $table->index(['type', 'is_active']);
        });

        Schema::create('finance_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20); // income, expense
            $table->foreignId('category_id')->constrained('finance_categories')->restrictOnDelete();
            $table->unsignedBigInteger('amount'); // Nominal bilangan bulat Rupiah, maks 1.000.000.000
            $table->date('transaction_date');
            $table->string('description', 200);
            $table->string('counterparty', 80)->nullable(); // Pihak ketiga (internal)
            $table->boolean('counterparty_public')->default(false); // Apakah nama pihak ketiga tampil publik
            $table->string('proof_path')->nullable(); // Bukti nota di disk private
            $table->string('status', 20)->default('draft'); // draft, published
            $table->foreignId('corrects_id')->nullable()->constrained('finance_transactions')->nullOnDelete();
            $table->string('correction_reason', 200)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'transaction_date']);
            $table->index(['type', 'status']);
            $table->index('corrects_id');
        });

        Schema::create('finance_settings', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('opening_balance')->default(0); // Bisa negatif/positif integer
            $table->date('opening_date');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_settings');
        Schema::dropIfExists('finance_transactions');
        Schema::dropIfExists('finance_categories');
    }
};
