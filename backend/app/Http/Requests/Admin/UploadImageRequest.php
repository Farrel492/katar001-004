<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UploadImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'image' => ['required', 'file', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'image.required' => 'Berkas gambar wajib dipilih.',
            'image.file' => 'Unggahan harus berupa berkas yang valid.',
            'image.max' => 'Ukuran gambar maksimal adalah 2 MB.',
        ];
    }
}
