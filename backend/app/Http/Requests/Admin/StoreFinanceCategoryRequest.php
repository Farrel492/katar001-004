<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFinanceCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge(['name' => strip_tags(trim((string) $this->name))]);
        }
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:80',
                Rule::unique('finance_categories')->where('type', $this->type),
            ],
            'type' => ['required', 'string', 'in:income,expense'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama kategori wajib diisi.',
            'name.unique' => 'Nama kategori sudah terdaftar untuk jenis transaksi ini.',
            'type.required' => 'Jenis kategori wajib dipilih.',
            'type.in' => 'Jenis kategori harus berupa income atau expense.',
        ];
    }
}
