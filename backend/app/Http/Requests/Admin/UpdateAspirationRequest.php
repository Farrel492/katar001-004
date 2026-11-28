<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAspirationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $data = [];
        if ($this->has('internal_note')) {
            $data['internal_note'] = $this->filled('internal_note') ? strip_tags(trim((string) $this->internal_note)) : null;
        }
        if ($this->has('public_reply')) {
            $data['public_reply'] = $this->filled('public_reply') ? strip_tags(trim((string) $this->public_reply)) : null;
        }
        if (! empty($data)) {
            $this->merge($data);
        }
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', 'string', 'in:new,read,in_progress,done,rejected,spam'],
            'internal_note' => ['nullable', 'string', 'max:1000'],
            'public_reply' => ['nullable', 'string', 'max:1000'],
            'is_public' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Status aspirasi tidak valid.',
            'internal_note.max' => 'Catatan internal maksimal 1000 karakter.',
            'public_reply.max' => 'Balasan publik maksimal 1000 karakter.',
        ];
    }
}
