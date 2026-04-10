import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Users, Activity, Package, Download, Loader2 } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, Area, AreaChart
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
    setIsLoading(true);
    try {
      const response = await dashboardApi.getAdminStats();
      const data = response.data;
      
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.appsByCategory) {
        setAppsByCategory(data.appsByCategory);
      }
      if (data.recentActivities) {
        setRecentActivities(data.recentActivities);
      }
      if (data.connectionsByDay) {
        setConnectionsByDay(data.connectionsByDay);
      }
      if (data.monthlyTrend) {
        setMonthlyTrend(data.monthlyTrend);
      }
      if (data.peakHours) {
        setPeakHours(data.peakHours);
      }
      if (data.appUsage) {
        setAppUsage(data.appUsage);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  };

  // Transformer appsByCategory en données pour le graphique
  const categoryData = Object.entries(appsByCategory).map(([name, count]) => ({
    name,
    value: count
  }));

  const COLORS = ['#3b5998', '#00cc66', '#f9a825', '#ed1f24', '#6b7280', '#8b5cf6'];

  // Calculer le taux d'activité
  const activityRate = stats.users.total > 0 
    ? Math.round((stats.users.active / stats.users.total) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#3b5998] animate-spin" />
          <p className="text-gray-600">Chargement des statistiques...</p>
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
                <Activity className="w-6 h-6 text-[#3b5998]" />
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Statistiques & Analytics
                </h1>
              </div>
            </div>
            <Button 
              onClick={loadStats}
              className="flex items-center space-x-2 bg-[#3b5998] hover:bg-[#2d4373]"
            >
              <Activity className="w-4 h-4" />
              <span>Actualiser</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Utilisateurs Total</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.users.total}</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      {stats.users.active} actifs
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#3b5998]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connexions Aujourd'hui</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.logins.today}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">{stats.logins.weekly} cette semaine</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-[#00cc66]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.applications.total}</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                      {stats.applications.active} actives
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux d'Activité</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{activityRate}%</p>
                  <div className="flex items-center mt-2">
                    <Badge 
                      variant="outline" 
                      className={activityRate >= 80 
                        ? "bg-green-50 text-green-700 border-green-300" 
                        : activityRate >= 50 
                          ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                          : "bg-red-50 text-red-700 border-red-300"
                      }
                    >
                      {activityRate >= 80 ? 'Excellent' : activityRate >= 50 ? 'Moyen' : 'Faible'}
                    </Badge>
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Connexions par jour */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Connexions par jour</CardTitle>
              <CardDescription>Activité de la semaine en cours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={connectionsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="connexions" 
                    fill="#3b5998" 
                    radius={[4, 4, 0, 0]}
                    name="Connexions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Utilisation par application */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Utilisation par application</CardTitle>
              <CardDescription>Répartition des utilisateurs actifs</CardDescription>
            </CardHeader>
            <CardContent>
              {appUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="users"
                    >
                      {appUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Aucune donnée d'utilisation</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Tendance mensuelle */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Tendance mensuelle</CardTitle>
              <CardDescription>Évolution des connexions sur 6 mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#00cc66" 
                    strokeWidth={3}
                    dot={{ fill: '#00cc66', strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                    name="Connexions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Heures de pointe */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Heures de pointe</CardTitle>
              <CardDescription>Distribution des connexions par tranche horaire</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#f9a825" 
                    radius={[4, 4, 0, 0]}
                    name="Connexions"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Application by Category & Stats Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Application by Category Pie Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Applications par Catégorie</CardTitle>
              <CardDescription>Répartition des applications</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
              <CardDescription>Vue d'ensemble du système</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-[#3b5998]" />
                    <span className="font-medium">Utilisateurs actifs</span>
                  </div>
                  <span className="text-2xl font-bold text-[#3b5998]">{stats.users.active}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Utilisateurs inactifs</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-400">{stats.users.total - stats.users.active}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-[#00cc66]" />
                    <span className="font-medium">Applications actives</span>
                  </div>
                  <span className="text-2xl font-bold text-[#00cc66]">{stats.applications.active}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">Applications inactives</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-400">{stats.applications.total - stats.applications.active}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
            <CardDescription>Les 10 dernières actions sur le système</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#3b5998] rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {activity.user?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.user}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Aucune activité récente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
