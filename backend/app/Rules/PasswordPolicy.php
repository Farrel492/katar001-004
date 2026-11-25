<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Hash;

class PasswordPolicy implements ValidationRule
{
    protected string $username;
    protected ?string $oldPasswordHash;

    public function __construct(string $username, ?string $oldPasswordHash = null)
    {
        $this->username = $username;
        $this->oldPasswordHash = $oldPasswordHash;
    }

    /**
     * Laravel will call this method when the rule is used in the validator.
     */
    public function validate(string $attribute, $value, Closure $fail): void
    {
        if (! $this->passes($attribute, $value)) {
            $fail($this->message());
        }
    }

    public function passes($attribute, $value): bool
    {
        $min = config('admin.password_min', 12);
        if (strlen($value) < $min) {
            return false;
        }
        // Username should not appear in password (case‑insensitive)
        if (stripos($value, $this->username) !== false) {
            return false;
        }
        // Should not be same as old password
        if ($this->oldPasswordHash && Hash::check($value, $this->oldPasswordHash)) {
            return false;
        }
        return true;
    }

    public function message(): string
    {
        return 'Password tidak memenuhi kebijakan keamanan.';
    }
}
