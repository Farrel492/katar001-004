<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'summary' => ['required', 'string', 'max:300'],
            'description' => ['required', 'string'],
            'category' => ['required', 'string', 'max:50'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'location' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', 'in:draft,published'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul agenda wajib diisi.',
            'title.max' => 'Judul agenda maksimal 150 karakter.',
            'summary.required' => 'Ringkasan agenda wajib diisi.',
            'summary.max' => 'Ringkasan agenda maksimal 300 karakter.',
            'description.required' => 'Deskripsi agenda wajib diisi.',
            'category.required' => 'Kategori agenda wajib diisi.',
            'starts_at.required' => 'Waktu mulai acara wajib diisi.',
            'starts_at.date' => 'Format waktu mulai acara tidak valid.',
            'ends_at.date' => 'Format waktu selesai acara tidak valid.',
            'ends_at.after_or_equal' => 'Waktu selesai harus sama atau setelah waktu mulai acara.',
            'location.max' => 'Lokasi maksimal 150 karakter.',
            'status.in' => 'Status hanya boleh draft atau published.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => $this->title ? strip_tags(trim($this->title)) : null,
            'summary' => $this->summary ? strip_tags(trim($this->summary)) : null,
            'description' => $this->description ? strip_tags(trim($this->description)) : null,
            'category' => $this->category ? strip_tags(trim($this->category)) : null,
            'location' => $this->location ? strip_tags(trim($this->location)) : null,
        ]);
    }
}
