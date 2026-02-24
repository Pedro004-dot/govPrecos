import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { type ItemBusca } from '@/services/items';
import { cn } from '@/lib/utils';

export type OrdenacaoTipo = 'relevancia' | 'valor_asc' | 'valor_desc' | 'distancia_asc' | 'distancia_desc';

type PeriodoMeses = 'todos' | 6 | 3 | 1;

export interface FiltrosState {
  unidadesSelecionadas: Set<string>;
  valorMin: number | null;
  valorMax: number | null;
  ordenacao: OrdenacaoTipo;
  periodoMeses: PeriodoMeses;
}

interface FiltrosResultadosProps {
  itens: ItemBusca[];
  onFiltrar: (itensFiltrados: ItemBusca[]) => void;
  temFiltroRegiao?: boolean;
  className?: string;
}

export function FiltrosResultados({
  itens,
  onFiltrar,
  temFiltroRegiao = false,
  className,
}: FiltrosResultadosProps) {
  const [expandido, setExpandido] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosState>({
    unidadesSelecionadas: new Set<string>(),
    valorMin: null,
    valorMax: null,
    ordenacao: 'relevancia',
    periodoMeses: 'todos',
  });

  // Extrai unidades únicas dos itens (exatamente como vieram)
  const unidadesDisponiveis = useMemo(() => {
    const unidades = new Map<string, number>();
    for (const item of itens) {
      const unidade = item.unidadeMedida || 'Não informado';
      unidades.set(unidade, (unidades.get(unidade) || 0) + 1);
    }
    // Ordena por quantidade (mais comum primeiro)
    return Array.from(unidades.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([unidade, count]) => ({ unidade, count }));
  }, [itens]);

  // Extrai valores min/max dos itens para referência
  const valoresRange = useMemo(() => {
    const valores = itens
      .map((i) => i.valorUnitarioEstimado)
      .filter((v): v is number => v != null);
    if (valores.length === 0) return { min: 0, max: 0 };
    return {
      min: Math.min(...valores),
      max: Math.max(...valores),
    };
  }, [itens]);

  // Aplica filtros e ordenação
  useEffect(() => {
    let resultado = [...itens];

    // Filtro por unidade de medida
    if (filtros.unidadesSelecionadas.size > 0) {
      resultado = resultado.filter((item) => {
        const unidade = item.unidadeMedida || 'Não informado';
        return filtros.unidadesSelecionadas.has(unidade);
      });
    }

    // Filtro por valor mínimo
    if (filtros.valorMin != null) {
      resultado = resultado.filter(
        (item) => item.valorUnitarioEstimado != null && item.valorUnitarioEstimado >= filtros.valorMin!
      );
    }

    // Filtro por valor máximo
    if (filtros.valorMax != null) {
      resultado = resultado.filter(
        (item) => item.valorUnitarioEstimado != null && item.valorUnitarioEstimado <= filtros.valorMax!
      );
    }

    // Filtro por período (data da licitação)
    if (filtros.periodoMeses !== 'todos') {
      const meses = filtros.periodoMeses;
      const hoje = new Date();
      const dataMin = new Date(hoje);
      dataMin.setMonth(hoje.getMonth() - meses);

      resultado = resultado.filter((item) => {
        if (!item.dataLicitacao) return false;
        const data = new Date(item.dataLicitacao);
        if (Number.isNaN(data.getTime())) return false;
        return data >= dataMin;
      });
    }

    // Ordenação
    switch (filtros.ordenacao) {
      case 'valor_asc':
        resultado.sort((a, b) => (a.valorUnitarioEstimado ?? 0) - (b.valorUnitarioEstimado ?? 0));
        break;
      case 'valor_desc':
        resultado.sort((a, b) => (b.valorUnitarioEstimado ?? 0) - (a.valorUnitarioEstimado ?? 0));
        break;
      case 'distancia_asc':
        resultado.sort((a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity));
        break;
      case 'distancia_desc':
        resultado.sort((a, b) => (b.distanciaKm ?? 0) - (a.distanciaKm ?? 0));
        break;
      // 'relevancia' mantém a ordem original
    }

    onFiltrar(resultado);
  }, [itens, filtros, onFiltrar]);

  const toggleUnidade = (unidade: string) => {
    setFiltros((prev) => {
      const novas = new Set(prev.unidadesSelecionadas);
      if (novas.has(unidade)) {
        novas.delete(unidade);
      } else {
        novas.add(unidade);
      }
      return { ...prev, unidadesSelecionadas: novas };
    });
  };

  const selecionarTodasUnidades = () => {
    setFiltros((prev) => ({
      ...prev,
      unidadesSelecionadas: new Set(unidadesDisponiveis.map((u) => u.unidade)),
    }));
  };

  const limparUnidades = () => {
    setFiltros((prev) => ({
      ...prev,
      unidadesSelecionadas: new Set(),
    }));
  };

  const limparTodosFiltros = () => {
    setFiltros({
      unidadesSelecionadas: new Set(),
      valorMin: null,
      valorMax: null,
      ordenacao: 'relevancia',
      periodoMeses: 'todos',
    });
  };

  const temFiltrosAtivos =
    filtros.unidadesSelecionadas.size > 0 ||
    filtros.valorMin != null ||
    filtros.valorMax != null ||
    filtros.ordenacao !== 'relevancia' ||
    filtros.periodoMeses !== 'todos';

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (itens.length === 0) return null;

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card overflow-hidden', className)}>
      {/* Header do filtro */}
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Filtros e Ordenação</span>
          {temFiltrosAtivos && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Filtros ativos
            </span>
          )}
        </div>
        {expandido ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Conteúdo expandido */}
      {expandido && (
        <div className="px-4 pb-4 pt-2 border-t border-border/40 space-y-4">
          {/* Ordenação */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Ordenar por</label>
            <Select
              value={filtros.ordenacao}
              onValueChange={(v) => setFiltros((prev) => ({ ...prev, ordenacao: v as OrdenacaoTipo }))}
            >
              <SelectTrigger className="h-9 bg-background/50 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevancia">Relevância</SelectItem>
                <SelectItem value="valor_asc">Menor valor</SelectItem>
                <SelectItem value="valor_desc">Maior valor</SelectItem>
                {temFiltroRegiao && <SelectItem value="distancia_asc">Mais próximo</SelectItem>}
                {temFiltroRegiao && <SelectItem value="distancia_desc">Mais distante</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por período (data da licitação) */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Período da licitação
              <span className="text-muted-foreground/50 ml-2">
                (a partir de hoje)
              </span>
            </label>
            <Select
              value={String(filtros.periodoMeses)}
              onValueChange={(v) =>
                setFiltros((prev) => ({
                  ...prev,
                  periodoMeses: v === 'todos' ? 'todos' : (Number(v) as PeriodoMeses),
                }))
              }
            >
              <SelectTrigger className="h-9 bg-background/50 border-border/60 max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Últimos 24 meses (todos)</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="1">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por valor */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Faixa de valor unitário
              <span className="text-muted-foreground/50 ml-2">
                ({formatCurrency(valoresRange.min)} - {formatCurrency(valoresRange.max)})
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Mín"
                value={filtros.valorMin ?? ''}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    valorMin: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="h-9 bg-background/50 border-border/60 flex-1"
              />
              <span className="text-muted-foreground/50">até</span>
              <Input
                type="number"
                placeholder="Máx"
                value={filtros.valorMax ?? ''}
                onChange={(e) =>
                  setFiltros((prev) => ({
                    ...prev,
                    valorMax: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="h-9 bg-background/50 border-border/60 flex-1"
              />
            </div>
          </div>

          {/* Filtro por unidade de medida */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">
                Tipo de unidade
                {filtros.unidadesSelecionadas.size > 0 && (
                  <span className="text-primary ml-2">
                    ({filtros.unidadesSelecionadas.size} selecionado{filtros.unidadesSelecionadas.size !== 1 ? 's' : ''})
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selecionarTodasUnidades}
                  className="text-xs text-primary hover:underline"
                >
                  Selecionar todas
                </button>
                <span className="text-muted-foreground/30">|</span>
                <button
                  type="button"
                  onClick={limparUnidades}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-muted/20 rounded-lg">
              {unidadesDisponiveis.map(({ unidade, count }) => {
                const selecionada = filtros.unidadesSelecionadas.has(unidade);
                return (
                  <label
                    key={unidade}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors text-sm',
                      selecionada
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'bg-background border border-border/50 hover:border-border text-foreground/70'
                    )}
                  >
                    <Checkbox
                      checked={selecionada}
                      onCheckedChange={() => toggleUnidade(unidade)}
                      className="h-3.5 w-3.5"
                    />
                    <span>{unidade}</span>
                    <span className="text-xs text-muted-foreground/50">({count})</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Botão limpar filtros */}
          {temFiltrosAtivos && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limparTodosFiltros}
              className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="w-3 h-3" />
              Limpar todos os filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
