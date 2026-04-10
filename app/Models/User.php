<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'email',
        'password',
        'role_id',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'is_active' => 'boolean',
            'password' => 'hashed',
        ];
    }

    /**
     * Relation avec le rôle
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Applications autorisées pour cet utilisateur
     */
    public function applications()
    {
        return $this->role ? $this->role->applications() : collect();
    }

    /**
     * Logs d'activité de l'utilisateur
     */
    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }

    /**
     * Vérifier si l'utilisateur est administrateur
     */
    public function isAdmin()
    {
        return $this->role && $this->role->slug === 'administrateur';
    }

    /**
     * Nom complet de l'utilisateur
     */
    public function getFullNameAttribute()
    {
        return "{$this->prenom} {$this->nom}";
    }
}
