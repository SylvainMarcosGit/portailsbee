import { ArrowLeft, Settings, Save, Bell, Shield, Globe, Palette, Clock, Database } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Separator } from '@/app/components/ui/separator';

interface SystemSettingsProps {
  onBack: () => void;
}

export default function SystemSettings({ onBack }: SystemSettingsProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Paramètres Système</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Apparence</TabsTrigger>
            <TabsTrigger value="advanced">Avancé</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Paramètres généraux</span>
                </CardTitle>
                <CardDescription>
                  Configuration de base du portail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="portal-name">Nom du portail</Label>
                  <Input
                    id="portal-name"
                    defaultValue="Portail SBEE"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Le nom affiché dans le titre du portail
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="company-name">Nom de l'organisation</Label>
                  <Input
                    id="company-name"
                    defaultValue="Société Béninoise d'Énergie Électrique"
                    className="mt-2"
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="support-email">Email de support</Label>
                  <Input
                    id="support-email"
                    type="email"
                    defaultValue="support@sbee.bj"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Adresse email pour les demandes de support
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <select
                    id="timezone"
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue="Africa/Porto-Novo"
                  >
                    <option value="Africa/Porto-Novo">Afrique/Porto-Novo (GMT+1)</option>
                    <option value="Africa/Lagos">Afrique/Lagos (GMT+1)</option>
                    <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                  </select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mode maintenance</Label>
                    <p className="text-sm text-gray-600">
                      Activer le mode maintenance pour le portail
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Paramètres de sécurité</span>
                </CardTitle>
                <CardDescription>
                  Gérez les paramètres de sécurité et d'authentification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Double authentification obligatoire</Label>
                    <p className="text-sm text-gray-600">
                      Forcer tous les utilisateurs à activer la 2FA
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="session-timeout">Durée de session (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    defaultValue="60"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Déconnexion automatique après inactivité
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="password-expiry">Expiration du mot de passe (jours)</Label>
                  <Input
                    id="password-expiry"
                    type="number"
                    defaultValue="90"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Forcer le changement de mot de passe régulièrement
                  </p>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="max-login-attempts">Tentatives de connexion maximum</Label>
                  <Input
                    id="max-login-attempts"
                    type="number"
                    defaultValue="3"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nombre de tentatives avant verrouillage du compte
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Journalisation des activités</Label>
                    <p className="text-sm text-gray-600">
                      Enregistrer toutes les actions utilisateurs
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications de connexion suspecte</Label>
                    <p className="text-sm text-gray-600">
                      Alerter les utilisateurs en cas d'activité inhabituelle
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Paramètres de notifications</span>
                </CardTitle>
                <CardDescription>
                  Configurez les notifications système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications par email</Label>
                    <p className="text-sm text-gray-600">
                      Envoyer des emails pour les événements importants
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications de connexion</Label>
                    <p className="text-sm text-gray-600">
                      Notifier lors de chaque connexion réussie
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alertes de sécurité</Label>
                    <p className="text-sm text-gray-600">
                      Notifications pour les événements de sécurité
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications de maintenance</Label>
                    <p className="text-sm text-gray-600">
                      Alerter avant les maintenances planifiées
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mises à jour système</Label>
                    <p className="text-sm text-gray-600">
                      Notification des nouvelles fonctionnalités
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Paramètres d'apparence</span>
                </CardTitle>
                <CardDescription>
                  Personnalisez l'apparence du portail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Thème</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div className="border-2 border-blue-600 rounded-lg p-4 cursor-pointer bg-white">
                      <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded mb-2"></div>
                      <p className="text-sm text-center font-medium">Clair (Actuel)</p>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer bg-gray-50">
                      <div className="w-full h-20 bg-gradient-to-br from-gray-700 to-gray-900 rounded mb-2"></div>
                      <p className="text-sm text-center">Sombre</p>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer bg-gray-50">
                      <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-gray-700 rounded mb-2"></div>
                      <p className="text-sm text-center">Automatique</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="primary-color">Couleur principale</Label>
                  <div className="flex items-center space-x-4 mt-2">
                    <Input
                      id="primary-color"
                      type="color"
                      defaultValue="#2563eb"
                      className="w-20 h-10"
                    />
                    <span className="text-sm text-gray-600">#2563eb (Bleu par défaut)</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Animations</Label>
                    <p className="text-sm text-gray-600">
                      Activer les animations et transitions
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mode compact</Label>
                    <p className="text-sm text-gray-600">
                      Réduire l'espacement pour afficher plus de contenu
                    </p>
                  </div>
                  <Switch />
                </div>

                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Paramètres avancés</span>
                </CardTitle>
                <CardDescription>
                  Configuration technique du système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="api-url">URL de l'API backend</Label>
                  <Input
                    id="api-url"
                    defaultValue="https://api.sbee.bj"
                    className="mt-2"
                  />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="cache-duration">Durée du cache (secondes)</Label>
                  <Input
                    id="cache-duration"
                    type="number"
                    defaultValue="300"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Temps de conservation des données en cache
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mode développeur</Label>
                    <p className="text-sm text-gray-600">
                      Afficher les informations de débogage
                    </p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sauvegarde automatique</Label>
                    <p className="text-sm text-gray-600">
                      Sauvegarde quotidienne de la base de données
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Separator />

                <div>
                  <Label htmlFor="log-retention">Rétention des logs (jours)</Label>
                  <Input
                    id="log-retention"
                    type="number"
                    defaultValue="90"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Durée de conservation des journaux d'audit
                  </p>
                </div>

                <Separator />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Zone danger
                  </h4>
                  <p className="text-sm text-yellow-800 mb-3">
                    Les actions ci-dessous peuvent affecter le fonctionnement du système
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="border-yellow-300">
                      Vider le cache
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50">
                      Réinitialiser les paramètres
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2">
                    <Save className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
