import { useState, useEffect } from 'react';
import LoginPage from '@/app/components/LoginPage';
import Dashboard from '@/app/components/Dashboard';
import SimpleUserDashboard from '@/app/components/SimpleUserDashboard';
import UserManagement from '@/app/components/UserManagement';
import UserProfile from '@/app/components/UserProfile';
import AccessDenied from '@/app/components/AccessDenied';
import Analytics from '@/app/components/Analytics';
import ApplicationManagement from '@/app/components/ApplicationManagement';
import RoleManagement from '@/app/components/RoleManagement';
import CategoryManagement from '@/app/components/CategoryManagement';
import Sidebar from '@/app/components/Sidebar';
import UserNavbar from '@/app/components/UserNavbar';
import PasswordChangeRequired from '@/app/components/PasswordChangeRequired';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// SBEE Portal - Portail Captif Centralisé
type PageView = 'login' | 'dashboard' | 'user-dashboard' | 'user-management' | 'profile' | 'access-denied' | 'analytics' | 'app-management' | 'role-management' | 'category-management';

function AppContent() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageView>('login');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Déterminer le type d'utilisateur
  const userType = user?.is_admin ? 'admin' : 'user';

  // Rediriger après connexion/déconnexion
  useEffect(() => {
    if (isAuthenticated && user) {
      if (currentPage === 'login') {
        setCurrentPage(user.is_admin ? 'app-management' : 'user-dashboard');
      }
    } else if (!isLoading && !isAuthenticated) {
      setCurrentPage('login');
    }
  }, [isAuthenticated, user, isLoading]);

  const handleLoginSuccess = () => {
    // Le useEffect ci-dessus gérera la redirection
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage('login');
  };

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-sbee-red mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification de votre session…</p>
        </div>
      </div>
    );
  }

  // Première connexion (mot de passe initial) : écran bloquant à la place de tout le portail
  if (isAuthenticated && user?.needs_password_change) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <PasswordChangeRequired />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
      case 'dashboard':
        return <Dashboard />;
      case 'user-dashboard':
        return <SimpleUserDashboard />;
      case 'user-management':
        return <UserManagement onBack={() => setCurrentPage('app-management')} />;
      case 'profile':
        return <UserProfile onBack={() => userType === 'admin' ? setCurrentPage('app-management') : setCurrentPage('user-dashboard')} />;
      case 'access-denied':
        return <AccessDenied onBack={() => setCurrentPage('app-management')} />;
      case 'analytics':
        return <Analytics onBack={() => setCurrentPage('app-management')} />;
      case 'app-management':
        return (
          <ApplicationManagement
            onBack={() => setCurrentPage('app-management')}
            onManageCategories={() => setCurrentPage('category-management')}
          />
        );
      case 'category-management':
        return <CategoryManagement onBack={() => setCurrentPage('app-management')} />;
      case 'role-management':
        return <RoleManagement onBack={() => setCurrentPage('app-management')} />;
      default:
        return userType === 'admin' ? <Dashboard /> : <SimpleUserDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-2">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar - only shown for admin users and not on login page */}
      {currentPage !== 'login' && userType === 'admin' && isAuthenticated && (
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page as PageView)}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}

      {/* User Navbar - only shown for simple users and not on login page */}
      {currentPage !== 'login' && userType === 'user' && isAuthenticated && (
        <UserNavbar
          onNavigate={(page) => setCurrentPage(page as PageView)}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content */}
      <div className={`${
        currentPage !== 'login' && userType === 'admin' && isAuthenticated
          ? (isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20') 
          : ''
      } transition-[margin] duration-200 ease-[var(--ease-out)] flex flex-col min-h-screen`}>
        <div className="flex-1">{renderPage()}</div>
        {currentPage !== 'login' && isAuthenticated && (
          <footer className="border-t border-border bg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">La SBEE</span>, des femmes et des hommes à votre service 24h/24
              </p>
              <p>Portail des applications SBEE</p>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}