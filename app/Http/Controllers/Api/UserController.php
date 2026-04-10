<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Liste des utilisateurs
     */
    public function index(Request $request)
    {
        $query = User::with('role');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('matricule', 'like', "%{$search}%")
                  ->orWhere('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        $users = $query->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ] : null,
                'isActive' => $user->is_active,
                'lastLoginAt' => $user->last_login_at?->format('Y-m-d H:i:s'),
                'createdAt' => $user->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Créer un utilisateur
     */
    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        ActivityLog::log('create_user', "Utilisateur créé: {$user->matricule}");

        return response()->json([
            'message' => 'Utilisateur créé avec succès',
            'user' => $user->load('role'),
        ], 201);
    }

    /**
     * Afficher un utilisateur
     */
    public function show(User $user)
    {
        return response()->json([
            'user' => [
                'id' => $user->id,
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'role' => $user->role ? [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ] : null,
                'isActive' => $user->is_active,
                'lastLoginAt' => $user->last_login_at?->format('Y-m-d H:i:s'),
                'createdAt' => $user->created_at->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        ActivityLog::log('update_user', "Utilisateur mis à jour: {$user->matricule}");

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $user->load('role'),
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy(User $user)
    {
        $matricule = $user->matricule;
        $user->delete();

        ActivityLog::log('delete_user', "Utilisateur supprimé: {$matricule}");

        return response()->json([
            'message' => 'Utilisateur supprimé avec succès',
        ]);
    }

    /**
     * Activer/Désactiver un utilisateur
     */
    public function toggleStatus(User $user)
    {
        $user->update(['is_active' => !$user->is_active]);

        $status = $user->is_active ? 'activé' : 'désactivé';
        ActivityLog::log('toggle_user', "Utilisateur {$status}: {$user->matricule}");

        return response()->json([
            'message' => "Utilisateur {$status} avec succès",
            'user' => $user,
        ]);
    }

    /**
     * Obtenir les statistiques utilisateurs
     */
    public function stats()
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $inactiveUsers = User::where('is_active', false)->count();
        $recentLogins = User::whereNotNull('last_login_at')
            ->where('last_login_at', '>=', now()->subDays(7))
            ->count();

        return response()->json([
            'stats' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'inactive' => $inactiveUsers,
                'recentLogins' => $recentLogins,
            ],
        ]);
    }
}
