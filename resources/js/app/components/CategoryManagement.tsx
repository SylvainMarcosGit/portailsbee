import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Search, Tags, Package, FolderOpen, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';
import { categoriesApi, type Category } from '@/services/api';
import RequiredMark from '@/app/components/RequiredMark';

interface CategoryManagementProps {
  onBack: () => void;
}

const NAME_MAX = 100;

// Message serveur (422 : message ou première erreur de validation)
const getErrorMessage = (error: any, fallback: string): string => {
  const data = error?.response?.data;
  const errors = data?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
  }
  return data?.message || fallback;
};

const emptyForm = { name: '', description: '' };

export default function CategoryManagement({ onBack }: CategoryManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCategories(true);
  }, []);

  const loadCategories = async (withLoader = false) => {
    if (withLoader) setIsLoading(true);
    try {
      const response = await categoriesApi.getAll();
      const data = response.data?.categories || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Impossible de charger les catégories pour le moment. Réessayez dans quelques instants.');
    } finally {
      if (withLoader) setIsLoading(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(query)
  );

  const totalCount = categories.length;
  const classifiedCount = categories.reduce((sum, c) => sum + (c.applications_count || 0), 0);
  const emptyCount = categories.filter((c) => !c.applications_count).length;

  const kpis = [
    { label: 'Catégories', value: totalCount, icon: Tags },
    { label: 'Applications classées', value: classifiedCount, icon: Package },
    { label: 'Catégories vides', value: emptyCount, icon: FolderOpen },
  ];

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || '' });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFormError('');
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
    };
    try {
      if (editingCategory) {
        const response = await categoriesApi.update(editingCategory.id, payload);
        toast.success(response.data?.message || 'Catégorie mise à jour');
      } else {
        const response = await categoriesApi.create(payload);
        toast.success(response.data?.message || 'Catégorie créée');
      }
      setIsFormOpen(false);
      setEditingCategory(null);
      setFormData(emptyForm);
      loadCategories();
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error);
      const message = getErrorMessage(
        error,
        editingCategory ? 'La catégorie n’a pas pu être mise à jour.' : 'La catégorie n’a pas pu être créée.'
      );
      if (error?.response?.status === 422) {
        setFormError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = (category: Category) => {
    setDeleteError('');
    setCategoryToDelete(category);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setCategoryToDelete(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const response = await categoriesApi.delete(categoryToDelete.id);
      toast.success(response.data?.message || 'Catégorie supprimée');
      setCategoryToDelete(null);
      loadCategories();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const message = getErrorMessage(error, 'La catégorie n’a pas pu être supprimée.');
      if (error?.response?.status === 422) {
        setDeleteError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const isFormValid = formData.name.trim() !== '' && formData.name.length <= NAME_MAX;
  const deleteAppsCount = categoryToDelete?.applications_count || 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-sbee-red animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des catégories…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bandeau */}
      <div className="bg-surface border border-border rounded-lg rail-accent px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            aria-label="Retour"
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Catégories</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Regroupez les applications du portail par domaine métier
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="sm:self-center">
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-surface border border-border rounded-lg rail-accent p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-semibold num text-foreground mt-2">{value}</p>
          </div>
        ))}
      </div>

      {totalCount === 0 ? (
        /* État vide : aucune catégorie */
        <div className="bg-surface border border-border rounded-lg px-6 py-12 flex flex-col items-center text-center">
          <Tags className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-base font-medium text-foreground mt-4">
            Aucune catégorie. Créez la première pour classer les applications.
          </p>
          <Button variant="outline" className="mt-6" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Créer une catégorie
          </Button>
        </div>
      ) : (
        <>
          {/* Recherche */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" strokeWidth={1.5} />
              <Input
                type="text"
                placeholder="Rechercher par nom"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="Rechercher une catégorie"
              />
            </div>
            <p className="text-sm text-muted-foreground sm:ml-auto">
              <span className="num">{filteredCategories.length}</span> sur <span className="num">{totalCount}</span>
            </p>
          </div>

          {filteredCategories.length > 0 ? (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-3">Catégorie</th>
                      <th className="text-left px-4 py-3">Description</th>
                      <th className="text-right px-4 py-3">Applications</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="h-12 border-t border-border hover:bg-surface-2 transition-colors duration-[120ms]"
                      >
                        <td className="px-4 py-3">
                          <div className="min-w-[180px]">
                            <p className="font-medium text-foreground">{category.name}</p>
                            <p className="text-xs text-muted-foreground">{category.slug}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <p className="line-clamp-2 max-w-md min-w-[200px]">{category.description || '-'}</p>
                        </td>
                        <td className="px-4 py-3 text-right num text-foreground whitespace-nowrap">
                          {category.applications_count}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(category)}
                              aria-label={`Modifier ${category.name}`}
                            >
                              <Edit className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(category)}
                              aria-label={`Supprimer ${category.name}`}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* État vide : aucun résultat de recherche */
            <div className="bg-surface border border-border rounded-lg px-6 py-12 flex flex-col items-center text-center">
              <Search className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-base font-medium text-foreground mt-4">
                Aucune catégorie ne correspond à cette recherche
              </p>
              <p className="text-sm text-muted-foreground mt-1">Modifiez le terme recherché.</p>
              <Button variant="outline" className="mt-6" onClick={() => setSearchQuery('')}>
                Effacer la recherche
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modale création / édition */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSaving) setIsFormOpen(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? `Informations de ${editingCategory.name}`
                : 'Elle servira à classer les applications du portail.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="category-name">Nom<RequiredMark /></Label>
                <span
                  className={`text-xs num ${formData.name.length > NAME_MAX ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
                  aria-live="polite"
                >
                  {formData.name.length}/{NAME_MAX}
                </span>
              </div>
              <Input
                id="category-name"
                value={formData.name}
                maxLength={NAME_MAX}
                required
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setFormError('');
                }}
                placeholder="Ex. : Exploitation réseau"
                aria-invalid={formError ? true : undefined}
                aria-describedby={formError ? 'category-form-error' : undefined}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">
                Description
              </Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Le domaine métier couvert par cette catégorie"
                rows={3}
              />
            </div>
            {formError && (
              <p
                id="category-form-error"
                role="alert"
                className="text-sm text-foreground bg-warning-soft border border-border rounded-sm px-3 py-2"
              >
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !isFormValid}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingCategory ? 'Enregistrer la catégorie' : 'Créer la catégorie'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => { if (!open) closeDeleteDialog(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la catégorie {categoryToDelete?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAppsCount > 0 ? (
                <>
                  Cette catégorie contient <span className="num">{deleteAppsCount}</span> application(s).
                  Réattribuez-les à une autre catégorie avant de la supprimer.
                </>
              ) : (
                'Elle ne contient aucune application. Cette action est irréversible.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-foreground bg-warning-soft border border-border rounded-sm px-3 py-2">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting || deleteAppsCount > 0}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Supprimer la catégorie
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
