<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\PasswordPolicy;
use Illuminate\Support\Facades\Hash;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();
        return [
            'current_password' => ['sometimes', 'required_without:old_password', 'string'],
            'old_password' => ['sometimes', 'required_without:current_password', 'string'],
            'password' => ['required', 'string', new PasswordPolicy($user->username, $user->password)],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $user = $this->user();
            if ($user) {
                $old = $this->input('current_password') ?? $this->input('old_password');
                if ($old && ! Hash::check($old, $user->password)) {
                    $validator->errors()->add('current_password', 'Kata sandi saat ini tidak cocok.');
                }
            }
        });
    }
}
