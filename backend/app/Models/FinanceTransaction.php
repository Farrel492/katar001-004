<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinanceTransaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'type',
        'category_id',
        'amount',
        'transaction_date',
        'description',
        'counterparty',
        'counterparty_public',
        'proof_path',
        'status',
        'corrects_id',
        'correction_reason',
        'created_by',
        'updated_by',
        'published_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'counterparty_public' => 'boolean',
        'transaction_date' => 'date:Y-m-d',
        'published_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(FinanceCategory::class, 'category_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function originalTransaction(): BelongsTo
    {
        return $this->belongsTo(FinanceTransaction::class, 'corrects_id');
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(FinanceTransaction::class, 'corrects_id');
    }

    /**
     * Hitung saldo saat ini dari opening balance + seluruh published income - published expense.
     * Dihitung secara tepat menggunakan integer.
     */
    public static function calculateCurrentBalance(): int
    {
        $settings = FinanceSetting::getSettings();
        $opening = (int) $settings->opening_balance;

        $income = (int) static::where('status', 'published')
            ->where('type', 'income')
            ->sum('amount');

        $expense = (int) static::where('status', 'published')
            ->where('type', 'expense')
            ->sum('amount');

        return $opening + $income - $expense;
    }
}
