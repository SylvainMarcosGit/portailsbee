import { 
  Users, 
  Package, 
  BarChart3, 
  User, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
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
    { id: 'app-management', label: 'Gestion des apps', icon: Package },
    { id: 'user-management', label: 'Gestion utilisateurs', icon: Users },
    { id: 'role-management', label: 'Gestion des rôles', icon: ShieldCheck },
    { id: 'profile', label: 'Mon profil', icon: User },
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-[#3b5998] border-r border-[rgba(255,255,255,0.1)] shadow-lg z-50 transition-all duration-300 flex flex-col ${
          isOpen ? 'w-64' : 'w-0 lg:w-20'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.1)] ${!isOpen && 'lg:justify-center'}`}>
          {isOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f9a825] to-[#ed1f24] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h2 className="font-bold text-white" style={{ fontFamily: 'var(--font-poppins)' }}>SBEE</h2>
                <p className="text-xs text-gray-300" style={{ fontFamily: 'var(--font-gothic)' }}>Portail des applications</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-2 text-white hover:bg-[rgba(255,255,255,0.1)]"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#f9a825] text-white font-medium'
                        : 'text-gray-200 hover:bg-[rgba(255,255,255,0.1)]'
                    } ${!isOpen && 'lg:justify-center'}`}
                    title={!isOpen ? item.label : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
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
        <div className="border-t border-[rgba(255,255,255,0.1)] p-2">
          <button
            onClick={onLogout}
            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-[#ed1f24] hover:bg-[rgba(237,31,36,0.1)] transition-colors ${
              !isOpen && 'lg:justify-center'
            }`}
            title={!isOpen ? 'Déconnexion' : ''}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="text-sm">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Toggle button for mobile */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-30 lg:hidden bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
}