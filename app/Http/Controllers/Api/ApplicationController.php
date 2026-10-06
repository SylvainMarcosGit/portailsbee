<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Models\Application;
use App\Models\ActivityLog;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ApplicationController extends Controller
{
    /**
     * Liste des applications (pour utilisateur normal)
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Sans rôle : aucune application
        if (!$user->role) {
            return response()->json([
                'applications' => [],
            ]);
        }

        // Récupérer les applications autorisées pour le rôle de l'utilisateur
        $applications = $user->role->applications()
            ->with('category')
            ->where('is_active', true)
            ->get()
            ->map(function ($app) {
                return [
                    'id' => $app->id,
                    'name' => $app->name,
                    'url' => $app->url,
                    'description' => $app->description,
                    'category' => $app->category?->name,
                    'category_id' => $app->category_id,
                    'logo_url' => $app->logo_url,
                    'version' => $app->version,
                    'deployment_date' => $app->deployment_date?->format('Y-m-d'),
                    'developed_by' => $app->developed_by,
                    'is_active' => $app->is_active,
                ];
            });

        return response()->json([
            'applications' => $applications,
        ]);
    }

    /**
     * Liste complète des applications (pour admin)
     */
    public function all(Request $request)
    {
        $query = Application::with(['roles', 'category']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->byCategory($request->category_id);
        }

        $applications = $query->get()->map(function ($app) {
            return [
                'id' => $app->id,
                'name' => $app->name,
                'url' => $app->url,
                'description' => $app->description,
                'category' => $app->category?->name,
                'category_id' => $app->category_id,
                'logo_url' => $app->logo_url,
                'version' => $app->version,
                'deployment_date' => $app->deployment_date?->format('Y-m-d'),
                'developed_by' => $app->developed_by,
                'is_active' => $app->is_active,
                'roles' => $app->roles,
            ];
        });

        return response()->json([
            'applications' => $applications,
        ]);
    }

    /**
     * Créer une nouvelle application
     */
    public function store(StoreApplicationRequest $request)
    {
        $data = $request->validated();

        // Gérer l'upload du logo
        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        }

        // Version par défaut si non renseignée
        if (empty($data['version'])) {
            $data['version'] = '1.0.0';
        }

        unset($data['sync_roles'], $data['role_ids']);

        $application = Application::create($data);

        // Attribuer les rôles (sync_roles présent => la liste fait foi, même vide)
        if ($request->has('sync_roles') || $request->has('role_ids')) {
            $application->roles()->sync($request->input('role_ids') ?? []);
        }

        ActivityLog::log('create_application', "Application créée: {$application->name}");

        return response()->json([
            'message' => 'Application créée avec succès',
            'application' => $application->load(['roles', 'category'])->toApiArray(),
        ], 201);
    }

    /**
     * Afficher une application
     */
    public function show(Application $application)
    {
        $application->load(['roles', 'category']);

        return response()->json([
            'application' => [
                'id' => $application->id,
                'name' => $application->name,
                'url' => $application->url,
                'description' => $application->description,
                'category' => $application->category?->name,
                'category_id' => $application->category_id,
                'logo' => $application->logo_url,
                'version' => $application->version,
                'deploymentDate' => $application->deployment_date?->format('Y-m-d'),
                'developedBy' => $application->developed_by,
                'isActive' => $application->is_active,
                'authorizedRoles' => $application->roles->pluck('name')->toArray(),
            ],
        ]);
    }

    /**
     * Mettre à jour une application
     */
    public function update(UpdateApplicationRequest $request, Application $application)
    {
        $data = $request->validated();

        // Gérer l'upload du nouveau logo
        if ($request->hasFile('logo')) {
            // Supprimer l'ancien logo
            if ($application->logo) {
                Storage::disk('public')->delete($application->logo);
            }
            $data['logo'] = $request->file('logo')->store('logos', 'public');
        } else {
            // Ne pas écraser le logo existant si aucun fichier n'est envoyé
            unset($data['logo']);
        }

        // Version vidée => version par défaut
        if (array_key_exists('version', $data) && empty($data['version'])) {
            $data['version'] = '1.0.0';
        }

        unset($data['sync_roles'], $data['role_ids']);

        $application->update($data);

        // Mettre à jour les rôles (sync_roles présent => la liste fait foi, même vide)
        if ($request->has('sync_roles') || $request->has('role_ids')) {
            $application->roles()->sync($request->input('role_ids') ?? []);
        }

        ActivityLog::log('update_application', "Application mise à jour: {$application->name}");

        return response()->json([
            'message' => 'Application mise à jour avec succès',
            'application' => $application->load(['roles', 'category'])->toApiArray(),
        ]);
    }

    /**
     * Supprimer une application
     */
    public function destroy(Application $application)
    {
        $name = $application->name;

        // Supprimer le logo
        if ($application->logo) {
            Storage::disk('public')->delete($application->logo);
        }

        $application->delete();

        ActivityLog::log('delete_application', "Application supprimée: {$name}");

        return response()->json([
            'message' => 'Application supprimée avec succès',
        ]);
    }

    /**
     * Activer/Désactiver une application
     */
    public function toggleStatus(Application $application)
    {
        $application->update(['is_active' => !$application->is_active]);

        $status = $application->is_active ? 'activée' : 'désactivée';
        ActivityLog::log('toggle_application', "Application {$status}: {$application->name}");

        return response()->json([
            'message' => "Application {$status} avec succès",
            'application' => [
                'id' => $application->id,
                'name' => $application->name,
                'is_active' => $application->is_active,
            ],
        ]);
    }

    /**
     * Accéder à une application
     */
    public function access(Request $request, Application $application)
    {
        $user = $request->user();

        // Les administrateurs accèdent à toute application active (ouverture depuis le dashboard admin).
        // Les autres : rôle requis et application attribuée à ce rôle.
        $hasAccess = $user->isAdmin()
            || ($user->role
                && $user->role->applications()->where('applications.id', $application->id)->exists());

        if (!$hasAccess) {
            return response()->json([
                'message' => "Vous n'avez pas accès à cette application.",
            ], 403);
        }

        // Vérifier que l'application est active
        if (!$application->is_active) {
            return response()->json([
                'message' => "Cette application est actuellement désactivée.",
            ], 403);
        }

        ActivityLog::log('access_application', "Accès à l'application: {$application->name}", $application->id);

        return response()->json([
            'message' => 'Accès autorisé',
            'url' => $application->url,
            'application' => [
                'id' => $application->id,
                'name' => $application->name,
            ],
        ]);
    }
}
