import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { type ItemFonteDetalhada, type Fornecedor } from '@/services/projetos';
import { fornecedoresService } from '@/services/fornecedores';
import { DetalhesFornecedor } from '@/components/fornecedor/DetalhesFornecedor';
import { cn } from '@/lib/utils';

interface CardFonteExpandivelProps {
  fonte: ItemFonteDetalhada;
  classificacao: {
    cor: string;
    categoria: string;
    tooltip: string;
    desvio: number;
  };
  onRemover: (fonteId: string) => void;
  removingId: string | null;
  formatCurrency: (value: number) => string;
  formatDate: (dateStr: string | undefined) => string;
}

export function CardFonteExpandivel({
  fonte,
  classificacao,
  onRemover,
  removingId,
  formatCurrency,
  formatDate,
}: CardFonteExpandivelProps) {
  const [expanded, setExpanded] = useState(false);
  const [fornecedor, setFornecedor] = useState<Fornecedor | undefined>(fonte.fornecedor);
  const [loadingFornecedor, setLoadingFornecedor] = useState(false);
  const [erroFornecedor, setErroFornecedor] = useState<string | null>(null);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setExpanded((prev) => !prev);
  };

  const handleBuscarFornecedor = async () => {
    if (loadingFornecedor || !fonte.itemLicitacaoId) return;

    setLoadingFornecedor(true);
    setErroFornecedor(null);

    try {
      const response = await fornecedoresService.vincularFornecedor(fonte.itemLicitacaoId);
      if (response.success && response.fornecedor) {
        setFornecedor(response.fornecedor);
      } else {
        setErroFornecedor(response.message || 'Erro ao buscar fornecedor');
      }
    } catch (error: any) {
      console.error('Erro ao buscar fornecedor:', error);
      const message = error.response?.data?.message || error.message || 'Erro ao buscar fornecedor';
      setErroFornecedor(message);
    } finally {
      setLoadingFornecedor(false);
    }
  };

  return (
    <TooltipProvider>
      <Card
        className={cn(
          'overflow-hidden border transition-all cursor-pointer',
          fonte.ignoradoCalculo && 'opacity-60',
          expanded
            ? 'border-primary/40 bg-muted/30'
            : 'border-border hover:border-primary/30 hover:bg-muted/20'
        )}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          {/* Cabeçalho do card */}
          <div className="flex items-center gap-4 p-4">
            {/* Ícone colorido com tooltip */}
            <div className="shrink-0">
              {fonte.ignoradoCalculo ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Excluído do cálculo</p>
                    {fonte.justificativaExclusao && (
                      <p className="text-xs mt-1 text-muted-foreground">
                        {fonte.justificativaExclusao}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CheckCircle className={cn('w-5 h-5', classificacao.cor)} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{classificacao.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Descrição */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground leading-snug line-clamp-2">
                {fonte.descricaoPNCP}
              </p>
              {fonte.razaoSocialOrgao && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fonte.razaoSocialOrgao}
                </p>
              )}
            </div>

            {/* Dados à direita */}
            <div className="flex items-center gap-3 shrink-0 text-sm">
              <span className="text-muted-foreground">
                {fonte.quantidadePNCP != null
                  ? `${fonte.quantidadePNCP} ${fonte.unidadeMedidaPNCP ?? ''}`
                  : '—'}
              </span>
              <Badge variant="secondary" className="font-mono text-xs w-9 justify-center">
                {fonte.ufSigla ?? '—'}
              </Badge>
              <span className="text-muted-foreground w-20 text-right">
                {formatDate(fonte.dataLicitacao)}
              </span>
              <span className="font-semibold text-foreground tabular-nums min-w-[5rem] text-right">
                {formatCurrency(fonte.valorUnitario)}
              </span>
            </div>

            {/* Botão remover */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onRemover(fonte.id);
              }}
              disabled={removingId === fonte.id}
            >
              {removingId === fonte.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>

            {/* Botão expandir */}
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
                <TabsList className="w-full max-w-xs grid grid-cols-2 h-9">
                  <TabsTrigger value="propostas">Propostas</TabsTrigger>
                  <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                </TabsList>

                <TabsContent value="propostas" className="mt-4 space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-sm text-muted-foreground mb-1">Valor unitário homologado</p>
                    <p className="text-xl font-semibold text-primary">
                      {formatCurrency(fonte.valorUnitario)}
                    </p>
                    {fonte.quantidadePNCP != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Quantidade: {fonte.quantidadePNCP} {fonte.unidadeMedidaPNCP}
                      </p>
                    )}
                  </div>
                  {!fonte.ignoradoCalculo && (
                    <div className="rounded-lg border border-border bg-background p-3">
                      <p className="text-sm font-medium mb-1">Classificação</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={cn('w-4 h-4', classificacao.cor)} />
                        <p className="text-sm">{classificacao.tooltip}</p>
                      </div>
                    </div>
                  )}
                  {fonte.ignoradoCalculo && fonte.justificativaExclusao && (
                    <div className="rounded-lg border p-3" style={{ background: 'var(--warning-box-bg)', borderColor: 'var(--warning-box-border)' }}>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--warning-box-text)' }}>
                        Excluído do cálculo
                      </p>
                      <p className="text-sm text-muted-foreground">{fonte.justificativaExclusao}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="detalhes" className="mt-4 space-y-4">
                  <dl className="grid gap-3 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Descrição</dt>
                      <dd className="font-medium mt-0.5 text-foreground">{fonte.descricaoPNCP}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Órgão</dt>
                      <dd className="font-medium mt-0.5">{fonte.razaoSocialOrgao}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Município / UF</dt>
                      <dd className="font-medium mt-0.5">
                        {fonte.municipioNome ?? '—'}
                        {fonte.ufSigla ? ` / ${fonte.ufSigla}` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Quantidade / Unidade</dt>
                      <dd className="font-medium mt-0.5">
                        {fonte.quantidadePNCP != null
                          ? `${fonte.quantidadePNCP} ${fonte.unidadeMedidaPNCP ?? ''}`
                          : '—'}
                      </dd>
                    </div>
                 
                    <div>
                      <dt className="text-muted-foreground">Data da licitação</dt>
                      <dd className="font-medium mt-0.5">{formatDate(fonte.dataLicitacao)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Valor unitário</dt>
                      <dd className="font-medium mt-0.5">{formatCurrency(fonte.valorUnitario)}</dd>
                    </div>
                    {fonte.numeroControlePNCP && (
                      <div>
                        <dt className="text-muted-foreground">Número de controle PNCP</dt>
                        <dd className="font-medium mt-0.5 font-mono text-xs">
                          {fonte.numeroControlePNCP}
                        </dd>
                      </div>
                    )}
                    {fonte.numeroCompra && (
                      <div>
                        <dt className="text-muted-foreground">Número da compra</dt>
                        <dd className="font-medium mt-0.5">{fonte.numeroCompra}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Fornecedor Vencedor */}
                  {fornecedor && <DetalhesFornecedor fornecedor={fornecedor} />}

                  {!fornecedor && !loadingFornecedor && !erroFornecedor && (
                    <div className="pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBuscarFornecedor}
                        className="w-full"
                      >
                        Buscar dados do fornecedor
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Busca dados completos do fornecedor vencedor (PNCP + Receita Federal)
                      </p>
                    </div>
                  )}

                  {loadingFornecedor && (
                    <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm">Buscando dados do fornecedor...</p>
                    </div>
                  )}

                  {erroFornecedor && (
                    <div className="pt-4 border-t border-border">
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                        <p className="text-sm text-destructive font-medium">Erro ao buscar fornecedor</p>
                        <p className="text-xs text-muted-foreground mt-1">{erroFornecedor}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBuscarFornecedor}
                          className="mt-2 w-full"
                        >
                          Tentar novamente
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
