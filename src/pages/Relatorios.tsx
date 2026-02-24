import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ExternalLink, Loader2, FileSpreadsheet, FileCheck } from 'lucide-react';
import { relatoriosApi, type Relatorio } from '@/services/relatorios';
import { projetosService, type Projeto } from '@/services/projetos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
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

export function Relatorios() {
  const navigate = useNavigate();
  const [relatorios, setRelatorios] = useState<Relatorio[]>([]);
  const [projetosFinalizados, setProjetosFinalizados] = useState<Projeto[]>([]);
  const [loadingRelatorios, setLoadingRelatorios] = useState(true);
  const [loadingProjetos, setLoadingProjetos] = useState(true);
  const [gerandoId, setGerandoId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    relatoriosApi
      .listar()
      .then((data) => {
        if (!cancelled) setRelatorios(data);
      })
      .catch(() => {
        if (!cancelled) setRelatorios([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRelatorios(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    projetosService
      .listar()
      .then((res) => {
        if (!cancelled && res.success && res.projetos) {
          const finalizados = res.projetos.filter(
            (p: Projeto) => (p.status ?? '').toLowerCase() === 'finalizado'
          );
          setProjetosFinalizados(finalizados);
        }
      })
      .catch(() => {
        if (!cancelled) setProjetosFinalizados([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingProjetos(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGerarRelatorio = async (
    projetoId: string,
    nome: string,
    tipo: 'completo' | 'resumido' | 'xlsx'
  ) => {
    setGerandoId(projetoId);
    try {
      const blob = await projetosService.gerarRelatorio(projetoId, tipo);
      const url = window.URL.createObjectURL(blob);
      const extensao = tipo === 'xlsx' ? 'xlsx' : 'pdf';
      const nomeArquivo = `Relatorio_${tipo}_${nome.replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.${extensao}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = nomeArquivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error('Erro ao gerar relatório:', e);
    } finally {
      setGerandoId(null);
    }
  };

  const loading = loadingRelatorios || loadingProjetos;
  const temRelatorios = relatorios.length > 0;
  const temProjetos = projetosFinalizados.length > 0;

  return (
    <div className="space-y-10 w-full">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="animate-dash-in" style={{ animationDelay: '0ms' }}>
        <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
          GovPreços · Relatórios
        </p>
        <h1 className="font-display text-[2.8rem] leading-[1.05] font-normal text-foreground">
          Meus relatórios
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
          Relatórios gerados a partir das suas cotações de preços.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[9px] text-muted-foreground/30 tracking-widest uppercase">
            relatórios da prefeitura
          </span>
          <div className="h-px w-8 bg-border" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* ── Relatórios gerados (tabela relatorios) ───────── */}
          <Card className="animate-dash-in border-border/60" style={{ animationDelay: '50ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-muted-foreground" />
                Relatórios gerados
              </CardTitle>
              <CardDescription>
                Relatórios de pesquisas de preços já gerados e disponíveis para acesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!temRelatorios ? (
                <div className="py-10 text-center text-muted-foreground rounded-md border border-dashed border-border/60 bg-muted/20">
                  Nenhum relatório gerado ainda. Os relatórios de pesquisas antigas aparecerão aqui.
                </div>
              ) : (
                <div className="rounded-md border border-border/60 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pesquisa / Cotação</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Gerado em</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorios.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">
                            {r.pesquisaNome ?? `Pesquisa ${r.pesquisaId.slice(0, 8)}…`}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="uppercase">
                              {r.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(r.geradoEm ?? r.criadoEm)}
                          </TableCell>
                          <TableCell className="text-right">
                            {r.urlAcesso ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="gap-1.5"
                              >
                                <a
                                  href={r.urlAcesso}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Abrir
                                </a>
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Projetos finalizados (Lei 14.133) – Gerar relatório ─ */}
          <Card className="animate-dash-in border-border/60" style={{ animationDelay: '80ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-success" />
                Projetos finalizados (Lei 14.133/2021)
              </CardTitle>
              <CardDescription>
                Gere PDF ou planilha a partir das cotações finalizadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!temProjetos ? (
                <div className="py-10 text-center text-muted-foreground rounded-md border border-dashed border-border/60 bg-muted/20">
                  Nenhum projeto finalizado. Finalize uma cotação em Minhas cotações para gerar
                  relatório aqui.
                </div>
              ) : (
                <ul className="space-y-3">
                  {projetosFinalizados.map((projeto) => (
                    <li
                      key={projeto.id}
                      className={cn(
                        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border border-border/60 bg-card'
                      )}
                    >
                      <div className="min-w-0">
                        <p className="font-medium truncate">{projeto.nome}</p>
                        {projeto.dataFinalizacao && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Finalizado em {formatDate(projeto.dataFinalizacao)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={gerandoId === projeto.id}
                          onClick={() =>
                            handleGerarRelatorio(projeto.id, projeto.nome, 'completo')
                          }
                        >
                          {gerandoId === projeto.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileText className="w-4 h-4" />
                          )}
                          PDF Completo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={gerandoId === projeto.id}
                          onClick={() =>
                            handleGerarRelatorio(projeto.id, projeto.nome, 'resumido')
                          }
                        >
                          <FileText className="w-4 h-4" />
                          PDF Resumido
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          disabled={gerandoId === projeto.id}
                          onClick={() =>
                            handleGerarRelatorio(projeto.id, projeto.nome, 'xlsx')
                          }
                        >
                          <FileSpreadsheet className="w-4 h-4" />
                          XLSX
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/projeto/${projeto.id}`)}
                        >
                          Ver projeto
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
