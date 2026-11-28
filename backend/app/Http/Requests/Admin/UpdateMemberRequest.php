<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $cleanString = fn (?string $val) => $val !== null ? trim(strip_tags($val)) : null;

        $updates = [];
        foreach (['name', 'position', 'division', 'period', 'bio'] as $field) {
            if ($this->has($field)) {
                $updates[$field] = $cleanString($this->input($field));
            }
        }

        if (! empty($updates)) {
            $this->merge($updates);
        }
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'position' => ['sometimes', 'required', 'string', 'max:100'],
            'division' => ['nullable', 'string', 'max:100'],
            'period' => ['nullable', 'string', 'max:50'],
            'bio' => ['nullable', 'string', 'max:300'],
            'is_visible' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama pengurus wajib diisi.',
            'name.max' => 'Nama pengurus maksimal 100 karakter.',
            'position.required' => 'Jabatan wajib diisi.',
            'position.max' => 'Jabatan maksimal 100 karakter.',
            'division.max' => 'Divisi maksimal 100 karakter.',
            'period.max' => 'Periode maksimal 50 karakter.',
            'bio.max' => 'Bio singkat maksimal 300 karakter.',
            'is_visible.boolean' => 'Status tampil di publik harus berupa benar atau salah.',
        ];
    }
}
