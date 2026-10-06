<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Technique',
                'slug' => 'technique',
                'description' => 'Exploitation du réseau et maintenance',
            ],
            [
                'name' => 'Finances',
                'slug' => 'finances',
                'description' => 'Facturation, comptabilité et gestion financière',
            ],
            [
                'name' => 'RH',
                'slug' => 'rh',
                'description' => 'Gestion du personnel et de la paie',
            ],
            [
                'name' => 'Administration',
                'slug' => 'administration',
                'description' => 'Outils administratifs et communication interne',
            ],
        ];

        foreach ($categories as $category) {
            // Idempotent : le slug est la clé unique
            Category::updateOrCreate(['slug' => $category['slug']], $category);
        }
    }
}
