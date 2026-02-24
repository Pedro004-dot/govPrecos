import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { auditLogsApi, tenantsApi, type AuditLog, type Tenant } from '@/services/admin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ORDENAR_OPCOES: { value: 'criado_em' | 'acao' | 'entidade' | 'usuario_nome' | 'tenant_nome'; label: string }[] = [
  { value: 'criado_em', label: 'Data' },
  { value: 'acao', label: 'Movimentação' },
  { value: 'entidade', label: 'Entidade' },
  { value: 'tenant_nome', label: 'Órgão' },
  { value: 'usuario_nome', label: 'Usuário' },
];

const ACAO_OPCOES = [
  { value: '', label: 'Todas' },
  { value: 'create', label: 'Criar' },
  { value: 'update', label: 'Atualizar' },
  { value: 'delete', label: 'Excluir' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'password_reset', label: 'Recuperação de senha' },
];

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function AuditLogsTable() {
  const { isSuperAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [tenantId, setTenantId] = useState<string>('');
  const [acao, setAcao] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [ordenarPor, setOrdenarPor] = useState<'criado_em' | 'acao' | 'entidade' | 'usuario_nome' | 'tenant_nome'>('criado_em');
  const [ordenarDir, setOrdenarDir] = useState<'asc' | 'desc'>('desc');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await auditLogsApi.list({
        page,
        limit,
        ...(tenantId && { tenantId }),
        ...(acao && { acao }),
        ...(dataInicio && { dataInicio: dataInicio + 'T00:00:00' }),
        ...(dataFim && { dataFim: dataFim + 'T23:59:59' }),
        ordenarPor,
        ordenarDir,
      });
      setLogs(res.logs);
      setTotal(res.total);
    } catch (e) {
      console.error('Erro ao carregar logs:', e);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, tenantId, acao, dataInicio, dataFim, ordenarPor, ordenarDir]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (isSuperAdmin) {
      tenantsApi.list({ incluirInativos: true }).then(setTenants).catch(() => setTenants([]));
    }
  }, [isSuperAdmin]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const clearFilters = () => {
    setTenantId('');
    setAcao('');
    setDataInicio('');
    setDataFim('');
    setPage(1);
  };

  const toggleSort = (col: typeof ordenarPor) => {
    if (ordenarPor === col) {
      setOrdenarDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setOrdenarPor(col);
      setOrdenarDir('desc');
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: typeof ordenarPor }) => {
    if (ordenarPor !== column) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />;
    return ordenarDir === 'desc' ? (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ArrowUp className="ml-1 h-3.5 w-3.5" />
    );
  };

  return (
    <Card className="bg-card border-border/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-muted-foreground" />
          Logs de Auditoria
        </CardTitle>
        <CardDescription>
          Histórico de ações realizadas no sistema. Filtre por órgão, movimentação e data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {isSuperAdmin && (
            <div className="space-y-2">
              <Label>Órgão</Label>
              <Select value={tenantId || 'todos'} onValueChange={(v) => setTenantId(v === 'todos' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os órgãos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os órgãos</SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Movimentação</Label>
            <Select value={acao || 'todas'} onValueChange={(v) => setAcao(v === 'todas' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                {ACAO_OPCOES.map((o) => (
                  <SelectItem key={o.value || 'todas'} value={o.value || 'todas'}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data início</Label>
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data fim</Label>
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </div>

        {/* Ordenação */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-muted-foreground">Ordenar por:</span>
          <Select
            value={ordenarPor}
            onValueChange={(v) => {
              setOrdenarPor(v as typeof ordenarPor);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDENAR_OPCOES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={ordenarDir}
            onValueChange={(v) => {
              setOrdenarDir(v as 'asc' | 'desc');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Mais recente primeiro</SelectItem>
              <SelectItem value="asc">Mais antigo primeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border border-border/60 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Nenhum log encontrado com os filtros informados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center font-medium hover:text-foreground"
                      onClick={() => toggleSort('criado_em')}
                    >
                      Data/Hora
                      <SortIcon column="criado_em" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center font-medium hover:text-foreground"
                      onClick={() => toggleSort('usuario_nome')}
                    >
                      Usuário
                      <SortIcon column="usuario_nome" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center font-medium hover:text-foreground"
                      onClick={() => toggleSort('tenant_nome')}
                    >
                      Órgão
                      <SortIcon column="tenant_nome" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center font-medium hover:text-foreground"
                      onClick={() => toggleSort('acao')}
                    >
                      Movimentação
                      <SortIcon column="acao" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="flex items-center font-medium hover:text-foreground"
                      onClick={() => toggleSort('entidade')}
                    >
                      Entidade
                      <SortIcon column="entidade" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {formatDateTime(log.criadoEm)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{log.usuarioNome ?? '—'}</p>
                        {log.usuarioEmail && (
                          <p className="text-xs text-muted-foreground">{log.usuarioEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{log.tenantNome ?? '—'}</TableCell>
                    <TableCell>
                      <span className={cn(
                        'rounded px-2 py-0.5 text-xs font-medium',
                        log.acao === 'delete' && 'bg-destructive/10 text-destructive',
                        log.acao === 'create' && 'bg-success/10 text-success',
                        log.acao === 'update' && 'bg-primary/10 text-primary',
                        !['delete','create','update'].includes(log.acao) && 'bg-muted text-muted-foreground'
                      )}>
                        {log.acao}
                      </span>
                    </TableCell>
                    <TableCell>{log.entidade}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {log.ip ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Paginação */}
        {total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Exibindo {(page - 1) * limit + 1}–{Math.min(page * limit, total)} de {total} registros
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
