import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { type ItemBusca } from '@/services/items';
import { fornecedoresService } from '@/services/fornecedores';
import { DetalhesFornecedor } from '@/components/fornecedor/DetalhesFornecedor';
import type { Fornecedor } from '@/services/projetos';

interface DetalheItemSheetProps {
  open: boolean;
  onClose: () => void;
  item: ItemBusca | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('pt-BR');
}

export function DetalheItemSheet({ open, onClose, item }: DetalheItemSheetProps) {
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [loadingFornecedor, setLoadingFornecedor] = useState(false);
  const [erroFornecedor, setErroFornecedor] = useState<string | null>(null);

  if (!item) return null;

  const handleBuscarFornecedor = async () => {
    if (loadingFornecedor || !item.id) return;

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
      console.error('Erro ao buscar fornecedor na busca rápida:', error);
      const message =
        error.response?.data?.message || error.message || 'Erro ao buscar fornecedor';
      setErroFornecedor(message);
    } finally {
      setLoadingFornecedor(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Detalhe do item</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Cabeçalho resumo */}
          <div className="pb-4 border-b">
            <h2 className="font-semibold text-lg leading-tight text-foreground line-clamp-2">
              {item.descricao}
            </h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              <span>
                <strong>Quantidade:</strong>{' '}
                {item.quantidade != null ? `${item.quantidade} ${item.unidadeMedida}` : '—'}
              </span>
              <span>
                <strong>UF:</strong> {item.ufSigla ?? '—'}
              </span>
              <span>
                <strong>Data da licitação:</strong> {formatDate(item.dataLicitacao)}
              </span>
              <span className="font-semibold text-foreground">
                <strong>Valor Unit.:</strong>{' '}
                {item.valorUnitarioEstimado != null
                  ? formatCurrency(item.valorUnitarioEstimado)
                  : '—'}
              </span>
            </div>
          </div>

          <Tabs defaultValue="propostas" className="w-full">
            <TabsList className="w-full grid grid-cols-2" variant="line">
              <TabsTrigger value="propostas">PROPOSTAS</TabsTrigger>
              <TabsTrigger value="detalhes">DETALHES</TabsTrigger>
            </TabsList>
            <TabsContent value="propostas" className="mt-4 space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground mb-2">Valor estimado</p>
                <p className="text-xl font-semibold text-success">
                  {item.valorUnitarioEstimado != null
                    ? formatCurrency(item.valorUnitarioEstimado)
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor original: {item.valorUnitarioEstimado != null ? formatCurrency(item.valorUnitarioEstimado) : '—'}
                </p>
              </div>
              {/* Bloco de fornecedor vencedor */}
              {fornecedor && <DetalhesFornecedor fornecedor={fornecedor} />}

              {!fornecedor && !loadingFornecedor && !erroFornecedor && (
                <div className="pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleBuscarFornecedor}
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
                      onClick={handleBuscarFornecedor}
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
                  <dd className="font-medium mt-0.5">{item.descricao}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">PNCP ID do item</dt>
                  <dd className="font-medium mt-0.5">
                    {item.numeroControlePNCP
                      ? `${item.numeroControlePNCP} - item ${item.numeroItem}`
                      : '—'}
                  </dd>
                </div>
    
                <div>
                  <dt className="text-muted-foreground">Data da licitação</dt>
                  <dd className="font-medium mt-0.5">{formatDate(item.dataLicitacao)}</dd>
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
                Mais campos (órgão, modalidade, link do processo etc.) serão exibidos quando o endpoint de detalhe estiver disponível.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
