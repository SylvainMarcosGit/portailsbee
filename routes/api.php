<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Routes publiques
Route::post('/login', [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentification
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Profil utilisateur
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard/admin', [DashboardController::class, 'adminStats']);
    Route::get('/dashboard/user', [DashboardController::class, 'userStats']);

    // Applications - Routes utilisateur
    Route::get('/applications', [ApplicationController::class, 'index']);
    Route::get('/applications/{application}/access', [ApplicationController::class, 'access']);

    // Applications - Routes admin
    Route::get('/admin/applications', [ApplicationController::class, 'all']);
    Route::post('/admin/applications', [ApplicationController::class, 'store']);
    Route::get('/admin/applications/{application}', [ApplicationController::class, 'show']);
    Route::put('/admin/applications/{application}', [ApplicationController::class, 'update']);
    Route::delete('/admin/applications/{application}', [ApplicationController::class, 'destroy']);
    Route::patch('/admin/applications/{application}/toggle', [ApplicationController::class, 'toggleStatus']);

    // Utilisateurs - Routes admin
    Route::get('/admin/users', [UserController::class, 'index']);
    Route::get('/admin/users/stats', [UserController::class, 'stats']);
    Route::post('/admin/users', [UserController::class, 'store']);
    Route::get('/admin/users/{user}', [UserController::class, 'show']);
    Route::put('/admin/users/{user}', [UserController::class, 'update']);
    Route::delete('/admin/users/{user}', [UserController::class, 'destroy']);
    Route::patch('/admin/users/{user}/toggle', [UserController::class, 'toggleStatus']);

    // Rôles
    Route::get('/roles', [RoleController::class, 'index']);
    Route::get('/roles/{role}', [RoleController::class, 'show']);
    Route::put('/roles/{role}/applications', [RoleController::class, 'updateApplications']);

    // Logs d'activité - Routes admin
    Route::get('/admin/activity-logs', [ActivityLogController::class, 'index']);
    Route::get('/admin/activity-logs/stats', [ActivityLogController::class, 'stats']);
});
