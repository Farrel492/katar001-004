<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('description')) {
            $data['description'] = strip_tags(trim((string) $this->description));
        }
        if ($this->has('counterparty')) {
            $data['counterparty'] = $this->filled('counterparty') ? strip_tags(trim((string) $this->counterparty)) : null;
        }
        if (! empty($data)) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'string', 'in:income,expense'],
            'category_id' => ['nullable', 'integer', 'exists:finance_categories,id'],
            'amount' => ['nullable', 'integer', 'min:1', 'max:1000000000'],
            'transaction_date' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:200'],
            'counterparty' => ['nullable', 'string', 'max:80'],
            'counterparty_public' => ['nullable', 'boolean'],
        ];
    }
}
