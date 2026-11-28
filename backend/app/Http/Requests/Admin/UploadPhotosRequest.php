<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UploadPhotosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photos' => ['required', 'array', 'min:1', 'max:10'],
            'photos.*' => ['required', 'file', 'max:2048', 'mimes:jpeg,jpg,png,webp'],
            'captions' => ['nullable', 'array'],
            'captions.*' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'photos.required' => 'Berkas foto wajib diunggah.',
            'photos.array' => 'Format unggahan foto tidak valid.',
            'photos.min' => 'Pilih minimal 1 foto.',
            'photos.max' => 'Maksimal 10 foto per permintaan unggah.',
            'photos.*.required' => 'Setiap berkas foto wajib disertakan.',
            'photos.*.file' => 'Berkas harus berupa file foto.',
            'photos.*.max' => 'Ukuran setiap foto maksimal 2 MB.',
            'photos.*.mimes' => 'Format foto harus berupa JPG, PNG, atau WebP.',
            'captions.*.max' => 'Keterangan foto maksimal 200 karakter.',
        ];
    }
}
