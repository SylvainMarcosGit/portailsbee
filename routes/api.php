<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes publiques (5 tentatives de connexion par minute)
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Routes protégées (token valide + compte actif)
Route::middleware(['auth:sanctum', 'active'])->group(function () {

    // Accessibles même avec le mot de passe initial (première connexion)
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    // Tout le reste exige que le mot de passe initial ait été changé
    Route::middleware('password.changed')->group(function () {

        // Profil utilisateur
        Route::put('/profile', [AuthController::class, 'updateProfile']);

        // Dashboard utilisateur
        Route::get('/dashboard/user', [DashboardController::class, 'userStats']);

        // Applications - Routes utilisateur
        Route::get('/applications', [ApplicationController::class, 'index']);
        Route::get('/applications/{application}/access', [ApplicationController::class, 'access']);

        // Catégories - Lecture (tout utilisateur connecté)
        Route::get('/categories', [CategoryController::class, 'index']);

        // Routes réservées aux administrateurs
        Route::middleware('admin')->group(function () {

            // Dashboard admin
            Route::get('/dashboard/admin', [DashboardController::class, 'adminStats']);

            // Applications - Routes admin
            Route::get('/admin/applications', [ApplicationController::class, 'all']);
            Route::post('/admin/applications', [ApplicationController::class, 'store']);
            Route::get('/admin/applications/{application}', [ApplicationController::class, 'show']);
            Route::put('/admin/applications/{application}', [ApplicationController::class, 'update']);
            Route::delete('/admin/applications/{application}', [ApplicationController::class, 'destroy']);
            Route::patch('/admin/applications/{application}/toggle', [ApplicationController::class, 'toggleStatus']);

            // Catégories - Routes admin
            Route::post('/admin/categories', [CategoryController::class, 'store']);
            Route::put('/admin/categories/{category}', [CategoryController::class, 'update']);
            Route::delete('/admin/categories/{category}', [CategoryController::class, 'destroy']);

            // Recherche d'un employé dans la base RH SBEE (JD Edwards)
            Route::get('/admin/employes/{matricule}', [UserController::class, 'searchEmploye']);

            // Utilisateurs - Routes admin
            Route::get('/admin/users', [UserController::class, 'index']);
            Route::get('/admin/users/stats', [UserController::class, 'stats']);
            Route::post('/admin/users', [UserController::class, 'store']);
            Route::get('/admin/users/{user}', [UserController::class, 'show']);
            Route::put('/admin/users/{user}', [UserController::class, 'update']);
            Route::delete('/admin/users/{user}', [UserController::class, 'destroy']);
            Route::patch('/admin/users/{user}/toggle', [UserController::class, 'toggleStatus']);
            Route::post('/admin/users/{user}/reset-password', [UserController::class, 'resetPassword']);

            // Rôles
            Route::get('/roles', [RoleController::class, 'index']);
            Route::post('/roles', [RoleController::class, 'store']);
            Route::get('/roles/{role}', [RoleController::class, 'show']);
            Route::put('/roles/{role}', [RoleController::class, 'update']);
            Route::delete('/roles/{role}', [RoleController::class, 'destroy']);
            Route::put('/roles/{role}/applications', [RoleController::class, 'updateApplications']);

            // Logs d'activité - Routes admin
            Route::get('/admin/activity-logs', [ActivityLogController::class, 'index']);
            Route::get('/admin/activity-logs/stats', [ActivityLogController::class, 'stats']);
        });
    });
});
