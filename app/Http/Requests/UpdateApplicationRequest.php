<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'url' => ['sometimes', 'url', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', 'string', 'in:Technique,Finances,RH,Administration'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'version' => ['nullable', 'string', 'max:20'],
            'deployment_date' => ['sometimes', 'date'],
            'developed_by' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'role_ids' => ['sometimes', 'array'],
            'role_ids.*' => ['exists:roles,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'url.url' => 'L\'URL n\'est pas valide.',
            'category.in' => 'La catégorie doit être Technique, Finances, RH ou Administration.',
            'logo.image' => 'Le logo doit être une image.',
            'logo.max' => 'Le logo ne doit pas dépasser 2 Mo.',
            'deployment_date.date' => 'La date de déploiement n\'est pas valide.',
        ];
    }
}
