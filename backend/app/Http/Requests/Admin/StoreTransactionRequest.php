<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionRequest extends FormRequest
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
            'type' => ['required', 'string', 'in:income,expense'],
            'category_id' => ['required', 'integer', 'exists:finance_categories,id'],
            'amount' => ['required', 'integer', 'min:1', 'max:1000000000'],
            'transaction_date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:200'],
            'counterparty' => ['nullable', 'string', 'max:80'],
            'counterparty_public' => ['nullable', 'boolean'],
            'status' => ['nullable', 'string', 'in:draft,published'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Jenis transaksi (pemasukan/pengeluaran) wajib dipilih.',
            'type.in' => 'Jenis transaksi harus berupa income atau expense.',
            'category_id.required' => 'Kategori transaksi wajib dipilih.',
            'category_id.exists' => 'Kategori yang dipilih tidak ditemukan.',
            'amount.required' => 'Nominal transaksi wajib diisi.',
            'amount.integer' => 'Nominal transaksi harus berupa bilangan bulat Rupiah tanpa desimal.',
            'amount.min' => 'Nominal transaksi minimal Rp 1.',
            'amount.max' => 'Nominal transaksi maksimal Rp 1.000.000.000 (1 milyar Rupiah).',
            'transaction_date.required' => 'Tanggal transaksi wajib diisi.',
            'transaction_date.date' => 'Format tanggal transaksi tidak valid.',
            'description.required' => 'Keterangan transaksi wajib diisi.',
            'description.max' => 'Keterangan maksimal 200 karakter.',
        ];
    }
}
