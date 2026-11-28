<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $cleanString = fn (?string $val) => $val !== null ? trim(strip_tags($val)) : null;

        $this->merge([
            'name' => $cleanString($this->input('name')),
            'position' => $cleanString($this->input('position')),
            'division' => $cleanString($this->input('division')),
            'period' => $cleanString($this->input('period')),
            'bio' => $cleanString($this->input('bio')),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'position' => ['required', 'string', 'max:100'],
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
