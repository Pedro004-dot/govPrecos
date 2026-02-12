import axios from 'axios';

// Must match keys in auth.ts
const STORAGE_KEYS = {
  token: 'govprecos_access_token',
  user: 'govprecos_user',
};

// API Base URL - uses environment variable in production, proxy in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create an axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Get current user's tenantId and usuarioId from localStorage
 */
export const getAuthParams = (): { tenantId: string; usuarioId: string } => {
  const userStr = localStorage.getItem(STORAGE_KEYS.user);

  if (!userStr) {
    console.warn('[api] Usuário não encontrado no localStorage');
    return { tenantId: '', usuarioId: '' };
  }

  try {
    const user = JSON.parse(userStr);
    return {
      tenantId: user.tenantId || '',
      usuarioId: user.id || '',
    };
  } catch (error) {
    console.error('[api] Erro ao parsear usuário do localStorage:', error);
    return { tenantId: '', usuarioId: '' };
  }
};

export default api;
