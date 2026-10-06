<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Messages de validation (français)
    |--------------------------------------------------------------------------
    |
    | Messages par défaut des règles de validation utilisées dans le portail.
    | Les messages définis dans les FormRequest restent prioritaires.
    |
    */

    'accepted' => 'Le champ :attribute doit être accepté.',
    'array' => 'Le champ :attribute doit être une liste.',
    'boolean' => 'Le champ :attribute doit être vrai ou faux.',
    'confirmed' => 'La confirmation du champ :attribute ne correspond pas.',
    'current_password' => 'Le mot de passe est incorrect.',
    'date' => "Le champ :attribute n'est pas une date valide.",
    'date_format' => 'Le champ :attribute ne correspond pas au format :format.',
    'different' => 'Les champs :attribute et :other doivent être différents.',
    'email' => 'Le champ :attribute doit être une adresse email valide.',
    'exists' => 'La valeur sélectionnée pour le champ :attribute est invalide.',
    'file' => 'Le champ :attribute doit être un fichier.',
    'image' => 'Le champ :attribute doit être une image.',
    'in' => 'La valeur sélectionnée pour le champ :attribute est invalide.',
    'integer' => 'Le champ :attribute doit être un nombre entier.',
    'max' => [
        'array' => 'Le champ :attribute ne doit pas contenir plus de :max éléments.',
        'file' => 'Le fichier :attribute ne doit pas dépasser :max kilo-octets.',
        'numeric' => 'Le champ :attribute ne doit pas être supérieur à :max.',
        'string' => 'Le champ :attribute ne doit pas dépasser :max caractères.',
    ],
    'mimes' => 'Le champ :attribute doit être un fichier de type : :values.',
    'mimetypes' => 'Le champ :attribute doit être un fichier de type : :values.',
    'min' => [
        'array' => 'Le champ :attribute doit contenir au moins :min éléments.',
        'file' => 'Le fichier :attribute doit faire au moins :min kilo-octets.',
        'numeric' => 'Le champ :attribute doit être au moins égal à :min.',
        'string' => 'Le champ :attribute doit contenir au moins :min caractères.',
    ],
    'numeric' => 'Le champ :attribute doit être un nombre.',
    'present' => 'Le champ :attribute doit être présent.',
    'regex' => "Le format du champ :attribute n'est pas valide.",
    'required' => 'Le champ :attribute est obligatoire.',
    'required_with' => 'Le champ :attribute est obligatoire lorsque :values est présent.',
    'same' => 'Les champs :attribute et :other doivent correspondre.',
    'size' => [
        'array' => 'Le champ :attribute doit contenir :size éléments.',
        'file' => 'Le fichier :attribute doit faire :size kilo-octets.',
        'numeric' => 'Le champ :attribute doit être égal à :size.',
        'string' => 'Le champ :attribute doit contenir :size caractères.',
    ],
    'string' => 'Le champ :attribute doit être une chaîne de caractères.',
    'unique' => 'La valeur du champ :attribute est déjà utilisée.',
    'uploaded' => "Le fichier :attribute n'a pas pu être téléversé.",
    'url' => "Le champ :attribute doit être une URL valide.",

    /*
    |--------------------------------------------------------------------------
    | Messages personnalisés
    |--------------------------------------------------------------------------
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Noms des attributs
    |--------------------------------------------------------------------------
    */

    'attributes' => [
        'matricule' => 'matricule',
        'password' => 'mot de passe',
        'password_confirmation' => 'confirmation du mot de passe',
        'current_password' => 'mot de passe actuel',
        'email' => 'email',
        'nom' => 'nom',
        'prenom' => 'prénom',
        'telephone' => 'téléphone',
        'direction' => 'direction',
        'titre_de_poste' => 'titre de poste',
        'resync_rh' => 'resynchronisation RH',
        'name' => 'nom',
        'url' => 'URL',
        'description' => 'description',
        'category' => 'catégorie',
        'category_id' => 'catégorie',
        'developed_by' => 'éditeur',
        'deployment_date' => 'date de mise en service',
        'version' => 'version',
        'logo' => 'logo',
        'is_active' => 'statut',
        'role_id' => 'rôle',
        'role_ids' => 'rôles',
        'role_ids.*' => 'rôle',
        'application_ids' => 'applications',
        'application_ids.*' => 'application',
        'sync_roles' => 'synchronisation des rôles',
    ],

];
