<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Création d'un compte à partir d'un matricule RH.
 * Nom, prénom, direction et poste sont repris de l'API RH SBEE côté serveur ;
 * le mot de passe est toujours User::MOT_DE_PASSE_INITIAL.
 */
class StoreUserRequest extends FormRequest
{
    public const MESSAGE_TELEPHONE = 'Le téléphone doit comporter 10 chiffres et commencer par 01 (ex. 0197000000).';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'matricule' => ['required', 'string', 'max:50', 'unique:users,matricule'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'telephone' => ['nullable', 'string', 'regex:/^01\d{8}$/'],
            'role_id' => ['required', 'exists:roles,id'],
            'is_active' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'matricule.required' => 'Le matricule est requis.',
            'matricule.unique' => 'Un compte existe déjà pour ce matricule.',
            'email.email' => 'L\'email n\'est pas valide.',
            'email.unique' => 'Cet email existe déjà.',
            'telephone.regex' => self::MESSAGE_TELEPHONE,
            'role_id.required' => 'Le rôle est requis.',
            'role_id.exists' => 'Le rôle sélectionné n\'existe pas.',
        ];
    }
}
