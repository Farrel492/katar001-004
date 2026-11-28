<?php

namespace App\Http\Controllers\Admin;

use App\Http\Requests\Admin\LoginRequest;
use App\Http\Requests\Admin\ChangePasswordRequest;
use App\Models\User;
use App\Services\AuditLogger; // We'll create a simple service later or dummy
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $key = 'admin-login:' . $request->input('username') . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'message' => 'Too many login attempts. Please try again later.',
            ], 429);
        }

        $user = User::withTrashed()->where('username', strtolower($request->input('username')))->first();
        if (! $user || $user->trashed() || ! $user->is_active || ! Hash::check($request->input('password'), $user->password)) {
            RateLimiter::hit($key, 60);
            // Audit failed login (user may be null)
            AuditLogger::log($user, 'login_failed', $request);
            return response()->json(['message' => 'Username atau kata sandi salah.'], 401);
        }

        // Reset attempts on successful login
        RateLimiter::clear($key);

        // Otentikasi pengguna ke dalam session web guard
        Auth::guard('web')->login($user);

        // Regenerate session to prevent fixation
        $request->session()->regenerate();

        // Update last_login_at
        $user->last_login_at = now();
        $user->save();

        // Log audit login_success
        AuditLogger::log($user, 'login_success', $request);

        return response()->json([
            'must_change_password' => $user->must_change_password,
        ]);
    }

    public function logout(Request $request)
    {
        if ($request->user()) {
            if (method_exists($request->user(), 'currentAccessToken')) {
                $token = $request->user()->currentAccessToken();
                if ($token && method_exists($token, 'delete')) {
                    $token->delete();
                }
            }
            AuditLogger::log($request->user(), 'logout', $request);
        }

        Auth::guard('web')->logout();
        Auth::forgetGuards();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $role = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'role' => $role,
            'must_change_password' => (bool) $user->must_change_password,
        ]);
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();
        $user->password = Hash::make($request->input('password'));
        $user->must_change_password = false;
        $user->save();
        AuditLogger::log($user, 'password_changed', $request);
        return response()->json(['message' => 'Password updated']);
    }
}
