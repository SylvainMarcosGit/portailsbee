<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

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
