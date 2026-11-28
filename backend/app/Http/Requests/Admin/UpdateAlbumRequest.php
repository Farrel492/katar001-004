<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAlbumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:500'],
            'event_id' => ['nullable', 'exists:events,id'],
            'taken_at' => ['nullable', 'date'],
            'status' => ['nullable', 'in:draft,published'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul album wajib diisi.',
            'title.max' => 'Judul album maksimal 150 karakter.',
            'description.max' => 'Deskripsi album maksimal 500 karakter.',
            'event_id.exists' => 'Agenda yang dipilih tidak ditemukan.',
            'taken_at.date' => 'Format tanggal kegiatan tidak valid.',
            'status.in' => 'Status hanya boleh draft atau published.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('title')) {
            $data['title'] = strip_tags(trim($this->title));
        }
        if ($this->has('description')) {
            $data['description'] = strip_tags(trim($this->description));
        }
        if (! empty($data)) {
            $this->merge($data);
        }
    }
}
