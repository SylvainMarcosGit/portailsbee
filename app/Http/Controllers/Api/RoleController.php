<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRoleRequest;
use App\Http\Requests\UpdateRoleRequest;
use App\Models\ActivityLog;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Liste des rôles
     */
    public function index()
    {
        $roles = Role::with('applications.category')->withCount('users')->get()->map(fn ($role) => $this->format($role));

        return response()->json([
            'data' => $roles,
        ]);
    }

    /**
     * Créer un rôle (avec, éventuellement, ses applications)
     */
    public function store(StoreRoleRequest $request)
    {
        $role = Role::create($request->safe()->only(['name', 'description']));

        if ($request->filled('application_ids')) {
            $role->applications()->sync($request->validated('application_ids'));
        }

        ActivityLog::log('create_role', "Rôle créé: {$role->name}");

        return response()->json([
            'message' => 'Rôle créé.',
            'role' => $this->format($role->load('applications.category')->loadCount('users')),
        ], 201);
    }

    /**
     * Afficher un rôle avec ses applications
     */
    public function show(Role $role)
    {
        $role->load('applications.category');

        return response()->json([
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_system' => $role->isSystem(),
                'applications' => $role->applications->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'name' => $app->name,
                        'category' => $app->category?->name,
                        'category_id' => $app->category_id,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Mettre à jour un rôle (le slug du rôle système reste inchangé)
     */
    public function update(UpdateRoleRequest $request, Role $role)
    {
        $role->update($request->validated());

        ActivityLog::log('update_role', "Rôle mis à jour: {$role->name}");

        return response()->json([
            'message' => 'Rôle mis à jour.',
            'role' => $this->format($role->load('applications.category')->loadCount('users')),
        ]);
    }

    /**
     * Supprimer un rôle (refusé pour le rôle système ou tant que des utilisateurs l'ont)
     */
    public function destroy(Role $role)
    {
        if ($role->isSystem()) {
            return response()->json([
                'message' => 'Le rôle administrateur est un rôle système : il ne peut pas être supprimé.',
            ], 422);
        }

        $count = $role->users()->count();

        if ($count > 0) {
            return response()->json([
                'message' => "{$count} utilisateur(s) ont ce rôle. Attribuez-leur un autre rôle avant de le supprimer.",
            ], 422);
        }

        $name = $role->name;
        $role->delete();

        ActivityLog::log('delete_role', "Rôle supprimé: {$name}");

        return response()->json([
            'message' => 'Rôle supprimé.',
        ]);
    }

    /**
     * Mettre à jour les applications d'un rôle
     */
    public function updateApplications(Request $request, Role $role)
    {
        $request->validate([
            'application_ids' => 'present|array',
            'application_ids.*' => 'exists:applications,id',
        ]);

        $role->applications()->sync($request->input('application_ids', []));

        ActivityLog::log('update_role_applications', "Applications du rôle mises à jour: {$role->name}");

        return response()->json([
            'message' => 'Applications du rôle mises à jour avec succès',
            'role' => array_merge($role->load('applications.category')->toArray(), [
                'is_system' => $role->isSystem(),
                'applications' => $role->applications->map(fn ($app) => $app->toApiArray()),
            ]),
        ]);
    }

    /**
     * Format de réponse d'un rôle (élément de la liste)
     */
    private function format(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
            'slug' => $role->slug,
            'description' => $role->description,
            'is_system' => $role->isSystem(),
            'users_count' => (int) $role->users_count,
            'applications' => $role->applications->map(function ($app) {
                return [
                    'id' => $app->id,
                    'name' => $app->name,
                    'category' => $app->category?->name,
                    'category_id' => $app->category_id,
                    'is_active' => $app->is_active,
                ];
            }),
        ];
    }
}
