<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'url',
        'description',
        'category_id',
        'logo',
        'version',
        'deployment_date',
        'developed_by',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'deployment_date' => 'date:Y-m-d',
    ];

    /**
     * Catégorie de l'application
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Rôles autorisés pour cette application
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'application_role')
                    ->withTimestamps();
    }

    /**
     * URL du logo (chemin relatif, indépendant de APP_URL)
     */
    public function getLogoUrlAttribute()
    {
        if ($this->logo) {
            return '/storage/' . ltrim($this->logo, '/');
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
    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Représentation API : attributs du modèle + `category` = nom de la catégorie
     * (la relation `category` doit être chargée pour éviter le N+1)
     */
    public function toApiArray(): array
    {
        return array_merge($this->toArray(), [
            'category_id' => $this->category_id,
            'category' => $this->category?->name,
        ]);
    }
}
