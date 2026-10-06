<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Connexion de l'utilisateur
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('matricule', $request->matricule)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'matricule' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'matricule' => ["Votre compte est désactivé. Contactez l'administrateur du portail."],
            ]);
        }

        // Mettre à jour la dernière connexion
        $user->update(['last_login_at' => now()]);

        // Enregistrer l'activité
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'description' => 'Connexion réussie',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'created_at' => now(),
        ]);

        // Créer le token
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie',
            'user' => $this->formatUser($user),
            'token' => $token,
        ]);
    }

    /**
     * Déconnexion de l'utilisateur
     */
    public function logout(Request $request)
    {
        // Enregistrer l'activité
        ActivityLog::log('logout', 'Déconnexion');

        // Révoquer le token actuel
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie',
        ]);
    }

    /**
     * Obtenir l'utilisateur authentifié
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $user->load('role');

        return response()->json([
            'user' => $this->formatUser($user),
        ]);
    }

    /**
     * Mettre à jour le profil (email)
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ], [
            'email.required' => "L'email est requis.",
            'email.email' => "L'email n'est pas valide.",
            'email.unique' => 'Cet email est déjà utilisé par un autre compte.',
        ]);

        $user->update([
            'email' => $request->email,
        ]);

        // Enregistrer l'activité
        ActivityLog::log('update_profile', 'Mise à jour du profil');

        return response()->json([
            'message' => 'Profil mis à jour avec succès.',
            'user' => $this->formatUser($user->load('role')),
        ]);
    }

    /**
     * Changer le mot de passe
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'different:current_password',
                Rule::notIn([User::MOT_DE_PASSE_INITIAL]),
            ],
        ], [
            'password.different' => 'Le nouveau mot de passe doit être différent du mot de passe actuel.',
            'password.not_in' => 'Le nouveau mot de passe ne peut pas être le mot de passe initial.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Révoquer les autres sessions (tous les tokens sauf le courant)
        $currentTokenId = $user->currentAccessToken()?->id;
        $user->tokens()
            ->when($currentTokenId, fn ($query) => $query->where('id', '!=', $currentTokenId))
            ->delete();

        // Enregistrer l'activité
        ActivityLog::log('password_change', 'Changement de mot de passe');

        return response()->json([
            'message' => 'Mot de passe modifié avec succès.',
            'user' => $this->formatUser($user->load('role')),
        ]);
    }

    /**
     * Représentation de l'utilisateur renvoyée au front (login, me, profil)
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
            'is_admin' => $user->isAdmin(),
            'is_active' => $user->is_active,
            'needs_password_change' => $user->needs_password_change,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
