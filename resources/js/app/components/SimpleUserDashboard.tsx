import { useState, useEffect } from 'react';
import {
  Search,
  Zap,
  Loader2,
  ExternalLink,
  Calendar,
  Building2,
  CheckCircle,
  Tag
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { applicationsApi } from '@/services/api';
import { toast } from 'sonner';

type AppCategory = 'Administration' | 'Technique' | 'Finances' | 'RH' | 'Tous';

interface Application {
  id: number;
  name: string;
  category: string;
  logo_url: string | null;
  url: string;
  description: string;
  version: string;
  deployment_date: string;
  developed_by: string;
  is_active: boolean;
}

export default function SimpleUserDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('Tous');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les applications autorisées pour l'utilisateur
  useEffect(() => {
    const fetchApps = async () => {
      try {
        setIsLoading(true);
        const response = await applicationsApi.getAll();
        const appsData = response.data?.applications || response.data || [];
        setApplications(Array.isArray(appsData) ? appsData : []);
      } catch (error) {
        console.error('Erreur:', error);
        toast.error('Erreur lors du chargement des applications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
  }, []);

  const handleAppClick = (app: Application) => {
    if (app.url) {
      window.open(app.url, '_blank');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technique': return 'bg-[#3b5998]';
      case 'Finances': return 'bg-[#00cc66]';
      case 'RH': return 'bg-[#f9a825]';
      case 'Administration': return 'bg-[#555555]';
      default: return 'bg-[#3b5998]';
    }
  };

  const categories: AppCategory[] = ['Tous', 'Administration', 'Technique', 'Finances', 'RH'];

  const filteredApps = (applications || []).filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998] mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
            {categories.map((category) => (
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
              onClick={() => handleAppClick(app)}
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
                  v{app.version || '1.0.0'}
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
              <p className="text-sm text-gray-500 mt-2 line-clamp-2" style={{ fontFamily: 'var(--font-gothic)' }}>
                {app.description}
              </p>
               {/* {app.is_active && (
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-500 ml-1">Active</span>
                </div>
              )} */}
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
