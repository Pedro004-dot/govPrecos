import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/common/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { Search } from '@/pages/Search';
import { Relatorios } from '@/pages/Relatorios';
import { AnaliseFornecedores } from '@/pages/AnaliseFornecedores';
import { ProjectEditor } from '@/pages/ProjectEditor';
import { ProjectDetails } from '@/pages/ProjectDetails';
import { BuscarItensParaItem } from '@/pages/BuscarItensParaItem';
import { ItemDetalhamento } from '@/pages/ItemDetalhamento';
import { ItemSourceManager } from '@/pages/ItemSourceManager';
import { Profile } from '@/pages/Profile';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

// Protected route wrapper - redirects to login if not authenticated
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Routes only for regular users (not super admin)
function RequireRegularUser({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admin can only access /admin
  if (isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper - redirects to appropriate page if already authenticated
function PublicOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // Super admin goes to /admin, others go to /
    return <Navigate to={isSuperAdmin ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
}

// Catch-all redirect based on user type
function CatchAllRedirect() {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isSuperAdmin ? '/admin' : '/'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <ForgotPasswordPage />
          </PublicOnly>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected routes for regular users (not super admin) */}
      <Route
        path="/"
        element={
          <RequireRegularUser>
            <MainLayout />
          </RequireRegularUser>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="buscar" element={<Search />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="inteligencia/fornecedores" element={<AnaliseFornecedores />} />

        {/* Cotações: projetos (Lei 14.133/2021) */}
        <Route path="projetos/novo" element={<ProjectEditor />} />
        <Route path="projeto/:id" element={<ProjectDetails />} />
        <Route path="projeto/:id/editar" element={<ProjectEditor />} />
        <Route path="projeto/:id/item/:itemId" element={<ItemDetalhamento />} />
        <Route path="projeto/:id/item/:itemId/buscar" element={<BuscarItensParaItem />} />
        <Route path="item/:id/fontes" element={<ItemSourceManager />} />
      </Route>

      {/* Admin routes - accessible by admins and super admins */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboard />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<CatchAllRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
