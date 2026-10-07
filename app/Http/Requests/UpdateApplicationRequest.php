<?php

namespace App\Http\Requests;

use App\Models\Application;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'logo' => ['nullable', 'mimes:png,jpg,jpeg,webp', 'max:2048'],
            'version' => ['nullable', 'string', 'max:20'],
            'deployment_date' => ['sometimes', 'date'],
            'developed_by' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sync_roles' => ['nullable'],
            'role_ids' => ['nullable', 'array'],
            'role_ids.*' => ['exists:roles,id'],
            'sso_mode' => ['nullable', Rule::in(Application::SSO_MODES)],
            'login_url_pattern' => ['nullable', 'string', 'max:500'],
            'identifier_type' => ['nullable', Rule::in(Application::IDENTIFIER_TYPES)],
            'username_selector' => ['nullable', 'string', 'max:255'],
            'password_selector' => ['nullable', 'string', 'max:255'],
            'submit_selector' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Remplissage automatique activé (mode envoyé ou déjà enregistré) => URL de la page de connexion requise
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->hasAny(['sso_mode', 'login_url_pattern'])) {
                    return;
                }

                $application = $this->route('application');

                $mode = $this->has('sso_mode')
                    ? ($this->input('sso_mode') ?? 'none')
                    : ($application?->sso_mode ?? 'none');
                $pattern = $this->has('login_url_pattern')
                    ? $this->input('login_url_pattern')
                    : $application?->login_url_pattern;

                if ($mode !== 'none' && blank($pattern)) {
                    $validator->errors()->add('login_url_pattern', "L'URL de la page de connexion est requise quand le remplissage automatique est activé.");
                }
            },
        ];
    }

    public function messages(): array
    {
        return [
            'url.url' => 'L\'URL n\'est pas valide.',
            'category_id.required' => 'La catégorie est requise.',
            'category_id.integer' => "La catégorie sélectionnée n'est pas valide.",
            'category_id.exists' => "La catégorie sélectionnée n'existe pas.",
            'logo.mimes' => 'Le logo doit être une image PNG, JPEG ou WebP.',
            'logo.max' => 'Le logo ne doit pas dépasser 2 Mo.',
            'role_ids.array' => "La liste des rôles n'est pas valide.",
            'role_ids.*.exists' => "Un des rôles sélectionnés n'existe pas.",
            'deployment_date.date' => 'La date de déploiement n\'est pas valide.',
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
