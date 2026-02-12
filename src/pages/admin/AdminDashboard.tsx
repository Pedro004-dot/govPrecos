import { useState } from 'react';
import {
  Users,
  Building2,
  ScrollText,
  Shield,
} from 'lucide-react';
import { useAuth, ProtectedRoute } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UserManagement } from './UserManagement';
import { TenantManagement } from './TenantManagement';

// ══════════════════════════════════════════════════════════════════════
// Admin Dashboard
// ══════════════════════════════════════════════════════════════════════

export function AdminDashboard() {
  const { user, isSuperAdmin, tenant } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  return (
    <ProtectedRoute requiredPermission="admin">
      <div className="space-y-6 animate-dash-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-semibold">
                Administração
              </h1>
            </div>
            <p className="text-muted-foreground">
              {isSuperAdmin
                ? 'Gerencie prefeituras, usuários e configurações do sistema'
                : `Gerencie os usuários de ${tenant?.nome || 'sua prefeitura'}`}
            </p>
          </div>

          {/* User info badge */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/60">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.nome}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Badge
              variant={isSuperAdmin ? 'default' : 'secondary'}
              className={cn(
                isSuperAdmin && 'bg-amber-500/20 text-amber-500 border-amber-500/30'
              )}
            >
              {isSuperAdmin ? 'Super Admin' : 'Admin'}
            </Badge>
          </div>
        </div>

        {/* Stats cards for super admin */}
        {isSuperAdmin && <AdminStatsCards />}

        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border/60 p-1 h-auto">
            <TabsTrigger
              value="users"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger
                value="tenants"
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Building2 className="w-4 h-4" />
                Prefeituras
              </TabsTrigger>
            )}
            <TabsTrigger
              value="logs"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ScrollText className="w-4 h-4" />
              Logs de Auditoria
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-0">
            <UserManagement />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="tenants" className="mt-0">
              <TenantManagement />
            </TabsContent>
          )}

          <TabsContent value="logs" className="mt-0">
            <AuditLogsPlaceholder />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Stats Cards (Super Admin only)
// ══════════════════════════════════════════════════════════════════════

function AdminStatsCards() {
  // These would ideally come from an API endpoint
  const stats = [
    {
      label: 'Prefeituras ativas',
      value: '—',
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Usuários ativos',
      value: '—',
      icon: Users,
      color: 'text-[hsl(38_82%_52%)]',
      bgColor: 'bg-[hsl(38_82%_52%/0.1)]',
    },
    {
      label: 'Projetos criados',
      value: '—',
      icon: ScrollText,
      color: 'text-[hsl(142_65%_42%)]',
      bgColor: 'bg-[hsl(142_65%_42%/0.1)]',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="font-display text-2xl font-semibold mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={cn('p-3 rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Audit Logs Placeholder
// ══════════════════════════════════════════════════════════════════════

function AuditLogsPlaceholder() {
  return (
    <Card className="bg-card border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-muted-foreground" />
          Logs de Auditoria
        </CardTitle>
        <CardDescription>
          Histórico de ações realizadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <ScrollText className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            Os logs de auditoria estarão disponíveis em breve.
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Todas as ações de criação, edição e exclusão serão registradas aqui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;
