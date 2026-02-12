import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Building2,
  Trash2,
} from 'lucide-react';
import {
  projetosService,
  type ProjetoItem,
  type ItemFonteDetalhada,
} from '@/services/projetos';
import { SourceCounter } from '@/components/projeto/SourceCounter';
import { OutlierDialog } from '@/components/projeto/OutlierDialog';
import { RecencyWarning } from '@/components/projeto/RecencyWarning';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ItemSourceManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<ProjetoItem | null>(null);
  const [fontes, setFontes] = useState<ItemFonteDetalhada[]>([]);

  // Ignore/Include dialog
  const [ignoreDialogOpen, setIgnoreDialogOpen] = useState(false);
  const [selectedFonte, setSelectedFonte] = useState<ItemFonteDetalhada | null>(null);
  const [processing, setProcessing] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fonteToDelete, setFonteToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadItem();
    }
  }, [id]);

  const loadItem = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await projetosService.buscarItem(id);
      if (response.success) {
        setItem(response.item);
        // Fontes vêm separadas na resposta, não dentro de item
        setFontes(response.fontes || []);
      }
    } catch (error) {
      console.error('Failed to load item:', error);
      alert('Erro ao carregar item');
    } finally {
      setLoading(false);
    }
  };

  const handleIgnoreFonte = (fonte: ItemFonteDetalhada) => {
    setSelectedFonte(fonte);
    setIgnoreDialogOpen(true);
  };

  const handleConfirmIgnore = async (justificativa: string) => {
    if (!selectedFonte) return;

    setProcessing(true);
    try {
      const response = await projetosService.marcarFonteIgnorada(
        selectedFonte.id,
        justificativa
      );
      if (response.success) {
        // Update item with new median
        if (item) {
          setItem({
            ...item,
            medianaCalculada: response.medianaAtualizada || undefined,
          });
        }

        // Reload sources to get updated data
        loadItem();
        setSelectedFonte(null);
      }
    } catch (error) {
      console.error('Failed to ignore fonte:', error);
      alert('Erro ao marcar fonte como ignorada');
    } finally {
      setProcessing(false);
    }
  };

  const handleIncludeFonte = async (fonteId: string) => {
    setProcessing(true);
    try {
      const response = await projetosService.marcarFonteIncluida(fonteId);
      if (response.success) {
        // Update item with new median
        if (item) {
          setItem({
            ...item,
            medianaCalculada: response.medianaAtualizada || undefined,
          });
        }

        // Reload sources
        loadItem();
      }
    } catch (error) {
      console.error('Failed to include fonte:', error);
      alert('Erro ao incluir fonte');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteFonte = async () => {
    if (!fonteToDelete || !id) return;

    setProcessing(true);
    try {
      await projetosService.removerFonte(id, fonteToDelete);
      // Reload item to get updated median and source count
      loadItem();
      setDeleteConfirmOpen(false);
      setFonteToDelete(null);
    } catch (error) {
      console.error('Failed to delete fonte:', error);
      alert('Erro ao remover fonte');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const calcularDesvioPercentual = (valor: number, mediana?: number) => {
    if (!mediana || mediana === 0) return null;
    const desvio = ((valor - mediana) / mediana) * 100;
    return desvio.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h3 className="text-lg font-medium mb-2">Item não encontrado</h3>
        <Button onClick={() => navigate('/')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const fontesIncluidas = fontes.filter(f => !f.ignoradoCalculo);
  const fontesIgnoradas = fontes.filter(f => f.ignoradoCalculo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/projeto/${item.projetoId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gerenciar Fontes</h1>
            <p className="text-muted-foreground mt-1">
              {item.nome} • {item.quantidade} {item.unidadeMedida}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <SourceCounter current={item.quantidadeFontes} minimum={3} />
          <Button
            onClick={() => navigate(`/buscar?itemId=${item.id}`)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Fontes
          </Button>
        </div>
      </div>

      {/* Warning if <3 sources */}
      {item.quantidadeFontes < 3 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Este item precisa de {3 - item.quantidadeFontes} fonte(s) adicional(is) para cumprir o
            requisito mínimo da Lei 14.133/2021. <strong>Projeto não pode ser finalizado.</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Median Display */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Mediana Calculada (Atualização Automática)</CardTitle>
          <CardDescription>
            Valor central considerando apenas fontes incluídas no cálculo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <div className="text-4xl font-bold text-primary">
              {item.medianaCalculada !== null && item.medianaCalculada !== undefined
                ? formatCurrency(item.medianaCalculada)
                : '-'}
            </div>
            <span className="text-muted-foreground">/un</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Baseada em {fontesIncluidas.length} fonte(s)
            {fontesIgnoradas.length > 0 && ` (${fontesIgnoradas.length} ignorada(s))`}
          </p>
          {item.medianaCalculada !== null && item.medianaCalculada !== undefined && (
            <p className="text-sm font-medium mt-2">
              Subtotal estimado: {formatCurrency(item.medianaCalculada * item.quantidade)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sources List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fontes Vinculadas ({fontes.length})</CardTitle>
              <CardDescription>
                Itens do PNCP utilizados como referência de preço
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fontes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma fonte vinculada ainda</p>
              <Button onClick={() => navigate(`/buscar?itemId=${item.id}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Buscar Fontes no PNCP
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Included Sources */}
              {fontesIncluidas.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Incluídas no Cálculo ({fontesIncluidas.length})
                  </h3>
                  {fontesIncluidas.map((fonte) => {
                    const desvio = calcularDesvioPercentual(fonte.valorUnitario, item.medianaCalculada);

                    return (
                      <Card key={fonte.id} className="border-success/30 bg-success/5">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span className="font-semibold text-lg">
                                  {formatCurrency(fonte.valorUnitario)}/un
                                </span>
                                {desvio && (
                                  <Badge variant="outline">
                                    {desvio}% {parseFloat(desvio) >= 0 ? 'acima' : 'abaixo'} da mediana
                                  </Badge>
                                )}
                                <RecencyWarning
                                  dataLicitacao={fonte.dataLicitacao}
                                  thresholdMonths={12}
                                  variant="badge"
                                />
                              </div>

                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {fonte.descricaoPNCP}
                              </p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {fonte.razaoSocialOrgao}
                                </span>
                                {fonte.municipioNome && (
                                  <span>
                                    {fonte.municipioNome}, {fonte.ufSigla}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(fonte.dataLicitacao)}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `https://pncp.gov.br/app/editais/${fonte.numeroControlePNCP}`,
                                    '_blank'
                                  )
                                }
                                className="gap-2"
                              >
                                <ExternalLink className="w-3 h-3" />
                                PNCP
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleIgnoreFonte(fonte)}
                                disabled={processing}
                              >
                                Ignorar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFonteToDelete(fonte.id);
                                  setDeleteConfirmOpen(true);
                                }}
                                disabled={processing}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Ignored Sources */}
              {fontesIgnoradas.length > 0 && (
                <div className="space-y-2 mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Ignoradas (Outliers) ({fontesIgnoradas.length})
                  </h3>
                  {fontesIgnoradas.map((fonte) => {
                    const desvio = calcularDesvioPercentual(fonte.valorUnitario, item.medianaCalculada);

                    return (
                      <Card
                        key={fonte.id}
                        className="border-warning/30 bg-warning/10"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-warning" />
                                <span className="font-semibold text-lg line-through text-muted-foreground">
                                  {formatCurrency(fonte.valorUnitario)}/un
                                </span>
                                {desvio && (
                                  <Badge variant="destructive">
                                    ⚠️ {desvio}% {parseFloat(desvio) >= 0 ? 'acima' : 'abaixo'}
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {fonte.descricaoPNCP}
                              </p>

                              {fonte.justificativaExclusao && (
                                <Alert className="bg-background">
                                  <AlertDescription className="text-xs">
                                    <strong>Justificativa:</strong> {fonte.justificativaExclusao}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleIncludeFonte(fonte.id)}
                                disabled={processing}
                              >
                                Incluir
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setFonteToDelete(fonte.id);
                                  setDeleteConfirmOpen(true);
                                }}
                                disabled={processing}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outlier Dialog */}
      <OutlierDialog
        fonte={selectedFonte}
        mediana={item.medianaCalculada || 0}
        open={ignoreDialogOpen}
        onClose={() => {
          setIgnoreDialogOpen(false);
          setSelectedFonte(null);
        }}
        onConfirm={handleConfirmIgnore}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Remoção</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover esta fonte? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteFonte} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Confirmar Remoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
