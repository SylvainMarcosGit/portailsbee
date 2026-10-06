<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'logo' => ['nullable', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'version' => ['nullable', 'string', 'max:20'],
            'deployment_date' => ['required', 'date'],
            'developed_by' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'sync_roles' => ['nullable'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de l\'application est requis.',
            'url.required' => 'L\'URL est requise.',
            'url.url' => 'L\'URL n\'est pas valide.',
            'category_id.required' => 'La catégorie est requise.',
            'category_id.integer' => "La catégorie sélectionnée n'est pas valide.",
            'category_id.exists' => "La catégorie sélectionnée n'existe pas.",
            'logo.mimes' => 'Le logo doit être une image PNG, JPEG ou WebP.',
            'logo.max' => 'Le logo ne doit pas dépasser 2 Mo.',
            'role_ids.array' => "La liste des rôles n'est pas valide.",
            'role_ids.*.exists' => "Un des rôles sélectionnés n'existe pas.",
            'deployment_date.required' => 'La date de déploiement est requise.',
            'deployment_date.date' => 'La date de déploiement n\'est pas valide.',
            'developed_by.required' => 'Le développeur est requis.',
        ];
    }
}
