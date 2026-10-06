import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Users, Activity, Package, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { dashboardApi } from '@/services/api';
import { toast } from 'sonner';

interface AnalyticsProps {
  onBack: () => void;
}

interface Stats {
  users: {
    total: number;
    active: number;
  };
  applications: {
    total: number;
    active: number;
  };
  logins: {
    weekly: number;
    today: number;
  };
}

interface RecentActivity {
  id: number;
  user: string;
  action: string;
  description: string;
  time: string;
}

interface ConnectionByDay {
  day: string;
  connexions: number;
}

interface MonthlyTrend {
  month: string;
  total: number;
}

interface PeakHour {
  hour: string;
  value: number;
}

interface AppUsage {
  name: string;
  users: number;
  color: string;
}

export default function Analytics({ onBack }: AnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    users: { total: 0, active: 0 },
    applications: { total: 0, active: 0 },
    logins: { weekly: 0, today: 0 }
  });
  const [appsByCategory, setAppsByCategory] = useState<{ [key: string]: number }>({});
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [connectionsByDay, setConnectionsByDay] = useState<ConnectionByDay[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [appUsage, setAppUsage] = useState<AppUsage[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const isFirstLoad = !hasData;
    if (isFirstLoad) {
      setIsLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const response = await dashboardApi.getAdminStats();
      const data = response.data || {};

      if (data.stats) setStats(data.stats);
      setAppsByCategory(data.appsByCategory || {});
      setRecentActivities(Array.isArray(data.recentActivities) ? data.recentActivities : []);
      setConnectionsByDay(Array.isArray(data.connectionsByDay) ? data.connectionsByDay : []);
      setMonthlyTrend(Array.isArray(data.monthlyTrend) ? data.monthlyTrend : []);
      setPeakHours(Array.isArray(data.peakHours) ? data.peakHours : []);
      setAppUsage(Array.isArray(data.appUsage) ? data.appUsage : []);
      setHasData(true);
      setLoadError(null);
    } catch (error: any) {
      console.error('Erreur:', error);
      const message = error?.response?.status === 403
        ? 'Cette page est réservée aux administrateurs.'
        : error?.response?.data?.message || 'Impossible de charger les statistiques pour le moment.';
      setLoadError(message);
      if (!isFirstLoad) {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Transformer appsByCategory en données pour le graphique
  const categoryData = Object.entries(appsByCategory).map(([name, count]) => ({
    name,
    value: count
  }));

  // Palette : 1 seule série en rouge, puis bleu, puis gris
  const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];
  const MAX_PIE_SEGMENTS = 5;

  // Calculer le taux d'activité
  const activityRate = stats.users.total > 0
    ? Math.round((stats.users.active / stats.users.total) * 100)
    : 0;

  // --- Aides de rendu (présentation uniquement) ---
  const formatNumber = (n: number) => n.toLocaleString('fr-FR');
  // Les tranches arrivent déjà libellées ('08h-12h') : laissées telles quelles
  const formatHour = (h: string) => (/^\d{1,2}$/.test(String(h).trim()) ? `${String(h).trim()}h` : h);
  // '08h-12h' → '08h et 12h' pour le titre « Pic de connexions entre … »
  const formatSlot = (h: string) => {
    const parts = formatHour(h).split(/-/).map(p => p.trim()).filter(Boolean);
    return parts.length === 2 ? `${parts[0]} et ${parts[1]}` : formatHour(h);
  };

  // Regroupe au-delà de 5 segments : 4 plus gros + « Autres »
  const toPieSegments = (items: { name: string; value: number }[]) => {
    const sorted = [...items].sort((a, b) => b.value - a.value);
    if (sorted.length <= MAX_PIE_SEGMENTS) return sorted;
    const head = sorted.slice(0, MAX_PIE_SEGMENTS - 1);
    const rest = sorted.slice(MAX_PIE_SEGMENTS - 1).reduce((sum, i) => sum + i.value, 0);
    return [...head, { name: 'Autres', value: rest }];
  };

  const maxBy = <T,>(items: T[], get: (i: T) => number): T | null =>
    items.length === 0 ? null : items.reduce((best, i) => (get(i) > get(best) ? i : best), items[0]);

  const usageSegments = toPieSegments(appUsage.map(a => ({ name: a.name, value: a.users })));
  const usageTotal = usageSegments.reduce((s, i) => s + i.value, 0);
  const categorySegments = toPieSegments(categoryData);

  const hasDailyConnections = connectionsByDay.some(d => d.connexions > 0);
  const hasMonthlyTrend = monthlyTrend.some(m => m.total > 0);
  const hasPeakHours = peakHours.some(h => h.value > 0);

  const peakDay = maxBy(connectionsByDay, d => d.connexions);
  const peakHour = maxBy(peakHours, h => h.value);
  const topUsage = usageSegments[0];
  const topCategory = categorySegments[0];

  const firstMonth = monthlyTrend[0];
  const lastMonth = monthlyTrend[monthlyTrend.length - 1];
  const trendDelta = firstMonth && lastMonth && firstMonth.total > 0
    ? Math.round(((lastMonth.total - firstMonth.total) / firstMonth.total) * 100)
    : null;

  const dayTitle = peakDay && peakDay.connexions > 0
    ? `Pic sur 7 jours le ${peakDay.day} : ${formatNumber(peakDay.connexions)} connexions`
    : 'Connexions par jour, 7 derniers jours';
  const hourTitle = peakHour && peakHour.value > 0
    ? `Pic de connexions entre ${formatSlot(peakHour.hour)}`
    : 'Connexions par tranche horaire';
  const trendTitle = trendDelta === null || monthlyTrend.length < 2
    ? 'Connexions mensuelles sur 6 mois'
    : trendDelta === 0
      ? `Connexions stables entre ${firstMonth.month} et ${lastMonth.month}`
      : `Connexions en ${trendDelta > 0 ? 'hausse' : 'baisse'} de ${Math.abs(trendDelta)} % entre ${firstMonth.month} et ${lastMonth.month}`;
  const usageTitle = topUsage && usageTotal > 0 && topUsage.name !== 'Autres'
    ? `${topUsage.name} : application la plus utilisée (${formatNumber(topUsage.value)} utilisateur${topUsage.value > 1 ? 's' : ''} distinct${topUsage.value > 1 ? 's' : ''})`
    : 'Utilisateurs distincts par application';
  const categoryTitle = topCategory && topCategory.name !== 'Autres'
    ? `${topCategory.name} : catégorie la plus fournie (${formatNumber(topCategory.value)} application${topCategory.value > 1 ? 's' : ''})`
    : 'Applications par catégorie';

  // Styles recharts partagés
  const gridProps = { stroke: 'var(--border)', strokeDasharray: '3 3', vertical: false } as const;
  const axisProps = {
    tick: { fontSize: 12, fill: 'var(--muted-foreground)' },
    axisLine: { stroke: 'var(--border)' },
    tickLine: { stroke: 'var(--border)' },
  };
  const tooltipProps = {
    contentStyle: {
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      boxShadow: 'none',
      fontSize: 12,
    },
    cursor: { fill: 'var(--surface-2)' },
  };
  const legendProps = {
    iconType: 'square' as const,
    iconSize: 10,
    wrapperStyle: { fontSize: 12, color: 'var(--muted-foreground)' },
  };

  const LOG_SOURCE = 'Source : journaux de connexion du portail';

  const ChartMeta = ({ source = LOG_SOURCE }: { source?: string }) => (
    <p className="text-xs text-muted-foreground mt-4">{source}</p>
  );

  const ChartEmpty = ({ icon: Icon, text }: { icon: typeof Activity; text: string }) => (
    <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-center">
      <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-sbee-red animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des statistiques…</p>
        </div>
      </div>
    );
  }

  if (loadError && !hasData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-surface border border-border rounded-lg px-6 py-16 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground mb-4" strokeWidth={1.5} />
          <p className="text-foreground font-medium max-w-md mx-auto">{loadError}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              Retour
            </Button>
            <Button variant="outline" onClick={loadStats}>
              <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activityBadge = activityRate >= 80
    ? { variant: 'success' as const, label: 'Élevé' }
    : activityRate >= 50
      ? { variant: 'warning' as const, label: 'Moyen' }
      : { variant: 'destructive' as const, label: 'Faible' };

  const kpis = [
    {
      label: 'Utilisateurs',
      value: formatNumber(stats.users.total),
      icon: Users,
      meta: <><span className="num">{formatNumber(stats.users.active)}</span> actifs</>,
    },
    {
      label: "Connexions aujourd'hui",
      value: formatNumber(stats.logins.today),
      icon: Activity,
      meta: <><span className="num">{formatNumber(stats.logins.weekly)}</span> cette semaine</>,
    },
    {
      label: 'Applications',
      value: formatNumber(stats.applications.total),
      icon: Package,
      meta: <><span className="num">{formatNumber(stats.applications.active)}</span> actives</>,
    },
    {
      label: "Taux d'activité",
      value: `${activityRate} %`,
      icon: TrendingUp,
      meta: <Badge variant={activityBadge.variant}>{activityBadge.label}</Badge>,
    },
  ];

  const summaryRows = [
    { label: 'Utilisateurs actifs', value: stats.users.active, icon: Users, strong: true },
    { label: 'Utilisateurs inactifs', value: stats.users.total - stats.users.active, icon: Users, strong: false },
    { label: 'Applications actives', value: stats.applications.active, icon: Package, strong: true },
    { label: 'Applications inactives', value: stats.applications.total - stats.applications.active, icon: Package, strong: false },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Bandeau contexte */}
      <div className="bg-surface border border-border rounded-lg rail-accent px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Revenir à la page précédente" className="-ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Statistiques</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Connexions, utilisateurs et usage des applications du portail
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadStats} disabled={refreshing} aria-busy={refreshing}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          Actualiser les statistiques
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, meta }) => (
          <div key={label} className="bg-surface border border-border rounded-lg rail-accent p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-3xl font-semibold num text-foreground mt-2">{value}</p>
            <div className="text-sm text-muted-foreground mt-2">{meta}</div>
          </div>
        ))}
      </div>

      {/* Graphiques - ligne 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connexions par jour */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground">{dayTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">7 derniers jours</p>
          <div className="mt-6">
            {hasDailyConnections ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={connectionsByDay}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="day" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="connexions" radius={[4, 4, 0, 0]} name="Connexions">
                    {connectionsByDay.map((entry, index) => (
                      <Cell key={`day-${index}`} fill={entry === peakDay ? 'var(--chart-1)' : 'var(--chart-2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty icon={Activity} text="Aucune connexion enregistrée ces 7 derniers jours." />
            )}
          </div>
          <ChartMeta />
        </div>

        {/* Utilisation par application */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground">{usageTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">Utilisateurs distincts ayant ouvert chaque application, 30 derniers jours</p>
          <div className="mt-6">
            {usageTotal > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usageSegments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent = 0 }) => `${(percent * 100).toFixed(0)} %`}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    stroke="var(--surface)"
                    strokeWidth={2}
                  >
                    {usageSegments.map((_, index) => (
                      <Cell key={`usage-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                  <Legend {...legendProps} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty icon={Package} text="Aucune ouverture d'application sur les 30 derniers jours." />
            )}
          </div>
          <ChartMeta source="Source : journaux d'accès aux applications du portail" />
        </div>
      </div>

      {/* Graphiques - ligne 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendance mensuelle */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground">{trendTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">Connexions mensuelles, 6 derniers mois</p>
          <div className="mt-6">
            {hasMonthlyTrend ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="month" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip {...tooltipProps} cursor={{ stroke: 'var(--border-strong)' }} />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    name="Connexions"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty icon={TrendingUp} text="Pas encore assez d'historique pour afficher une tendance." />
            )}
          </div>
          <ChartMeta />
        </div>

        {/* Heures de pointe */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground">{hourTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">Connexions par tranche horaire</p>
          <div className="mt-6">
            {hasPeakHours ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="hour" {...axisProps} />
                  <YAxis {...axisProps} allowDecimals={false} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Connexions">
                    {peakHours.map((entry, index) => (
                      <Cell key={`hour-${index}`} fill={entry === peakHour ? 'var(--chart-1)' : 'var(--chart-2)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty icon={Activity} text="Aucune connexion enregistrée sur la période." />
            )}
          </div>
          <ChartMeta />
        </div>
      </div>

      {/* Catégories & résumé */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications par catégorie */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground">{categoryTitle}</h2>
          <p className="text-sm text-muted-foreground mt-1">Nombre d'applications par catégorie</p>
          <div className="mt-6">
            {categorySegments.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categorySegments}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ value }) => `${value}`}
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    stroke="var(--surface)"
                    strokeWidth={2}
                  >
                    {categorySegments.map((_, index) => (
                      <Cell key={`cat-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipProps} />
                  <Legend {...legendProps} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmpty icon={Package} text="Aucune application catégorisée pour le moment." />
            )}
          </div>
          <ChartMeta source="Source : catalogue des applications du portail" />
        </div>

        {/* Résumé */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h2 className="text-base font-semibold text-foreground">Résumé des comptes et applications</h2>
          <p className="text-sm text-muted-foreground mt-1">État actuel du portail</p>
          <div className="mt-6 border border-border rounded-lg overflow-hidden">
            {summaryRows.map(({ label, value, icon: Icon, strong }, i) => (
              <div
                key={label}
                className={`flex items-center justify-between h-14 px-4 ${i > 0 ? 'border-t border-border' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <span className={`text-2xl font-semibold num ${strong ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {formatNumber(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activités récentes */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-base font-semibold text-foreground">Activités récentes</h2>
        <p className="text-sm text-muted-foreground mt-1">Les 10 dernières actions enregistrées</p>
        <div className="mt-6">
          {recentActivities.length > 0 ? (
            <ul className="border border-border rounded-lg overflow-hidden">
              {recentActivities.map((activity, i) => (
                <li
                  key={activity.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2 transition-colors duration-[120ms] ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 shrink-0 bg-surface-3 border border-border rounded-full flex items-center justify-center text-foreground text-xs font-semibold">
                      {activity.user?.charAt(0) || 'S'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.user}</p>
                      <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground num whitespace-nowrap">{activity.time}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center text-center py-8 gap-2">
              <Activity className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
            </div>
          )}
          {recentActivities.length > 0 && <ChartMeta />}
        </div>
      </div>
    </div>
  );
}
