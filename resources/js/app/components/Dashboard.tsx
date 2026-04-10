import { useState, useEffect } from 'react';
import {
  Search,
  LogOut,
  Tag,
  Calendar,
  Building2,
  CheckCircle,
  Zap,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { applicationsApi, dashboardApi } from '@/services/api';
import { toast } from 'sonner';

type AppCategory = 'Administration' | 'Technique' | 'Finances' | 'RH' | 'Tous';

interface Application {
  id: number;
  name: string;
  category: string;
  logo_url: string | null;
  version: string;
  deployment_date: string;
  developed_by: string;
  description: string;
  is_active: boolean;
  url: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalApps: 0,
    activeApps: 0,
    todayLogins: 0
  });

  // Charger les applications depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [appsResponse, statsResponse] = await Promise.all([
          applicationsApi.getAllAdmin(),
          dashboardApi.getAdminStats()
        ]);
        const appsData = appsResponse.data?.applications || appsResponse.data || [];
        setApplications(Array.isArray(appsData) ? appsData : []);
        
        // Mapper les stats de l'API vers le format attendu
        const apiStats = statsResponse.data?.stats || statsResponse.data;
        if (apiStats) {
          setStats({
            totalUsers: apiStats.users?.total || 0,
            totalApps: apiStats.applications?.total || 0,
            activeApps: apiStats.applications?.active || 0,
            todayLogins: apiStats.logins?.today || 0
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleAppClick = (app: Application) => {
    if (app.url) {
      window.open(app.url, '_blank');
    }
  };

  // Générer les initiales de l'utilisateur
  const getInitials = () => {
    if (user?.prenom && user?.nom) {
      return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    }
    return 'US';
  };

  // Récupérer les catégories uniques disponibles
  const availableCategories = ['Tous', ...new Set([...['Administration', 'Technique', 'Finances', 'RH'], ...applications.map(app => app.category)])].filter(Boolean);

  const filteredApps = (applications || []).filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' ||
      (app.category && app.category.toLowerCase() === selectedCategory.toLowerCase());
    const isActive = app.is_active === true;
    return matchesSearch && matchesCategory && isActive;
  });

  const getCategoryColor = (category: string) => {
    const normalizedCategory = category?.toLowerCase() || '';
    if (normalizedCategory.includes('technique')) return 'bg-[#3b5998]';
    if (normalizedCategory.includes('finance')) return 'bg-[#00cc66]';
    if (normalizedCategory.includes('rh') || normalizedCategory.includes('ressources')) return 'bg-[#f9a825]';
    if (normalizedCategory.includes('admin')) return 'bg-[#555555]';
    return 'bg-[#3b5998]';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998] mx-auto mb-4" />
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
            {/* Logo Section */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12">
                  <img
                    src="/images/logo.png"
                    alt="SBEE"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>SBEE</h1>
                  <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-gothic)' }}>Portail des applications</p>
                </div>
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-[#3b5998] rounded-full flex items-center justify-center text-white font-semibold">
                {user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}` : 'U'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2 hover:bg-red-50 hover:border-[#ed1f24] hover:text-[#ed1f24]"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
            Bienvenue, {user?.prenom || 'Utilisateur'} !
          </h2>
          <p className="text-gray-600" style={{ fontFamily: 'var(--font-gothic)' }}>
            Accédez à vos applications et services SBEE
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher une application..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 transition-all ${selectedCategory === category
                  ? 'bg-[#3b5998] hover:bg-[#2d4373] text-white'
                  : 'hover:bg-gray-100'
                  }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:-translate-y-1"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden mb-4 group-hover:scale-110 transition-transform duration-300 bg-gray-100 flex items-center justify-center">
                {app.logo_url ? (
                  <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" />
                ) : (
                  <Zap className="w-8 h-8 text-[#3b5998]" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                {app.name}
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  {app.category}
                </Badge>
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  v{app.version}
                </Badge>
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 mb-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{app.deployment_date ? new Date(app.deployment_date).toLocaleDateString('fr-FR') : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{app.developed_by || 'Non spécifié'}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'var(--font-gothic)' }}>
                {app.description}
              </p>
              {app.is_active && (
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-500 ml-1">Active</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredApps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Aucune application trouvée
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </main>
    </div>
  );
}