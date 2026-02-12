import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, XCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { type ValidationResult, type ValidationMessage } from '@/services/projetos';
import { useState } from 'react';

interface ValidationAlertProps {
  validation: ValidationResult;
  onDismiss?: () => void;
  onItemClick?: (itemId: string) => void;
  showDetails?: boolean;
}

/**
 * ValidationAlert - Display compliance warnings/errors
 *
 * Three levels of alerts:
 * - ERROR (Red): Blocks finalization - requires action
 * - WARNING (Orange): Alerts only - doesn't block
 * - INFO (Blue): Suggestions - user decides
 *
 * This is the "audit safety net" - shows exactly what needs fixing
 */
export function ValidationAlert({
  validation,
  onDismiss,
  onItemClick,
  showDetails = true,
}: ValidationAlertProps) {
  const [expanded, setExpanded] = useState(false);

  const { valido, erros, avisos, infos } = validation;

  // If valid and no warnings/infos, show success message
  if (valido && avisos.length === 0 && infos.length === 0) {
    return (
      <Alert className="border-success/30 bg-success/10">
        <Info className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">
          ✓ Projeto em Conformidade
        </AlertTitle>
        <AlertDescription className="text-success/90">
          Todos os itens possuem 3 ou mais fontes. Projeto pronto para finalização conforme Lei 14.133/2021.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {/* Errors (Blocking) */}
      {erros.length > 0 && (
        <Alert variant="destructive" className="relative">
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <XCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Erros Bloqueantes ({erros.length})
            <Badge variant="destructive" className="ml-auto">
              Impede Finalização
            </Badge>
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p className="text-sm">
                Os seguintes problemas devem ser corrigidos antes de finalizar o projeto:
              </p>
              <ul className="space-y-1">
                {erros.map((erro, idx) => (
                  <li key={idx} className="text-sm">
                    <ValidationMessageItem
                      message={erro}
                      onItemClick={onItemClick}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings (Non-blocking) */}
      {avisos.length > 0 && (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning flex items-center gap-2">
            Avisos ({avisos.length})
            <Badge variant="outline" className="ml-auto border-warning/50 text-warning">
              Não Bloqueia
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-warning/90">
            <div className="space-y-2 mt-2">
              <p className="text-sm">Recomendações para melhor conformidade:</p>
              <div className={`space-y-1 ${!showDetails && avisos.length > 3 && !expanded ? 'max-h-20 overflow-hidden' : ''}`}>
                {avisos.map((aviso, idx) => (
                  <div key={idx} className="text-sm">
                    <ValidationMessageItem
                      message={aviso}
                      onItemClick={onItemClick}
                    />
                  </div>
                ))}
              </div>
              {!showDetails && avisos.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="gap-2 h-auto py-1 px-2"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Ver menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Ver todos ({avisos.length} avisos)
                    </>
                  )}
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Infos (Suggestions) */}
      {infos.length > 0 && showDetails && (
        <Alert className="border-info/30 bg-info/10">
          <Info className="h-4 w-4 text-info" />
          <AlertTitle className="text-info">
            Informações ({infos.length})
          </AlertTitle>
          <AlertDescription className="text-info/90">
            <div className="space-y-2 mt-2">
              <ul className="space-y-1">
                {infos.map((info, idx) => (
                  <li key={idx} className="text-sm">
                    <ValidationMessageItem
                      message={info}
                      onItemClick={onItemClick}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * ValidationMessageItem - Individual validation message
 */
function ValidationMessageItem({
  message,
  onItemClick,
}: {
  message: ValidationMessage;
  onItemClick?: (itemId: string) => void;
}) {
  const { mensagem, itemId } = message;

  return (
    <div className="flex items-start gap-2">
      <span className="flex-1">{mensagem}</span>
      {itemId && onItemClick && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          onClick={() => onItemClick(itemId)}
        >
          Ver item
        </Button>
      )}
    </div>
  );
}

/**
 * ValidationSummary - Compact version for cards/badges
 */
export function ValidationSummary({ validation }: { validation: ValidationResult }) {
  const { valido, erros, avisos } = validation;

  if (valido && avisos.length === 0) {
    return (
      <Badge className="gap-1 bg-success text-success-foreground">
        <Info className="w-3 h-3" />
        Conforme
      </Badge>
    );
  }

  if (erros.length > 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="w-3 h-3" />
        {erros.length} {erros.length === 1 ? 'erro' : 'erros'}
      </Badge>
    );
  }

  if (avisos.length > 0) {
    return (
      <Badge className="gap-1 bg-warning text-warning-foreground">
        <AlertTriangle className="w-3 h-3" />
        {avisos.length} {avisos.length === 1 ? 'aviso' : 'avisos'}
      </Badge>
    );
  }

  return null;
}
