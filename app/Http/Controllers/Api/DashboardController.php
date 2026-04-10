<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Statistiques pour le tableau de bord admin
     */
    public function adminStats()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $totalApplications = Application::count();
        $activeApplications = Application::where('is_active', true)->count();
        
        $recentLogins = ActivityLog::where('action', 'login')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $todayLogins = ActivityLog::where('action', 'login')
            ->whereDate('created_at', today())
            ->count();

        // Applications par catégorie
        $appsByCategory = Application::selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        // Connexions par jour de la semaine (7 derniers jours)
        $connectionsByDay = [];
        $days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $count = ActivityLog::where('action', 'login')
                ->whereDate('created_at', $date)
                ->count();
            $connectionsByDay[] = [
                'day' => $days[$date->dayOfWeek],
                'connexions' => $count,
            ];
        }

        // Tendance mensuelle (6 derniers mois)
        $monthlyTrend = [];
        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = ActivityLog::where('action', 'login')
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            $monthlyTrend[] = [
                'month' => $months[$date->month - 1],
                'total' => $count,
            ];
        }

        // Heures de pointe (distribution par tranche horaire)
        $peakHours = [];
        $hourRanges = [
            ['start' => 0, 'end' => 4, 'label' => '00h'],
            ['start' => 4, 'end' => 8, 'label' => '04h'],
            ['start' => 8, 'end' => 12, 'label' => '08h'],
            ['start' => 12, 'end' => 16, 'label' => '12h'],
            ['start' => 16, 'end' => 20, 'label' => '16h'],
            ['start' => 20, 'end' => 24, 'label' => '20h'],
        ];
        foreach ($hourRanges as $range) {
            $count = ActivityLog::where('action', 'login')
                ->where('created_at', '>=', now()->subDays(30))
                ->whereRaw('HOUR(created_at) >= ? AND HOUR(created_at) < ?', [$range['start'], $range['end']])
                ->count();
            $peakHours[] = [
                'hour' => $range['label'],
                'value' => $count,
            ];
        }

        // Utilisation par application (basé sur les accès)
        $appUsage = ActivityLog::where('action', 'access_application')
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('description, count(*) as count')
            ->groupBy('description')
            ->orderByDesc('count')
            ->limit(6)
            ->get()
            ->map(function ($item, $index) {
                $colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];
                // Extraire le nom de l'app de la description
                $appName = str_replace("Accès à l'application: ", '', $item->description);
                return [
                    'name' => $appName ?: 'Autres',
                    'users' => $item->count,
                    'color' => $colors[$index] ?? '#6b7280',
                ];
            });

        // Dernières activités
        $recentActivities = ActivityLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user' => $log->user ? $log->user->full_name : 'Système',
                    'action' => $log->action,
                    'description' => $log->description,
                    'time' => $log->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'stats' => [
                'users' => [
                    'total' => $totalUsers,
                    'active' => $activeUsers,
                ],
                'applications' => [
                    'total' => $totalApplications,
                    'active' => $activeApplications,
                ],
                'logins' => [
                    'weekly' => $recentLogins,
                    'today' => $todayLogins,
                ],
            ],
            'appsByCategory' => $appsByCategory,
            'connectionsByDay' => $connectionsByDay,
            'monthlyTrend' => $monthlyTrend,
            'peakHours' => $peakHours,
            'appUsage' => $appUsage,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Statistiques pour le tableau de bord utilisateur
     */
    public function userStats(Request $request)
    {
        $user = $request->user();
        
        // Applications accessibles
        $applications = $user->role->applications()
            ->where('is_active', true)
            ->get()
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'name' => $app->name,
                    'url' => $app->url,
                    'category' => $app->category,
                    'description' => $app->description,
                ];
            });

        // Derniers accès de l'utilisateur
        $recentAccess = ActivityLog::where('user_id', $user->id)
            ->where('action', 'access_application')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($log) {
                return [
                    'description' => $log->description,
                    'time' => $log->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'user' => [
                'fullName' => $user->full_name,
                'role' => $user->role->name,
                'lastLogin' => $user->last_login_at?->format('d/m/Y H:i'),
            ],
            'applications' => $applications,
            'recentAccess' => $recentAccess,
        ]);
    }
}
