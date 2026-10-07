<?php

namespace App\Console\Commands;

use App\Models\AppCredential;
use App\Services\VaultCipher;
use Illuminate\Console\Command;
use Throwable;

class VaultRotateCommand extends Command
{
    protected $signature = 'vault:rotate';

    protected $description = 'Rechiffre tous les secrets du coffre avec la clé courante (VAULT_KEY), depuis la clé courante ou VAULT_PREVIOUS_KEYS';

    public function handle(VaultCipher $cipher): int
    {
        $rotated = 0;
        $failed = 0;

        AppCredential::query()->chunkById(200, function ($credentials) use ($cipher, &$rotated, &$failed) {
            foreach ($credentials as $credential) {
                try {
                    $plain = $cipher->decrypt($credential->secret);
                    $credential->forceFill(['secret' => $cipher->encrypt($plain)])->saveQuietly();
                    $rotated++;
                } catch (Throwable $e) {
                    $failed++;
                    $this->error("Identifiant #{$credential->id} : {$e->getMessage()}");
                }
            }
        });

        $this->info("Secrets rechiffrés : {$rotated}.");

        if ($failed > 0) {
            $this->error("Secrets non déchiffrables : {$failed}.");

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
