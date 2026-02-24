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
  CheckCircle,
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
  const [cotacaoDiretaNome, setCotacaoDiretaNome] = useState('');
  const [cotacaoDiretaCidade, setCotacaoDiretaCidade] = useState('');
  const [cotacaoDiretaValor, setCotacaoDiretaValor] = useState('');
  const [savingCotacaoDireta, setSavingCotacaoDireta] = useState(false);

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

  const handleFinalizarProjeto = async () => {
    if (!projetoId || !projeto) return;

    try {
      const response = await projetosService.finalizar(projetoId);
      if (response.success) {
        setProjeto(response.projeto);
        alert('✅ Projeto finalizado com sucesso! Agora você pode gerar o relatório.');
      }
    } catch (error: any) {
      console.error('Failed to finalize project:', error);
      const errorMessage = error?.response?.data?.message || error.message || 'Erro ao finalizar projeto';
      alert('❌ Erro: ' + errorMessage);
    }
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

  const handleAdicionarCotacaoDireta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !cotacaoDiretaNome || !cotacaoDiretaValor) return;

    const valor = parseFloat(cotacaoDiretaValor.replace(',', '.'));
    if (Number.isNaN(valor) || valor <= 0) {
      alert('Informe um valor unitário válido (maior que zero).');
      return;
    }

    try {
      setSavingCotacaoDireta(true);
      const res = await projetosService.adicionarCotacaoDireta(itemId, {
        fornecedorNome: cotacaoDiretaNome.trim(),
        fornecedorCidade: cotacaoDiretaCidade.trim() || undefined,
        valorUnitario: valor,
      });

      if (!res.success) {
        alert(res.message || 'Erro ao adicionar cotação direta.');
        return;
      }

      // Recarregar item/fontes para refletir nova mediana e lista
      const reload = await projetosService.buscarItem(itemId);
      if (reload.success) {
        if (reload.item) setItem(reload.item);
        setFontes(reload.fontes || []);
      }

      setCotacaoDiretaNome('');
      setCotacaoDiretaCidade('');
      setCotacaoDiretaValor('');
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || error.message || 'Erro ao adicionar cotação direta.';
      alert(msg);
    } finally {
      setSavingCotacaoDireta(false);
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
            {projeto?.status !== 'finalizado' && (
              <Button
                className="w-full h-9 gap-1.5 px-4 bg-success text-success-foreground hover:bg-success/90"
                onClick={handleFinalizarProjeto}
              >
                <CheckCircle className="w-4 h-4" />
                Finalizar
              </Button>
            )}
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
            <div className="space-y-6">
              <Card>
                <CardContent className="p-4">
                  <h2 className="font-semibold text-lg mb-2">Nova cotação direta</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use esta seção para registrar uma proposta direta de um fornecedor conhecido (nome, cidade e valor unitário).
                  </p>
                  <form onSubmit={handleAdicionarCotacaoDireta} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Nome do fornecedor</label>
                      <input
                        type="text"
                        className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                        value={cotacaoDiretaNome}
                        onChange={(e) => setCotacaoDiretaNome(e.target.value)}
                        placeholder="Ex: Papelaria Exemplo Ltda"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Cidade</label>
                      <input
                        type="text"
                        className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                        value={cotacaoDiretaCidade}
                        onChange={(e) => setCotacaoDiretaCidade(e.target.value)}
                        placeholder="Ex: Belo Horizonte / MG"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-muted-foreground">Valor unitário (R$)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
                          value={cotacaoDiretaValor}
                          onChange={(e) => setCotacaoDiretaValor(e.target.value)}
                          placeholder="Ex: 12,34"
                          required
                        />
                        <Button
                          type="submit"
                          className="shrink-0"
                          disabled={savingCotacaoDireta}
                        >
                          {savingCotacaoDireta ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Adicionar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h2 className="font-semibold text-lg">Cotações diretas registradas</h2>
                    <p className="text-sm text-muted-foreground">
                      Estas fontes entram no cálculo da mediana junto com os preços governamentais.
                    </p>
                  </div>
                </div>
                {fontes.filter((f) => f.tipoOrigem === 'cotacao_direta').length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Nenhuma cotação direta registrada para este item.
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {fontes
                      .filter((f) => f.tipoOrigem === 'cotacao_direta')
                      .map((fonte) => (
                        <div
                          key={fonte.id}
                          className="flex items-center justify-between border border-border rounded-md px-4 py-3 bg-card"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {fonte.fornecedorNome}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {fonte.fornecedorCidade || 'Cidade não informada'} • Cotação direta
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-sm">
                              {formatCurrency(fonte.valorUnitario)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoverFonte(fonte.id)}
                              disabled={removingId === fonte.id}
                            >
                              {removingId === fonte.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-4 h-4 rotate-45" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            </div>
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
