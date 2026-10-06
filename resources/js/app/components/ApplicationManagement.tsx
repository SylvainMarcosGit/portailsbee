import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Search, ExternalLink, Package, CheckCircle, XCircle, Upload, Calendar, Building2, Tag, Loader2 } from 'lucide-react';
import { Button, buttonVariants } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import api, { applicationsApi, rolesApi, categoriesApi, type Category } from '@/services/api';
import RequiredMark from '@/app/components/RequiredMark';

interface Application {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
  category_id: number;
  is_active: boolean;
  logo_url: string;
  version: string;
  deployment_date: string;
  developed_by: string;
  roles?: Array<{
    id: number;
    name: string;
  }>;
}

interface ApplicationManagementProps {
  onBack: () => void;
  onManageCategories?: () => void;
}

interface Role {
  id: number;
  name: string;
  slug: string;
}

export default function ApplicationManagement({ onBack, onManageCategories }: ApplicationManagementProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [appToDelete, setAppToDelete] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    category_id: '',
    is_active: true,
    logo_url: '',
    version: '1.0.0',
    deployment_date: new Date().toISOString().split('T')[0],
    developed_by: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appsResponse, rolesResponse, categoriesResponse] = await Promise.all([
        applicationsApi.getAllAdmin(),
        rolesApi.getAll(),
        categoriesApi.getAll(),
      ]);
      const categoriesData = categoriesResponse.data?.categories || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      const appsData = appsResponse.data?.applications || appsResponse.data?.data || [];
      const rolesData = rolesResponse.data?.data || rolesResponse.data || [];
      setApplications(Array.isArray(appsData) ? appsData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const response = await applicationsApi.getAllAdmin();
      const data = response.data?.applications || response.data?.data || [];
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const filteredApps = (applications || []).filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || app.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddApplication = async () => {
    setIsSaving(true);
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('url', formData.url);
      form.append('description', formData.description);
      form.append('category_id', formData.category_id);
      form.append('version', formData.version);
      form.append('deployment_date', formData.deployment_date);
      form.append('developed_by', formData.developed_by);
      form.append('is_active', formData.is_active ? '1' : '0');

      if (logoFile) {
        form.append('logo', logoFile);
      }

      // Rôles autorisés : synchronisation systématique (0..n rôles)
      form.append('sync_roles', '1');
      selectedRoleIds.forEach(id => {
        form.append('role_ids[]', id.toString());
      });

      await api.post('/admin/applications', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Application ajoutée avec succès');
      setIsAddModalOpen(false);
      resetForm();
      loadApplications();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditApplication = (app: Application) => {
    setSelectedApp(app);
    setFormData({
      name: app.name,
      url: app.url,
      description: app.description || '',
      category_id: app.category_id != null ? String(app.category_id) : (categories[0] ? String(categories[0].id) : ''),
      is_active: app.is_active,
      logo_url: app.logo_url || '',
      version: app.version || '1.0.0',
      deployment_date: app.deployment_date || new Date().toISOString().split('T')[0],
      developed_by: app.developed_by || '',
    });
    setLogoPreview(app.logo_url || '');

    // Set selected roles from app.roles
    if (app.roles && app.roles.length > 0) {
      const ids = app.roles.map(r => r.id);
      setSelectedRoleIds(ids);
    } else {
      setSelectedRoleIds([]);
    }

    setIsEditModalOpen(true);
  };

  const handleUpdateApplication = async () => {
    if (!selectedApp) return;
    setIsSaving(true);
    try {
      const form = new FormData();
      form.append('_method', 'PUT'); // Méthode spoofing pour Laravel
      form.append('name', formData.name);
      form.append('url', formData.url);
      form.append('description', formData.description);
      form.append('category_id', formData.category_id);
      form.append('version', formData.version);
      form.append('deployment_date', formData.deployment_date);
      form.append('developed_by', formData.developed_by);
      form.append('is_active', formData.is_active ? '1' : '0');

      if (logoFile) {
        form.append('logo', logoFile);
      }

      // Rôles autorisés : synchronisation systématique (0..n rôles)
      form.append('sync_roles', '1');
      selectedRoleIds.forEach(id => {
        form.append('role_ids[]', id.toString());
      });

      await api.post(`/admin/applications/${selectedApp.id}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Application mise à jour avec succès');
      setIsEditModalOpen(false);
      setSelectedApp(null);
      resetForm();
      loadApplications();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteApplication = async () => {
    if (!appToDelete) return;
    try {
      await applicationsApi.delete(appToDelete);
      toast.success('Application supprimée avec succès');
      setAppToDelete(null);
      loadApplications();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      await applicationsApi.toggleStatus(id);
      toast.success('Statut modifié avec succès');
      loadApplications();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      category_id: categories[0] ? String(categories[0].id) : '',
      is_active: true,
      logo_url: '',
      version: '1.0.0',
      deployment_date: new Date().toISOString().split('T')[0],
      developed_by: '',
    });
    setLogoFile(null);
    setLogoPreview('');
    setSelectedRoleIds([]);
  };

  const toggleRole = (roleId: number, checked: boolean) => {
    setSelectedRoleIds((prev) =>
      checked ? (prev.includes(roleId) ? prev : [...prev, roleId]) : prev.filter((id) => id !== roleId)
    );
  };

  const isFormValid =
    formData.name.trim() !== '' &&
    formData.url.trim() !== '' &&
    formData.category_id !== '' &&
    formData.developed_by.trim() !== '' &&
    formData.deployment_date !== '';

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalCount = applications.length;
  const activeCount = applications.filter(a => a.is_active).length;
  const inactiveCount = totalCount - activeCount;
  const categoryCount = categories.length;

  const kpis = [
    { label: 'Applications', value: totalCount, icon: Package },
    { label: 'Actives', value: activeCount, icon: CheckCircle },
    { label: 'Inactives', value: inactiveCount, icon: XCircle },
    { label: 'Catégories', value: categoryCount, icon: Tag },
  ];

  const selectClassName =
    'w-full h-10 px-3 text-sm bg-surface text-foreground border border-border-strong rounded-sm focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50';

  const renderFormFields = (suffix: string, withPlaceholders: boolean) => (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-sm bg-surface-3 border border-dashed border-border-strong flex items-center justify-center overflow-hidden flex-shrink-0">
          {logoPreview ? (
            <img src={logoPreview} alt="Aperçu du logo" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
          )}
        </div>
        <div>
          <Label
            htmlFor={`logo-upload${suffix}`}
            className="cursor-pointer text-sm font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            {logoPreview ? 'Changer le logo' : 'Ajouter un logo'}
          </Label>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou WEBP, 2 Mo max</p>
        </div>
        <input
          id={`logo-upload${suffix}`}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleLogoChange}
          className="hidden"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`app-name${suffix}`}>Nom de l'application<RequiredMark /></Label>
        <Input
          id={`app-name${suffix}`} aria-required="true"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={withPlaceholders ? 'Ex. : Gestion réseau' : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`app-url${suffix}`}>URL<RequiredMark /></Label>
        <Input
          id={`app-url${suffix}`} aria-required="true"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder={withPlaceholders ? 'https://…' : undefined}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`app-description${suffix}`}>Description</Label>
        <Textarea
          id={`app-description${suffix}`}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={withPlaceholders ? "À quoi sert l'application, pour qui" : undefined}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`app-category${suffix}`}>Catégorie<RequiredMark /></Label>
          {categories.length > 0 ? (
            <select
              id={`app-category${suffix}`} aria-required="true"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={selectClassName}
            >
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-muted-foreground border border-border rounded-sm bg-surface-2 px-3 py-2">
              <p>Aucune catégorie disponible.</p>
              {onManageCategories ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    onManageCategories();
                  }}
                  className="mt-1 font-medium text-foreground underline underline-offset-4 hover:no-underline"
                >
                  Créer une catégorie
                </button>
              ) : (
                <p className="mt-1">Créez d'abord une catégorie dans le menu Catégories.</p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`app-version${suffix}`}>Version</Label>
          <Input
            id={`app-version${suffix}`}
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder={withPlaceholders ? '1.0.0' : undefined}
            className="num"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`app-date${suffix}`}>Date de déploiement<RequiredMark /></Label>
          <Input
            id={`app-date${suffix}`} aria-required="true"
            type="date"
            value={formData.deployment_date}
            onChange={(e) => setFormData({ ...formData, deployment_date: e.target.value })}
            className="num"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`app-dev${suffix}`}>Développé par<RequiredMark /></Label>
          <Input
            id={`app-dev${suffix}`} aria-required="true"
            value={formData.developed_by}
            onChange={(e) => setFormData({ ...formData, developed_by: e.target.value })}
            placeholder={withPlaceholders ? 'Ex. : Direction des systèmes d’information' : undefined}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Switch
          id={`is-active${suffix}`}
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor={`is-active${suffix}`}>Visible dans le portail</Label>
      </div>

      <fieldset className="space-y-2 pt-2">
        <legend className="text-sm font-medium text-foreground">Rôles autorisés</legend>
        <p className="text-xs text-muted-foreground">
          Les agents de ces rôles verront l'application dans leur portail.
        </p>
        {roles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-border rounded-sm bg-surface-2 p-3 max-h-48 overflow-y-auto">
            {roles.map((role) => {
              const checkboxId = `role-${role.id}${suffix}`;
              return (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={checkboxId}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                  />
                  <Label htmlFor={checkboxId} className="font-normal cursor-pointer">
                    {role.name}
                  </Label>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun rôle disponible.</p>
        )}
      </fieldset>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-sbee-red animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des applications…</p>
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
            <h1 className="text-2xl font-semibold text-foreground">Applications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Catalogue des applications proposées dans le portail
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
          className="sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Ajouter une application
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 lg:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" strokeWidth={1.5} />
          <Input
            type="text"
            placeholder="Rechercher par nom ou description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Rechercher une application"
          />
        </div>
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filtrer par catégorie">
          {[{ id: 'all' as const, name: 'Toutes' }, ...categories].map((category) => {
            const isActive = categoryFilter === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryFilter(category.id)}
                aria-pressed={isActive}
                className={`h-9 px-3 rounded-sm border text-sm font-medium transition-colors duration-[120ms] ${
                  isActive
                    ? 'bg-foreground text-white border-foreground'
                    : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground lg:ml-auto">
          <span className="num">{filteredApps.length}</span> sur <span className="num">{totalCount}</span>
        </p>
      </div>

      {/* Tableau */}
      {filteredApps.length > 0 ? (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Application</th>
                  <th className="text-left px-4 py-3">Catégorie</th>
                  <th className="text-left px-4 py-3">Éditeur</th>
                  <th className="text-right px-4 py-3">Version</th>
                  <th className="text-right px-4 py-3">Déploiement</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    className="h-12 border-t border-border hover:bg-surface-2 transition-colors duration-[120ms]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <div className="w-10 h-10 rounded-sm bg-surface-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {app.logo_url ? (
                            <img src={app.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{app.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                            {app.description || 'Sans description'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{app.category || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="w-4 h-4" strokeWidth={1.5} />
                        {app.developed_by || 'Non renseigné'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right num text-foreground whitespace-nowrap">
                      {app.version || '1.0.0'}
                    </td>
                    <td className="px-4 py-3 text-right num text-muted-foreground whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4" strokeWidth={1.5} />
                        {app.deployment_date ? new Date(app.deployment_date).toLocaleDateString('fr-FR') : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <Switch
                          checked={app.is_active}
                          onCheckedChange={() => toggleStatus(app.id)}
                          aria-label={app.is_active ? `Désactiver ${app.name}` : `Activer ${app.name}`}
                        />
                        {app.is_active ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="muted">Inactive</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Ouvrir ${app.name} dans un nouvel onglet`}
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditApplication(app)}
                          aria-label={`Modifier ${app.name}`}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAppToDelete(app.id)}
                          aria-label={`Supprimer ${app.name}`}
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
        <div className="bg-surface border border-border rounded-lg px-6 py-12 flex flex-col items-center text-center">
          <Package className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-base font-medium text-foreground mt-4">
            {totalCount === 0 ? 'Aucune application dans le catalogue' : 'Aucune application ne correspond à ces filtres'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount === 0
              ? 'Ajoutez la première application pour la rendre accessible depuis le portail.'
              : 'Modifiez la recherche ou choisissez une autre catégorie.'}
          </p>
          {totalCount === 0 ? (
            <Button
              className="mt-6"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              Ajouter une application
            </Button>
          ) : (
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      )}

      {/* Modale d'ajout */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une application</DialogTitle>
            <DialogDescription>Elle apparaîtra dans le portail pour les rôles autorisés.</DialogDescription>
          </DialogHeader>
          {renderFormFields('', true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddApplication}
              disabled={isSaving || !isFormValid}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Créer l'application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de modification */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'application</DialogTitle>
            <DialogDescription>Informations de {selectedApp?.name}</DialogDescription>
          </DialogHeader>
          {renderFormFields('-edit', false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateApplication} disabled={isSaving || !isFormValid}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enregistrer l'application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog open={!!appToDelete} onOpenChange={() => setAppToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette application ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle sera retirée du portail pour tous les rôles. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteApplication}
              className={buttonVariants({ variant: 'destructive' })}
            >
              Supprimer l'application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
