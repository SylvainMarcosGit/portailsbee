<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UserSeeder::class,
            CategorySeeder::class,
            ApplicationSeeder::class,
        ]);

        // Données d'activité fictives : uniquement en environnement local
        if (app()->environment('local')) {
            $this->call(ActivityLogSeeder::class);
        }
    }
}
