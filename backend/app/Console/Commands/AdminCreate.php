<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Enums\UserRole;
use App\Rules\PasswordPolicy;
use App\Services\AuditLogger;
use Illuminate\Console\Command;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminCreate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create {username} {--name=} {--role=admin} {--must-change}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin user (admin or superadmin) via CLI';

    public function handle()
    {
        $username = strtolower($this->argument('username'));

        // Validate username format
        if (! preg_match('/^[a-z0-9._-]+$/', $username)) {
            $this->error('Username hanya boleh huruf kecil, angka, titik, underscore, atau dash.');
            return 1;
        }

        // Check existence (including soft‑deleted)
        $existing = User::withTrashed()->where('username', $username)->first();
        if ($existing) {
            $this->error('Username sudah dipakai (termasuk yang soft‑deleted).');
            return 1;
        }

        $roleInput = strtolower($this->option('role'));
        if (! in_array($roleInput, ['admin', 'superadmin'])) {
            $this->error('Role hanya admin atau superadmin.');
            return 1;
        }
        $role = $roleInput === 'superadmin' ? UserRole::SUPERADMIN : UserRole::ADMIN;

        // Prompt password hidden
        $password = $this->secret('Password');
        $confirm  = $this->secret('Confirm password');
        if ($password !== $confirm) {
            $this->error('Konfirmasi password tidak cocok.');
            return 1;
        }

        // Validate password via rule
        $policy = new PasswordPolicy($username);
        if (! $policy->passes('password', $password)) {
            $this->error($policy->message());
            return 1;
        }

        $user = User::create([
            'username' => $username,
            'name' => $this->option('name') ?? $username,
            'role' => $role,
            'password' => Hash::make($password),
            'is_active' => true,
            'must_change_password' => $this->option('must-change') ? true : false,
        ]);

        // Log audit (metadata hanya role)
        AuditLogger::log($user, 'user_created_cli', null, ['role' => $role->value]);

        $this->info("User \"{$username}\" dengan role \"{$role->value}\" berhasil dibuat.");
        return 0;
    }
}
