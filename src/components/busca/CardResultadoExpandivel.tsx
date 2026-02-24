import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { type ItemBusca } from '@/services/items';
import { fornecedoresService } from '@/services/fornecedores';
import { DetalhesFornecedor } from '@/components/fornecedor/DetalhesFornecedor';
import type { Fornecedor } from '@/services/projetos';
import { cn } from '@/lib/utils';

interface CardResultadoExpandivelProps {
  item: ItemBusca;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  formatCurrency: (value: number) => string;
}

export function CardResultadoExpandivel({
  item,
  selected,
  onToggleSelect,
  formatCurrency,
}: CardResultadoExpandivelProps) {
  const [expanded, setExpanded] = useState(false);
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [loadingFornecedor, setLoadingFornecedor] = useState(false);
  const [erroFornecedor, setErroFornecedor] = useState<string | null>(null);

  // Resetar estado do fornecedor quando o item mudar
  useEffect(() => {
    setFornecedor(null);
    setLoadingFornecedor(false);
    setErroFornecedor(null);
  }, [item.id]);

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR');
  };

  const handleBuscarFornecedor = async () => {
    if (loadingFornecedor) return;

    setLoadingFornecedor(true);
    setErroFornecedor(null);

    try {
      const response = await fornecedoresService.vincularFornecedor(item.id);
      if (response.success && response.fornecedor) {
        setFornecedor(response.fornecedor);
      } else {
        setErroFornecedor(response.message || 'Erro ao buscar fornecedor');
      }
    } catch (error: any) {
      console.error('Erro ao buscar fornecedor na tela de vincular preço:', error);
      const message =
        error.response?.data?.message || error.message || 'Erro ao buscar fornecedor';
      setErroFornecedor(message);
    } finally {
      setLoadingFornecedor(false);
    }
  };

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return;
    setExpanded((prev) => !prev);
  };

  return (
    <Card
      className={cn(
        'overflow-hidden border transition-all cursor-pointer',
        selected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:border-primary/40 hover:bg-muted/30'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        {/* Cabeçalho do card: dados da licitação visíveis (shadcn + paleta) */}
        <div className="flex items-center gap-4 p-4">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(item.id)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground leading-snug line-clamp-2">
              {item.descricao}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-sm">
            <span className="text-muted-foreground">
              {item.quantidade != null ? `${item.quantidade} ${item.unidadeMedida}` : '—'}
            </span>
            <div className="flex flex-col items-end gap-0.5 min-w-[120px]">
              {item.municipioNome && (
                <span className="text-xs text-foreground/70 truncate max-w-[120px]">
                  {item.municipioNome}
                </span>
              )}
              {item.ufSigla ? (
                <Badge variant="secondary" className="font-mono text-xs w-9 justify-center">
                  {item.ufSigla}
                </Badge>
              ) : (
                !item.municipioNome && <span className="text-muted-foreground">—</span>
              )}
            </div>
            {item.distanciaKm != null ? (
              <span className="text-muted-foreground w-24 text-right font-mono">
                {item.distanciaKm.toFixed(0)} km
              </span>
            ) : (
              <span className="text-muted-foreground w-24 text-right">
                {formatDate(item.dataLicitacao)}
              </span>
            )}
            <span className="font-semibold text-foreground tabular-nums min-w-[5rem] text-right">
              {item.valorUnitarioEstimado != null
                ? formatCurrency(item.valorUnitarioEstimado)
                : '—'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={toggleExpand}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Conteúdo expandido: abas PROPOSTAS e DETALHES */}
        {expanded && (
          <div className="border-t border-border bg-muted/30 px-4 pb-4 pt-3">
            <Tabs defaultValue="propostas" className="w-full">
              <TabsList className="w-full max-w-xs grid grid-cols-2 h-9" variant="line">
                <TabsTrigger value="propostas">Propostas</TabsTrigger>
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              </TabsList>
              <TabsContent value="propostas" className="mt-4 space-y-4">
                <div className="rounded-lg border border-border bg-background p-4">
                  <p className="text-sm text-muted-foreground mb-1">Valor estimado</p>
                  <p className="text-xl font-semibold text-primary">
                    {item.valorUnitarioEstimado != null
                      ? formatCurrency(item.valorUnitarioEstimado)
                      : '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor original: {item.valorUnitarioEstimado != null ? formatCurrency(item.valorUnitarioEstimado) : '—'}
                  </p>
                </div>
                {/* Fornecedor vencedor (opcional) */}
                {fornecedor && <DetalhesFornecedor fornecedor={fornecedor} />}

                {!fornecedor && !loadingFornecedor && !erroFornecedor && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuscarFornecedor();
                      }}
                    >
                      Buscar dados do fornecedor
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Busca dados completos do fornecedor vencedor (PNCP + Receita Federal)
                    </p>
                  </div>
                )}

                {loadingFornecedor && (
                  <div className="pt-2 border-t border-border flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm">Buscando dados do fornecedor...</p>
                  </div>
                )}

                {erroFornecedor && (
                  <div className="pt-2 border-t border-border">
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                      <p className="text-sm text-destructive font-medium">Erro ao buscar fornecedor</p>
                      <p className="text-xs text-muted-foreground">{erroFornecedor}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuscarFornecedor();
                        }}
                      >
                        Tentar novamente
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="detalhes" className="mt-4 space-y-4">
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Descrição</dt>
                    <dd className="font-medium mt-0.5 text-foreground">{item.descricao}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Número da licitação e do item</dt>
                    <dd className="font-medium mt-0.5 text-foreground">
                      {item.numeroControlePNCP
                        ? `${item.numeroControlePNCP} - item ${item.numeroItem}`
                        : '—'}
                    </dd>
                  </div>
  
                  <div>
                    <dt className="text-muted-foreground">Data da licitação</dt>
                    <dd className="font-medium mt-0.5 text-foreground">
                      {formatDate(item.dataLicitacao)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Quantidade / Unidade</dt>
                    <dd className="font-medium mt-0.5">
                      {item.quantidade != null ? `${item.quantidade} ${item.unidadeMedida}` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Município / UF</dt>
                    <dd className="font-medium mt-0.5">
                      {item.municipioNome ?? '—'} {item.ufSigla ? ` / ${item.ufSigla}` : ''}
                      {item.distanciaKm != null && (
                        <span className="text-muted-foreground ml-2">({item.distanciaKm.toFixed(0)} km)</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Valor unitário estimado</dt>
                    <dd className="font-medium mt-0.5">
                      {item.valorUnitarioEstimado != null
                        ? formatCurrency(item.valorUnitarioEstimado)
                        : '—'}
                    </dd>
                  </div>
                </dl>
                <p className="text-sm text-muted-foreground">
                  Mais campos (órgão, modalidade, link do processo etc.) quando o endpoint de detalhe estiver disponível.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
