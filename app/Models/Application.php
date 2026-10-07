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
        'sso_mode',
        'login_url_pattern',
        'identifier_type',
        'username_selector',
        'password_selector',
        'submit_selector',
    ];

    /**
     * Modes de connexion par l'extension SBEE : aucun, remplissage, remplissage + validation
     */
    public const SSO_MODES = ['none', 'fill', 'fill_submit'];

    /**
     * Nature de l'identifiant attendu par l'application
     */
    public const IDENTIFIER_TYPES = ['email', 'matricule', 'username', 'autre'];

    /**
     * Champs du remplissage automatique (extension SBEE), renvoyés dans toutes les réponses application
     */
    public const SSO_FIELDS = [
        'sso_mode',
        'login_url_pattern',
        'identifier_type',
        'username_selector',
        'password_selector',
        'submit_selector',
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
     * Identifiants enregistrés par les utilisateurs (coffre)
     */
    public function credentials()
    {
        return $this->hasMany(AppCredential::class);
    }

    /**
     * Champs du remplissage automatique (mode, motif d'URL, type d'identifiant, sélecteurs)
     */
    public function ssoAttributes(): array
    {
        $attributes = [];
        foreach (self::SSO_FIELDS as $field) {
            $attributes[$field] = $this->{$field};
        }

        return $attributes;
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
        return array_merge($this->toArray(), $this->ssoAttributes(), [
            'category_id' => $this->category_id,
            'category' => $this->category?->name,
        ]);
    }
}
