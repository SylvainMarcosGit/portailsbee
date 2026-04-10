import { useState } from 'react';
import { 
  Search, 
  User,
  Tag,
  Calendar,
  Building2,
  CheckCircle,
  Zap
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';

type AppCategory = 'Administration' | 'Technique' | 'Finances' | 'RH' | 'Tous';

interface Application {
  id: number;
  name: string;
  category: AppCategory;
  logo: string;
  version: string;
  deploymentDate: string;
  developedBy: string;
  description: string;
  isActive: boolean;
}

interface UserDashboardProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function UserDashboard({ onNavigate, onLogout }: UserDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('Tous');
  const [activeTab, setActiveTab] = useState<'accueil'>('accueil');

  const applications: Application[] = [
    { 
      id: 1, 
      name: 'Gestion Réseau', 
      category: 'Technique', 
      logo: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop',
      version: '2.3.1',
      deploymentDate: '2024-01-15',
      developedBy: 'Direction Technique SBEE',
      description: 'Système de gestion et monitoring du réseau électrique',
      isActive: true
    },
    { 
      id: 2, 
      name: 'Facturation', 
      category: 'Finances', 
      logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=100&h=100&fit=crop',
      version: '3.1.0',
      deploymentDate: '2024-03-20',
      developedBy: 'Direction Financière',
      description: 'Gestion des factures et paiements clients',
      isActive: true
    },
    { 
      id: 3, 
      name: 'Ressources Humaines', 
      category: 'RH', 
      logo: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=100&h=100&fit=crop',
      version: '1.8.2',
      deploymentDate: '2023-11-10',
      developedBy: 'Service RH',
      description: 'Gestion du personnel et des ressources humaines',
      isActive: true
    },
    { 
      id: 4, 
      name: 'Administration', 
      category: 'Administration', 
      logo: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=100&h=100&fit=crop',
      version: '2.0.0',
      deploymentDate: '2023-12-01',
      developedBy: 'Direction Générale',
      description: 'Outils d\'administration générale',
      isActive: true
    },
    { 
      id: 5, 
      name: 'Comptabilité', 
      category: 'Finances', 
      logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop',
      version: '1.5.3',
      deploymentDate: '2023-09-18',
      developedBy: 'Direction Financière',
      description: 'Gestion comptable et financière',
      isActive: false
    },
    { 
      id: 6, 
      name: 'Statistiques', 
      category: 'Administration', 
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop',
      version: '1.2.0',
      deploymentDate: '2024-02-10',
      developedBy: 'Direction Planification',
      description: 'Tableaux de bord et statistiques',
      isActive: true
    },
    { 
      id: 7, 
      name: 'Sécurité', 
      category: 'Administration', 
      logo: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop',
      version: '3.0.1',
      deploymentDate: '2024-04-05',
      developedBy: 'Service Sécurité',
      description: 'Gestion de la sécurité et accès',
      isActive: true
    },
    { 
      id: 8, 
      name: 'Base de Données', 
      category: 'Technique', 
      logo: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=100&h=100&fit=crop',
      version: '2.1.5',
      deploymentDate: '2023-10-22',
      developedBy: 'Direction Technique SBEE',
      description: 'Administration des bases de données',
      isActive: true
    },
    { 
      id: 9, 
      name: 'Production Énergie', 
      category: 'Technique', 
      logo: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=100&h=100&fit=crop',
      version: '1.9.0',
      deploymentDate: '2024-01-30',
      developedBy: 'Direction Technique SBEE',
      description: 'Suivi de la production énergétique',
      isActive: true
    },
    { 
      id: 10, 
      name: 'Maintenance', 
      category: 'Technique', 
      logo: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=100&h=100&fit=crop',
      version: '2.0.5',
      deploymentDate: '2024-02-05',
      developedBy: 'Direction Technique SBEE',
      description: 'Suivi des opérations de maintenance',
      isActive: true
    },
    { 
      id: 11, 
      name: 'Gestion de Projet', 
      category: 'Administration', 
      logo: 'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=100&h=100&fit=crop',
      version: '1.4.2',
      deploymentDate: '2023-11-25',
      developedBy: 'Direction Générale',
      description: 'Planification et suivi de projets',
      isActive: true
    },
    { 
      id: 12, 
      name: 'Inventaire', 
      category: 'Administration', 
      logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&h=100&fit=crop',
      version: '1.7.1',
      deploymentDate: '2024-03-12',
      developedBy: 'Service Logistique',
      description: 'Gestion des stocks et inventaire',
      isActive: true
    },
  ];

  const categories: AppCategory[] = ['Tous', 'Administration', 'Technique', 'Finances', 'RH'];

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <header className="bg-[#3b5998] shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#3b5998]" />
              </div>
              <div className="text-white">
                <h1 className="text-lg font-bold">SBEE</h1>
                <p className="text-xs opacity-90">Portail des applications</p>
              </div>
            </div>

            {/* Navigation Tabs 
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActiveTab('accueil')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'accueil'
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                Accueil
              </button>
            </nav> */}

            {/* User Profile Dropdown */}
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-3 focus:outline-none hover:opacity-80 transition-opacity">
                    <div className="hidden sm:block text-right text-white">
                      <p className="text-sm font-medium">Sylvain ZOSSOU</p>
                      <p className="text-xs opacity-80">Employé</p>
                    </div>
                    <div className="w-10 h-10 bg-[#f9a825] rounded-full flex items-center justify-center text-white font-semibold ring-2 ring-white/30">
                      SZ
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onNavigate('profile')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, Sylvain !
          </h2>
          <p className="text-gray-600">
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
                className={`cursor-pointer px-4 py-2 transition-all ${
                  selectedCategory === category
                    ? 'bg-[#3b5998] hover:bg-[#3b5998]/90 text-white'
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
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                <img src={app.logo} alt={app.name} className="w-16 h-16 rounded-lg" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
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
              <div className="space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{new Date(app.deploymentDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 flex-shrink-0" />
                  <span className="line-clamp-1">{app.developedBy}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {app.description}
              </p>
              {app.isActive ? (
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-500 ml-1">Actif</span>
                </div>
              ) : (
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500 ml-1">Inactif</span>
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