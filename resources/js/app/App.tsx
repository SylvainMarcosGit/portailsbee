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
import Sidebar from '@/app/components/Sidebar';
import UserNavbar from '@/app/components/UserNavbar';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// SBEE Portal - Portail Captif Centralisé
type PageView = 'login' | 'dashboard' | 'user-dashboard' | 'user-management' | 'profile' | 'access-denied' | 'analytics' | 'app-management' | 'role-management';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#3b5998] mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
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
        return <UserManagement onBack={() => setCurrentPage('dashboard')} />;
      case 'profile':
        return <UserProfile onBack={() => userType === 'admin' ? setCurrentPage('dashboard') : setCurrentPage('user-dashboard')} />;
      case 'access-denied':
        return <AccessDenied onBack={() => setCurrentPage('dashboard')} />;
      case 'analytics':
        return <Analytics onBack={() => setCurrentPage('dashboard')} />;
      case 'app-management':
        return <ApplicationManagement onBack={() => setCurrentPage('dashboard')} />;
      case 'role-management':
        return <RoleManagement onBack={() => setCurrentPage('dashboard')} />;
      default:
        return userType === 'admin' ? <Dashboard /> : <SimpleUserDashboard />;
    }
  };

  return (
    <div className="min-h-screen">
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
      } transition-all duration-300`}>
        {renderPage()}
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