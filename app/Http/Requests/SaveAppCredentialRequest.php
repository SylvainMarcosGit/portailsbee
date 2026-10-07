<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveAppCredentialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login_identifier' => ['required', 'string', 'max:255'],
            'secret' => ['required', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'login_identifier.required' => "L'identifiant est requis.",
            'login_identifier.string' => "L'identifiant doit être une chaîne de caractères.",
            'login_identifier.max' => "L'identifiant ne doit pas dépasser 255 caractères.",
            'secret.required' => 'Le mot de passe est requis.',
            'secret.string' => 'Le mot de passe doit être une chaîne de caractères.',
            'secret.max' => 'Le mot de passe ne doit pas dépasser 1000 caractères.',
        ];
    }
}
