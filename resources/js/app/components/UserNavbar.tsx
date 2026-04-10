import { Zap, User, ChevronDown } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface UserNavbarProps {
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function UserNavbar({ onNavigate, onLogout }: UserNavbarProps) {
  const { user } = useAuth();

  const initials = user ? `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}` : 'U';
  const fullName = user ? `${user.prenom} ${user.nom}` : 'Utilisateur';

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10">
                <img
                  src="/images/logo.png"
                  alt="SBEE"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-poppins)' }}>SBEE</h1>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'var(--font-gothic)' }}>Portail des applications</p>
              </div>
            </div>
          </div>

          {/* User Profile Menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <div className="w-9 h-9 bg-[#3b5998] rounded-full flex items-center justify-center text-white font-semibold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{fullName}</p>
                    <p className="text-xs text-gray-500">{user?.role?.name || 'Utilisateur'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{fullName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mon profil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}