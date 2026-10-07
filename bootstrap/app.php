<?php

use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\EnsureVaultExtensionToken;
use App\Http\Middleware\RequirePasswordChange;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Laravel\Sanctum\Exceptions\MissingAbilityException;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'admin' => AdminMiddleware::class,
            'active' => EnsureUserIsActive::class,
            'password.changed' => RequirePasswordChange::class,
            'abilities' => CheckAbilities::class,
            'vault.extension' => EnsureVaultExtensionToken::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Token absent, invalide ou expiré : 401 avec message en français
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Session expirée ou invalide. Veuillez vous reconnecter.',
                ], 401);
            }
        });

        // Jeton sans l'ability requise (ex. jeton d'extension SBEE hors du coffre) : 403 en français
        $exceptions->render(function (MissingAbilityException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => "Ce jeton n'est pas autorisé pour cette opération.",
                ], 403);
            }
        });

        // Trop de tentatives (ex. throttle sur /login) : 429 avec message en français
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $seconds = (int) ($e->getHeaders()['Retry-After'] ?? 60);

                return response()->json([
                    'message' => __('auth.throttle', ['seconds' => $seconds]),
                ], 429, $e->getHeaders());
            }
        });
    })->create();
