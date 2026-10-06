<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\ActivityLog;
use App\Models\Role;
use App\Models\User;
use App\Services\RhApiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Slug du rôle administrateur (cf. User::isAdmin(), Role::SLUG_ADMIN)
     */
    private const ADMIN_SLUG = Role::SLUG_ADMIN;

    /**
     * Réponse quand la création ou la resynchronisation ne peut pas s'appuyer sur le RH
     */
    private const MESSAGE_RH_INDISPONIBLE = 'Matricule invalide ou serveur RH SBEE inaccessible.';

    public function __construct(private RhApiService $rh)
    {
    }

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

        $users = $query->get()->map(fn (User $user) => $this->formatUser($user));

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Rechercher un employé dans la base RH SBEE avant la création du compte
     */
    public function searchEmploye(string $matricule)
    {
        $matricule = trim($matricule);

        if (User::where('matricule', $matricule)->exists()) {
            return response()->json([
                'message' => 'Un compte existe déjà pour ce matricule.',
            ], 409);
        }

        if (!$this->rh->isConfigured()) {
            return response()->json([
                'message' => 'Recherche RH non configurée (JDE_API_ENDPOINT).',
            ], 503);
        }

        $employe = $this->rh->getEmploye($matricule);

        if ($employe === RhApiService::CALL_EXCEPTION) {
            return response()->json([
                'message' => 'Serveur RH SBEE injoignable. Réessayez dans un instant.',
            ], 503);
        }

        if ($employe === false) {
            return response()->json([
                'message' => "Aucun employé trouvé avec le matricule : {$matricule}",
            ], 404);
        }

        return response()->json([
            'employe' => $employe,
        ]);
    }

    /**
     * Créer un utilisateur à partir de son matricule RH.
     * Nom, prénom, direction et poste viennent de l'API RH ; le mot de passe
     * est le mot de passe initial, à changer à la première connexion.
     */
    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();

        $employe = $this->rh->getEmploye($data['matricule']);

        if (!is_array($employe)) {
            return response()->json([
                'message' => self::MESSAGE_RH_INDISPONIBLE,
            ], 422);
        }

        $user = User::create([
            'matricule' => $data['matricule'],
            'nom' => $employe['nom'],
            'prenom' => $employe['prenom'],
            'direction' => $employe['direction'] ?: null,
            'titre_de_poste' => $employe['titre_de_poste'] ?: null,
            'email' => $data['email'] ?? null,
            'telephone' => $data['telephone'] ?? null,
            'role_id' => $data['role_id'],
            'is_active' => $data['is_active'] ?? true,
            'password' => Hash::make(User::MOT_DE_PASSE_INITIAL),
        ]);

        ActivityLog::log('create_user', "Utilisateur créé: {$user->matricule}");

        return response()->json([
            'message' => 'Utilisateur créé. Mot de passe initial : '.User::MOT_DE_PASSE_INITIAL.' - à changer à la première connexion.',
            'user' => $this->formatUser($user->load('role')),
        ], 201);
    }

    /**
     * Afficher un utilisateur
     */
    public function show(User $user)
    {
        return response()->json([
            'user' => $this->formatUser($user->load('role')),
        ]);
    }

    /**
     * Mettre à jour un utilisateur (email, téléphone, rôle, statut).
     * resync_rh=1 rafraîchit nom, prénom, direction et poste depuis l'API RH.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();
        $resyncRh = (bool) ($data['resync_rh'] ?? false);
        unset($data['resync_rh']);

        // Perte du rôle administrateur
        if (array_key_exists('role_id', $data) && $user->isAdmin()) {
            $newRole = Role::find($data['role_id']);
            if (!$newRole || $newRole->slug !== self::ADMIN_SLUG) {
                if ($error = $this->guardAdminRemoval($request, $user, 'retirer votre propre rôle administrateur', 'retirer le rôle du dernier administrateur actif')) {
                    return $error;
                }
            }
        }

        // Désactivation via le formulaire
        if (array_key_exists('is_active', $data) && !$data['is_active'] && $user->is_active) {
            if ($error = $this->guardAdminRemoval($request, $user, 'désactiver votre propre compte', 'désactiver le dernier administrateur actif')) {
                return $error;
            }
        }

        // Resynchronisation facultative de l'identité depuis le RH
        if ($resyncRh) {
            $employe = $this->rh->getEmploye($user->matricule);

            if (!is_array($employe)) {
                return response()->json([
                    'message' => self::MESSAGE_RH_INDISPONIBLE,
                ], 422);
            }

            $data['nom'] = $employe['nom'];
            $data['prenom'] = $employe['prenom'];
            $data['direction'] = $employe['direction'] ?: null;
            $data['titre_de_poste'] = $employe['titre_de_poste'] ?: null;
        }

        $user->update($data);

        ActivityLog::log('update_user', "Utilisateur mis à jour: {$user->matricule}");

        return response()->json([
            'message' => 'Utilisateur mis à jour avec succès',
            'user' => $this->formatUser($user->load('role')),
        ]);
    }

    /**
     * Réinitialiser le mot de passe au mot de passe initial.
     * L'utilisateur devra le changer à sa prochaine connexion ; ses sessions sont révoquées.
     */
    public function resetPassword(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            return response()->json([
                'message' => 'Vous ne pouvez pas réinitialiser votre propre mot de passe. Changez-le depuis votre profil.',
            ], 422);
        }

        $user->forceFill([
            'password' => Hash::make(User::MOT_DE_PASSE_INITIAL),
        ])->save();

        $user->tokens()->delete();

        ActivityLog::log('reset_password', "Mot de passe réinitialisé: {$user->matricule}");

        return response()->json([
            'message' => "Mot de passe réinitialisé. L'utilisateur devra le changer à sa prochaine connexion.",
        ]);
    }

    /**
     * Supprimer un utilisateur
     */
    public function destroy(Request $request, User $user)
    {
        if ($error = $this->guardAdminRemoval($request, $user, 'supprimer votre propre compte', 'supprimer le dernier administrateur actif')) {
            return $error;
        }

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
    public function toggleStatus(Request $request, User $user)
    {
        if ($user->is_active) {
            if ($error = $this->guardAdminRemoval($request, $user, 'désactiver votre propre compte', 'désactiver le dernier administrateur actif')) {
                return $error;
            }
        }

        $user->update(['is_active' => !$user->is_active]);

        // Un compte désactivé perd immédiatement toutes ses sessions
        if (!$user->is_active) {
            $user->tokens()->delete();
        }

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

    /**
     * Représentation d'un utilisateur dans l'administration (liste, détail, création, mise à jour)
     */
    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'matricule' => $user->matricule,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'email' => $user->email,
            'telephone' => $user->telephone,
            'direction' => $user->direction,
            'titre_de_poste' => $user->titre_de_poste,
            'role' => $user->role ? [
                'id' => $user->role->id,
                'name' => $user->role->name,
                'slug' => $user->role->slug,
            ] : null,
            'isActive' => $user->is_active,
            'needs_password_change' => $user->needs_password_change,
            'lastLoginAt' => $user->last_login_at?->format('Y-m-d H:i:s'),
            'createdAt' => $user->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Empêcher une action sur soi-même ou sur le dernier administrateur actif.
     * Renvoie une réponse 422 si l'action est interdite, null sinon.
     */
    private function guardAdminRemoval(Request $request, User $user, string $selfAction, string $lastAdminAction)
    {
        if ($request->user() && $request->user()->id === $user->id) {
            return response()->json([
                'message' => "Vous ne pouvez pas {$selfAction}.",
            ], 422);
        }

        if ($user->is_active && $user->isAdmin()) {
            $activeAdmins = User::where('is_active', true)
                ->whereHas('role', fn ($query) => $query->where('slug', self::ADMIN_SLUG))
                ->count();

            if ($activeAdmins <= 1) {
                return response()->json([
                    'message' => "Impossible de {$lastAdminAction}.",
                ], 422);
            }
        }

        return null;
    }
}
