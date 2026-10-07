<?php

namespace App\Exceptions;

use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Levée quand VAULT_KEY est absente ou invalide : le coffre ne peut ni chiffrer ni déchiffrer.
 * Rendue en 503 JSON par l'API.
 */
class VaultNotConfiguredException extends RuntimeException
{
    public const MESSAGE = 'Coffre non configuré : définissez VAULT_KEY dans le fichier .env (php artisan vault:key).';

    public function __construct(string $message = self::MESSAGE)
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
        ], 503);
    }

    /**
     * Erreur de configuration attendue : inutile de la journaliser comme une exception
     */
    public function report(): bool
    {
        return true;
    }
}
