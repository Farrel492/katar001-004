<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ForcePasswordChange
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if ($user && $user->must_change_password) {
            // Allow only specific route names
            $allowed = ['admin.me', 'admin.logout', 'admin.changePassword'];
            if (! $request->routeIs($allowed)) {
                return response()->json([
                    'message' => 'Password harus diganti.',
                    'code' => 'password_change_required',
                ], 403);
            }
        }
        return $next($request);
    }
}
