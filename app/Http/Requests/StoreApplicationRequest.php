<?php

namespace App\Http\Requests;

use App\Models\Application;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'sso_mode' => ['nullable', Rule::in(Application::SSO_MODES)],
            'login_url_pattern' => ['nullable', 'string', 'max:500', 'required_if:sso_mode,fill,fill_submit,silent'],
            'identifier_type' => ['nullable', Rule::in(Application::IDENTIFIER_TYPES)],
            'username_selector' => ['nullable', 'string', 'max:255'],
            'password_selector' => ['nullable', 'string', 'max:255'],
            'submit_selector' => ['nullable', 'string', 'max:255'],
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
            'sso_mode.in' => "Le mode de connexion sélectionné n'est pas valide.",
            'login_url_pattern.required_if' => "L'URL de la page de connexion est requise quand le remplissage automatique est activé.",
            'login_url_pattern.max' => "L'URL de la page de connexion ne doit pas dépasser 500 caractères.",
            'identifier_type.in' => "Le type d'identifiant sélectionné n'est pas valide.",
            'username_selector.max' => "Le sélecteur du champ identifiant ne doit pas dépasser 255 caractères.",
            'password_selector.max' => 'Le sélecteur du champ mot de passe ne doit pas dépasser 255 caractères.',
            'submit_selector.max' => 'Le sélecteur du bouton de connexion ne doit pas dépasser 255 caractères.',
        ];
    }
}
