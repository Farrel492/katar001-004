<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFinanceCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge(['name' => strip_tags(trim((string) $this->name))]);
        }
    }

    public function rules(): array
    {
        $category = $this->route('category');
        $categoryId = is_object($category) ? $category->id : $category;
        $type = is_object($category) ? $category->type : $this->input('type');

        return [
            'name' => [
                'nullable',
                'string',
                'max:80',
                Rule::unique('finance_categories')
                    ->where('type', $type)
                    ->ignore($categoryId),
            ],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
