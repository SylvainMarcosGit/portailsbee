<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class EnsureVaultExtensionToken
{
    /**
     * Nom du jeton Sanctum remis à l'extension SBEE (ability unique : vault)
     */
    public const TOKEN_NAME = 'sbee-extension';

    /**
     * Routes /vault/ext/* : seul un jeton d'extension (nom sbee-extension, ability vault,
     * sans '*') est accepté ; un jeton du portail est refusé.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->user()?->currentAccessToken();

        $isExtensionToken = $token instanceof PersonalAccessToken
            && $token->name === self::TOKEN_NAME
            && $token->can('vault')
            && !$token->can('*');

        if (!$isExtensionToken) {
            return response()->json([
                'message' => "Réservé à l'extension SBEE.",
            ], 403);
        }

        return $next($request);
    }
}
