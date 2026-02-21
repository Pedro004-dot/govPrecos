import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { tenantsApi, type Tenant, type TenantTipo } from '@/services/admin';
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

const TIPO_LABELS: Record<TenantTipo, string> = {
  prefeitura: 'Prefeitura',
  camara: 'Câmara',
  consorcio: 'Consórcio',
  
};

export function TenantManagement() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, [showInactive]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await tenantsApi.list({ incluirInativos: showInactive });
      setTenants(data);
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const query = searchQuery.toLowerCase();
    return (
      tenant.nome.toLowerCase().includes(query) ||
      tenant.cnpj.includes(query)
    );
  });

  // Actions
  const handleToggleStatus = async (tenant: Tenant) => {
    try {
      if (tenant.ativo) {
        await tenantsApi.deactivate(tenant.id);
      } else {
        await tenantsApi.activate(tenant.id);
      }
      loadData();
    } catch (error) {
      console.error('Error toggling tenant status:', error);
    }
  };

  return (
    <Card className="bg-card border-border/60">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              Prefeituras
            </CardTitle>
            <CardDescription>
              Gerencie as prefeituras e câmaras cadastradas no sistema
            </CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova prefeitura
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
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
            <span className="text-muted-foreground">Mostrar inativas</span>
          </label>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhuma prefeitura encontrada</p>
          </div>
        ) : (
          <div className="border border-border/60 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Prefeitura</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className={cn(!tenant.ativo && 'opacity-60')}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{tenant.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{tenant.cnpj}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPO_LABELS[tenant.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tenant.ativo ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                          Inativa
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
                          <DropdownMenuItem onClick={() => setEditingTenant(tenant)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(tenant)}
                            className={tenant.ativo ? 'text-destructive' : 'text-success'}
                          >
                            {tenant.ativo ? (
                              <>
                                <XCircle className="w-4 h-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
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
      <TenantFormDialog
        open={createDialogOpen || !!editingTenant}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingTenant(null);
        }}
        tenant={editingTenant}
        onSuccess={loadData}
      />
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Tenant Form Dialog
// ══════════════════════════════════════════════════════════════════════

interface TenantFormDialogProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSuccess: () => void;
}

function TenantFormDialog({ open, onClose, tenant, onSuccess }: TenantFormDialogProps) {
  const isEditing = !!tenant;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [tipo, setTipo] = useState<TenantTipo>('prefeitura');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (tenant) {
        setNome(tenant.nome);
        setCnpj(tenant.cnpj);
        setTipo(tenant.tipo);
      } else {
        setNome('');
        setCnpj('');
        setTipo('prefeitura');
      }
      setError(null);
    }
  }, [open, tenant]);

  // Format CNPJ as user types
  const handleCnpjChange = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Format as CNPJ
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length > 5) formatted = formatted.slice(0, 6) + '.' + formatted.slice(6);
    if (digits.length > 8) formatted = formatted.slice(0, 10) + '/' + formatted.slice(10);
    if (digits.length > 12) formatted = formatted.slice(0, 15) + '-' + formatted.slice(15);
    setCnpj(formatted.slice(0, 18));
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await tenantsApi.update(tenant.id, { nome, tipo });
      } else {
        await tenantsApi.create({ nome, cnpj, tipo });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erro ao salvar prefeitura';
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
            {isEditing ? 'Editar prefeitura' : 'Nova prefeitura'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da prefeitura'
              : 'Preencha os dados para cadastrar uma nova prefeitura'}
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
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Prefeitura Municipal de..."
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="font-mono"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TenantTipo)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prefeitura">Prefeitura</SelectItem>
                <SelectItem value="camara">Câmara</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              'Cadastrar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TenantManagement;
