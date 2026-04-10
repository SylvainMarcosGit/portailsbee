import { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Plus, X, Check, Shield, ArrowLeft, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
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
import { usersApi, rolesApi } from '@/services/api';

interface User {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  isActive: boolean;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  applications?: Array<{
    id: number;
    name: string;
  }>;
}

interface Role {
  id: number;
  name: string;
  slug: string;
}

interface UserManagementProps {
  onBack: () => void;
}

export default function UserManagement({ onBack }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Tous');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [newUserForm, setNewUserForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    matricule: '',
    password: '',
    role_id: 0,
  });

  const [editUserForm, setEditUserForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    matricule: '',
    role_id: 0,
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

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
      const loadedRoles = Array.isArray(rolesData) ? rolesData : [];
      setRoles(loadedRoles);

      if (loadedRoles.length > 0) {
        setNewUserForm(prev => ({ ...prev, role_id: loadedRoles[0].id }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = (users || []).filter(user => {
    const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.matricule.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'Tous' || user.role?.name === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async () => {
    setIsSaving(true);
    try {
      await usersApi.create(newUserForm);
      toast.success('Utilisateur ajouté avec succès');
      setIsAddModalOpen(false);
      setNewUserForm({
        prenom: '',
        nom: '',
        email: '',
        matricule: '',
        password: '',
        role_id: 2,
      });
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await usersApi.update(selectedUser.id, editUserForm);
      toast.success('Utilisateur modifié avec succès');
      setIsEditModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
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
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await usersApi.toggleStatus(userId);
      toast.success('Statut modifié avec succès');
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      matricule: user.matricule,
      role_id: user.role?.id || (roles.length > 0 ? roles[0].id : 0),
      is_active: user.isActive,
    });
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#3b5998] animate-spin" />
          <p className="text-gray-600">Chargement des utilisateurs...</p>
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
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Gestion des Utilisateurs
                </h1>
                <p className="text-sm text-gray-500">{filteredUsers.length} utilisateurs</p>
              </div>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#3b5998] hover:bg-[#2d4373] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Utilisateur
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
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Tous', ...roles.map(r => r.name)].map((role) => (
                <Badge
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  className={`cursor-pointer ${roleFilter === role
                    ? 'bg-[#3b5998] hover:bg-[#2d4373] text-white'
                    : 'hover:bg-gray-100'
                    }`}
                  onClick={() => setRoleFilter(role)}
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Matricule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-[#3b5998] flex items-center justify-center text-white font-medium">
                        {user.prenom?.[0]}{user.nom?.[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.prenom} {user.nom}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.matricule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className="flex items-center w-fit gap-1">
                      <Shield className="w-3 h-3" />
                      {user.role?.name || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${user.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                    >
                      {user.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Actif
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inactif
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(user)}>
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun utilisateur trouvé</p>
            </div>
          )}
        </div>
      </main>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvel Utilisateur</DialogTitle>
            <DialogDescription>Créez un nouveau compte utilisateur</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom</Label>
                <Input
                  value={newUserForm.prenom}
                  onChange={(e) => setNewUserForm({ ...newUserForm, prenom: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div>
                <Label>Nom</Label>
                <Input
                  value={newUserForm.nom}
                  onChange={(e) => setNewUserForm({ ...newUserForm, nom: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="email@sbee.bj"
              />
            </div>
            <div>
              <Label>Matricule</Label>
              <Input
                value={newUserForm.matricule}
                onChange={(e) => setNewUserForm({ ...newUserForm, matricule: e.target.value })}
                placeholder="XXXXX"
              />
            </div>
            <div>
              <Label>Mot de passe</Label>
              <Input
                type="password"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <select
                value={newUserForm.role_id}
                onChange={(e) => setNewUserForm({ ...newUserForm, role_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b5998]"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={isSaving}
              className="bg-[#3b5998] hover:bg-[#2d4373]"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'Utilisateur</DialogTitle>
            <DialogDescription>Modifiez les informations de {selectedUser?.prenom}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prénom</Label>
                <Input
                  value={editUserForm.prenom}
                  onChange={(e) => setEditUserForm({ ...editUserForm, prenom: e.target.value })}
                />
              </div>
              <div>
                <Label>Nom</Label>
                <Input
                  value={editUserForm.nom}
                  onChange={(e) => setEditUserForm({ ...editUserForm, nom: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Matricule</Label>
              <Input
                value={editUserForm.matricule}
                onChange={(e) => setEditUserForm({ ...editUserForm, matricule: e.target.value })}
              />
            </div>
            <div>
              <Label>Rôle</Label>
              <select
                value={editUserForm.role_id}
                onChange={(e) => setEditUserForm({ ...editUserForm, role_id: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b5998]"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEditUser}
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
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
