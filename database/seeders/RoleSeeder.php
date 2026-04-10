<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Administrateur',
                'slug' => 'administrateur',
                'description' => 'Accès complet à toutes les fonctionnalités',
            ],
            [
                'name' => 'Technicien',
                'slug' => 'technicien',
                'description' => 'Accès aux applications techniques',
            ],
            [
                'name' => 'Comptable',
                'slug' => 'comptable',
                'description' => 'Accès aux applications financières',
            ],
            [
                'name' => 'RH Manager',
                'slug' => 'rh-manager',
                'description' => 'Accès aux applications RH',
            ],
            [
                'name' => 'Utilisateur',
                'slug' => 'utilisateur',
                'description' => 'Accès basique',
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
