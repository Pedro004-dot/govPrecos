import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  BarChart3,
  FileText,
} from 'lucide-react';
import {
  projetosService,
  type Projeto,
  type ProjetoItem,
  type ItemFonteDetalhada,
} from '@/services/projetos';
import { CardFonteExpandivel } from '@/components/projeto/CardFonteExpandivel';
import { cn } from '@/lib/utils';

type SecaoFonte = 'precos_governamentais' | 'cotacao_direta' | 'graficos';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDateShort(dateStr: string | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Desvio padrão e coeficiente de variação a partir dos valores (incluídos no cálculo). */
function statsFromFontes(fontes: ItemFonteDetalhada[]) {
  const included = fontes.filter((f) => !f.ignoradoCalculo);
  const values = included.map((f) => f.valorUnitario).filter((v) => v != null && !Number.isNaN(v));
  const n = values.length;
  if (n === 0)
    return {
      media: 0,
      desvioPadrao: 0,
      coefVariacao: 0,
      qntIncluidos: 0,
    };
  const media = values.reduce((a, b) => a + b, 0) / n;
  const varianza =
    values.reduce((acc, v) => acc + (v - media) ** 2, 0) / n;
  const desvioPadrao = Math.sqrt(varianza);
  const coefVariacao = media !== 0 ? (desvioPadrao / media) * 100 : 0;
  return {
    media,
    desvioPadrao,
    coefVariacao,
    qntIncluidos: n,
  };
}

/** Classifica o preço baseado no desvio percentual da média */
function classificarPreco(valorUnitario: number, media: number) {
  if (media === 0) {
    return {
      cor: 'text-muted-foreground',
      categoria: 'indefinido',
      tooltip: 'Sem base de comparação',
      desvio: 0,
    };
  }

  const desvioPercentual = ((valorUnitario - media) / media) * 100;
  const desvioFormatado = desvioPercentual >= 0
    ? `+${desvioPercentual.toFixed(1)}%`
    : `${desvioPercentual.toFixed(1)}%`;

  // Vermelho: ≥70% ou ≤-70%
  if (desvioPercentual >= 70) {
    return {
      cor: 'text-destructive',
      categoria: 'excessivo',
      tooltip: `Preço excessivo: ${desvioFormatado} da média`,
      desvio: desvioPercentual,
    };
  }
  if (desvioPercentual <= -70) {
    return {
      cor: 'text-destructive',
      categoria: 'inexequivel',
      tooltip: `Preço inexequível: ${desvioFormatado} da média`,
      desvio: desvioPercentual,
    };
  }

  // Amarelo: 20% a 69% ou -20% a -69%
  if (desvioPercentual >= 20 && desvioPercentual < 70) {
    return {
      cor: 'text-warning',
      categoria: 'elevado',
      tooltip: `Preço elevado: ${desvioFormatado} da média`,
      desvio: desvioPercentual,
    };
  }
  if (desvioPercentual < -20 && desvioPercentual > -70) {
    return {
      cor: 'text-warning',
      categoria: 'inexequivel',
      tooltip: `Preço inexequível: ${desvioFormatado} da média`,
      desvio: desvioPercentual,
    };
  }

  // Verde: -19% a +19%
  return {
    cor: 'text-success',
    categoria: 'valido',
    tooltip: `Preço válido: ${desvioFormatado} da média`,
    desvio: desvioPercentual,
  };
}

export function ItemDetalhamento() {
  const { id: projetoId, itemId } = useParams<{ id: string; itemId: string }>();
  const navigate = useNavigate();

  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [itens, setItens] = useState<ProjetoItem[]>([]);
  const [item, setItem] = useState<ProjetoItem | null>(null);
  const [fontes, setFontes] = useState<ItemFonteDetalhada[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoFonte>('precos_governamentais');

  const currentIndex = useMemo(
    () => (itemId ? itens.findIndex((i) => i.id === itemId) : -1),
    [itens, itemId]
  );
  const prevItem = currentIndex > 0 ? itens[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < itens.length - 1 ? itens[currentIndex + 1] : null;

  const stats = useMemo(() => statsFromFontes(fontes), [fontes]);
  const mediana = item?.medianaCalculada ?? 0;
  const mediaCotacao = mediana * (item?.quantidade ?? 0);

  useEffect(() => {
    if (!projetoId) return;
    projetosService
      .buscarPorId(projetoId)
      .then((res) => {
        if (res.success) {
          setProjeto(res.projeto);
          setItens(res.itens || []);
        }
      })
      .catch(() => setProjeto(null));
  }, [projetoId]);

  useEffect(() => {
    if (!itemId) {
      setItem(null);
      setFontes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    projetosService
      .buscarItem(itemId)
      .then((res) => {
        if (res.success) {
          setItem(res.item);
          setFontes(res.fontes || []);
        } else {
          setItem(null);
          setFontes([]);
        }
      })
      .catch(() => {
        setItem(null);
        setFontes([]);
      })
      .finally(() => setLoading(false));
  }, [itemId]);

  const goPrev = () => {
    if (prevItem && projetoId) navigate(`/projeto/${projetoId}/item/${prevItem.id}`);
  };
  const goNext = () => {
    if (nextItem && projetoId) navigate(`/projeto/${projetoId}/item/${nextItem.id}`);
  };

  const handleRemoverFonte = async (fonteId: string) => {
    if (!itemId || removingId) return;
    setRemovingId(fonteId);
    try {
      await projetosService.removerFonte(itemId, fonteId);
      const res = await projetosService.buscarItem(itemId);
      if (res.success) {
        setFontes(res.fontes || []);
        if (res.item) setItem(res.item);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao remover fonte.');
    } finally {
      setRemovingId(null);
    }
  };

  if (!projetoId || !itemId) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Projeto ou item não informado.</p>
      </div>
    );
  }

  if (loading && !item) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground">Item não encontrado.</p>
        <Button variant="outline" onClick={() => navigate(`/projeto/${projetoId}`)}>
          Voltar à cotação
        </Button>
      </div>
    );
  }

  const secoes: { id: SecaoFonte; label: string; icon: React.ReactNode }[] = [
    { id: 'precos_governamentais', label: 'Preços governamentais', icon: <FileText className="w-4 h-4" /> },
    { id: 'cotacao_direta', label: 'Cotação direta', icon: <Plus className="w-4 h-4" /> },
    { id: 'graficos', label: 'Gráficos comparativos', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Topo: seta voltar + título + navegação entre itens */}
      <header className="shrink-0 border-b border-border bg-background px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projeto/${projetoId}`)}
            className="shrink-0"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{item.nome}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Detalhamento do item</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goPrev}
            disabled={!prevItem}
          >
            <ChevronLeft className="w-4 h-4" />
            Item anterior
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {currentIndex + 1} de {itens.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goNext}
            disabled={!nextItem}
          >
            Item seguinte
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar esquerda: colado ao conteúdo, sem margem extra */}
        <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-3 border-b border-border">
            <Card className="bg-muted/50 border-border">
              <CardContent className="p-3 text-sm">
                <p className="text-muted-foreground text-xs font-medium">Cotação de: {projeto?.nome ?? '—'}</p>
                <p className="mt-1"><strong>Item:</strong> {currentIndex + 1}</p>
                <p><strong>Nome:</strong> {item.nome}</p>
                <p><strong>Quantidade:</strong> {item.quantidade} {item.unidadeMedida}</p>
              </CardContent>
            </Card>
          </div>
          <p className="px-3 pt-2 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fontes de orçamento
          </p>
          {secoes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSecaoAtiva(s.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-left text-sm font-medium border-l-2 transition-colors',
                secaoAtiva === s.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent text-foreground hover:bg-muted/50'
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
          <div className="mt-auto p-3 border-t border-border">
            <Button
              className="w-full"
              onClick={() => navigate(`/projeto/${projetoId}`)}
            >
              Gerar relatório
            </Button>
          </div>
        </aside>

        {/* Conteúdo principal: padding reduzido para eliminar espaço entre sidebar e lista */}
        <main className="flex-1 overflow-y-auto p-4 min-w-0">
          {secaoAtiva === 'precos_governamentais' && (
            <>
              {/* Estatísticas */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Qnt. Preços</p>
                    <p className="text-xl font-bold mt-1">{stats.qntIncluidos}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Média dos Preços</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(stats.media)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Mediana dos Preços</p>
                    <p className="text-xl font-bold mt-1">{mediana ? formatCurrency(mediana) : '—'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Média da Cotação</p>
                    <p className="text-xl font-bold mt-1">{mediaCotacao ? formatCurrency(mediaCotacao) : '—'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Desvio padrão</p>
                    <p className="text-xl font-bold mt-1">{stats.desvioPadrao ? formatCurrency(stats.desvioPadrao) : '—'}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Coef. variação</p>
                    <p className="text-xl font-bold mt-1">{stats.coefVariacao ? `${stats.coefVariacao.toFixed(2)}%` : '—'}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <label className="text-sm text-muted-foreground">Selecione a fórmula para cálculo</label>
                <Select defaultValue="mediana">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mediana">Mediana</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="menor_preco">Menor preço</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preços selecionados */}
              <Card>
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h2 className="font-semibold text-lg">Preços selecionados</h2>
                    <p className="text-sm text-muted-foreground">Todos os preços vinculados a este item</p>
                  </div>
                  <Button
                    onClick={() => navigate(`/projeto/${projetoId}/item/${itemId}/buscar`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Incluir preço
                  </Button>
                </div>
                {fontes.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <p className="mb-4">Nenhuma fonte vinculada ainda.</p>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/projeto/${projetoId}/item/${itemId}/buscar`)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Buscar preços governamentais
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {fontes.map((fonte) => {
                      const classificacao = classificarPreco(fonte.valorUnitario, stats.media);
                      return (
                        <CardFonteExpandivel
                          key={fonte.id}
                          fonte={fonte}
                          classificacao={classificacao}
                          onRemover={handleRemoverFonte}
                          removingId={removingId}
                          formatCurrency={formatCurrency}
                          formatDate={formatDateShort}
                        />
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          )}

          {secaoAtiva === 'cotacao_direta' && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Plus className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Cotação direta</p>
                <p className="text-sm mt-1">Em breve: incluir preço por cotação direta (fornecedor, valor, documento).</p>
              </CardContent>
            </Card>
          )}

          {secaoAtiva === 'graficos' && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Gráficos comparativos</p>
                <p className="text-sm mt-1">Em breve: gráfico de comparação de preços entre as fontes deste item.</p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
