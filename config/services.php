<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | API RH SBEE (JD Edwards / AIS) : recherche d'un employé par matricule
    | lors de la création d'un compte. Aucune valeur par défaut secrète :
    | tout doit venir du .env.
    */
    'jde' => [
        'endpoint' => env('JDE_API_ENDPOINT'),
        'username' => env('JDE_API_USERNAME'),
        'password' => env('JDE_API_PASSWORD'),
        'environnement' => env('JDE_API_ENVIRONNEMENT'),
        'role' => env('JDE_API_ROLE'),
    ],

];
