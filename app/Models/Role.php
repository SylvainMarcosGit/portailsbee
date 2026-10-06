<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Role extends Model
{
    use HasFactory;

    /**
     * Slug du rôle système administrateur (cf. User::isAdmin())
     */
    public const SLUG_ADMIN = 'administrateur';

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * Slug généré depuis le nom (création sans slug explicite, et à chaque
     * changement de nom) - sauf pour le rôle système, dont le slug est figé
     */
    protected static function booted(): void
    {
        static::saving(function (Role $role) {
            if ($role->exists && $role->getOriginal('slug') === self::SLUG_ADMIN) {
                $role->slug = self::SLUG_ADMIN;

                return;
            }

            if (empty($role->slug) || ($role->exists && $role->isDirty('name'))) {
                $role->slug = Str::slug($role->name);
            }
        });
    }

    /**
     * Rôle système (non supprimable, slug non modifiable)
     */
    public function isSystem(): bool
    {
        return $this->slug === self::SLUG_ADMIN;
    }

    /**
     * Utilisateurs ayant ce rôle
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Applications autorisées pour ce rôle
     */
    public function applications()
    {
        return $this->belongsToMany(Application::class, 'application_role')
                    ->withTimestamps();
    }
}
