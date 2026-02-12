import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, authStorage, type AuthUser, type LoginCredentials } from '@/services/auth';

// ══════════════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════════════

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tenant: {
    id: string;
    nome: string;
    cnpj: string;
    tipo: string;
  } | null;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canManageUsers: boolean;
  canManageTenants: boolean;
}

// ══════════════════════════════════════════════════════════════════════
// Context
// ══════════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextValue | null>(null);

// ══════════════════════════════════════════════════════════════════════
// Provider
// ══════════════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: authStorage.getUser(),
    isAuthenticated: !!authStorage.getAccessToken(),
    isLoading: true,
    tenant: null,
  });

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = authStorage.getAccessToken();

      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await authApi.me();
        if (response.success) {
          setState({
            user: response.usuario,
            isAuthenticated: true,
            isLoading: false,
            tenant: response.usuario.tenant ?? null,
          });
          authStorage.setUser(response.usuario);
        } else {
          throw new Error('Invalid response');
        }
      } catch {
        // Token invalid or expired
        authStorage.clear();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          tenant: null,
        });
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.login(credentials);

      if (!response.success) {
        throw new Error('Login failed');
      }

      // Fetch full user data including tenant
      const meResponse = await authApi.me();

      setState({
        user: meResponse.usuario,
        isAuthenticated: true,
        isLoading: false,
        tenant: meResponse.usuario.tenant ?? null,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await authApi.logout();
    } finally {
      authStorage.clear();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        tenant: null,
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.me();
      if (response.success) {
        setState((prev) => ({
          ...prev,
          user: response.usuario,
          tenant: response.usuario.tenant ?? null,
        }));
        authStorage.setUser(response.usuario);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Derived permissions
  const isSuperAdmin = state.user?.isSuperAdmin ?? false;
  const isAdmin = isSuperAdmin || state.user?.perfil === 'admin';
  const canManageUsers = isAdmin;
  const canManageTenants = isSuperAdmin;

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
    isSuperAdmin,
    isAdmin,
    canManageUsers,
    canManageTenants,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ══════════════════════════════════════════════════════════════════════
// Hook
// ══════════════════════════════════════════════════════════════════════

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ══════════════════════════════════════════════════════════════════════
// Protected Route Component
// ══════════════════════════════════════════════════════════════════════

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: 'admin' | 'super_admin';
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isSuperAdmin, isAdmin } = useAuth();

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="animate-pulse">
            <div className="w-12 h-12 rounded-full bg-primary/20" />
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    // Redirect will be handled by the router
    return null;
  }

  if (requiredPermission === 'super_admin' && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-display font-semibold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground">
          Esta página é restrita a administradores do sistema.
        </p>
      </div>
    );
  }

  if (requiredPermission === 'admin' && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-display font-semibold mb-2">Acesso Restrito</h1>
        <p className="text-muted-foreground">
          Esta página é restrita a administradores.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthContext;
