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
        User::firstOrCreate(['matricule' => 'ADMIN001'], [
            'matricule' => 'ADMIN001',
            'nom' => 'ADMIN',
            'prenom' => 'Système',
            'email' => 'admin@sbee.bj',
            'telephone' => null,
            'direction' => "Direction des Systèmes d'Information",
            'titre_de_poste' => 'Administrateur du portail',
            'password' => Hash::make('Admin@2024'),
            'role_id' => $adminRole->id,
            'is_active' => true,
        ]);

        // Créer un utilisateur de test
        User::firstOrCreate(['matricule' => 'USER001'], [
            'matricule' => 'USER001',
            'nom' => 'KOUTON',
            'prenom' => 'Jean',
            'email' => 'jean.kouton@sbee.bj',
            'telephone' => null,
            'direction' => "Direction Commerciale",
            'titre_de_poste' => 'Agent commercial',
            'password' => Hash::make('User@2024'),
            'role_id' => $userRole->id,
            'is_active' => true,
        ]);

        // Créer un technicien
        User::firstOrCreate(['matricule' => 'TECH001'], [
            'matricule' => 'TECH001',
            'nom' => 'DOSSOU',
            'prenom' => 'Pierre',
            'email' => 'pierre.dossou@sbee.bj',
            'telephone' => null,
            'direction' => "Direction de la Distribution",
            'titre_de_poste' => 'Technicien réseau',
            'password' => Hash::make('Tech@2024'),
            'role_id' => $techRole->id,
            'is_active' => true,
        ]);

        // Créer un comptable
        User::firstOrCreate(['matricule' => 'COMPTA001'], [
            'matricule' => 'COMPTA001',
            'nom' => 'ADJOVI',
            'prenom' => 'Marie',
            'email' => 'marie.adjovi@sbee.bj',
            'telephone' => null,
            'direction' => "Direction Financière et Comptable",
            'titre_de_poste' => 'Comptable',
            'password' => Hash::make('Compta@2024'),
            'role_id' => $comptaRole->id,
            'is_active' => true,
        ]);
    }
}
