import { useState } from 'react';
import { ArrowLeft, FileText, Search, Download, Filter, Calendar } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';

interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
}

interface AuditLogsProps {
  onBack: () => void;
}

export default function AuditLogs({ onBack }: AuditLogsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const logs: AuditLog[] = [
    {
      id: 1,
      timestamp: '2026-01-20 10:45:23',
      user: 'Sylvain ZOSSOU',
      action: 'LOGIN',
      target: 'Système',
      ipAddress: '192.168.1.45',
      status: 'success',
      details: 'Connexion réussie au portail',
    },
    {
      id: 2,
      timestamp: '2026-01-20 10:30:12',
      user: 'Marie ADJOVI',
      action: 'ACCESS_APPLICATION',
      target: 'Gestion Réseau',
      ipAddress: '192.168.1.67',
      status: 'success',
      details: 'Accès à l\'application autorisé',
    },
    {
      id: 3,
      timestamp: '2026-01-20 10:15:45',
      user: 'Jean KOUDJO',
      action: 'UPDATE_PERMISSIONS',
      target: 'Utilisateur: Ibrahim ALASSANE',
      ipAddress: '192.168.1.89',
      status: 'success',
      details: 'Permissions mises à jour - Ajout de l\'accès à Maintenance',
    },
    {
      id: 4,
      timestamp: '2026-01-20 09:58:30',
      user: 'Aminata SANNI',
      action: 'LOGIN',
      target: 'Système',
      ipAddress: '10.0.0.120',
      status: 'failed',
      details: 'Échec de connexion - Mot de passe incorrect (Tentative 2/3)',
    },
    {
      id: 5,
      timestamp: '2026-01-20 09:42:18',
      user: 'Sylvain ZOSSOU',
      action: 'CREATE_USER',
      target: 'Nouvel utilisateur: Paul DOSSA',
      ipAddress: '192.168.1.45',
      status: 'success',
      details: 'Création d\'un nouveau compte utilisateur',
    },
    {
      id: 6,
      timestamp: '2026-01-20 09:25:07',
      user: 'Ibrahim ALASSANE',
      action: 'PASSWORD_CHANGE',
      target: 'Compte personnel',
      ipAddress: '192.168.1.102',
      status: 'success',
      details: 'Changement de mot de passe effectué',
    },
    {
      id: 7,
      timestamp: '2026-01-20 08:55:44',
      user: 'System',
      action: 'SYSTEM_UPDATE',
      target: 'Application: Facturation',
      ipAddress: '127.0.0.1',
      status: 'success',
      details: 'Mise à jour automatique de l\'application vers v2.3.1',
    },
    {
      id: 8,
      timestamp: '2026-01-20 08:30:22',
      user: 'Marie ADJOVI',
      action: 'ACCESS_DENIED',
      target: 'Comptabilité',
      ipAddress: '192.168.1.67',
      status: 'warning',
      details: 'Tentative d\'accès à une application non autorisée',
    },
    {
      id: 9,
      timestamp: '2026-01-19 17:45:10',
      user: 'Sylvain ZOSSOU',
      action: 'DELETE_USER',
      target: 'Utilisateur: Pierre AKPLOGAN',
      ipAddress: '192.168.1.45',
      status: 'success',
      details: 'Suppression du compte utilisateur suite à départ',
    },
    {
      id: 10,
      timestamp: '2026-01-19 16:20:35',
      user: 'Jean KOUDJO',
      action: 'EXPORT_DATA',
      target: 'Rapport Mensuel',
      ipAddress: '192.168.1.89',
      status: 'success',
      details: 'Export du rapport des connexions de décembre 2025',
    },
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      LOGIN: 'Connexion',
      LOGOUT: 'Déconnexion',
      ACCESS_APPLICATION: 'Accès Application',
      UPDATE_PERMISSIONS: 'Mise à jour Permissions',
      CREATE_USER: 'Création Utilisateur',
      DELETE_USER: 'Suppression Utilisateur',
      PASSWORD_CHANGE: 'Changement Mot de passe',
      SYSTEM_UPDATE: 'Mise à jour Système',
      ACCESS_DENIED: 'Accès Refusé',
      EXPORT_DATA: 'Export de Données',
    };
    return labels[action] || action;
  };

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
                <FileText className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Journal d'Audit</h1>
              </div>
            </div>
            <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Exporter les logs</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher dans les logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-blue-600' : ''}
            >
              Tous
            </Button>
            <Button
              variant={statusFilter === 'success' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('success')}
              className={statusFilter === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              Succès
            </Button>
            <Button
              variant={statusFilter === 'failed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('failed')}
              className={statusFilter === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Échecs
            </Button>
            <Button
              variant={statusFilter === 'warning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('warning')}
              className={statusFilter === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
            >
              Avertissements
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Événements</p>
                <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Succès</p>
                <p className="text-3xl font-bold text-green-600">
                  {logs.filter(l => l.status === 'success').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Échecs</p>
                <p className="text-3xl font-bold text-red-600">
                  {logs.filter(l => l.status === 'failed').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Avertissements</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {logs.filter(l => l.status === 'warning').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horodatage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cible
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {log.timestamp}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                            {log.user.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm text-gray-900">{log.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="font-mono text-xs">
                          {getActionLabel(log.action)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {log.target}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.details}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          {log.status === 'success' && 'Succès'}
                          {log.status === 'failed' && 'Échec'}
                          {log.status === 'warning' && 'Avertissement'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Aucun log trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez de modifier vos critères de recherche
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
