import { useState } from 'react';
import { ArrowLeft, MessageSquare, Plus, Search, Clock, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface Ticket {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

interface SupportTicketsProps {
  onBack: () => void;
}

export default function SupportTickets({ onBack }: SupportTicketsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technique',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 1,
      title: 'Impossible d\'accéder à l\'application Facturation',
      description: 'Je reçois une erreur 403 lorsque j\'essaie d\'accéder à l\'application Facturation. Pouvez-vous vérifier mes permissions ?',
      category: 'Accès',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2026-01-20 09:30',
      updatedAt: '2026-01-20 10:15',
      assignedTo: 'Support Technique',
    },
    {
      id: 2,
      title: 'Demande de réinitialisation de mot de passe',
      description: 'J\'ai oublié mon mot de passe et je n\'arrive pas à le réinitialiser via le lien "Mot de passe oublié".',
      category: 'Compte',
      priority: 'urgent',
      status: 'resolved',
      createdAt: '2026-01-19 14:20',
      updatedAt: '2026-01-19 15:45',
      assignedTo: 'Admin Sécurité',
    },
    {
      id: 3,
      title: 'Suggestion : Ajouter une application de suivi de projet',
      description: 'Il serait utile d\'avoir une application dédiée pour le suivi des projets en cours.',
      category: 'Suggestion',
      priority: 'low',
      status: 'open',
      createdAt: '2026-01-18 11:00',
      updatedAt: '2026-01-18 11:00',
    },
    {
      id: 4,
      title: 'Problème de performance sur l\'application RH',
      description: 'L\'application RH est très lente depuis ce matin. Le chargement prend plus de 30 secondes.',
      category: 'Technique',
      priority: 'high',
      status: 'in-progress',
      createdAt: '2026-01-20 08:15',
      updatedAt: '2026-01-20 09:00',
      assignedTo: 'Support Technique',
    },
    {
      id: 5,
      title: 'Erreur lors de l\'export de données',
      description: 'J\'obtiens une erreur lorsque j\'essaie d\'exporter le rapport mensuel en format Excel.',
      category: 'Technique',
      priority: 'medium',
      status: 'open',
      createdAt: '2026-01-17 16:30',
      updatedAt: '2026-01-17 16:30',
    },
  ]);

  const categories = ['Technique', 'Accès', 'Compte', 'Suggestion', 'Autre'];

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTicket = () => {
    const newTicket: Ticket = {
      id: tickets.length + 1,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      status: 'open',
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setTickets([newTicket, ...tickets]);
    setIsCreateModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'Technique',
      priority: 'medium',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      open: 'Ouvert',
      'in-progress': 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: { [key: string]: string } = {
      low: 'Basse',
      medium: 'Moyenne',
      high: 'Haute',
      urgent: 'Urgente',
    };
    return labels[priority] || priority;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                #{ticket.id} - {ticket.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {ticket.description}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className={getStatusColor(ticket.status)}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(ticket.status)}
              <span>{getStatusLabel(ticket.status)}</span>
            </div>
          </Badge>
          <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
            Priorité: {getPriorityLabel(ticket.priority)}
          </Badge>
          <Badge variant="outline">
            {ticket.category}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-4">
            <span>Créé: {ticket.createdAt}</span>
            {ticket.assignedTo && (
              <span className="text-blue-600">Assigné: {ticket.assignedTo}</span>
            )}
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
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Support & Tickets</h1>
              </div>
            </div>
            <Button
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Ticket</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Ouverts</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {tickets.filter(t => t.status === 'open').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-3xl font-bold text-blue-600">
                  {tickets.filter(t => t.status === 'in-progress').length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Résolus</p>
                <p className="text-3xl font-bold text-green-600">
                  {tickets.filter(t => t.status === 'resolved').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher un ticket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="open">Ouverts</TabsTrigger>
            <TabsTrigger value="in-progress">En cours</TabsTrigger>
            <TabsTrigger value="resolved">Résolus</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </TabsContent>

          <TabsContent value="open" className="space-y-4">
            {filteredTickets.filter(t => t.status === 'open').map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </TabsContent>

          <TabsContent value="in-progress" className="space-y-4">
            {filteredTickets.filter(t => t.status === 'in-progress').map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {filteredTickets.filter(t => t.status === 'resolved').map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Ticket Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau ticket de support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Titre du problème</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Décrivez brièvement le problème..."
              />
            </div>
            <div>
              <Label htmlFor="description">Description détaillée</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Fournissez le maximum de détails sur le problème rencontré..."
                rows={5}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTicket} className="bg-blue-600 hover:bg-blue-700">
              Créer le ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
