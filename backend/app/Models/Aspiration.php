<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Aspiration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tracking_code',
        'name',
        'contact',
        'category',
        'subject',
        'message',
        'status',
        'internal_note',
        'public_reply',
        'is_public',
        'ip_hash',
        'handled_by',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    /**
     * Buat kode pelacakan unik dalam format ASP-XXXX-YYYY
     * Karakter alfabet acak tanpa 0/O/1/l/I.
     */
    public static function generateTrackingCode(): string
    {
        $chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        $len = strlen($chars);

        do {
            $p1 = '';
            for ($i = 0; $i < 4; $i++) {
                $p1 .= $chars[random_int(0, $len - 1)];
            }
            $p2 = '';
            for ($i = 0; $i < 4; $i++) {
                $p2 .= $chars[random_int(0, $len - 1)];
            }
            $code = "ASP-{$p1}-{$p2}";
        } while (static::where('tracking_code', $code)->exists());

        return $code;
    }

    /**
     * Hitung HMAC-SHA256 untuk IP menggunakan APP_KEY.
     * Tidak menyimpan IP mentah untuk menjaga privasi warga.
     */
    public static function hashIp(string $ip): string
    {
        $key = (string) config('app.key');
        return hash_hmac('sha256', $ip, $key);
    }
}
