import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  FileText,
  LineChart,
  Users,
  Search,
  ChevronRight,
  ChevronDown,
  User,
  HelpCircle,
  Bell,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Shield,
  LogOut,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { LogoSymbol, LogoFull } from './Logo';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const m = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    m.addEventListener('change', handler);
    setMatches(m.matches);
    return () => m.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

type NavGroup = {
  label: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon?: React.ElementType }[];
  href?: string;
};

const baseNavStructure: NavGroup[] = [
  {
    label: 'Cotações',
    icon: ShoppingBag,
    children: [
      { label: 'Minhas cotações', href: '/', icon: ShoppingBag },
      { label: 'Meus relatórios', href: '/relatorios', icon: FileText },
    ],
  },
  {
    label: 'Inteligência de mercado',
    icon: LineChart,
    children: [
      { label: 'Análise de fornecedores', href: '/inteligencia/fornecedores', icon: Users },
    ],
  },
  {
    label: 'Busca rápida de preço',
    icon: Search,
    href: '/buscar',
  },
];

const adminNavItem: NavGroup = {
  label: 'Administração',
  icon: Shield,
  href: '/admin',
};

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLg = useMediaQuery('(min-width: 1024px)');
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, tenant, isAdmin, isSuperAdmin, logout } = useAuth();

  // Build nav structure based on user permissions
  // Super admin only sees admin page, regular admins see everything + admin
  const navStructure = isSuperAdmin
    ? [adminNavItem]
    : isAdmin
      ? [...baseNavStructure, adminNavItem]
      : baseNavStructure;

  const [userCollapsed, setUserCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  // Em telas pequenas sempre recolhida; em telas grandes segue a preferência do usuário
  const collapsed = !isLg || userCollapsed;

  const toggleSidebar = () => {
    setUserCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {}
      return next;
    });
  };

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Cotações: true,
    'Inteligência de mercado': false,
  });

  const toggleExpanded = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const navItemBase = 'rounded-md text-sm font-medium transition-all duration-150 text-[hsl(var(--sidebar-dark-muted))] hover:bg-[hsl(var(--sidebar-dark-hover))] hover:text-[hsl(var(--sidebar-dark-foreground))]';
  const navItemActive = 'sidebar-item-active';

  return (
    <aside
      className={cn(
        'min-h-screen flex flex-col shrink-0 transition-[width] duration-200 ease-in-out',
        'bg-[hsl(var(--sidebar-dark))] text-[hsl(var(--sidebar-dark-foreground))]',
        'border-r border-[hsl(var(--sidebar-dark-border))]',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ── Logo ── */}
      <div className={cn(
        'flex-shrink-0 border-b border-[hsl(var(--sidebar-dark-border))]',
        collapsed ? 'p-3 flex justify-center items-center' : 'px-4 py-4 flex items-center'
      )}>
        <Link to="/" className="inline-flex items-center justify-center">
          {collapsed ? (
            <LogoSymbol className="h-12 w-12" variant="sidebar" />
          ) : (
            <LogoFull className="h-16 w-auto" variant="sidebar" />
          )}
        </Link>
      </div>

      {/* Toggle expandir/recolher (apenas em telas grandes) */}
      {isLg && (
        <div className={cn(
          'flex-shrink-0 border-b border-[hsl(var(--sidebar-dark-border))]',
          collapsed ? 'p-2 flex justify-center' : 'px-3 py-2'
        )}>
          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'rounded-md transition-colors text-[hsl(var(--sidebar-dark-muted))] hover:text-[hsl(var(--sidebar-dark-foreground))] hover:bg-[hsl(var(--sidebar-dark-hover))]',
              collapsed ? 'p-2' : 'flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium'
            )}
          >
            {collapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <>
                <PanelLeftClose className="w-5 h-5 shrink-0" />
                Recolher menu
              </>
            )}
          </button>
        </div>
      )}

      {/* Navegação */}
      <nav className={cn(
        'flex-1 overflow-y-auto space-y-1 flex-shrink min-h-0',
        collapsed ? 'py-3 px-2' : 'py-4 px-3'
      )}>
        {navStructure.map((group) => {
          if (group.children && group.children.length > 0) {
            const isOpen = expanded[group.label] ?? false;
            const hasActiveChild = group.children.some((c) => isActive(c.href));

            if (collapsed) {
              return (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      title={group.label}
                      className={cn(
                        'w-full flex items-center justify-center py-2.5 rounded-md',
                        navItemBase,
                        hasActiveChild && navItemActive
                      )}
                    >
                      <group.icon className="w-5 h-5 text-[hsl(var(--sidebar-dark-muted))]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-56">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {group.children.map((child) => {
                      const active = isActive(child.href);
                      const Icon = child.icon;
                      return (
                        <DropdownMenuItem key={child.href} asChild>
                          <Link
                            to={child.href}
                            className={cn(active && 'bg-primary/10 font-medium')}
                          >
                            {Icon && <Icon className="mr-2 h-4 w-4" />}
                            {child.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            return (
              <div key={group.label} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleExpanded(group.label)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md',
                    navItemBase,
                    hasActiveChild && 'bg-[hsl(var(--sidebar-dark-hover))]'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <group.icon className="w-5 h-5 text-[hsl(var(--sidebar-dark-muted))]" />
                    {group.label}
                  </span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="ml-4 pl-3 border-l border-[hsl(var(--sidebar-dark-border))] space-y-0.5">
                    {group.children.map((child) => {
                      const active = isActive(child.href);
                      const Icon = child.icon;
                      return (
                        <Link
                          key={child.href}
                          to={child.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150',
                            active
                              ? 'sidebar-item-active font-medium'
                              : 'text-[hsl(var(--sidebar-dark-muted))] hover:text-[hsl(var(--sidebar-dark-foreground))] hover:bg-[hsl(var(--sidebar-dark-hover))]'
                          )}
                        >
                          {Icon && <Icon className="w-4 h-4 shrink-0" />}
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (group.href) {
            const active = isActive(group.href);
            const Icon = group.icon;

            if (collapsed) {
              return (
                <Link
                  key={group.label}
                  to={group.href}
                  title={group.label}
                  className={cn(
                    'w-full flex items-center justify-center py-2.5 rounded-md',
                    navItemBase,
                    active && navItemActive
                  )}
                >
                  <Icon className="w-5 h-5 text-[hsl(var(--sidebar-dark-muted))]" />
                </Link>
              );
            }

            return (
              <Link
                key={group.label}
                to={group.href}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2.5 rounded-md',
                  navItemBase,
                  active && navItemActive
                )}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[hsl(var(--sidebar-dark-muted))]" />
                  {group.label}
                </span>
                <ChevronRight className="w-4 h-4 shrink-0 opacity-70" />
              </Link>
            );
          }

          return null;
        })}
      </nav>

      {/* Rodapé: usuário, tema, ajuda, notificações */}
      <div
        className={cn(
          'flex-shrink-0 border-t border-[hsl(var(--sidebar-dark-border))]',
          collapsed ? 'p-2 flex flex-col items-center gap-1' : 'p-3 flex items-center gap-2'
        )}
      >
        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Minha conta"
              className={cn(
                'rounded-full transition-colors hover:ring-2 hover:ring-[hsl(var(--sidebar-dark-hover))]',
                collapsed ? '' : 'mr-auto'
              )}
            >
              <Avatar className="h-8 w-8 rounded-full bg-primary text-primary-foreground shrink-0">
                {tenant?.brasaoUrl && (
                  <AvatarImage src={tenant.brasaoUrl} alt="Brasão da prefeitura" className="object-contain" />
                )}
                <AvatarFallback className="text-xs font-semibold">
                  {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.nome || 'Usuário'}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {user?.email || 'email@exemplo.com'}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            {(isAdmin || isSuperAdmin) && (
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <Shield className="mr-2 h-4 w-4" />
                Administração
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          className="rounded-md p-2 text-[hsl(var(--sidebar-dark-muted))] hover:text-[hsl(var(--sidebar-dark-foreground))] hover:bg-[hsl(var(--sidebar-dark-hover))] transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <button
          type="button"
          title="Ajuda"
          className="rounded-md p-2 text-[hsl(var(--sidebar-dark-muted))] hover:text-[hsl(var(--sidebar-dark-foreground))] hover:bg-[hsl(var(--sidebar-dark-hover))] transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          type="button"
          title="Notificações"
          className="relative rounded-md p-2 text-[hsl(var(--sidebar-dark-muted))] hover:text-[hsl(var(--sidebar-dark-foreground))] hover:bg-[hsl(var(--sidebar-dark-hover))] transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>
      </div>
    </aside>
  );
}
