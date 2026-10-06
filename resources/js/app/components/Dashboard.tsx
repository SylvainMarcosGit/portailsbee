import { useState, useEffect } from 'react';
import {
  Search,
  Tag,
  Calendar,
  Building2,
  Zap,
  Loader2
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { applicationsApi } from '@/services/api';
import { toast } from 'sonner';

type AppCategory = string;

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
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('Tous');
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Charger les applications depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const appsResponse = await applicationsApi.getAllAdmin();
        const appsData = appsResponse.data?.applications || appsResponse.data || [];
        setApplications(Array.isArray(appsData) ? appsData : []);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        toast.error('Impossible de charger les données pour le moment. Réessayez dans quelques instants.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAppClick = async (app: Application) => {
    // Ouverture synchrone pour éviter le blocage des popups
    const w = window.open('', '_blank');
    try {
      const res = await applicationsApi.accessApp(app.id);
      if (w) {
        w.opener = null;
        w.location.href = res.data.url;
      }
    } catch (error: any) {
      w?.close();
      toast.error(error?.response?.data?.message || "Impossible d'ouvrir cette application.");
    }
  };

  // Récupérer les catégories uniques disponibles
  const availableCategories: AppCategory[] = [
    'Tous',
    ...Array.from(new Set(applications.map(app => app.category).filter((c): c is string => !!c)))
      .sort((a, b) => a.localeCompare(b, 'fr')),
  ];

  const filteredApps = (applications || []).filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' ||
      app.category === selectedCategory;
    const isActive = app.is_active === true;
    return matchesSearch && matchesCategory && isActive;
  });


  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-sbee-red mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des applications…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bandeau contexte (logo et déconnexion déjà présents dans la sidebar) */}
      <div className="bg-surface border border-border rounded-lg rail-accent px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Bonjour {user?.prenom || 'et bienvenue'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="num">{filteredApps.length}</span>{' '}
            {filteredApps.length > 1 ? 'applications actives affichées' : 'application active affichée'}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" strokeWidth={1.5} />
          <Input
            type="text"
            placeholder="Rechercher une application"
            aria-label="Rechercher une application"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      {/* Filtres de catégories */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
        {availableCategories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => setSelectedCategory(category)}
              className={`h-9 px-3 rounded-sm border text-sm transition-colors duration-[120ms] ${
                isActive
                  ? 'bg-foreground border-foreground text-white font-medium'
                  : 'bg-surface border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {category === 'Tous' ? 'Toutes' : category}
            </button>
          );
        })}
      </div>

      {/* Grille d'applications */}
      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredApps.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => handleAppClick(app)}
              className="group text-left bg-surface border border-border rounded-lg p-5 flex flex-col hover:border-sbee-red hover:-translate-y-0.5 transition-[transform,border-color] duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-sm overflow-hidden bg-surface-3 border border-border flex items-center justify-center flex-shrink-0">
                  {app.logo_url ? (
                    <img src={app.logo_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Zap className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                  )}
                </div>
                {app.is_active && <Badge variant="success">Active</Badge>}
              </div>
              <h3 className="font-semibold text-foreground leading-snug">
                {app.name}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                {app.category && <Badge variant="outline">{app.category}</Badge>}
                <span className="text-xs text-muted-foreground num inline-flex items-center gap-1">
                  <Tag className="w-3 h-3" strokeWidth={1.5} />
                  v{app.version}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {app.description}
              </p>
              <div className="mt-auto pt-4 space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                  <span className="line-clamp-1 num">{app.deployment_date ? new Date(app.deployment_date).toLocaleDateString('fr-FR') : 'Date non renseignée'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                  <span className="line-clamp-1">{app.developed_by || 'Éditeur non renseigné'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* État vide */
        <div className="bg-surface border border-border rounded-lg px-6 py-16 text-center">
          <Search className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1.5} />
          <p className="text-foreground font-medium">
            Aucune application active ne correspond à votre recherche.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Modifiez le terme recherché ou choisissez une autre catégorie.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => { setSearchQuery(''); setSelectedCategory('Tous'); }}
          >
            Afficher toutes les applications
          </Button>
        </div>
      )}
    </div>
  );
}
