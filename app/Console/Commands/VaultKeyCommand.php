<?php

namespace App\Console\Commands;

use App\Services\VaultCipher;
use Illuminate\Console\Command;

class VaultKeyCommand extends Command
{
    protected $signature = 'vault:key';

    protected $description = "Affiche une nouvelle clé de chiffrement du coffre (à copier dans VAULT_KEY) - n'écrit rien";

    public function handle(): int
    {
        $this->line(VaultCipher::generateKey());

        return self::SUCCESS;
    }
}
