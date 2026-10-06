<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Category;
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

        // Applications par catégorie { "<nom>": count }, catégories vides incluses
        $appsByCategory = Category::query()
            ->leftJoin('applications', 'applications.category_id', '=', 'categories.id')
            ->selectRaw('categories.name as category_name, count(applications.id) as count')
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('categories.name')
            ->pluck('count', 'category_name')
            ->map(fn ($count) => (int) $count);

        $driver = ActivityLog::query()->getConnection()->getDriverName();
        $isSqlite = $driver === 'sqlite';

        // Connexions par jour de la semaine (7 derniers jours) - une seule requête groupée
        $dayExpr = $isSqlite ? "date(created_at)" : "DATE(created_at)";
        $loginsPerDay = ActivityLog::where('action', 'login')
            ->where('created_at', '>=', today()->subDays(6))
            ->selectRaw("{$dayExpr} as day, count(*) as count")
            ->groupBy('day')
            ->pluck('count', 'day');

        $connectionsByDay = [];
        $days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        for ($i = 6; $i >= 0; $i--) {
            $date = today()->subDays($i);
            $connectionsByDay[] = [
                'day' => $days[$date->dayOfWeek],
                'connexions' => (int) ($loginsPerDay[$date->format('Y-m-d')] ?? 0),
            ];
        }

        // Tendance mensuelle (6 derniers mois) - une seule requête groupée
        $monthExpr = $isSqlite ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";
        $loginsPerMonth = ActivityLog::where('action', 'login')
            ->where('created_at', '>=', now()->startOfMonth()->subMonths(5))
            ->selectRaw("{$monthExpr} as ym, count(*) as count")
            ->groupBy('ym')
            ->pluck('count', 'ym');

        $monthlyTrend = [];
        $months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        for ($i = 5; $i >= 0; $i--) {
            // startOfMonth() avant subMonths() : évite le débordement (ex. 31 mars - 1 mois = 3 mars)
            $date = now()->startOfMonth()->subMonths($i);
            $monthlyTrend[] = [
                'month' => $months[$date->month - 1],
                'total' => (int) ($loginsPerMonth[$date->format('Y-m')] ?? 0),
            ];
        }

        // Heures de pointe (connexions des 30 derniers jours par tranche de 4 heures)
        // (division entière native en SQLite, FLOOR en MySQL)
        $slotExpr = $isSqlite ? "(CAST(strftime('%H', created_at) AS INTEGER) / 4)" : "FLOOR(HOUR(created_at) / 4)";
        $loginsPerSlot = ActivityLog::where('action', 'login')
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw("{$slotExpr} as slot, count(*) as count")
            ->groupBy('slot')
            ->pluck('count', 'slot');

        $peakHours = [];
        for ($slot = 0; $slot < 6; $slot++) {
            $peakHours[] = [
                'hour' => sprintf('%02dh-%02dh', $slot * 4, ($slot + 1) * 4),
                'value' => (int) ($loginsPerSlot[$slot] ?? 0),
            ];
        }

        // Utilisation par application : utilisateurs distincts sur 30 jours
        // (les anciens logs sans application_id sont ignorés)
        $colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6b7280'];
        $appUsage = ActivityLog::query()
            ->join('applications', 'applications.id', '=', 'activity_logs.application_id')
            ->where('activity_logs.action', 'access_application')
            ->where('activity_logs.created_at', '>=', now()->subDays(30))
            ->selectRaw('applications.id, applications.name, COUNT(DISTINCT activity_logs.user_id) as users')
            ->groupBy('applications.id', 'applications.name')
            ->orderByDesc('users')
            ->get()
            ->values()
            ->map(function ($item, $index) use ($colors) {
                return [
                    'name' => $item->name,
                    'users' => (int) $item->users,
                    'color' => $colors[$index % count($colors)],
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
        
        // Applications accessibles (aucune si l'utilisateur n'a pas de rôle)
        $applications = ($user->role ? $user->role->applications()->with('category')->where('is_active', true)->get() : collect())
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'name' => $app->name,
                    'url' => $app->url,
                    'category' => $app->category?->name,
                    'category_id' => $app->category_id,
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
                'role' => $user->role?->name,
                'lastLogin' => $user->last_login_at?->format('d/m/Y H:i'),
            ],
            'applications' => $applications,
            'recentAccess' => $recentAccess,
        ]);
    }
}
