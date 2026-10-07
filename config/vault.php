<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Coffre d'identifiants (extension SBEE)
    |--------------------------------------------------------------------------
    |
    | Clé de chiffrement des mots de passe enregistrés dans le coffre, distincte
    | de APP_KEY. Générer une clé : php artisan vault:key (format base64:...).
    | Rotation : placer l'ancienne clé dans VAULT_PREVIOUS_KEYS (liste séparée
    | par des virgules), la nouvelle dans VAULT_KEY, puis php artisan vault:rotate.
    |
    */

    'key' => env('VAULT_KEY'),

    'previous_keys' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('VAULT_PREVIOUS_KEYS', ''))
    ))),

    'cipher' => 'aes-256-gcm',

];
