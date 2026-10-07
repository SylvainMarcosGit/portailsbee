<?php

namespace App\Services;

use App\Exceptions\VaultNotConfiguredException;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter;

/**
 * Chiffrement des secrets du coffre d'identifiants avec une clé dédiée (VAULT_KEY),
 * indépendante de APP_KEY. Le déchiffrement essaie la clé courante puis les
 * anciennes clés (VAULT_PREVIOUS_KEYS) pour permettre la rotation.
 */
class VaultCipher
{
    private string $cipher;

    private ?string $key;

    /** @var string[] */
    private array $previousKeys;

    public function __construct(?string $key = null, ?array $previousKeys = null, ?string $cipher = null)
    {
        $this->cipher = $cipher ?? (string) config('vault.cipher', 'aes-256-gcm');
        $this->key = $key ?? config('vault.key');
        $this->previousKeys = $previousKeys ?? (array) config('vault.previous_keys', []);
    }

    /**
     * Nouvelle clé au format base64:... (à copier dans VAULT_KEY)
     */
    public static function generateKey(?string $cipher = null): string
    {
        $cipher ??= (string) config('vault.cipher', 'aes-256-gcm');

        return 'base64:'.base64_encode(Encrypter::generateKey($cipher));
    }

    public function encrypt(string $plain): string
    {
        return $this->encrypter($this->currentKey())->encryptString($plain);
    }

    /**
     * Déchiffrer avec la clé courante, sinon avec les anciennes clés
     */
    public function decrypt(string $payload): string
    {
        $keys = array_merge([$this->currentKey()], $this->previousKeys);

        foreach ($keys as $key) {
            try {
                return $this->encrypter($key)->decryptString($payload);
            } catch (DecryptException) {
                // Essayer la clé suivante
            }
        }

        throw new DecryptException('Impossible de déchiffrer le secret avec VAULT_KEY ou VAULT_PREVIOUS_KEYS.');
    }

    private function currentKey(): string
    {
        if (empty($this->key)) {
            throw new VaultNotConfiguredException();
        }

        return $this->key;
    }

    private function encrypter(string $key): Encrypter
    {
        if (str_starts_with($key, 'base64:')) {
            $key = base64_decode(substr($key, 7), true);
        }

        if (!is_string($key) || !Encrypter::supported($key, $this->cipher)) {
            throw new VaultNotConfiguredException('Coffre non configuré : VAULT_KEY invalide (clé base64:... de 32 octets attendue, php artisan vault:key).');
        }

        return new Encrypter($key, $this->cipher);
    }
}
