import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import type { ItemFonteDetalhada } from '@/services/projetos';

interface OutlierDialogProps {
  fonte: ItemFonteDetalhada | null;
  mediana: number;
  open: boolean;
  onClose: () => void;
  onConfirm: (justificativa: string) => void;
}

export function OutlierDialog({
  fonte,
  mediana,
  open,
  onClose,
  onConfirm,
}: OutlierDialogProps) {
  const [justificativa, setJustificativa] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (justificativa.trim().length < 10) {
      setError('Justificativa deve ter no mínimo 10 caracteres');
      return;
    }

    onConfirm(justificativa.trim());
    handleClose();
  };

  const handleClose = () => {
    setJustificativa('');
    setError('');
    onClose();
  };

  if (!fonte) return null;

  const calcularDesvioPercentual = (valor: number, med: number) => {
    if (!med || med === 0) return 0;
    return ((valor - med) / med) * 100;
  };

  const desvio = calcularDesvioPercentual(fonte.valorUnitario, mediana);
  const isAboveMedian = fonte.valorUnitario > mediana;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Ignorar Fonte de Preço
          </DialogTitle>
          <DialogDescription>
            Esta fonte será excluída do cálculo da mediana. Forneça uma justificativa para
            fins de auditoria conforme Lei 14.133/2021.
          </DialogDescription>
        </DialogHeader>

        {/* Price Comparison */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <h4 className="font-semibold mb-3 text-sm text-muted-foreground">
              Comparação de Preços
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Preço da Fonte</div>
                <div className="text-xl font-bold">{formatCurrency(fonte.valorUnitario)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Mediana Atual</div>
                <div className="text-xl font-bold text-primary">
                  {formatCurrency(mediana)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Desvio</div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold text-warning">
                    {desvio > 0 ? '+' : ''}
                    {desvio.toFixed(1)}%
                  </div>
                  {isAboveMedian ? (
                    <TrendingUp className="w-5 h-5 text-warning" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-warning" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Source Details */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Detalhes da Fonte</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Descrição: </span>
                <span className="font-medium">{fonte.descricaoPNCP}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Órgão: </span>
                <span>{fonte.razaoSocialOrgao}</span>
              </div>
              {fonte.dataLicitacao && (
                <div>
                  <span className="text-muted-foreground">Data: </span>
                  <span>
                    {new Date(fonte.dataLicitacao).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              {fonte.numeroControlePNCP && (
                <div>
                  <span className="text-muted-foreground">PNCP: </span>
                  <span className="font-mono text-xs">{fonte.numeroControlePNCP}</span>
                </div>
              )}
            </div>
          </div>

          {/* Outlier Badge */}
          {Math.abs(desvio) > 30 && (
            <div className="flex items-start gap-3 p-3 border-2 border-warning/30 rounded-lg bg-warning/10">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-warning">
                  Potencial Outlier Detectado
                </div>
                <div className="text-sm text-warning/90 mt-1">
                  Este preço desvia {Math.abs(desvio).toFixed(1)}% da mediana. Preços com
                  desvio superior a 30% podem ser outliers estatísticos e devem ser
                  justificados adequadamente.
                </div>
              </div>
            </div>
          )}

          {/* Justification Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Justificativa <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={justificativa}
              onChange={(e) => {
                setJustificativa(e.target.value);
                setError('');
              }}
              placeholder="Ex: Preço muito acima da média de mercado, podendo indicar especificações diferentes ou erro de cotação. Outros preços pesquisados se mostraram mais condizentes com a realidade local..."
              className="min-h-[120px]"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <p className="text-xs text-muted-foreground">
              Mínimo 10 caracteres. Esta justificativa será incluída no relatório de pesquisa
              de preços para fins de auditoria.
            </p>
          </div>

          {/* Audit Notice */}
          <div className="p-3 border rounded-lg" style={{ background: 'var(--info-box-bg)', borderColor: 'var(--info-box-border)' }}>
            <div className="flex items-start gap-2">
              <div className="text-xs" style={{ color: 'var(--info-box-text)' }}>
                <strong>⚖️ Conformidade Legal:</strong> A justificativa para exclusão de
                fontes de preço deve estar fundamentada e documentada conforme Art. 23 da Lei
                14.133/2021. O uso de mediana auxilia na mitigação de valores discrepantes,
                mas a exclusão manual requer justificativa técnica adequada.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={justificativa.trim().length < 10}
            className="gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Confirmar Exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
