<?php

namespace App\Http\Requests;

use App\Models\Role;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('role')->id;

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($roleId)],
            'description' => ['nullable', 'string'],
        ];
    }

    /**
     * Le slug (unique) est dérivé du nom : refuser un nom sans lettre/chiffre ou trop proche d'un existant
     * (le rôle système garde son slug : seul le contrôle « lettre ou chiffre » s'applique)
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->has('name')) {
                    return;
                }

                $role = $this->route('role');
                $slug = Str::slug((string) $this->input('name'));

                if ($slug === '') {
                    $validator->errors()->add('name', 'Le nom du rôle doit contenir au moins une lettre ou un chiffre.');
                } elseif (!$role->isSystem() && Role::where('slug', $slug)->whereKeyNot($role->id)->exists()) {
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
        ];
    }
}
