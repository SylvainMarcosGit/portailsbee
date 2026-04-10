import { useState } from 'react';
import { ArrowLeft, Bell, AlertCircle, Info, CheckCircle, XCircle, Trash2, MailOpen } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  timestamp: string;
  category: string;
}

interface NotificationsProps {
  onBack: () => void;
}

export default function Notifications({ onBack }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Maintenance planifiée',
      message: 'Une maintenance du système est prévue le 25 janvier de 2h à 4h du matin. Les services seront temporairement indisponibles.',
      type: 'warning',
      isRead: false,
      timestamp: '2026-01-20 10:30',
      category: 'Système',
    },
    {
      id: 2,
      title: 'Nouvelle application disponible',
      message: 'L\'application "Gestion de Projet" est maintenant disponible dans votre portail. Accédez-y depuis votre tableau de bord.',
      type: 'success',
      isRead: false,
      timestamp: '2026-01-20 09:15',
      category: 'Application',
    },
    {
      id: 3,
      title: 'Mise à jour de sécurité',
      message: 'Pour votre sécurité, veuillez mettre à jour votre mot de passe. Il est recommandé de changer votre mot de passe tous les 90 jours.',
      type: 'warning',
      isRead: true,
      timestamp: '2026-01-19 14:20',
      category: 'Sécurité',
    },
    {
      id: 4,
      title: 'Connexion réussie',
      message: 'Vous vous êtes connecté avec succès depuis un nouvel appareil (Windows PC - IP: 192.168.1.45)',
      type: 'info',
      isRead: true,
      timestamp: '2026-01-19 08:45',
      category: 'Connexion',
    },
    {
      id: 5,
      title: 'Échec de connexion détecté',
      message: 'Plusieurs tentatives de connexion infructueuses ont été détectées sur votre compte. Si ce n\'était pas vous, veuillez changer votre mot de passe immédiatement.',
      type: 'error',
      isRead: true,
      timestamp: '2026-01-18 23:12',
      category: 'Sécurité',
    },
    {
      id: 6,
      title: 'Permissions mises à jour',
      message: 'Vos permissions ont été mises à jour. Vous avez maintenant accès à l\'application "Comptabilité".',
      type: 'success',
      isRead: true,
      timestamp: '2026-01-17 16:30',
      category: 'Permissions',
    },
    {
      id: 7,
      title: 'Rapport mensuel disponible',
      message: 'Le rapport d\'utilisation du mois de décembre est maintenant disponible dans la section Statistiques.',
      type: 'info',
      isRead: true,
      timestamp: '2026-01-15 10:00',
      category: 'Rapport',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'success':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-300';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'À l\'instant';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    if (diffInHours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card className={`shadow-sm transition-all ${notification.isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)}`}>
            {getIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {notification.title}
                  </h3>
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {notification.category}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.timestamp)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              {notification.message}
            </p>
            <div className="flex items-center space-x-2">
              {!notification.isRead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                  className="flex items-center space-x-1 text-xs"
                >
                  <MailOpen className="w-3 h-3" />
                  <span>Marquer comme lu</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteNotification(notification.id)}
                className="flex items-center space-x-1 text-xs hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              >
                <Trash2 className="w-3 h-3" />
                <span>Supprimer</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
                <Bell className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {unreadCount > 0 && (
                  <Badge className="bg-red-600 text-white">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Tout marquer comme lu</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">
              Toutes ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              Non lues ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="read">
              Lues ({notifications.length - unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {notifications.map(notification => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </TabsContent>

          <TabsContent value="unread" className="space-y-4">
            {notifications.filter(n => !n.isRead).map(notification => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
            {unreadCount === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Aucune notification non lue
                </h3>
                <p className="text-gray-500">
                  Vous êtes à jour !
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-4">
            {notifications.filter(n => n.isRead).map(notification => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
            {notifications.filter(n => n.isRead).length === 0 && (
              <div className="text-center py-12">
                <Info className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Aucune notification lue
                </h3>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
