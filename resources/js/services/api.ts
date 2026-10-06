import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Événement émis quand le serveur exige le changement du mot de passe initial
export const PASSWORD_CHANGE_REQUIRED_EVENT = 'password-change-required';

// Mot de passe initial attribué à la création / réinitialisation d'un compte
export const MOT_DE_PASSE_INITIAL = '12345@SBEE';

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.requires_password_change === true) {
      // Mot de passe initial : AuthContext affiche l'écran bloquant de changement
      window.dispatchEvent(new CustomEvent(PASSWORD_CHANGE_REQUIRED_EVENT));
    }
    const isLoginRequest = (error.config?.url || '').endsWith('/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (matricule: string, password: string) =>
    api.post('/login', { matricule, password }),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  changePassword: (data: { current_password: string; new_password: string; new_password_confirmation: string }) =>
    api.put('/profile/password', {
      current_password: data.current_password,
      password: data.new_password,
      password_confirmation: data.new_password_confirmation,
    }),
};

// Profile API
export const profileApi = {
  update: (data: { email: string }) => api.put('/profile', data),
};

// Applications API
export const applicationsApi = {
  // User routes
  getAll: () => api.get('/applications'),
  getMyApps: () => api.get('/applications'),
  accessApp: (id: number) => api.get(`/applications/${id}/access`),

  // Admin routes
  getAllAdmin: () => api.get('/admin/applications'),
  getOne: (id: number) => api.get(`/admin/applications/${id}`),
  create: (data: any) => api.post('/admin/applications', data),
  update: (id: number, data: any) => api.put(`/admin/applications/${id}`, data),
  delete: (id: number) => api.delete(`/admin/applications/${id}`),
  toggleStatus: (id: number) => api.patch(`/admin/applications/${id}/toggle`),
};

// Categories API
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  applications_count: number;
}

export interface CategoryPayload {
  name: string;
  description?: string | null;
}

export const categoriesApi = {
  getAll: () => api.get<{ categories: Category[] }>('/categories'),
  create: (data: CategoryPayload) =>
    api.post<{ message: string; category: Category }>('/admin/categories', data),
  update: (id: number, data: CategoryPayload) =>
    api.put<{ message: string; category: Category }>(`/admin/categories/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/admin/categories/${id}`),
};

// Users API
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
  isActive: boolean;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  applications?: Array<{
    id: number;
    name: string;
  }>;
}

export interface Employe {
  matricule: string;
  prenom: string;
  nom: string;
  titre_de_poste: string | null;
  direction: string | null;
}

export interface CreateUserPayload {
  matricule: string;
  email?: string | null;
  telephone?: string | null;
  role_id: number;
  is_active?: boolean;
}

export interface UpdateUserPayload {
  email?: string | null;
  telephone?: string | null;
  role_id?: number;
  is_active?: boolean;
}

export const usersApi = {
  getAll: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/users/stats'),
  getOne: (id: number) => api.get(`/admin/users/${id}`),
  searchEmployee: (matricule: string, signal?: AbortSignal) =>
    api.get<{ employe: Employe }>(`/admin/employes/${encodeURIComponent(matricule)}`, { signal }),
  create: (data: CreateUserPayload) =>
    api.post<{ message: string; user: User }>('/admin/users', data),
  update: (id: number, data: UpdateUserPayload) => api.put(`/admin/users/${id}`, data),
  resetPassword: (id: number) =>
    api.post<{ message: string }>(`/admin/users/${id}/reset-password`),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id: number) => api.patch(`/admin/users/${id}/toggle`),
};

// Roles API
export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_system: boolean;
  users_count?: number;
  applications?: Array<{
    id: number;
    name: string;
    category?: string;
    is_active?: boolean;
  }>;
}

export interface CreateRolePayload {
  name: string;
  description?: string | null;
  application_ids?: number[];
}

export interface UpdateRolePayload {
  name: string;
  description?: string | null;
}

export const rolesApi = {
  getAll: () => api.get('/roles'),
  getOne: (id: number) => api.get(`/roles/${id}`),
  create: (data: CreateRolePayload) =>
    api.post<{ message: string; role: Role }>('/roles', data),
  update: (id: number, data: UpdateRolePayload) =>
    api.put<{ message: string; role: Role }>(`/roles/${id}`, data),
  delete: (id: number) => api.delete<{ message: string }>(`/roles/${id}`),
  updateApplications: (id: number, applicationIds: number[]) =>
    api.put(`/roles/${id}/applications`, { application_ids: applicationIds }),
};

// Dashboard API
export const dashboardApi = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getUserStats: () => api.get('/dashboard/user'),
};

// Activity Logs API
export const activityLogsApi = {
  getAll: (params?: any) => api.get('/admin/activity-logs', { params }),
  getStats: () => api.get('/admin/activity-logs/stats'),
};

export default api;
