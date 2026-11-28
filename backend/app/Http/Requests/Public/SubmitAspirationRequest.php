<?php

namespace App\Http\Requests\Public;

use Illuminate\Foundation\Http\FormRequest;

class SubmitAspirationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => $this->filled('name') ? strip_tags(trim((string) $this->name)) : null,
            'contact' => $this->filled('contact') ? strip_tags(trim((string) $this->contact)) : null,
            'subject' => $this->filled('subject') ? strip_tags(trim((string) $this->subject)) : '',
            'message' => $this->filled('message') ? strip_tags(trim((string) $this->message)) : '',
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:80'],
            'contact' => [
                'nullable',
                'string',
                'max:100',
                function ($attribute, $value, $fail) {
                    if ($value === null || $value === '') {
                        return;
                    }
                    $isEmail = filter_var($value, FILTER_VALIDATE_EMAIL);
                    $digits = preg_replace('/[^\d]/', '', $value);
                    $isPhone = strlen($digits) >= 8 && strlen($digits) <= 15 && preg_match('/^(\+?[0-9\s\-()]+)$/', $value);
                    if (! $isEmail && ! $isPhone) {
                        $fail('Kontak harus berupa alamat email yang valid atau nomor telepon 8-15 digit.');
                    }
                },
            ],
            'category' => ['required', 'string', 'in:saran,keluhan,pertanyaan,usulan_kegiatan,lainnya'],
            'subject' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'min:10', 'max:2000'],
            'website' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'category.required' => 'Kategori aspirasi wajib dipilih.',
            'category.in' => 'Kategori yang dipilih tidak valid.',
            'subject.required' => 'Subjek aspirasi wajib diisi.',
            'subject.max' => 'Subjek maksimal 120 karakter.',
            'message.required' => 'Isi aspirasi wajib diisi.',
            'message.min' => 'Isi aspirasi minimal 10 karakter.',
            'message.max' => 'Isi aspirasi maksimal 2000 karakter.',
            'name.max' => 'Nama maksimal 80 karakter.',
            'contact.max' => 'Kontak maksimal 100 karakter.',
        ];
    }
}
