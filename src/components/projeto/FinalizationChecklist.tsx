import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Projeto, ProjetoItem, ValidationResult } from '@/services/projetos';

interface FinalizationChecklistProps {
  projeto: Projeto;
  itens: ProjetoItem[];
  validation: ValidationResult | null;
  onFinalize: (justificativa?: string) => Promise<void>;
  loading?: boolean;
}

interface ChecklistItem {
  id: string;
  label: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  blocking: boolean;
}

export function FinalizationChecklist({
  projeto,
  itens,
  validation,
  onFinalize,
  loading = false,
}: FinalizationChecklistProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [processing, setProcessing] = useState(false);

  // Build checklist items
  const buildChecklist = (): ChecklistItem[] => {
    const checklist: ChecklistItem[] = [];

    // Check 1: Project has items
    checklist.push({
      id: 'has_items',
      label: 'Projeto possui itens',
      status: itens.length > 0 ? 'passed' : 'failed',
      message:
        itens.length > 0
          ? `${itens.length} ${itens.length === 1 ? 'item cadastrado' : 'itens cadastrados'}`
          : 'Nenhum item cadastrado',
      blocking: itens.length === 0,
    });

    // Check 2: All items have 3+ sources
    const itensComFontesInsuficientes = itens.filter((item) => item.quantidadeFontes < 3);
    checklist.push({
      id: 'minimum_sources',
      label: 'Mínimo 3 fontes por item (Lei 14.133/2021)',
      status:
        itensComFontesInsuficientes.length === 0
          ? 'passed'
          : itensComFontesInsuficientes.length === itens.length
          ? 'failed'
          : 'warning',
      message:
        itensComFontesInsuficientes.length === 0
          ? 'Todos os itens possuem 3+ fontes'
          : `${itensComFontesInsuficientes.length} ${
              itensComFontesInsuficientes.length === 1 ? 'item precisa' : 'itens precisam'
            } de mais fontes`,
      blocking: itensComFontesInsuficientes.length > 0,
    });

    // Check 3: All items have calculated median
    const itensSemMediana = itens.filter(
      (item) => item.medianaCalculada === null || item.medianaCalculada === undefined
    );
    checklist.push({
      id: 'has_median',
      label: 'Mediana calculada para todos os itens',
      status: itensSemMediana.length === 0 ? 'passed' : 'failed',
      message:
        itensSemMediana.length === 0
          ? 'Todos os itens têm mediana calculada'
          : `${itensSemMediana.length} ${
              itensSemMediana.length === 1 ? 'item sem' : 'itens sem'
            } mediana`,
      blocking: itensSemMediana.length > 0,
    });

    // Check 4: Validation passed
    if (validation) {
      checklist.push({
        id: 'validation',
        label: 'Validação de conformidade',
        status: validation.valido ? 'passed' : 'warning',
        message: validation.valido
          ? 'Projeto conforme com todos os requisitos'
          : `${validation.erros.length} ${
              validation.erros.length === 1 ? 'erro' : 'erros'
            }, ${validation.avisos.length} ${validation.avisos.length === 1 ? 'aviso' : 'avisos'}`,
        blocking: false, // Can finalize with justification
      });
    }

    return checklist;
  };

  const checklist = buildChecklist();
  const hasBlockingIssues = checklist.some((item) => item.blocking && item.status === 'failed');
  const hasWarnings = checklist.some((item) => item.status === 'warning' || item.status === 'failed');
  const canFinalize = projeto.status !== 'finalizado';

  const handleFinalizeClick = () => {
    if (hasBlockingIssues) {
      return; // Should not happen, button is disabled
    }

    if (hasWarnings) {
      // Open justification dialog
      setConfirmDialogOpen(true);
    } else {
      // Direct finalization
      handleConfirmFinalize();
    }
  };

  const handleConfirmFinalize = async () => {
    setProcessing(true);
    try {
      await onFinalize(hasWarnings ? justificativa.trim() : undefined);
      setConfirmDialogOpen(false);
      setJustificativa('');
    } catch (error) {
      console.error('Finalization failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: 'passed' | 'failed' | 'warning') => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
    }
  };

  return (
    <>
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Checklist de Finalização
          </CardTitle>
          <CardDescription>
            Verifique todos os requisitos antes de finalizar o projeto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Checklist Items */}
          <div className="space-y-3">
            {checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                {getStatusIcon(item.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{item.label}</span>
                    {item.blocking && item.status !== 'passed' && (
                      <Badge variant="destructive" className="text-xs">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t">
            {hasBlockingIssues ? (
              <div className="p-3 rounded-lg bg-destructive/10 border-2 border-destructive/30">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-destructive mb-1">
                      Projeto não pode ser finalizado
                    </div>
                    <p className="text-sm text-destructive/90">
                      Resolva todos os itens obrigatórios antes de finalizar o projeto.
                    </p>
                  </div>
                </div>
              </div>
            ) : hasWarnings ? (
              <div className="p-3 rounded-lg bg-warning/10 border-2 border-warning/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-warning mb-1">
                      Projeto pode ser finalizado com justificativa
                    </div>
                    <p className="text-sm text-warning/90">
                      Alguns requisitos não foram totalmente atendidos. Você precisará fornecer
                      uma justificativa.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-success/10 border-2 border-success/30">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-success mb-1">
                      Projeto pronto para finalização
                    </div>
                    <p className="text-sm text-success/90">
                      Todos os requisitos foram atendidos. O projeto está conforme a Lei
                      14.133/2021.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Finalize Button */}
          <Button
            onClick={handleFinalizeClick}
            disabled={hasBlockingIssues || !canFinalize || loading || processing}
            className="w-full gap-2"
            size="lg"
          >
            {loading || processing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {projeto.status === 'finalizado'
              ? 'Projeto Finalizado'
              : hasWarnings
              ? 'Finalizar com Justificativa'
              : 'Finalizar Projeto'}
          </Button>
        </CardContent>
      </Card>

      {/* Justification Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Finalizar Projeto com Justificativa</DialogTitle>
            <DialogDescription>
              Este projeto possui pendências. Forneça uma justificativa técnica adequada para
              finalizar mesmo assim, conforme Lei 14.133/2021.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Show warnings/errors */}
            {validation && (
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold text-sm mb-2">Pendências Identificadas:</h4>
                <ul className="space-y-1 text-sm">
                  {validation.erros.map((erro, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      <span>{erro.mensagem}</span>
                    </li>
                  ))}
                  {validation.avisos.map((aviso, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-warning">•</span>
                      <span>{aviso.mensagem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Justification input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Justificativa Técnica <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Ex: Devido à especificidade dos itens solicitados e ao prazo reduzido, não foi possível obter 3 fontes para todos os itens. As fontes disponíveis foram criteriosamente selecionadas e são representativas do mercado local..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo 20 caracteres. Esta justificativa será incluída no relatório final para
                fins de auditoria.
              </p>
            </div>

            {/* Legal notice */}
            <div className="p-3 border rounded-lg" style={{ background: 'var(--info-box-bg)', borderColor: 'var(--info-box-border)' }}>
              <p className="text-xs" style={{ color: 'var(--info-box-text)' }}>
                <strong>⚖️ Atenção:</strong> A justificativa deve estar fundamentada em razões
                técnicas ou de mercado. Projetos finalizados com pendências devem ter
                documentação adequada para auditoria conforme Art. 23 da Lei 14.133/2021.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmFinalize}
              disabled={justificativa.trim().length < 20 || processing}
              className="gap-2"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirmar Finalização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
