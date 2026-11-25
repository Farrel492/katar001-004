<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogger
{
    /**
     * Log an audit event.
     *
     * @param  User|null  $user  The authenticated user (or null).
     * @param  string  $action  Action name.
     * @param  Request|null  $request  Current request (or null when called from CLI).
     * @param  array|null  $metadata  Additional data.
     * @return void
     */
    public static function log(?User $user, string $action, ?Request $request = null, ?array $metadata = null): void
    {
        $meta = $metadata ?? [];
        if ($request && $request->userAgent()) {
            $meta['user_agent'] = $request->userAgent();
        }

        try {
            DB::table('audit_logs')->insert([
                'user_id' => $user ? $user->id : null,
                'action' => $action,
                'ip_address' => $request ? $request->ip() : null,
                'metadata' => ! empty($meta) ? json_encode($meta) : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Catat ke Laravel logger bawaan jika tabel audit mengalami kendala,
            // sehingga alur login/transaksi utama pengguna tidak terblokir.
            report($e);
        }
    }
}
