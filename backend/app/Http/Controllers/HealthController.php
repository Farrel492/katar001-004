<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    /**
     * Check health status of the application and database.
     */
    public function __invoke(): JsonResponse
    {
        $dbStatus = 'ok';

        try {
            DB::connection()->getPdo();
        } catch (Throwable) {
            $dbStatus = 'gagal';
        }

        $isHealthy = $dbStatus === 'ok';

        return response()->json([
            'status' => $isHealthy ? 'ok' : 'error',
            'app_name' => config('app.name'),
            'server_time' => now()->setTimezone('Asia/Jakarta')->toIso8601String(),
            'database' => $dbStatus,
        ], $isHealthy ? 200 : 503);
    }
}

