<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFinanceSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'opening_balance' => ['required', 'integer'],
            'opening_date' => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'opening_balance.required' => 'Saldo awal kas wajib diisi.',
            'opening_balance.integer' => 'Saldo awal harus berupa bilangan bulat Rupiah.',
            'opening_date.required' => 'Tanggal saldo awal wajib diisi.',
            'opening_date.date' => 'Format tanggal saldo awal tidak valid.',
        ];
    }
}
