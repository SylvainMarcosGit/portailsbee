import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, PASSWORD_CHANGE_REQUIRED_EVENT } from '@/services/api';
import { toast } from 'sonner';

export interface User {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone?: string | null;
  direction?: string | null;
  titre_de_poste?: string | null;
  needs_password_change?: boolean;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  is_admin: boolean;
  created_at?: string;
}

export interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (matricule: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<User | null>;
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

  const login = async (matricule: string, password: string): Promise<LoginResult> => {
    // Pas de setIsLoading ici : le chargement global remplacerait toute l'application
    // (Toaster compris) et ferait perdre le message d'erreur. La page gère son propre état.
    try {
      const response = await authApi.login(matricule, password);
      const { token: newToken, user: newUser } = response.data;

      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      setToken(newToken);
      setUser(newUser);

      return { success: true };
    } catch (error: any) {
      const status = error.response?.status;
      let message = 'Connexion impossible. Vérifiez votre réseau puis réessayez.';

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
      } else if (status && status >= 500) {
        message = 'Le portail est momentanément indisponible. Réessayez dans un instant.';
      }

      return { success: false, message };
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

  const updateUser = (newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  // Recharge l'utilisateur courant depuis /me (ex. après changement du mot de passe initial)
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await authApi.me();
      const freshUser: User | undefined = response.data?.user;
      if (freshUser) {
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
        return freshUser;
      }
    } catch (error) {
      console.error("Erreur lors du rafraîchissement de l'utilisateur:", error);
    }
    return null;
  }, []);

  // Le serveur a refusé une requête (403 requires_password_change) : afficher l'écran bloquant
  useEffect(() => {
    const handler = () => {
      setUser((prev) => (prev && !prev.needs_password_change ? { ...prev, needs_password_change: true } : prev));
    };
    window.addEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, handler);
    return () => window.removeEventListener(PASSWORD_CHANGE_REQUIRED_EVENT, handler);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      updateUser,
      refreshUser,
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
