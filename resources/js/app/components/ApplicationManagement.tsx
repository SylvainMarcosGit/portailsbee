import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash2, Search, ExternalLink, Package, CheckCircle, XCircle, Upload, Calendar, Building2, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
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
import api, { applicationsApi, rolesApi } from '@/services/api';

interface Application {
  id: number;
  name: string;
  url: string;
  description: string;
  category: string;
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
}

interface Role {
  id: number;
  name: string;
  slug: string;
}

export default function ApplicationManagement({ onBack }: ApplicationManagementProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tous');
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
    category: 'Technique',
    is_active: true,
    logo_url: '',
    version: '1.0.0',
    deployment_date: new Date().toISOString().split('T')[0],
    developed_by: '',
  });

  const categories = ['Tous', 'Technique', 'Finances', 'RH', 'Administration'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [appsResponse, rolesResponse] = await Promise.all([
        applicationsApi.getAllAdmin(),
        rolesApi.getAll(),
      ]);
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
    const matchesCategory = categoryFilter === 'Tous' || app.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddApplication = async () => {
    setIsSaving(true);
    try {
      const form = new FormData();
      form.append('name', formData.name);
      form.append('url', formData.url);
      form.append('description', formData.description);
      form.append('category', formData.category);
      form.append('version', formData.version);
      form.append('deployment_date', formData.deployment_date);
      form.append('developed_by', formData.developed_by);
      form.append('is_active', formData.is_active ? '1' : '0');

      if (logoFile) {
        form.append('logo', logoFile);
      }

      // Append roles
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
      category: app.category || 'Technique',
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
      form.append('category', formData.category);
      form.append('version', formData.version);
      form.append('deployment_date', formData.deployment_date);
      form.append('developed_by', formData.developed_by);
      form.append('is_active', formData.is_active ? '1' : '0');

      if (logoFile) {
        form.append('logo', logoFile);
      }

      // Append roles
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
      category: 'Technique',
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#3b5998] animate-spin" />
          <p className="text-gray-600">Chargement des applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour</span>
              </Button>
              <div className="flex items-center space-x-2">
                <Package className="w-6 h-6 text-[#3b5998]" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Gestion des Applications
                  </h1>
                  <p className="text-sm text-gray-500">{filteredApps.length} applications</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="bg-[#3b5998] hover:bg-[#2d4373] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Application
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher une application..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={categoryFilter === category ? "default" : "outline"}
                  className={`cursor-pointer ${categoryFilter === category
                    ? 'bg-[#3b5998] hover:bg-[#2d4373] text-white'
                    : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <Card key={app.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {app.logo_url ? (
                          <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.name}</h3>
                        <Badge variant="outline" className="text-xs mt-1">
                          <Tag className="w-3 h-3 mr-1" />
                          {app.category}
                        </Badge>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStatus(app.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${app.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                    >
                      {app.is_active ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Actif
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          Inactif
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {app.description || 'Aucune description'}
                  </p>

                  <div className="space-y-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Déployé le {app.deployment_date ? new Date(app.deployment_date).toLocaleDateString('fr-FR') : 'N/A'}
                    </div>
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 mr-2" />
                      {app.developed_by || 'Non spécifié'}
                    </div>
                    <div className="flex items-center">
                      <Tag className="w-4 h-4 mr-2" />
                      Version {app.version || '1.0.0'}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between">
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3b5998] hover:text-[#2d4373] text-sm font-medium flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ouvrir
                  </a>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEditApplication(app)}>
                      <Edit className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setAppToDelete(app.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucune application trouvée</p>
          </div>
        )}
      </main>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Application</DialogTitle>
            <DialogDescription>Ajoutez une nouvelle application au portail</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <Label htmlFor="logo-upload" className="cursor-pointer text-[#3b5998] hover:underline text-sm">
                Ajouter un logo
              </Label>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            <div>
              <Label>Nom de l'application</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Gestion Réseau"
              />
            </div>

            <div>
              <Label>URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'application..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b5998]"
                >
                  <option value="Technique">Technique</option>
                  <option value="Finances">Finances</option>
                  <option value="RH">RH</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de déploiement</Label>
                <Input
                  type="date"
                  value={formData.deployment_date}
                  onChange={(e) => setFormData({ ...formData, deployment_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Développé par</Label>
                <Input
                  value={formData.developed_by}
                  onChange={(e) => setFormData({ ...formData, developed_by: e.target.value })}
                  placeholder="Direction..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is-active">Application active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddApplication}
              disabled={isSaving || !formData.name || !formData.url}
              className="bg-[#3b5998] hover:bg-[#2d4373]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'Application</DialogTitle>
            <DialogDescription>Modifiez les informations de {selectedApp?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <Label htmlFor="logo-upload-edit" className="cursor-pointer text-[#3b5998] hover:underline text-sm">
                Changer le logo
              </Label>
              <input
                id="logo-upload-edit"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            <div>
              <Label>Nom de l'application</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Catégorie</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b5998]"
                >
                  <option value="Technique">Technique</option>
                  <option value="Finances">Finances</option>
                  <option value="RH">RH</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>
              <div>
                <Label>Version</Label>
                <Input
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date de déploiement</Label>
                <Input
                  type="date"
                  value={formData.deployment_date}
                  onChange={(e) => setFormData({ ...formData, deployment_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Développé par</Label>
                <Input
                  value={formData.developed_by}
                  onChange={(e) => setFormData({ ...formData, developed_by: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-active-edit"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is-active-edit">Application active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdateApplication}
              disabled={isSaving}
              className="bg-[#3b5998] hover:bg-[#2d4373]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!appToDelete} onOpenChange={() => setAppToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'application ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'application sera définitivement supprimée du portail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteApplication}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
