import { useState, useEffect } from 'react';
import {
  Search,
  LayoutGrid,
  Loader2,
  ExternalLink,
  PackageOpen
} from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { applicationsApi } from '@/services/api';
import { toast } from 'sonner';

type AppCategory = string;

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
        toast.error('Impossible de charger vos applications pour le moment. Réessayez dans quelques instants.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApps();
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

  // Catégories distinctes présentes dans les applications chargées, triées par nom
  const categories: AppCategory[] = [
    'Tous',
    ...Array.from(new Set(applications.map(app => app.category).filter((c): c is string => !!c)))
      .sort((a, b) => a.localeCompare(b, 'fr')),
  ];

  const filteredApps = (applications || []).filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const appCount = applications.length;
  const roleName = user?.role?.name;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-sbee-red mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de vos applications…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bandeau contexte */}
      <div className="bg-surface border border-border rounded-lg rail-accent px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Bonjour {user?.prenom || 'et bienvenue'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {appCount > 0 ? (
              <>
                <span className="num">{appCount}</span>{' '}
                {appCount > 1 ? 'applications disponibles' : 'application disponible'}
                {roleName ? <> pour votre rôle <span className="font-medium text-foreground">{roleName}</span></> : null}
              </>
            ) : (
              'Vos applications SBEE, accessibles depuis un seul endroit'
            )}
          </p>
        </div>
        {appCount > 0 && (
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
        )}
      </div>

      {appCount === 0 ? (
        /* État vide : aucune application attribuée */
        <div className="bg-surface border border-border rounded-lg px-6 py-16 text-center">
          <PackageOpen className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1.5} />
          <p className="text-foreground font-medium max-w-md mx-auto">
            Aucune application n'est encore attribuée à votre rôle.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Contactez l'administrateur du portail.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => window.location.href = 'mailto:info@sbee.bj'}
          >
            Écrire à l'administrateur
          </Button>
        </div>
      ) : (
        <>
          {/* Filtres de catégories */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par catégorie">
            {categories.map((category) => {
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
                        <LayoutGrid className="w-6 h-6 text-muted-foreground" strokeWidth={1.5} />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground num">v{app.version || '1.0.0'}</span>
                  </div>

                  <h3 className="font-semibold text-foreground leading-snug">
                    {app.name}
                  </h3>
                  {app.category && (
                    <Badge variant="outline" className="mt-2">
                      {app.category}
                    </Badge>
                  )}
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {app.description}
                  </p>

                  <span className="mt-auto pt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    Ouvrir
                    <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-sbee-red transition-colors duration-[120ms]" strokeWidth={1.5} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* État vide : aucun résultat de filtre */
            <div className="bg-surface border border-border rounded-lg px-6 py-16 text-center">
              <Search className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1.5} />
              <p className="text-foreground font-medium">
                Aucune application ne correspond à votre recherche.
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
        </>
      )}
    </div>
  );
}
