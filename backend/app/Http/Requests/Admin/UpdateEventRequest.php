<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'summary' => ['sometimes', 'required', 'string', 'max:300'],
            'description' => ['sometimes', 'required', 'string'],
            'category' => ['sometimes', 'required', 'string', 'max:50'],
            'starts_at' => ['sometimes', 'required', 'date'],
            'ends_at' => [
                'nullable',
                'date',
                function ($attribute, $value, $fail) {
                    $startsAt = $this->input('starts_at') ?? $this->route('event')?->starts_at;
                    if ($startsAt && $value && strtotime($value) < strtotime($startsAt)) {
                        $fail('Waktu selesai harus sama atau setelah waktu mulai acara.');
                    }
                },
            ],
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
            'location.max' => 'Lokasi maksimal 150 karakter.',
            'status.in' => 'Status hanya boleh draft atau published.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('title')) {
            $data['title'] = strip_tags(trim($this->title));
        }
        if ($this->has('summary')) {
            $data['summary'] = strip_tags(trim($this->summary));
        }
        if ($this->has('description')) {
            $data['description'] = strip_tags(trim($this->description));
        }
        if ($this->has('category')) {
            $data['category'] = strip_tags(trim($this->category));
        }
        if ($this->has('location')) {
            $data['location'] = strip_tags(trim($this->location));
        }
        if (! empty($data)) {
            $this->merge($data);
        }
    }
}
