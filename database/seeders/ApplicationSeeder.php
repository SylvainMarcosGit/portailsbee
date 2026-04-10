<?php

namespace Database\Seeders;

use App\Models\Application;
use App\Models\Role;
use Illuminate\Database\Seeder;

class ApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $applications = [
            [
                'name' => 'Gestion Réseau',
                'url' => 'https://reseau.sbee.bj',
                'description' => 'Système de gestion et monitoring du réseau électrique',
                'category' => 'Technique',
                'version' => '2.3.1',
                'deployment_date' => '2024-01-15',
                'developed_by' => 'Direction Technique SBEE',
                'is_active' => true,
                'roles' => ['administrateur', 'technicien'],
            ],
            [
                'name' => 'Facturation',
                'url' => 'https://facturation.sbee.bj',
                'description' => 'Gestion des factures et paiements clients',
                'category' => 'Finances',
                'version' => '3.1.0',
                'deployment_date' => '2024-03-20',
                'developed_by' => 'Direction Financière',
                'is_active' => true,
                'roles' => ['administrateur', 'comptable'],
            ],
            [
                'name' => 'Ressources Humaines',
                'url' => 'https://rh.sbee.bj',
                'description' => 'Gestion du personnel et des ressources humaines',
                'category' => 'RH',
                'version' => '1.8.2',
                'deployment_date' => '2023-11-10',
                'developed_by' => 'Service RH',
                'is_active' => true,
                'roles' => ['administrateur', 'rh-manager'],
            ],
            [
                'name' => 'Maintenance',
                'url' => 'https://maintenance.sbee.bj',
                'description' => 'Suivi des opérations de maintenance et interventions',
                'category' => 'Technique',
                'version' => '2.0.5',
                'deployment_date' => '2024-02-05',
                'developed_by' => 'Direction Technique SBEE',
                'is_active' => true,
                'roles' => ['administrateur', 'technicien'],
            ],
            [
                'name' => 'Comptabilité',
                'url' => 'https://compta.sbee.bj',
                'description' => 'Gestion comptable et financière',
                'category' => 'Finances',
                'version' => '1.5.3',
                'deployment_date' => '2023-09-18',
                'developed_by' => 'Direction Financière',
                'is_active' => true,
                'roles' => ['administrateur', 'comptable'],
            ],
            [
                'name' => 'Paie',
                'url' => 'https://paie.sbee.bj',
                'description' => 'Gestion de la paie des employés',
                'category' => 'RH',
                'version' => '2.1.0',
                'deployment_date' => '2024-01-01',
                'developed_by' => 'Service RH',
                'is_active' => true,
                'roles' => ['administrateur', 'rh-manager', 'comptable'],
            ],
            [
                'name' => 'Inventaire',
                'url' => 'https://inventaire.sbee.bj',
                'description' => 'Gestion des stocks et équipements',
                'category' => 'Technique',
                'version' => '1.2.0',
                'deployment_date' => '2024-04-10',
                'developed_by' => 'Direction Technique SBEE',
                'is_active' => true,
                'roles' => ['administrateur', 'technicien', 'comptable'],
            ],
            [
                'name' => 'Messagerie Interne',
                'url' => 'https://mail.sbee.bj',
                'description' => 'Système de messagerie interne SBEE',
                'category' => 'Administration',
                'version' => '1.0.0',
                'deployment_date' => '2023-06-01',
                'developed_by' => 'Direction Informatique',
                'is_active' => true,
                'roles' => ['administrateur', 'technicien', 'comptable', 'rh-manager', 'utilisateur'],
            ],
        ];

        foreach ($applications as $appData) {
            $roleSlugs = $appData['roles'];
            unset($appData['roles']);

            $app = Application::create($appData);

            // Attacher les rôles
            $roles = Role::whereIn('slug', $roleSlugs)->get();
            $app->roles()->attach($roles);
        }
    }
}
