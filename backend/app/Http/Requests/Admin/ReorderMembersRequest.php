<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ReorderMembersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'distinct', 'exists:organization_members,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'ids.required' => 'Daftar urutan anggota wajib dikirim.',
            'ids.array' => 'Format urutan anggota harus berupa daftar ID.',
            'ids.*.integer' => 'ID anggota tidak valid.',
            'ids.*.distinct' => 'Daftar ID anggota tidak boleh duplikat.',
            'ids.*.exists' => 'Salah satu ID anggota tidak ditemukan.',
        ];
    }
}
