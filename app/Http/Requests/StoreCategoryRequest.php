<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StoreCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:categories,name'],
            'description' => ['nullable', 'string'],
        ];
    }

    /**
     * Le slug (unique) est dérivé du nom : refuser un nom sans lettre/chiffre ou trop proche d'un existant
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->has('name')) {
                    return;
                }

                $slug = Str::slug((string) $this->input('name'));

                if ($slug === '') {
                    $validator->errors()->add('name', 'Le nom de la catégorie doit contenir au moins une lettre ou un chiffre.');
                } elseif (Category::where('slug', $slug)->exists()) {
                    $validator->errors()->add('name', 'Une catégorie portant un nom similaire existe déjà.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de la catégorie est requis.',
            'name.string' => 'Le nom de la catégorie doit être une chaîne de caractères.',
            'name.max' => 'Le nom de la catégorie ne doit pas dépasser 100 caractères.',
            'name.unique' => 'Cette catégorie existe déjà.',
            'description.string' => 'La description doit être une chaîne de caractères.',
        ];
    }
}
