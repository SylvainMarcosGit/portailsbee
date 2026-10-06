<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * Slug généré automatiquement depuis le nom (création et modification)
     */
    protected static function booted(): void
    {
        static::saving(function (Category $category) {
            if ($category->isDirty('name') || empty($category->slug)) {
                $category->slug = Str::slug($category->name);
            }
        });
    }

    /**
     * Applications de cette catégorie
     */
    public function applications()
    {
        return $this->hasMany(Application::class);
    }
}
