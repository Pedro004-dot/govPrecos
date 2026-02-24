import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ArrowRight,
  FolderOpen,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { projetosService, type Projeto } from '@/services/projetos';

export function Dashboard() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { tenant } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await projetosService.listar();
        if (response.success) {
          setProjetos(response.projetos || []);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatStatusLabel = (status: string) => {
    const s = status?.toLowerCase() ?? '';
    if (s === 'finalizado') return 'Finalizada';
    if (s === 'em_andamento' || s === 'em andamento') return 'Em andamento';
    if (s === 'rascunho') return 'Rascunho';
    if (s === 'cancelado') return 'Cancelada';
    return status;
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase() ?? '';
    if (s === 'finalizado') return 'text-success';
    if (s === 'em_andamento' || s === 'em andamento') return 'text-warning';
    return 'text-muted-foreground';
  };

  const emAndamento = projetos.filter((p) => {
    const s = p.status?.toLowerCase() ?? '';
    return s === 'em_andamento' || s === 'em andamento';
  }).length;

  const finalizados = projetos.filter(
    (p) => p.status?.toLowerCase() === 'finalizado'
  ).length;

  const ultimasCotacoes = projetos.slice(0, 3);
  const hasCotacoes = ultimasCotacoes.length > 0;

  const hoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-10 w-full">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="animate-dash-in flex flex-col md:flex-row md:items-start md:justify-between gap-4" style={{ animationDelay: '0ms' }}>
        <div>
          <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
            GovPreços&nbsp;·&nbsp;Lei 14.133/2021
            <span className="ml-3 text-primary/50">{hoje}</span>
          </p>
          <h1 className="font-display text-[2.8rem] leading-[1.05] font-normal text-foreground">
            Minhas cotações
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
            Pesquisa de preços com rastreabilidade PNCP conforme Lei 14.133/2021.
          </p>
          {/* Decorative rule */}
          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[9px] text-muted-foreground/30 tracking-widest uppercase">
              visão geral
            </span>
            <div className="h-px w-8 bg-border" />
          </div>
        </div>
        {/* Brasão da prefeitura — apenas em tablet/desktop */}
        {tenant?.brasaoUrl && (
          <div className="hidden md:flex shrink-0 items-center justify-end">
            <img
              src={tenant.brasaoUrl}
              alt="Brasão da prefeitura"
              className="h-20 w-20 object-contain md:h-24 md:w-24"
            />
          </div>
        )}
      </div>

      {/* ── KPI Stats ────────────────────────────────────────── */}
      <div
        className="animate-dash-in grid grid-cols-1 sm:grid-cols-3 gap-3"
        style={{ animationDelay: '70ms' }}
      >
        {/* Total */}
        <div className="rounded-xl bg-card border border-border px-5 py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
              Total
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/25" />
          </div>
          {loading ? (
            <div className="h-9 w-12 bg-muted rounded animate-pulse" />
          ) : (
            <p className="font-display text-[2.4rem] leading-none text-foreground">
              {projetos.length}
            </p>
          )}
          <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
            cotações
          </p>
        </div>

        {/* Em andamento — amber glow */}
        <div className="rounded-xl bg-card kpi-glow-amber px-5 py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-warning/70">
              Andamento
            </span>
            <Clock className="h-3.5 w-3.5 text-warning/50" />
          </div>
          {loading ? (
            <div className="h-9 w-12 bg-muted rounded animate-pulse" />
          ) : (
            <p className="font-display text-[2.4rem] leading-none text-warning">
              {emAndamento}
            </p>
          )}
          <p className="font-mono text-[10px] text-warning/40 uppercase tracking-wider">
            em progresso
          </p>
        </div>

        {/* Finalizadas — green glow */}
        <div className="rounded-xl bg-card kpi-glow-green px-5 py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-success/70">
              Finalizadas
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-success/50" />
          </div>
          {loading ? (
            <div className="h-9 w-12 bg-muted rounded animate-pulse" />
          ) : (
            <p className="font-display text-[2.4rem] leading-none text-success">
              {finalizados}
            </p>
          )}
          <p className="font-mono text-[10px] text-success/40 uppercase tracking-wider">
            concluídas
          </p>
        </div>
      </div>

      {/* ── Create CTA ───────────────────────────────────────── */}
      <div
        className="animate-dash-in"
        style={{ animationDelay: '140ms' }}
      >
        <div className="flex items-baseline gap-2 mb-3">
          <span className="font-mono text-[10px] text-muted-foreground/40 tracking-widest">02</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
            Nova cotação
          </span>
        </div>

        <div className="relative rounded-xl overflow-hidden group cursor-pointer" onClick={() => navigate('/projetos/novo')}>
          {/* Layered gradient background */}
          <div
            className="absolute inset-0"
            style={{ background: 'var(--cta-bg)' }}
          />
          {/* Amber spark top-right */}
          <div
            className="absolute -top-12 -right-12 h-40 w-40 rounded-full"
            style={{
              background: 'var(--cta-spark-top)',
              opacity: 'var(--cta-spark-top-opacity)',
            }}
          />
          {/* Blue spark bottom-left */}
          <div
            className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full"
            style={{
              background: 'var(--cta-spark-bottom)',
              opacity: 'var(--cta-spark-bottom-opacity)',
            }}
          />
          {/* Dot texture */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, var(--cta-dot-fill) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
              opacity: 'var(--cta-dot-opacity)',
            }}
          />
          {/* Border */}
          <div
            className="absolute inset-0 rounded-xl ring-1 ring-inset transition-all duration-300"
            style={{
              boxShadow: `inset 0 0 0 1px var(--cta-ring)`,
            }}
          />

          <div className="relative px-7 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/70 mb-2">
                Pesquisa de preços
              </p>
              <h2 className="font-display text-[1.7rem] leading-snug font-normal text-foreground dark:text-white">
                Criar uma cotação
              </h2>
              <p className="text-sm text-muted-foreground dark:text-white/50 mt-1.5 max-w-sm leading-relaxed">
                Adicione itens e vincule fontes PNCP (mínimo 3 por item) para
                gerar seu relatório.
              </p>
            </div>
            <Button
              onClick={(e) => { e.stopPropagation(); navigate('/projetos/novo'); }}
              size="lg"
              className="shrink-0 gap-2 font-medium h-11 px-6 shadow-none rounded-lg transition-all duration-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/18 dark:border-white/15 dark:border bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
            >
              <Plus className="h-4 w-4" />
              Criar cotação
            </Button>
          </div>
        </div>
      </div>

      {/* ── Recent Quotations ────────────────────────────────── */}
      <section
        className="space-y-3 animate-dash-in"
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] text-muted-foreground/40 tracking-widest">03</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/50">
              Últimas cotações
            </span>
          </div>
          {hasCotacoes && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary/70 hover:text-primary gap-1 h-7 px-2 hover:bg-primary/10"
              onClick={() => navigate('/relatorios')}
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[68px] rounded-lg bg-card/60 animate-pulse border border-border/50" />
            ))}
          </div>
        ) : !hasCotacoes ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 flex flex-col items-center justify-center py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-medium text-sm text-foreground/80 mb-1">Nenhuma cotação ainda</h3>
            <p className="text-muted-foreground/60 text-xs mb-5 max-w-xs leading-relaxed">
              Crie sua primeira cotação para começar a pesquisar preços.
            </p>
            <Button
              onClick={() => navigate('/projetos/novo')}
              size="sm"
              className="gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" />
              Criar cotação
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {ultimasCotacoes.map((projeto, index) => (
              <div
                key={projeto.id}
                className="group relative flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3.5 cursor-pointer hover:border-border hover:bg-card/80 hover:shadow-[0_2px_16px_hsl(217_100%_65%/0.07)] transition-all duration-200 animate-dash-in"
                style={{ animationDelay: `${260 + index * 55}ms` }}
                onClick={() => navigate(`/projeto/${projeto.id}`)}
              >
                {/* Left accent bar — animates in on hover */}
                <div className="absolute left-0 inset-y-3 w-[3px] rounded-full bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />

                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary/70 group-hover:bg-primary/15 group-hover:text-primary transition-colors duration-200">
                  <FolderOpen className="h-4 w-4" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm text-foreground/80 truncate group-hover:text-foreground transition-colors">
                      {projeto.nome}
                    </p>
                    <span className={`shrink-0 font-mono text-[10px] uppercase tracking-wide ${getStatusColor(projeto.status)}`}>
                      {formatStatusLabel(projeto.status)}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground/50 truncate">
                    {projeto.numeroProcesso
                      ? projeto.numeroProcesso
                      : projeto.descricao || 'Sem número de processo'}
                    <span className="mx-1.5 opacity-40">·</span>
                    {new Date(projeto.criadoEm).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {/* Arrow */}
                <div className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/25 group-hover:text-primary/70 group-hover:bg-primary/10 transition-all duration-200">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
