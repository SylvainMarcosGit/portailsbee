<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'url',
        'description',
        'category',
        'logo',
        'version',
        'deployment_date',
        'developed_by',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'deployment_date' => 'date',
    ];

    /**
     * Rôles autorisés pour cette application
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'application_role')
                    ->withTimestamps();
    }

    /**
     * URL complète du logo
     */
    public function getLogoUrlAttribute()
    {
        if ($this->logo) {
            return Storage::url($this->logo);
        }
        return null;
    }

    /**
     * Scope pour les applications actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope par catégorie
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}
