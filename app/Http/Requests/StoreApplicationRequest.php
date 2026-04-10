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
            'category' => ['required', 'string', 'in:Technique,Finances,RH,Administration'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'version' => ['nullable', 'string', 'max:20'],
            'deployment_date' => ['required', 'date'],
            'developed_by' => ['required', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'role_ids' => ['array'],
            'role_ids.*' => ['exists:roles,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom de l\'application est requis.',
            'url.required' => 'L\'URL est requise.',
            'url.url' => 'L\'URL n\'est pas valide.',
            'category.required' => 'La catégorie est requise.',
            'category.in' => 'La catégorie doit être Technique, Finances, RH ou Administration.',
            'logo.image' => 'Le logo doit être une image.',
            'logo.max' => 'Le logo ne doit pas dépasser 2 Mo.',
            'deployment_date.required' => 'La date de déploiement est requise.',
            'deployment_date.date' => 'La date de déploiement n\'est pas valide.',
            'developed_by.required' => 'Le développeur est requis.',
        ];
    }
}
