<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Application;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ActivityLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();
        $applications = Application::all();
        
        // Générer des logs de connexion sur les 6 derniers mois
        for ($i = 0; $i < 180; $i++) {
            $date = Carbon::now()->subDays($i);
            
            // Nombre aléatoire de connexions par jour (plus élevé en semaine)
            $dayOfWeek = $date->dayOfWeek;
            $baseCount = ($dayOfWeek >= 1 && $dayOfWeek <= 5) ? rand(15, 45) : rand(5, 15);
            
            for ($j = 0; $j < $baseCount; $j++) {
                $user = $users->random();
                $hour = $this->getRandomHour();
                
                ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => 'login',
                    'description' => 'Connexion au portail',
                    'ip_address' => $this->getRandomIp(),
                    'created_at' => $date->copy()->setHour($hour)->setMinute(rand(0, 59)),
                ]);
            }
            
            // Accès aux applications
            $accessCount = rand(5, 20);
            for ($k = 0; $k < $accessCount; $k++) {
                $user = $users->random();
                $app = $applications->random();
                $hour = $this->getRandomHour();
                
                ActivityLog::create([
                    'user_id' => $user->id,
                    'action' => 'access_application',
                    'description' => "Accès à l'application: " . $app->name,
                    'ip_address' => $this->getRandomIp(),
                    'created_at' => $date->copy()->setHour($hour)->setMinute(rand(0, 59)),
                ]);
            }
        }
        
        // Ajouter quelques logs de déconnexion récents
        for ($i = 0; $i < 50; $i++) {
            $user = $users->random();
            $daysAgo = rand(0, 7);
            $hour = $this->getRandomHour();
            
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'logout',
                'description' => 'Déconnexion du portail',
                'ip_address' => $this->getRandomIp(),
                'created_at' => Carbon::now()->subDays($daysAgo)->setHour($hour),
            ]);
        }
    }
    
    /**
     * Génère une heure pondérée selon les heures de pointe
     */
    private function getRandomHour(): int
    {
        $weights = [
            0 => 1, 1 => 1, 2 => 1, 3 => 1, 4 => 2, 5 => 3,
            6 => 5, 7 => 15, 8 => 25, 9 => 30, 10 => 25, 11 => 20,
            12 => 15, 13 => 20, 14 => 25, 15 => 28, 16 => 22, 17 => 18,
            18 => 10, 19 => 6, 20 => 4, 21 => 3, 22 => 2, 23 => 1
        ];
        
        $total = array_sum($weights);
        $rand = rand(1, $total);
        $cumulative = 0;
        
        foreach ($weights as $hour => $weight) {
            $cumulative += $weight;
            if ($rand <= $cumulative) {
                return $hour;
            }
        }
        
        return 9; // Default
    }
    
    /**
     * Génère une IP aléatoire
     */
    private function getRandomIp(): string
    {
        return '192.168.' . rand(1, 2) . '.' . rand(1, 2);
    }
}
