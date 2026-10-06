<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Accès à l'API RH SBEE (JD Edwards / AIS).
 *
 * Porté de sms-bulk (App\Classes\PerformApi::getToken / getEmploye) :
 *  - POST {endpoint}/tokenrequest pour obtenir un jeton (mis en cache ~50 min) ;
 *  - POST {endpoint}/orchestrator/ORCH_WS_EMPLOYEE avec Address_Number = "1" . matricule.
 *
 * getEmploye() renvoie :
 *  - un tableau { matricule, prenom, nom, titre_de_poste, direction } si l'employé existe ;
 *  - false si aucun employé ne correspond au matricule ;
 *  - self::CALL_EXCEPTION si le serveur RH est injoignable ou répond en erreur.
 */
class RhApiService
{
    public const CALL_EXCEPTION = 'call-exception';

    private const TOKEN_CACHE_KEY = 'jde_api_token';

    private const TOKEN_TTL_MINUTES = 50;

    private const TIMEOUT_SECONDS = 15;

    /**
     * L'endpoint JDE est-il renseigné ?
     */
    public function isConfigured(): bool
    {
        return !empty($this->endpoint());
    }

    /**
     * Rechercher un employé par matricule.
     *
     * @return array<string, string>|false|string
     */
    public function getEmploye(string $matricule)
    {
        if (!$this->isConfigured()) {
            return self::CALL_EXCEPTION;
        }

        $result = $this->queryEmploye($matricule);

        // Jeton expiré ou révoqué côté JDE : on en redemande un et on réessaie une fois
        if ($result === 'token-rejected') {
            Cache::forget(self::TOKEN_CACHE_KEY);
            $result = $this->queryEmploye($matricule);
        }

        return $result === 'token-rejected' ? self::CALL_EXCEPTION : $result;
    }

    /**
     * Appel unitaire de l'orchestrateur employé.
     *
     * @return array<string, string>|false|string
     */
    private function queryEmploye(string $matricule)
    {
        $token = $this->getToken();

        if ($token === false) {
            return self::CALL_EXCEPTION;
        }

        try {
            $query = Http::timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->post($this->endpoint().'/orchestrator/ORCH_WS_EMPLOYEE', [
                    'token' => $token,
                    'Address_Number' => '1'.$matricule,
                ]);
        } catch (ConnectionException $e) {
            Log::warning('API RH injoignable (ORCH_WS_EMPLOYEE) : '.$e->getMessage());

            return self::CALL_EXCEPTION;
        }

        if (in_array($query->status(), [401, 403, 444], true)) {
            return 'token-rejected';
        }

        if ($query->serverError()) {
            Log::warning('API RH en erreur (ORCH_WS_EMPLOYEE) : HTTP '.$query->status());

            return self::CALL_EXCEPTION;
        }

        if (!$query->ok()) {
            return false;
        }

        $records = (int) $query->json('FR_WS_EMPLOYE_1.records', 0);
        $employe = $query->json('FR_WS_EMPLOYE_1.rowset.0');

        if ($records === 0 || !is_array($employe)) {
            return false;
        }

        return [
            'matricule' => $matricule,
            'prenom' => trim((string) ($employe['prenom'] ?? '')),
            'nom' => trim((string) ($employe['nom'] ?? '')),
            'titre_de_poste' => $this->valeurOuNull($employe['titre_de_poste'] ?? null),
            'direction' => $this->valeurOuNull($employe['direction'] ?? null),
        ];
    }

    /**
     * Le RH renvoie parfois « . » ou « - » pour un champ non renseigné : on le traite comme vide.
     */
    private function valeurOuNull($valeur): ?string
    {
        $valeur = trim((string) $valeur);

        return preg_match('/[\p{L}\p{N}]/u', $valeur) ? $valeur : null;
    }

    /**
     * Obtenir (ou réutiliser) un jeton d'accès aux orchestrateurs JDE.
     *
     * @return string|false
     */
    private function getToken()
    {
        $cached = Cache::get(self::TOKEN_CACHE_KEY);

        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        try {
            $query = Http::timeout(self::TIMEOUT_SECONDS)
                ->acceptJson()
                ->post($this->endpoint().'/tokenrequest', [
                    'username' => config('services.jde.username'),
                    'password' => config('services.jde.password'),
                    'environnement' => config('services.jde.environnement'),
                    'role' => config('services.jde.role'),
                ]);
        } catch (ConnectionException $e) {
            Log::warning('API RH injoignable (tokenrequest) : '.$e->getMessage());

            return false;
        }

        $token = $query->ok() ? $query->json('userInfo.token') : null;

        if (!is_string($token) || $token === '') {
            Log::warning('API RH : jeton refusé (HTTP '.$query->status().')');

            return false;
        }

        Cache::put(self::TOKEN_CACHE_KEY, $token, now()->addMinutes(self::TOKEN_TTL_MINUTES));

        return $token;
    }

    private function endpoint(): string
    {
        return rtrim((string) config('services.jde.endpoint'), '/');
    }
}
