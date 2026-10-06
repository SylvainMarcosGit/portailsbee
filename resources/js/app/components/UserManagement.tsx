import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Edit, Trash2, Plus, Shield, ArrowLeft, Loader2, ToggleLeft, ToggleRight, Users, UserCheck, UserX,
  KeyRound, CheckCircle2, AlertCircle, Info,
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
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
import { usersApi, rolesApi, MOT_DE_PASSE_INITIAL, type User, type Employe } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import RequiredMark from '@/app/components/RequiredMark';

interface Role {
  id: number;
  name: string;
  slug: string;
}

type RhStatus = 'idle' | 'searching' | 'found' | 'error';

const TELEPHONE_REGEX = /^01\d{8}$/;
const TELEPHONE_HINT = '10 chiffres commençant par 01 (ex. 0197000000)';
const RH_HINT = 'Rempli automatiquement depuis le RH';

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

// Chiffres uniquement, 10 maximum
const sanitizeTelephone = (value: string): string => value.replace(/\D/g, '').slice(0, 10);

const isTelephoneValid = (value: string): boolean => value === '' || TELEPHONE_REGEX.test(value);

interface UserManagementProps {
  onBack: () => void;
}

const emptyNewUserForm = {
  matricule: '',
  email: '',
  telephone: '',
  role_id: 0,
  is_active: true,
};

// Champ en lecture seule alimenté par le RH
function ReadOnlyField({ id, label, value, className }: { id: string; label: string; value: string; className?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        readOnly
        tabIndex={-1}
        placeholder="-"
        className={`bg-surface-2 text-foreground cursor-default ${className ?? ''}`}
      />
    </div>
  );
}

export default function UserManagement({ onBack }: UserManagementProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Tous');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [newUserForm, setNewUserForm] = useState(emptyNewUserForm);
  const [rhStatus, setRhStatus] = useState<RhStatus>('idle');
  const [employe, setEmploye] = useState<Employe | null>(null);
  const [rhError, setRhError] = useState<string | null>(null);

  const [editUserForm, setEditUserForm] = useState({
    email: '',
    telephone: '',
    role_id: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  // Recherche RH du matricule (debounce 800 ms, requêtes obsolètes annulées)
  useEffect(() => {
    if (!isAddModalOpen) return;
    const matricule = newUserForm.matricule.trim();
    setEmploye(null);
    setRhError(null);
    if (matricule.length < 3) {
      setRhStatus('idle');
      return;
    }
    setRhStatus('searching');
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await usersApi.searchEmployee(matricule, controller.signal);
        if (controller.signal.aborted) return;
        const found = response.data?.employe;
        if (found) {
          setEmploye(found);
          setRhStatus('found');
        } else {
          setRhError(`Aucun employé trouvé avec le matricule : ${matricule}`);
          setRhStatus('error');
        }
      } catch (error: any) {
        if (axios.isCancel(error) || controller.signal.aborted) return;
        setRhError(getErrorMessage(error, 'La recherche RH a échoué. Réessayez dans un instant.'));
        setRhStatus('error');
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [newUserForm.matricule, isAddModalOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        usersApi.getAll(),
        rolesApi.getAll(),
      ]);
      const usersData = usersResponse.data?.users || usersResponse.data?.data || [];
      const rolesData = rolesResponse.data?.roles || rolesResponse.data?.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = (users || []).filter(user => {
    const query = searchQuery.toLowerCase();
    const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.matricule || '').toLowerCase().includes(query) ||
      (user.telephone || '').includes(query) ||
      (user.direction || '').toLowerCase().includes(query);
    const matchesRole = roleFilter === 'Tous' || user.role?.name === roleFilter;
    return matchesSearch && matchesRole;
  });

  const resetAddForm = () => {
    setNewUserForm(emptyNewUserForm);
    setEmploye(null);
    setRhError(null);
    setRhStatus('idle');
  };

  const handleAddModalChange = (open: boolean) => {
    setIsAddModalOpen(open);
    if (!open) resetAddForm();
  };

  const newTelephoneValid = isTelephoneValid(newUserForm.telephone);
  const canCreate = rhStatus === 'found' && !!employe && newUserForm.role_id > 0 && newTelephoneValid && !isSaving;

  const handleAddUser = async () => {
    if (!canCreate || !employe) return;
    setIsSaving(true);
    try {
      const response = await usersApi.create({
        matricule: employe.matricule || newUserForm.matricule.trim(),
        email: newUserForm.email.trim() || null,
        telephone: newUserForm.telephone || null,
        role_id: newUserForm.role_id,
        is_active: newUserForm.is_active,
      });
      toast.success(response.data?.message || 'Utilisateur créé.');
      handleAddModalChange(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(getErrorMessage(error, 'Erreur lors de la création'));
    } finally {
      setIsSaving(false);
    }
  };

  const editTelephoneValid = isTelephoneValid(editUserForm.telephone);

  const handleEditUser = async () => {
    if (!selectedUser || !editTelephoneValid) return;
    setIsSaving(true);
    try {
      await usersApi.update(selectedUser.id, {
        email: editUserForm.email.trim() || null,
        telephone: editUserForm.telephone || null,
        role_id: editUserForm.role_id,
        is_active: editUserForm.is_active,
      });
      toast.success('Utilisateur modifié avec succès');
      setIsEditModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      toast.error(getErrorMessage(error, 'Erreur lors de la modification'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await usersApi.delete(userToDelete);
      toast.success('Utilisateur supprimé avec succès');
      setUserToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(getErrorMessage(error, 'Erreur lors de la suppression'));
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    setIsResetting(true);
    try {
      const response = await usersApi.resetPassword(userToReset.id);
      toast.success(response.data?.message || 'Mot de passe réinitialisé.');
      setUserToReset(null);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la réinitialisation:', error);
      toast.error(getErrorMessage(error, 'Le mot de passe n\'a pas pu être réinitialisé.'));
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await usersApi.toggleStatus(userId);
      toast.success('Statut modifié avec succès');
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(getErrorMessage(error, 'Erreur lors de la modification du statut'));
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      email: user.email || '',
      telephone: user.telephone || '',
      role_id: user.role?.id || (roles.length > 0 ? roles[0].id : 0),
      is_active: user.isActive,
    });
    setIsEditModalOpen(true);
  };

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminUsers = users.filter(u => u.role?.slug?.toLowerCase().includes('admin')).length;

  const kpis = [
    { label: 'Utilisateurs', value: totalUsers, icon: Users },
    { label: 'Comptes actifs', value: activeUsers, icon: UserCheck },
    { label: 'Comptes inactifs', value: inactiveUsers, icon: UserX },
    { label: 'Administrateurs', value: adminUsers, icon: Shield },
  ];

  const selectClassName =
    'w-full h-10 px-3 bg-surface text-foreground text-sm border border-border rounded-sm focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-sbee-red animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des utilisateurs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bandeau contexte */}
      <div className="bg-surface border border-border rounded-lg rail-accent px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Revenir à la page précédente" className="-ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Comptes d'accès au portail, rôles et statuts -{' '}
              <span className="num">{filteredUsers.length}</span> affiché{filteredUsers.length > 1 ? 's' : ''} sur{' '}
              <span className="num">{totalUsers}</span>
            </p>
          </div>
        </div>
        <Button size="lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Ajouter un utilisateur
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" strokeWidth={1.5} />
          <Input
            type="text"
            placeholder="Rechercher par nom, e-mail, matricule ou téléphone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-surface"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['Tous', ...roles.map(r => r.name)].map((role) => {
            const isActive = roleFilter === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => setRoleFilter(role)}
                className={`h-9 px-3 rounded-sm border text-sm font-medium transition-colors duration-[120ms] ${isActive
                  ? 'bg-foreground text-white border-foreground'
                  : 'bg-surface border-border text-muted-foreground hover:text-foreground'
                  }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-surface-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 h-10 text-left">Matricule</th>
                  <th className="px-4 h-10 text-left">Nom</th>
                  <th className="px-4 h-10 text-left hidden lg:table-cell">Téléphone</th>
                  <th className="px-4 h-10 text-left">Rôle</th>
                  <th className="px-4 h-10 text-left">Statut</th>
                  <th className="px-4 h-10 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  const poste = [user.titre_de_poste, user.direction].filter(Boolean).join(' · ');
                  return (
                    <tr key={user.id} className="h-12 border-t border-border hover:bg-surface-2 transition-colors duration-[120ms]">
                      <td className="px-4 py-2 whitespace-nowrap text-sm num text-foreground">{user.matricule}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-surface-3 border border-border flex items-center justify-center text-xs font-semibold text-foreground">
                            {user.prenom?.[0]}{user.nom?.[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground whitespace-nowrap">{user.prenom} {user.nom}</div>
                            {poste ? <div className="text-xs text-muted-foreground">{poste}</div> : null}
                            {user.email ? <div className="text-xs text-muted-foreground">{user.email}</div> : null}
                            {user.telephone ? (
                              <div className="text-xs text-muted-foreground num lg:hidden">{user.telephone}</div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm num text-foreground hidden lg:table-cell">
                        {user.telephone || <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-foreground">
                        {user.role?.name || 'Non attribué'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user.id)}
                            title={user.isActive ? 'Désactiver le compte' : 'Activer le compte'}
                            className="rounded-sm focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          >
                            {user.isActive ? (
                              <Badge variant="success">
                                <ToggleRight />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="muted">
                                <ToggleLeft />
                                Inactif
                              </Badge>
                            )}
                          </button>
                          {user.needs_password_change ? (
                            <Badge variant="warning">
                              <KeyRound />
                              Mot de passe initial
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-1 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(user)} aria-label={`Modifier ${user.prenom} ${user.nom}`}>
                            <Edit className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                          </Button>
                          {!isSelf ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setUserToReset(user)}
                              aria-label={`Réinitialiser le mot de passe de ${user.prenom} ${user.nom}`}
                              title="Réinitialiser le mot de passe"
                            >
                              <KeyRound className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                            </Button>
                          ) : null}
                          <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user.id)} aria-label={`Supprimer ${user.prenom} ${user.nom}`}>
                            <Trash2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center px-6 py-12 gap-3">
            <Users className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">Aucun utilisateur ne correspond à cette recherche.</p>
            <Button
              variant="outline"
              onClick={() => { setSearchQuery(''); setRoleFilter('Tous'); }}
            >
              Effacer les filtres
            </Button>
          </div>
        )}
      </div>

      {/* Nouvel utilisateur */}
      <Dialog open={isAddModalOpen} onOpenChange={handleAddModalChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvel utilisateur</DialogTitle>
            <DialogDescription>Saisissez le matricule : l'identité de l'agent est chargée depuis le RH.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-matricule">Matricule<RequiredMark /></Label>
              <div className="relative">
                <Input
                  id="new-matricule"
                  value={newUserForm.matricule}
                  onChange={(e) => setNewUserForm({ ...newUserForm, matricule: e.target.value.trim() })}
                  placeholder="Ex. 12345"
                  autoComplete="off"
                  required
                  aria-describedby="new-matricule-status"
                  className="num pr-10"
                />
                {rhStatus === 'searching' ? (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : null}
              </div>
              <div id="new-matricule-status" aria-live="polite">
                {rhStatus === 'idle' ? (
                  <p className="text-xs text-muted-foreground">Au moins 3 caractères pour lancer la recherche RH.</p>
                ) : null}
                {rhStatus === 'searching' ? (
                  <p className="text-xs text-muted-foreground">Recherche dans le RH…</p>
                ) : null}
                {rhStatus === 'found' && employe ? (
                  <div className="flex items-start gap-2 bg-success-soft text-success rounded-sm px-3 py-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={1.5} />
                    <span>
                      {employe.prenom} {employe.nom}
                      {employe.titre_de_poste ? ` - ${employe.titre_de_poste}` : ''}
                      {employe.direction ? ` (${employe.direction})` : ''}
                    </span>
                  </div>
                ) : null}
                {rhStatus === 'error' && rhError ? (
                  <div role="alert" className="flex items-start gap-2 bg-sbee-red-soft text-foreground rounded-sm px-3 py-2 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                    <span>{rhError}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadOnlyField id="new-prenom" label="Prénom" value={employe?.prenom ?? ''} />
              <ReadOnlyField id="new-nom" label="Nom" value={employe?.nom ?? ''} />
              <ReadOnlyField id="new-poste" label="Titre de poste" value={employe?.titre_de_poste ?? ''} />
              <ReadOnlyField id="new-direction" label="Direction" value={employe?.direction ?? ''} />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">{RH_HINT}</p>

            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail</Label>
              <Input
                id="new-email"
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="prenom.nom@sbee.bj"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-telephone">Téléphone</Label>
              <Input
                id="new-telephone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={newUserForm.telephone}
                onChange={(e) => setNewUserForm({ ...newUserForm, telephone: sanitizeTelephone(e.target.value) })}
                placeholder="0197000000"
                aria-invalid={!newTelephoneValid}
                aria-describedby="new-telephone-hint"
                className="num"
              />
              <p id="new-telephone-hint" className={`text-xs ${newTelephoneValid ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                {TELEPHONE_HINT}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Rôle<RequiredMark /></Label>
              <select
                id="new-role"
                value={newUserForm.role_id}
                onChange={(e) => setNewUserForm({ ...newUserForm, role_id: parseInt(e.target.value, 10) || 0 })}
                className={selectClassName}
                required
              >
                <option value={0} disabled>Choisir un rôle</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="new-is-active"
                checked={newUserForm.is_active}
                onCheckedChange={(checked) => setNewUserForm({ ...newUserForm, is_active: checked })}
              />
              <Label htmlFor="new-is-active">Compte actif</Label>
            </div>

            <div className="flex items-start gap-2 bg-surface-2 border border-border rounded-sm px-3 py-2 text-sm text-foreground">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <span>
                Le compte reçoit le mot de passe initial <span className="num font-medium">{MOT_DE_PASSE_INITIAL}</span>. L'utilisateur devra le changer à sa première connexion.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleAddModalChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddUser} disabled={!canCreate}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Créer l'utilisateur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modifier l'utilisateur */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>Informations du compte de {selectedUser?.prenom} {selectedUser?.nom}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ReadOnlyField id="edit-matricule" label="Matricule" value={selectedUser?.matricule ?? ''} className="num" />
              <div className="hidden sm:block" />
              <ReadOnlyField id="edit-prenom" label="Prénom" value={selectedUser?.prenom ?? ''} />
              <ReadOnlyField id="edit-nom" label="Nom" value={selectedUser?.nom ?? ''} />
              <ReadOnlyField id="edit-poste" label="Titre de poste" value={selectedUser?.titre_de_poste ?? ''} />
              <ReadOnlyField id="edit-direction" label="Direction" value={selectedUser?.direction ?? ''} />
            </div>
            <p className="text-xs text-muted-foreground -mt-2">{RH_HINT}</p>

            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                placeholder="prenom.nom@sbee.bj"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telephone">Téléphone</Label>
              <Input
                id="edit-telephone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={editUserForm.telephone}
                onChange={(e) => setEditUserForm({ ...editUserForm, telephone: sanitizeTelephone(e.target.value) })}
                placeholder="0197000000"
                aria-invalid={!editTelephoneValid}
                aria-describedby="edit-telephone-hint"
                className="num"
              />
              <p id="edit-telephone-hint" className={`text-xs ${editTelephoneValid ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
                {TELEPHONE_HINT}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rôle<RequiredMark /></Label>
              <select
                id="edit-role" aria-required="true"
                value={editUserForm.role_id}
                onChange={(e) => setEditUserForm({ ...editUserForm, role_id: parseInt(e.target.value, 10) || 0 })}
                className={selectClassName}
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="edit-is-active"
                checked={editUserForm.is_active}
                onCheckedChange={(checked) => setEditUserForm({ ...editUserForm, is_active: checked })}
              />
              <Label htmlFor="edit-is-active">Compte actif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEditUser} disabled={isSaving || !editTelephoneValid || !editUserForm.role_id}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Réinitialisation du mot de passe */}
      <AlertDialog open={!!userToReset} onOpenChange={(open) => { if (!open && !isResetting) setUserToReset(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe ?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToReset ? (
                <span className="block mb-2 text-foreground">
                  {userToReset.prenom} {userToReset.nom} - matricule <span className="num">{userToReset.matricule}</span>
                </span>
              ) : null}
              Le compte reprendra le mot de passe initial {MOT_DE_PASSE_INITIAL} et devra le changer à sa prochaine connexion. Ses sessions ouvertes seront fermées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleResetPassword(); }}
              disabled={isResetting}
              className="bg-destructive text-white hover:bg-sbee-red-hover"
            >
              {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Réinitialiser le mot de passe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suppression */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte et ses accès aux applications seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-primary text-primary-foreground hover:bg-sbee-red-hover"
            >
              Supprimer l'utilisateur
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
