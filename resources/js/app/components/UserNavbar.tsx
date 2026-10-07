import { User, ChevronDown, LogOut, KeyRound } from 'lucide-react';
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
    <header className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Logo SBEE"
              className="w-9 h-10 object-contain"
            />
            <div className="border-l border-border pl-3">
              <p className="font-semibold text-foreground leading-tight">Portail des applications</p>
              <p className="text-xs text-muted-foreground">Société Béninoise d'Énergie Électrique</p>
            </div>
          </div>

          {/* User Profile Menu */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => onNavigate('vault')}
              className="h-11 text-muted-foreground hover:text-foreground"
              aria-label="Mes identifiants"
            >
              <KeyRound className="w-5 h-5" strokeWidth={1.5} />
              <span className="hidden md:inline text-sm">Mes identifiants</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-11 flex items-center gap-2">
                  <div className="w-9 h-9 bg-surface-3 border border-border rounded-full flex items-center justify-center text-foreground text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground">{fullName}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user?.role?.name || 'Utilisateur'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{fullName}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate('profile')} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Mon profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('vault')} className="cursor-pointer">
                  <KeyRound className="mr-2 h-4 w-4" />
                  <span>Mes identifiants</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
