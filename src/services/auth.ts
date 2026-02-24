import api from './api';

// ══════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  usuario: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  nome: string;
  perfil: 'super_admin' | 'admin' | 'operador' | 'auditor';
  tenantId: string | null;
  isSuperAdmin: boolean;
}

export interface MeResponse {
  success: boolean;
  usuario: AuthUser & {
    tenant?: {
      id: string;
      nome: string;
      cnpj: string;
      tipo: string;
      brasaoUrl?: string;
    };
  };
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ══════════════════════════════════════════════════════════════════════
// Auth Storage
// ══════════════════════════════════════════════════════════════════════

const AUTH_TOKEN_KEY = 'govprecos_access_token';
const REFRESH_TOKEN_KEY = 'govprecos_refresh_token';
const USER_KEY = 'govprecos_user';

export const authStorage = {
  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAccessToken: (token: string): void => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {}
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setRefreshToken: (token: string): void => {
    try {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch {}
  },

  getUser: (): AuthUser | null => {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setUser: (user: AuthUser): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {}
  },

  clear: (): void => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {}
  },
};

// ══════════════════════════════════════════════════════════════════════
// API Interceptor - Add auth header
// ══════════════════════════════════════════════════════════════════════

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      authStorage.clear();
      // Redirect to login if not already there
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ══════════════════════════════════════════════════════════════════════
// Auth API Functions
// ══════════════════════════════════════════════════════════════════════

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);

    if (response.data.success) {
      authStorage.setAccessToken(response.data.accessToken);
      authStorage.setRefreshToken(response.data.refreshToken);
      authStorage.setUser(response.data.usuario);
    }

    return response.data;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      authStorage.clear();
    }
  },

  /**
   * Get current user data
   */
  me: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>('/auth/me');
    return response.data;
  },

  /**
   * Request password reset
   */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/forgot-password', payload);
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async (payload: ResetPasswordPayload): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  },

  /**
   * Change own password
   */
  changePassword: async (payload: ChangePasswordPayload): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/change-password', payload);
    return response.data;
  },
};

export default authApi;
