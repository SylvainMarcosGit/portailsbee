<?php

namespace App\Models;

use App\Services\VaultCipher;
use Illuminate\Database\Eloquent\Model;

/**
 * Identifiants d'un utilisateur pour une application (coffre de l'extension SBEE).
 * `secret` est chiffré par VaultCipher et n'est jamais sérialisé.
 */
class AppCredential extends Model
{
    protected $fillable = [
        'user_id',
        'application_id',
        'login_identifier',
        'secret',
        'last_used_at',
    ];

    protected $hidden = [
        'secret',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    /**
     * Propriétaire des identifiants
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Application concernée
     */
    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    /**
     * Chiffrer et affecter le mot de passe en clair
     */
    public function setPlainSecret(string $plain): self
    {
        $this->secret = app(VaultCipher::class)->encrypt($plain);

        return $this;
    }

    /**
     * Mot de passe en clair (déchiffré)
     */
    public function plainSecret(): string
    {
        return app(VaultCipher::class)->decrypt($this->secret);
    }

    /**
     * Représentation API (jamais le secret)
     */
    public function toApiArray(): array
    {
        return [
            'application_id' => $this->application_id,
            'login_identifier' => $this->login_identifier,
            'last_used_at' => $this->last_used_at?->toISOString(),
        ];
    }
}
