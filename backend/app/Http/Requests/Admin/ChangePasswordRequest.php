<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\PasswordPolicy;

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
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', new PasswordPolicy($user->username, $user->password)],
            'password_confirmation' => ['required', 'same:password'],
        ];
    }
}
