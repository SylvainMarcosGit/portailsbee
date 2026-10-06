<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordChange
{
    /**
     * Bloque l'API tant que l'utilisateur conserve le mot de passe initial
     * (User::MOT_DE_PASSE_INITIAL). Les routes exemptées (logout, me,
     * profile/password) sont déclarées hors du groupe password.changed.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->needs_password_change) {
            return response()->json([
                'message' => 'Vous devez changer votre mot de passe initial avant de continuer.',
                'requires_password_change' => true,
            ], 403);
        }

        return $next($request);
    }
}
