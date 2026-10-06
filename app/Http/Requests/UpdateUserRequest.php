<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Modification d'un compte par un administrateur.
 * Nom, prénom, direction et poste viennent du RH (resync_rh=1 pour les
 * rafraîchir) ; le mot de passe se réinitialise via reset-password.
 */
class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user')->id;

        return [
            'email' => ['sometimes', 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'telephone' => ['sometimes', 'nullable', 'string', 'regex:/^01\d{8}$/'],
            'role_id' => ['sometimes', 'exists:roles,id'],
            'is_active' => ['sometimes', 'boolean'],
            'resync_rh' => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'L\'email n\'est pas valide.',
            'email.unique' => 'Cet email existe déjà.',
            'telephone.regex' => StoreUserRequest::MESSAGE_TELEPHONE,
            'role_id.exists' => 'Le rôle sélectionné n\'existe pas.',
        ];
    }
}
