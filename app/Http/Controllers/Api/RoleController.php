<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Liste des rôles
     */
    public function index()
    {
        $roles = Role::with('applications')->withCount('users')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'users_count' => $role->users_count,
                'applications' => $role->applications->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'name' => $app->name,
                        'category' => $app->category,
                        'is_active' => $app->is_active,
                    ];
                }),
            ];
        });

        return response()->json([
            'data' => $roles,
        ]);
    }

    /**
     * Afficher un rôle avec ses applications
     */
    public function show(Role $role)
    {
        return response()->json([
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'applications' => $role->applications->map(function ($app) {
                    return [
                        'id' => $app->id,
                        'name' => $app->name,
                        'category' => $app->category,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Mettre à jour les applications d'un rôle
     */
    public function updateApplications(Request $request, Role $role)
    {
        $request->validate([
            'application_ids' => 'required|array',
            'application_ids.*' => 'exists:applications,id',
        ]);

        $role->applications()->sync($request->application_ids);

        return response()->json([
            'message' => 'Applications du rôle mises à jour avec succès',
            'role' => $role->load('applications'),
        ]);
    }
}
