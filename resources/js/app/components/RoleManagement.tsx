import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Plus, Edit, Pencil, Trash2, Save, X, Users, Package, Loader2, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from 'sonner';
import { rolesApi, applicationsApi, type Role as ApiRole } from '@/services/api';
import RequiredMark from '@/app/components/RequiredMark';

interface Application {
  id: number;
  name: string;
  category: string;
  is_active: boolean;
}

type Role = Omit<ApiRole, 'applications'> & {
  applications?: Application[];
};

interface RoleManagementProps {
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

interface AppChecklistProps {
  idPrefix: string;
  apps: Application[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

// Liste d'applications à cocher (modale d'accès et modale de création)
function AppChecklist({ idPrefix, apps, selectedIds, onToggle, onSelectAll, onClear }: AppChecklistProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <p className="text-sm font-medium text-foreground">
          <span className="num">{selectedIds.length}</span> sur{' '}
          <span className="num">{apps.length}</span> applications actives
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onSelectAll}>
            Tout cocher
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Tout décocher
          </Button>
        </div>
      </div>

      {apps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-1">
          {apps.map((app) => {
            const checked = selectedIds.includes(app.id);
            const inputId = `${idPrefix}-${app.id}`;
            return (
              <div
                key={app.id}
                className={`flex items-center gap-3 min-h-12 px-3 py-2 rounded-sm border cursor-pointer transition-colors duration-[120ms] ${
                  checked
                    ? 'border-border-strong bg-surface-3'
                    : 'border-border bg-surface hover:bg-surface-2'
                }`}
                onClick={() => onToggle(app.id)}
              >
                <Checkbox
                  id={inputId}
                  checked={checked}
                  onCheckedChange={() => onToggle(app.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={inputId}
                    className="cursor-pointer text-sm font-medium text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {app.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">{app.category}</p>
                </div>
                {checked && <Check className="w-4 h-4 text-success" strokeWidth={2} />}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center py-8">
          <Package className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground mt-4">Aucune application active</p>
          <p className="text-sm text-muted-foreground mt-1">
            Activez une application dans le catalogue pour pouvoir l'attribuer.
          </p>
        </div>
      )}
    </>
  );
}

export default function RoleManagement({ onBack }: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modale d'attribution des accès
  const [isSaving, setIsSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);

  // Modale création / édition du rôle
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formAppIds, setFormAppIds] = useState<number[]>([]);
  const [formError, setFormError] = useState('');
  const [isFormSaving, setIsFormSaving] = useState(false);

  // Suppression
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData(true);
  }, []);

  const loadData = async (withLoader = false) => {
    if (withLoader) setIsLoading(true);
    try {
      const [rolesResponse, appsResponse] = await Promise.all([
        rolesApi.getAll(),
        applicationsApi.getAllAdmin(),
      ]);

      const rolesData = rolesResponse.data?.data || rolesResponse.data || [];
      const appsData = appsResponse.data?.applications || appsResponse.data?.data || [];

      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Impossible de charger les rôles pour le moment. Réessayez dans quelques instants.');
    } finally {
      if (withLoader) setIsLoading(false);
    }
  };

  const handleEditRole = async (role: Role) => {
    setSelectedRole(role);
    // Récupérer les détails du rôle avec ses applications
    try {
      const response = await rolesApi.getOne(role.id);
      const roleData = response.data?.role || response.data;
      const appIds = roleData.applications?.map((app: Application) => app.id) || [];
      setSelectedAppIds(appIds);
    } catch (error) {
      // Fallback: utiliser les applications du rôle si déjà chargées
      const appIds = role.applications?.map(app => app.id) || [];
      setSelectedAppIds(appIds);
    }
    setIsEditModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const response = await rolesApi.updateApplications(selectedRole.id, selectedAppIds);
      toast.success(response.data?.message || 'Accès aux applications mis à jour');
      setIsEditModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(getErrorMessage(error, 'Les accès n’ont pas pu être mis à jour.'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAppAccess = (appId: number) => {
    setSelectedAppIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const toggleFormApp = (appId: number) => {
    setFormAppIds(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  // Création / édition
  const openCreateModal = () => {
    setEditingRole(null);
    setFormData(emptyForm);
    setFormAppIds([]);
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description || '' });
    setFormAppIds([]);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveRole = async () => {
    setIsFormSaving(true);
    setFormError('');
    const name = formData.name.trim();
    const description = formData.description.trim() || null;
    try {
      if (editingRole) {
        const response = await rolesApi.update(editingRole.id, { name, description });
        toast.success(response.data?.message || 'Rôle mis à jour.');
      } else {
        const response = await rolesApi.create({ name, description, application_ids: formAppIds });
        toast.success(response.data?.message || 'Rôle créé.');
      }
      setIsFormOpen(false);
      setEditingRole(null);
      setFormData(emptyForm);
      setFormAppIds([]);
      loadData();
    } catch (error: any) {
      console.error("Erreur lors de l'enregistrement:", error);
      const message = getErrorMessage(
        error,
        editingRole ? 'Le rôle n’a pas pu être mis à jour.' : 'Le rôle n’a pas pu être créé.'
      );
      if (error?.response?.status === 422) {
        setFormError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsFormSaving(false);
    }
  };

  // Suppression
  const openDeleteDialog = (role: Role) => {
    setDeleteError('');
    setRoleToDelete(role);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setRoleToDelete(null);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const response = await rolesApi.delete(roleToDelete.id);
      toast.success(response.data?.message || 'Rôle supprimé.');
      if (selectedRole?.id === roleToDelete.id) setSelectedRole(null);
      setRoleToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const message = getErrorMessage(error, 'Le rôle n’a pas pu être supprimé.');
      if (error?.response?.status === 422) {
        setDeleteError(message);
      } else {
        toast.error(message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const activeApps = applications.filter(app => app.is_active);
  const totalUsers = roles.reduce((sum, role) => sum + (role.users_count || 0), 0);
  const rolesWithoutApps = roles.filter(role => !role.applications || role.applications.length === 0).length;

  const isFormValid = formData.name.trim() !== '' && formData.name.length <= NAME_MAX;
  const deleteUsersCount = roleToDelete?.users_count || 0;

  const kpis = [
    { label: 'Rôles', value: roles.length, icon: Shield },
    { label: 'Utilisateurs rattachés', value: totalUsers, icon: Users },
    { label: 'Applications actives', value: activeApps.length, icon: Package },
    { label: 'Rôles sans application', value: rolesWithoutApps, icon: X },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-sbee-red animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des rôles…</p>
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
            <h1 className="text-2xl font-semibold text-foreground">Rôles et accès</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Chaque utilisateur ne voit que les applications autorisées pour son rôle
            </p>
          </div>
        </div>
        <Button onClick={openCreateModal} className="sm:self-center">
          <Plus className="w-4 h-4" />
          Ajouter un rôle
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

      {/* Rôles */}
      {roles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const isSelected = selectedRole?.id === role.id;
            const appCount = role.applications?.length || 0;
            return (
              <div
                key={role.id}
                className={`border border-border rounded-lg p-5 flex flex-col gap-4 transition-colors duration-[120ms] ${
                  isSelected ? 'rail-accent bg-surface-3' : 'bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-sm bg-surface-3 border border-border flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-foreground">{role.name}</h2>
                        {role.is_system && <Badge variant="muted">Rôle système</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {role.description || 'Sans description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Badge variant="outline" className="mr-1" aria-label={`${role.users_count || 0} utilisateurs`}>
                      <Users className="w-3 h-3" />
                      <span className="num">{role.users_count || 0}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(role)}
                      aria-label={`Modifier ${role.name}`}
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                    </Button>
                    {!role.is_system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(role)}
                        aria-label={`Supprimer ${role.name}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Applications autorisées <span className="num">({appCount})</span>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {role.applications && role.applications.length > 0 ? (
                      <>
                        {role.applications.slice(0, 3).map((app) => (
                          <Badge key={app.id} variant="outline">
                            {app.name}
                          </Badge>
                        ))}
                        {role.applications.length > 3 && (
                          <Badge variant="muted">
                            <span className="num">+{role.applications.length - 3}</span> autres
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Aucune application attribuée</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-auto">
                  <Button
                    variant="outline"
                    onClick={() => handleEditRole(role)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4" strokeWidth={1.5} />
                    Gérer les accès
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* État vide : aucun rôle */
        <div className="bg-surface border border-border rounded-lg px-6 py-12 flex flex-col items-center text-center">
          <Shield className="w-10 h-10 text-muted-foreground" strokeWidth={1.5} />
          <p className="text-base font-medium text-foreground mt-4">
            Aucun rôle. Créez le premier pour attribuer des accès aux applications.
          </p>
          <Button variant="outline" className="mt-6" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Créer un rôle
          </Button>
        </div>
      )}

      {/* Modale création / édition du rôle */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isFormSaving) setIsFormOpen(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Modifier le rôle' : 'Ajouter un rôle'}</DialogTitle>
            <DialogDescription>
              {editingRole
                ? `Informations de ${editingRole.name}`
                : 'Il déterminera les applications visibles par les utilisateurs qui l’ont.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="role-name">Nom<RequiredMark /></Label>
                <span
                  className={`text-xs num ${formData.name.length > NAME_MAX ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}
                  aria-live="polite"
                >
                  {formData.name.length}/{NAME_MAX}
                </span>
              </div>
              <Input
                id="role-name"
                value={formData.name}
                maxLength={NAME_MAX}
                required
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  setFormError('');
                }}
                placeholder="Ex. : Agent commercial"
                aria-invalid={formError ? true : undefined}
                aria-describedby={
                  [formError ? 'role-form-error' : '', editingRole?.is_system ? 'role-system-help' : '']
                    .filter(Boolean)
                    .join(' ') || undefined
                }
              />
              {editingRole?.is_system && (
                <p id="role-system-help" className="text-xs text-muted-foreground">
                  {'Rôle système : son identifiant reste "administrateur".'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">
                Description
              </Label>
              <Textarea
                id="role-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Les missions couvertes par ce rôle"
                rows={3}
              />
            </div>
            {!editingRole && (
              <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-foreground">
                  Applications accessibles
                </p>
                <AppChecklist
                  idPrefix="new-role-app"
                  apps={activeApps}
                  selectedIds={formAppIds}
                  onToggle={toggleFormApp}
                  onSelectAll={() => setFormAppIds(prev => Array.from(new Set([...prev, ...activeApps.map(a => a.id)])))}
                  onClear={() => setFormAppIds([])}
                />
              </div>
            )}
            {formError && (
              <p
                id="role-form-error"
                role="alert"
                className="text-sm text-foreground bg-warning-soft border border-border rounded-sm px-3 py-2"
              >
                {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isFormSaving}>
              Annuler
            </Button>
            <Button onClick={handleSaveRole} disabled={isFormSaving || !isFormValid}>
              {isFormSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingRole ? 'Enregistrer le rôle' : 'Créer le rôle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog open={!!roleToDelete} onOpenChange={(open) => { if (!open) closeDeleteDialog(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle {roleToDelete?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUsersCount > 0 ? (
                <>
                  <span className="num">{deleteUsersCount}</span> utilisateur(s) ont ce rôle.
                  Attribuez-leur un autre rôle avant de le supprimer.
                </>
              ) : (
                'Les accès aux applications liés à ce rôle seront retirés.'
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
              disabled={isDeleting || deleteUsersCount > 0}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Supprimer le rôle
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modale d'attribution */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Accès du rôle {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Cochez les applications que ce rôle peut ouvrir depuis le portail.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <AppChecklist
              idPrefix="role-app"
              apps={activeApps}
              selectedIds={selectedAppIds}
              onToggle={toggleAppAccess}
              onSelectAll={() => setSelectedAppIds(prev => Array.from(new Set([...prev, ...activeApps.map(a => a.id)])))}
              onClear={() => setSelectedAppIds([])}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedRole(null);
                setSelectedAppIds([]);
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleSavePermissions} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Enregistrer les accès
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
