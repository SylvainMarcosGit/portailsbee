import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

interface User {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (matricule: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Vérifier que le token est toujours valide
          const response = await authApi.me();
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          // Token invalide, nettoyer
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (matricule: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authApi.login(matricule, password);
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      toast.success('Connexion réussie !');
      return true;
    } catch (error: any) {
      let message = 'Erreur de connexion';

      if (error.response?.data) {
        message = error.response.data.message || message;

        // Prioriser les erreurs spécifiques de validation si disponibles
        const errors = error.response.data.errors;
        if (errors) {
          const firstField = Object.keys(errors)[0];
          if (firstField && Array.isArray(errors[firstField]) && errors[firstField][0]) {
            message = errors[firstField][0];
          }
        }
      }

      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      toast.success('Déconnexion réussie');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
