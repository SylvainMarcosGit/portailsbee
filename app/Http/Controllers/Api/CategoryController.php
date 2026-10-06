<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\ActivityLog;
use App\Models\Category;

class CategoryController extends Controller
{
    /**
     * Liste des catégories (tout utilisateur connecté)
     */
    public function index()
    {
        $categories = Category::withCount('applications')
            ->orderBy('name')
            ->get()
            ->map(fn ($category) => $this->format($category));

        return response()->json([
            'categories' => $categories,
        ]);
    }

    /**
     * Créer une catégorie
     */
    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());

        ActivityLog::log('create_category', "Catégorie créée: {$category->name}");

        return response()->json([
            'message' => 'Catégorie créée avec succès',
            'category' => $this->format($category->loadCount('applications')),
        ], 201);
    }

    /**
     * Mettre à jour une catégorie
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());

        ActivityLog::log('update_category', "Catégorie mise à jour: {$category->name}");

        return response()->json([
            'message' => 'Catégorie mise à jour avec succès',
            'category' => $this->format($category->loadCount('applications')),
        ]);
    }

    /**
     * Supprimer une catégorie (refusé tant qu'elle contient des applications)
     */
    public function destroy(Category $category)
    {
        $count = $category->applications()->count();

        if ($count > 0) {
            return response()->json([
                'message' => "Cette catégorie contient {$count} application(s). Réattribuez-les avant de la supprimer.",
            ], 422);
        }

        $name = $category->name;
        $category->delete();

        ActivityLog::log('delete_category', "Catégorie supprimée: {$name}");

        return response()->json([
            'message' => 'Catégorie supprimée avec succès',
        ]);
    }

    /**
     * Format de réponse d'une catégorie
     */
    private function format(Category $category): array
    {
        return [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'applications_count' => (int) $category->applications_count,
        ];
    }
}
