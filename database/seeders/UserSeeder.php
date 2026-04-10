<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where('slug', 'administrateur')->first();
        $userRole = Role::where('slug', 'utilisateur')->first();
        $techRole = Role::where('slug', 'technicien')->first();
        $comptaRole = Role::where('slug', 'comptable')->first();

        // Créer un administrateur
        User::create([
            'matricule' => 'ADMIN001',
            'nom' => 'ADMIN',
            'prenom' => 'Système',
            'email' => 'admin@sbee.bj',
            'password' => Hash::make('Admin@2024'),
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        // Créer un utilisateur de test
        User::create([
            'matricule' => 'USER001',
            'nom' => 'KOUTON',
            'prenom' => 'Jean',
            'email' => 'jean.kouton@sbee.bj',
            'password' => Hash::make('User@2024'),
            'role_id' => $userRole->id,
            'is_active' => true,
        ]);

        // Créer un technicien
        User::create([
            'matricule' => 'TECH001',
            'nom' => 'DOSSOU',
            'prenom' => 'Pierre',
            'email' => 'pierre.dossou@sbee.bj',
            'password' => Hash::make('Tech@2024'),
            'role_id' => $techRole->id,
            'is_active' => true,
        ]);

        // Créer un comptable
        User::create([
            'matricule' => 'COMPTA001',
            'nom' => 'ADJOVI',
            'prenom' => 'Marie',
            'email' => 'marie.adjovi@sbee.bj',
            'password' => Hash::make('Compta@2024'),
            'role_id' => $comptaRole->id,
            'is_active' => true,
        ]);
    }
}
