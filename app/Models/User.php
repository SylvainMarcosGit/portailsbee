<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Mot de passe attribué à la création d'un compte et lors d'une
     * réinitialisation par un administrateur. Tant que l'utilisateur le
     * conserve, needs_password_change vaut true et le middleware
     * password.changed bloque le reste de l'API.
     */
    public const MOT_DE_PASSE_INITIAL = '12345@SBEE';

    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'email',
        'telephone',
        'direction',
        'titre_de_poste',
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
        return $this->role && $this->role->slug === Role::SLUG_ADMIN;
    }

    /**
     * L'utilisateur utilise-t-il encore le mot de passe initial ?
     */
    public function getNeedsPasswordChangeAttribute(): bool
    {
        return Hash::check(self::MOT_DE_PASSE_INITIAL, $this->password);
    }

    /**
     * Nom complet de l'utilisateur
     */
    public function getFullNameAttribute()
    {
        return "{$this->prenom} {$this->nom}";
    }
}
