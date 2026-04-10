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

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
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

// Users API
export const usersApi = {
  getAll: () => api.get('/admin/users'),
  getStats: () => api.get('/admin/users/stats'),
  getOne: (id: number) => api.get(`/admin/users/${id}`),
  create: (data: any) => api.post('/admin/users', data),
  update: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
  toggleStatus: (id: number) => api.patch(`/admin/users/${id}/toggle`),
};

// Roles API
export const rolesApi = {
  getAll: () => api.get('/roles'),
  getOne: (id: number) => api.get(`/roles/${id}`),
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
