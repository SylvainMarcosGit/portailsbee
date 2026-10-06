import {
  Users,
  Package,
  BarChart3,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Tags
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ currentPage, onNavigate, onLogout, isOpen, onToggle }: SidebarProps) {
  const menuItems = [
    { id: 'analytics', label: 'Statistiques', icon: BarChart3 },
    { id: 'app-management', label: 'Applications', icon: Package },
    { id: 'category-management', label: 'Catégories', icon: Tags },
    { id: 'user-management', label: 'Utilisateurs', icon: Users },
    { id: 'role-management', label: 'Rôles et accès', icon: ShieldCheck },
    { id: 'profile', label: 'Mon profil', icon: User },
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-[width] duration-200 ease-[var(--ease-out)] flex flex-col overflow-hidden ${
          isOpen ? 'w-64' : 'w-0 lg:w-20'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between h-16 px-4 border-b border-sidebar-border ${!isOpen && 'lg:justify-center lg:px-0'}`}>
          {isOpen && (
            <div className="flex items-center gap-3 min-w-0">
              <img src="/images/logo.png" alt="Logo SBEE" className="w-9 h-10 object-contain flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground leading-tight">SBEE</p>
                <p className="text-xs text-muted-foreground truncate">Administration du portail</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={isOpen ? 'Replier le menu' : 'Déplier le menu'}
            className="text-muted-foreground"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4" aria-label="Navigation principale">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full h-11 flex items-center gap-3 px-3 rounded-sm transition-colors duration-[120ms] ${
                      isActive
                        ? 'bg-sidebar-accent text-foreground font-semibold rail-accent'
                        : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                    } ${!isOpen && 'lg:justify-center'}`}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-sbee-red' : ''}`} strokeWidth={isActive ? 2 : 1.5} />
                    {isOpen && (
                      <span className="text-sm truncate">{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer - Logout */}
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={onLogout}
            className={`w-full h-11 flex items-center gap-3 px-3 rounded-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors duration-[120ms] ${
              !isOpen && 'lg:justify-center'
            }`}
            title={!isOpen ? 'Se déconnecter' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
            {isOpen && <span className="text-sm">Se déconnecter</span>}
          </button>
        </div>
      </aside>

      {/* Toggle button for mobile */}
      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label="Ouvrir le menu"
          className="fixed top-3 left-3 z-30 lg:hidden bg-surface w-11 h-11 flex items-center justify-center rounded-sm border border-border"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
