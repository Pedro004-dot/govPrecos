import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  UserCheck,
  UserX,
  Key,
  Pencil,
  Mail,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, tenantsApi, type User, type UserPerfil, type Tenant } from '@/services/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const PERFIL_LABELS: Record<UserPerfil, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  operador: 'Operador',
  auditor: 'Auditor',
};

const PERFIL_COLORS: Record<UserPerfil, string> = {
  super_admin: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  admin: 'bg-primary/20 text-primary border-primary/30',
  operador: 'bg-muted text-muted-foreground',
  auditor: 'bg-muted text-muted-foreground',
};

export function UserManagement() {
  const { isSuperAdmin, tenant } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [showInactive]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, tenantsData] = await Promise.all([
        usersApi.list({ incluirInativos: showInactive }),
        isSuperAdmin ? tenantsApi.list() : Promise.resolve([]),
      ]);
      setUsers(usersData);
      setTenants(tenantsData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.nome.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  // Actions
  const handleToggleStatus = async (user: User) => {
    try {
      if (user.ativo) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.activate(user.id);
      }
      loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  return (
    <Card className="bg-card border-border/60">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              Usuários
            </CardTitle>
            <CardDescription>
              {isSuperAdmin
                ? 'Gerencie todos os usuários do sistema'
                : `Usuários de ${tenant?.nome || 'sua prefeitura'}`}
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo usuário
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-muted-foreground">Mostrar inativos</span>
          </label>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        ) : (
          <div className="border border-border/60 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  {isSuperAdmin && <TableHead>Prefeitura</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className={cn(!user.ativo && 'opacity-60')}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.nome}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(PERFIL_COLORS[user.perfil])}>
                        {PERFIL_LABELS[user.perfil]}
                      </Badge>
                    </TableCell>
                    {isSuperAdmin && (
                      <TableCell>
                        {user.tenantId ? (
                          <span className="text-sm">
                            {tenants.find((t) => t.id === user.tenantId)?.nome || '—'}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sistema</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {user.ativo ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setResetPasswordUser(user)}>
                            <Key className="w-4 h-4 mr-2" />
                            Redefinir senha
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user)}
                            className={user.ativo ? 'text-destructive' : 'text-success'}
                          >
                            {user.ativo ? (
                              <>
                                <UserX className="w-4 h-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <UserFormDialog
        open={createDialogOpen || !!editingUser}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        tenants={tenants}
        isSuperAdmin={isSuperAdmin}
        defaultTenantId={tenant?.id}
        onSuccess={loadData}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={!!resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
        user={resetPasswordUser}
      />
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// User Form Dialog
// ══════════════════════════════════════════════════════════════════════

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  tenants: Tenant[];
  isSuperAdmin: boolean;
  defaultTenantId?: string;
  onSuccess: () => void;
}

function UserFormDialog({
  open,
  onClose,
  user,
  tenants,
  isSuperAdmin,
  defaultTenantId,
  onSuccess,
}: UserFormDialogProps) {
  const isEditing = !!user;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<UserPerfil>('operador');
  const [tenantId, setTenantId] = useState<string>('');
  const [enviarEmail, setEnviarEmail] = useState(true);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (user) {
        setNome(user.nome);
        setEmail(user.email);
        setPerfil(user.perfil);
        setTenantId(user.tenantId || '');
      } else {
        setNome('');
        setEmail('');
        setPerfil('operador');
        setTenantId(defaultTenantId || '');
        setEnviarEmail(true);
      }
      setError(null);
    }
  }, [open, user, defaultTenantId]);

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await usersApi.update(user.id, { nome, perfil });
      } else {
        await usersApi.create({
          nome,
          email,
          perfil,
          tenantId: perfil === 'super_admin' ? null : tenantId || null,
          enviarEmail,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao salvar usuário';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar usuário' : 'Novo usuário'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do usuário'
              : 'Preencha os dados para criar um novo usuário'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do usuário"
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@prefeitura.gov.br"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="perfil">Perfil</Label>
            <Select value={perfil} onValueChange={(v) => setPerfil(v as UserPerfil)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin && (
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                )}
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="auditor">Auditor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isSuperAdmin && perfil !== 'super_admin' && (
            <div className="space-y-2">
              <Label htmlFor="tenant">Prefeitura</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma prefeitura" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!isEditing && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={enviarEmail}
                onChange={(e) => setEnviarEmail(e.target.checked)}
                className="rounded border-border"
              />
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>Enviar email de boas-vindas com senha temporária</span>
              </div>
            </label>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : isEditing ? (
              'Salvar alterações'
            ) : (
              'Criar usuário'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Reset Password Dialog
// ══════════════════════════════════════════════════════════════════════

interface ResetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

function ResetPasswordDialog({ open, onClose, user }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setNewPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user || newPassword.length < 8) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await usersApi.resetPassword(user.id, newPassword);
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao redefinir senha';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            {user && `Definir nova senha para ${user.nome}`}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <p className="font-medium">Senha redefinida com sucesso!</p>
            <p className="text-sm text-muted-foreground mt-1">
              O usuário pode fazer login com a nova senha.
            </p>
            <Button onClick={onClose} className="mt-4">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
                {newPassword.length > 0 && newPassword.length < 8 && (
                  <p className="text-xs text-destructive">
                    A senha deve ter pelo menos 8 caracteres
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || newPassword.length < 8}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  'Redefinir senha'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default UserManagement;
