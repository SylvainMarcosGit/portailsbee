<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureVaultExtensionToken;
use App\Http\Requests\SaveAppCredentialRequest;
use App\Models\ActivityLog;
use App\Models\AppCredential;
use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Coffre d'identifiants : gestion depuis le portail (jeton '*') et
 * lecture / enregistrement depuis l'extension SBEE (jeton sbee-extension, ability vault).
 */
class VaultController extends Controller
{
    /**
     * Durée de validité du jeton d'extension (heures)
     */
    private const EXTENSION_TOKEN_HOURS = 8;

    /** Préfixe de l'ability qui identifie l'installation de l'extension (un jeton par navigateur). */
    private const INSTANCE_ABILITY_PREFIX = 'instance:';

    /**
     * Applications accessibles et état du coffre pour chacune (jamais de secret)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $credentials = $user->appCredentials()->get()->keyBy('application_id');

        $applications = $user->accessibleApplications()
            ->with('category')
            ->orderBy('name')
            ->get()
            ->map(function (Application $app) use ($credentials) {
                $credential = $credentials->get($app->id);

                return [
                    'application_id' => $app->id,
                    'name' => $app->name,
                    'url' => $app->url,
                    'logo_url' => $app->logo_url,
                    'category' => $app->category?->name,
                    'sso_mode' => $app->sso_mode,
                    'identifier_type' => $app->identifier_type,
                    'has_credential' => $credential !== null,
                    'login_identifier' => $credential?->login_identifier,
                    'last_used_at' => $credential?->last_used_at?->toISOString(),
                ];
            });

        return response()->json([
            'applications' => $applications,
        ]);
    }

    /**
     * Enregistrer (ou remplacer) les identifiants d'une application depuis le portail
     */
    public function update(SaveAppCredentialRequest $request, Application $application)
    {
        return $this->saveCredential($request, $application);
    }

    /**
     * Supprimer les identifiants d'une application
     */
    public function destroy(Request $request, Application $application)
    {
        $deleted = $request->user()->appCredentials()
            ->where('application_id', $application->id)
            ->delete();

        if ($deleted) {
            ActivityLog::log('vault_delete', "Identifiants supprimés du coffre: {$application->name}", $application->id);
        }

        return response()->json([
            'message' => 'Identifiants supprimés.',
        ]);
    }

    /**
     * Émettre un jeton pour l'extension SBEE (ability vault uniquement, 8 h).
     * Un jeton par installation de l'extension (instance_id) : un agent peut relier
     * plusieurs navigateurs (Edge, Firefox, Opera) sans que l'un révoque l'autre.
     * Seul l'ancien jeton de la même installation est remplacé ; sans instance_id,
     * tous les jetons d'extension de l'utilisateur sont révoqués (comportement initial).
     */
    public function extensionToken(Request $request)
    {
        $validated = $request->validate([
            'instance_id' => ['nullable', 'string', 'regex:/^[A-Za-z0-9-]{8,64}$/'],
        ]);
        $user = $request->user();
        $instanceId = $validated['instance_id'] ?? null;

        $extensionTokens = $user->tokens()->where('name', EnsureVaultExtensionToken::TOKEN_NAME);
        if ($instanceId === null) {
            $extensionTokens->delete();
        } else {
            $ability = self::INSTANCE_ABILITY_PREFIX.$instanceId;
            $extensionTokens->get()
                ->filter(fn ($t) => in_array($ability, $t->abilities ?? [], true)
                    || ($t->expires_at !== null && $t->expires_at->isPast()))
                ->each->delete();
        }

        $expiresAt = now()->addHours(self::EXTENSION_TOKEN_HOURS);
        $abilities = $instanceId === null ? ['vault'] : ['vault', self::INSTANCE_ABILITY_PREFIX.$instanceId];
        $token = $user->createToken(EnsureVaultExtensionToken::TOKEN_NAME, $abilities, $expiresAt);

        return response()->json([
            'token' => $token->plainTextToken,
            'expires_at' => $expiresAt->toISOString(),
            'api_base' => rtrim((string) config('app.url'), '/').'/api',
        ], 201);
    }

    /**
     * Extension : utilisateur et applications à remplir automatiquement
     */
    public function extensionConfig(Request $request)
    {
        $user = $request->user();
        $credentials = $user->appCredentials()->get()->keyBy('application_id');

        $applications = $user->accessibleApplications()
            ->where('sso_mode', '!=', 'none')
            ->whereNotNull('login_url_pattern')
            ->where('login_url_pattern', '!=', '')
            ->orderBy('name')
            ->get()
            ->map(function (Application $app) use ($credentials) {
                $credential = $credentials->get($app->id);

                return [
                    'application_id' => $app->id,
                    'name' => $app->name,
                    'sso_mode' => $app->sso_mode,
                    'login_url_pattern' => $app->login_url_pattern,
                    'identifier_type' => $app->identifier_type,
                    'username_selector' => $app->username_selector,
                    'password_selector' => $app->password_selector,
                    'submit_selector' => $app->submit_selector,
                    'has_credential' => $credential !== null,
                    'login_identifier' => $credential?->login_identifier,
                ];
            });

        return response()->json([
            'user' => [
                'matricule' => $user->matricule,
                'prenom' => $user->prenom,
                'nom' => $user->nom,
            ],
            'applications' => $applications,
        ]);
    }

    /**
     * Extension : identifiants en clair pour le remplissage d'une page de connexion
     */
    public function reveal(Request $request, Application $application)
    {
        $user = $request->user();

        if ($error = $this->denyAccess($user, $application)) {
            return $error;
        }

        $credential = $user->appCredentials()->where('application_id', $application->id)->first();

        if (!$credential) {
            return response()->json([
                'message' => 'Aucun identifiant enregistré pour cette application.',
            ], 404);
        }

        $credential->forceFill(['last_used_at' => now()])->save();

        ActivityLog::log('vault_fill', "Remplissage automatique: {$application->name}", $application->id);

        return response()->json([
            'login_identifier' => $credential->login_identifier,
            'secret' => $credential->plainSecret(),
        ]);
    }

    /**
     * Extension : enregistrer les identifiants saisis sur la page de connexion
     */
    public function extensionUpdate(SaveAppCredentialRequest $request, Application $application)
    {
        return $this->saveCredential($request, $application);
    }

    /**
     * Extension : révoquer le jeton courant
     */
    public function extensionLogout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Extension déconnectée.',
        ]);
    }

    /**
     * Créer ou remplacer les identifiants de l'utilisateur pour une application accessible
     */
    private function saveCredential(SaveAppCredentialRequest $request, Application $application)
    {
        $user = $request->user();

        if ($error = $this->denyAccess($user, $application)) {
            return $error;
        }

        $data = $request->validated();

        $credential = AppCredential::firstOrNew([
            'user_id' => $user->id,
            'application_id' => $application->id,
        ]);
        $credential->login_identifier = $data['login_identifier'];
        $credential->setPlainSecret($data['secret']);
        $credential->save();

        ActivityLog::log('vault_save', "Identifiants enregistrés dans le coffre: {$application->name}", $application->id);

        return response()->json([
            'message' => 'Identifiants enregistrés.',
            'credential' => $credential->toApiArray(),
        ]);
    }

    /**
     * Même règle que ApplicationController::access : réponse 403 si l'application
     * n'est pas accessible à l'utilisateur ou est désactivée, null sinon.
     */
    private function denyAccess(User $user, Application $application)
    {
        if (!$user->canAccessApplication($application)) {
            return response()->json([
                'message' => "Vous n'avez pas accès à cette application.",
            ], 403);
        }

        if (!$application->is_active) {
            return response()->json([
                'message' => 'Cette application est actuellement désactivée.',
            ], 403);
        }

        return null;
    }
}
