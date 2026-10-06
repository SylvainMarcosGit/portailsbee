<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'description' => ['nullable', 'string'],
            'application_ids' => ['nullable', 'array'],
            'application_ids.*' => ['integer', 'exists:applications,id'],
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
                    $validator->errors()->add('name', 'Le nom du rôle doit contenir au moins une lettre ou un chiffre.');
                } elseif (Role::where('slug', $slug)->exists()) {
                    $validator->errors()->add('name', 'Un rôle portant un nom similaire existe déjà.');
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom du rôle est requis.',
            'name.string' => 'Le nom du rôle doit être une chaîne de caractères.',
            'name.max' => 'Le nom du rôle ne doit pas dépasser 100 caractères.',
            'name.unique' => 'Ce rôle existe déjà.',
            'description.string' => 'La description doit être une chaîne de caractères.',
            'application_ids.array' => 'La liste des applications est invalide.',
            'application_ids.*.integer' => 'Application invalide.',
            'application_ids.*.exists' => "L'application sélectionnée n'existe pas.",
        ];
    }
}
