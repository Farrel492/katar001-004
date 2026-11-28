<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'opening_balance',
        'opening_date',
        'updated_by',
    ];

    protected $casts = [
        'opening_balance' => 'integer',
        'opening_date' => 'date:Y-m-d',
    ];

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Dapatkan baris pengaturan keuangan (singleton).
     */
    public static function getSettings(): static
    {
        return static::firstOrCreate([], [
            'opening_balance' => 0,
            'opening_date' => now()->startOfYear()->toDateString(),
        ]);
    }
}
