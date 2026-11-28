<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CorrectTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('correction_reason')) {
            $this->merge([
                'correction_reason' => strip_tags(trim((string) $this->correction_reason)),
            ]);
        }
        if ($this->has('replacement') && is_array($this->replacement)) {
            $rep = $this->replacement;
            if (isset($rep['description'])) {
                $rep['description'] = strip_tags(trim((string) $rep['description']));
            }
            if (isset($rep['counterparty'])) {
                $rep['counterparty'] = ! empty($rep['counterparty']) ? strip_tags(trim((string) $rep['counterparty'])) : null;
            }
            $this->merge(['replacement' => $rep]);
        }
    }

    public function rules(): array
    {
        return [
            'correction_reason' => ['required', 'string', 'max:200'],
            'replacement' => ['nullable', 'array'],
            'replacement.type' => ['required_with:replacement', 'string', 'in:income,expense'],
            'replacement.category_id' => ['required_with:replacement', 'integer', 'exists:finance_categories,id'],
            'replacement.amount' => ['required_with:replacement', 'integer', 'min:1', 'max:1000000000'],
            'replacement.transaction_date' => ['required_with:replacement', 'date'],
            'replacement.description' => ['required_with:replacement', 'string', 'max:200'],
            'replacement.counterparty' => ['nullable', 'string', 'max:80'],
            'replacement.counterparty_public' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'correction_reason.required' => 'Alasan koreksi transaksi wajib diisi.',
            'correction_reason.max' => 'Alasan koreksi maksimal 200 karakter.',
            'replacement.amount.integer' => 'Nominal transaksi pengganti harus berupa bilangan bulat Rupiah.',
            'replacement.amount.min' => 'Nominal transaksi pengganti minimal Rp 1.',
            'replacement.amount.max' => 'Nominal transaksi pengganti maksimal Rp 1.000.000.000.',
        ];
    }
}
