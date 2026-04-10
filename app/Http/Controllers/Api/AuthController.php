<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
                'matricule' => ['Votre compte a été désactivé.'],
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
            'user' => [
                'id' => $user->id,
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'role' => [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ],
                'is_admin' => $user->isAdmin(),
            ],
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
            'user' => [
                'id' => $user->id,
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'role' => [
                    'id' => $user->role->id,
                    'name' => $user->role->name,
                    'slug' => $user->role->slug,
                ],
                'is_admin' => $user->isAdmin(),
                'is_active' => $user->is_active,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    /**
     * Changer le mot de passe
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
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

        // Enregistrer l'activité
        ActivityLog::log('password_change', 'Changement de mot de passe');

        return response()->json([
            'message' => 'Mot de passe modifié avec succès.',
        ]);
    }
}
