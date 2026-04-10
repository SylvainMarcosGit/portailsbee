import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Plus, Edit, Save, X, Users, Package, Loader2, Check } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/app/components/ui/dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from 'sonner';
import { rolesApi, applicationsApi } from '@/services/api';

interface Application {
  id: number;
  name: string;
  category: string;
  is_active: boolean;
}

interface Role {
  id: number;
  name: string;
  slug: string;
  description?: string;
  users_count?: number;
  applications?: Application[];
}

interface RoleManagementProps {
  onBack: () => void;
}

export default function RoleManagement({ onBack }: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
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
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
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
      await rolesApi.updateApplications(selectedRole.id, selectedAppIds);
      toast.success('Accès aux applications mis à jour avec succès');
      setIsEditModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAppAccess = (appId: number) => {
    if (selectedAppIds.includes(appId)) {
      setSelectedAppIds(selectedAppIds.filter(id => id !== appId));
    } else {
      setSelectedAppIds([...selectedAppIds, appId]);
    }
  };

  const getRoleColor = (slug: string) => {
    switch (slug) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'technicien':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'comptable':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rh':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRoleIconColor = (slug: string) => {
    switch (slug) {
      case 'admin':
        return 'text-red-600';
      case 'technicien':
        return 'text-blue-600';
      case 'comptable':
        return 'text-green-600';
      case 'rh':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#3b5998] animate-spin" />
          <p className="text-gray-600">Chargement des rôles...</p>
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
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-[#3b5998]" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Gestion des Accès
                  </h1>
                  <p className="text-sm text-gray-500">Configurez l'accès aux applications par rôle</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Système de permissions</h3>
              <p className="text-sm text-blue-700 mt-1">
                Chaque rôle peut avoir accès à certaines applications. Les utilisateurs ne verront que les applications auxquelles leur rôle a accès.
              </p>
            </div>
          </div>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Shield className={`w-6 h-6 ${getRoleIconColor(role.slug)}`} />
                      <CardTitle>{role.name}</CardTitle>
                    </div>
                    <CardDescription>{role.description || 'Aucune description'}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getRoleColor(role.slug)}>
                    <Users className="w-3 h-3 mr-1" />
                    {role.users_count || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <Package className="w-4 h-4 mr-1" />
                    Applications autorisées ({role.applications?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {role.applications && role.applications.length > 0 ? (
                      <>
                        {role.applications.slice(0, 3).map((app) => (
                          <Badge key={app.id} variant="outline" className="text-xs">
                            {app.name}
                          </Badge>
                        ))}
                        {role.applications.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-gray-100">
                            +{role.applications.length - 3} autres
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="text-sm text-gray-500 italic">Aucune application</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRole(role)}
                    className="w-full flex items-center justify-center space-x-2 hover:bg-[#3b5998] hover:text-white hover:border-[#3b5998]"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Gérer les accès</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {roles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun rôle trouvé</p>
          </div>
        )}
      </main>

      {/* Edit Role Applications Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center">
              <Shield className={`w-5 h-5 mr-2 ${getRoleIconColor(selectedRole?.slug || '')}`} />
              Accès aux applications - {selectedRole?.name}
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les applications auxquelles ce rôle aura accès
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">
                Applications disponibles ({applications.filter(a => a.is_active).length})
              </Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAppIds(applications.filter(a => a.is_active).map(a => a.id))}
                >
                  Tout sélectionner
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAppIds([])}
                >
                  Tout désélectionner
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
              {applications.filter(app => app.is_active).map((app) => (
                <div
                  key={app.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedAppIds.includes(app.id)
                      ? 'border-[#3b5998] bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => toggleAppAccess(app.id)}
                >
                  <Checkbox
                    checked={selectedAppIds.includes(app.id)}
                    onCheckedChange={() => toggleAppAccess(app.id)}
                  />
                  <div className="flex-1">
                    <Label className="cursor-pointer text-sm font-medium">
                      {app.name}
                    </Label>
                    <p className="text-xs text-gray-500">{app.category}</p>
                  </div>
                  {selectedAppIds.includes(app.id) && (
                    <Check className="w-4 h-4 text-[#00cc66]" />
                  )}
                </div>
              ))}
            </div>

            {applications.filter(app => app.is_active).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Aucune application active disponible</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedRole(null);
                setSelectedAppIds([]);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="bg-[#3b5998] hover:bg-[#2d4373]"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
