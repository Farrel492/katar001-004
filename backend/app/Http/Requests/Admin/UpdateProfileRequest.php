<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $cleanString = fn (?string $val) => $val !== null ? trim(strip_tags($val)) : null;

        $missions = is_array($this->input('missions'))
            ? array_values(array_filter(array_map($cleanString, $this->input('missions')), fn ($v) => $v !== null && $v !== ''))
            : $this->input('missions');

        $values = is_array($this->input('values'))
            ? array_values(array_filter(array_map($cleanString, $this->input('values')), fn ($v) => $v !== null && $v !== ''))
            : $this->input('values');

        $this->merge([
            'name' => $cleanString($this->input('name')),
            'short_name' => $cleanString($this->input('short_name')),
            'tagline' => $cleanString($this->input('tagline')),
            'about' => $cleanString($this->input('about')),
            'history' => $cleanString($this->input('history')),
            'vision' => $cleanString($this->input('vision')),
            'missions' => $missions,
            'values' => $values,
            'address' => $cleanString($this->input('address')),
            'region_label' => $cleanString($this->input('region_label')),
            'whatsapp' => $cleanString($this->input('whatsapp')),
            'email' => $cleanString($this->input('email')),
            'instagram' => $cleanString($this->input('instagram')),
            'facebook' => $cleanString($this->input('facebook')),
            'youtube' => $cleanString($this->input('youtube')),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'short_name' => ['required', 'string', 'max:50'],
            'tagline' => ['nullable', 'string', 'max:150'],
            'about' => ['required', 'string', 'max:3000'],
            'history' => ['nullable', 'string', 'max:3000'],
            'vision' => ['required', 'string', 'max:1000'],
            'missions' => ['required', 'array', 'min:1', 'max:15'],
            'missions.*' => ['required', 'string', 'max:300'],
            'values' => ['nullable', 'array', 'max:15'],
            'values.*' => ['required', 'string', 'max:150'],
            'address' => ['required', 'string', 'max:500'],
            'region_label' => ['required', 'string', 'max:150'],
            'whatsapp' => ['required', 'string', 'regex:/^[1-9][0-9]{9,15}$/'],
            'email' => ['required', 'email:rfc', 'max:100'],
            'instagram' => ['nullable', 'string', 'max:255', 'regex:/^https:\/\/([a-z0-9-]+\.)?instagram\.com(\/.*)?$/i'],
            'facebook' => ['nullable', 'string', 'max:255', 'regex:/^https:\/\/([a-z0-9-]+\.)?facebook\.com(\/.*)?$/i'],
            'youtube' => ['nullable', 'string', 'max:255', 'regex:/^https:\/\/([a-z0-9-]+\.)?youtube\.com(\/.*)?$/i'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama organisasi wajib diisi.',
            'name.max' => 'Nama organisasi maksimal 120 karakter.',
            'short_name.required' => 'Nama singkat organisasi wajib diisi.',
            'short_name.max' => 'Nama singkat maksimal 50 karakter.',
            'tagline.max' => 'Tagline maksimal 150 karakter.',
            'about.required' => 'Deskripsi tentang organisasi wajib diisi.',
            'about.max' => 'Deskripsi tentang organisasi maksimal 3000 karakter.',
            'history.max' => 'Sejarah organisasi maksimal 3000 karakter.',
            'vision.required' => 'Visi organisasi wajib diisi.',
            'vision.max' => 'Visi maksimal 1000 karakter.',
            'missions.required' => 'Minimal harus ada 1 poin misi.',
            'missions.min' => 'Minimal harus ada 1 poin misi.',
            'missions.*.required' => 'Poin misi tidak boleh kosong.',
            'missions.*.max' => 'Setiap poin misi maksimal 300 karakter.',
            'values.*.max' => 'Setiap poin nilai utama maksimal 150 karakter.',
            'address.required' => 'Alamat sekretariat wajib diisi.',
            'address.max' => 'Alamat maksimal 500 karakter.',
            'region_label.required' => 'Label wilayah wajib diisi.',
            'region_label.max' => 'Label wilayah maksimal 150 karakter.',
            'whatsapp.required' => 'Nomor WhatsApp resmi wajib diisi.',
            'whatsapp.regex' => 'WhatsApp harus berupa angka format internasional (mis. 6281234567890, tanpa spasi atau simbol +).',
            'email.required' => 'Email resmi wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'instagram.regex' => 'Tautan Instagram harus diawali https:// dan menggunakan domain instagram.com.',
            'facebook.regex' => 'Tautan Facebook harus diawali https:// dan menggunakan domain facebook.com.',
            'youtube.regex' => 'Tautan YouTube harus diawali https:// dan menggunakan domain youtube.com.',
        ];
    }
}
