import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { projetosService, type ValidationResult } from '@/services/projetos';

interface RealTimeValidationProps {
  projetoId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  onValidationChange?: (validation: ValidationResult) => void;
}

export function RealTimeValidation({
  projetoId,
  autoRefresh = true,
  refreshInterval = 5000,
  onValidationChange,
}: RealTimeValidationProps) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const loadValidation = async () => {
    try {
      const response = await projetosService.validar(projetoId);
      if (response.success && response.validacao) {
        setValidation(response.validacao);
        setLastChecked(new Date());
        if (onValidationChange) {
          onValidationChange(response.validacao);
        }
      }
    } catch (error) {
      console.error('Failed to validate:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadValidation();

    if (autoRefresh) {
      const interval = setInterval(loadValidation, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [projetoId, autoRefresh, refreshInterval]);

  if (loading && !validation) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Validando conformidade...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!validation) return null;

  const hasErrors = validation.erros.length > 0;
  const hasWarnings = validation.avisos.length > 0;
  const isValid = validation.valido;

  const getBorderColor = () => {
    if (hasErrors) return 'border-destructive/30';
    if (hasWarnings) return 'border-warning/30';
    return 'border-success/30';
  };

  const getBackgroundColor = () => {
    if (hasErrors) return 'bg-destructive/10';
    if (hasWarnings) return 'bg-warning/10';
    return 'bg-success/10';
  };

  const getIcon = () => {
    if (hasErrors)
      return <XCircle className="w-5 h-5 text-destructive" />;
    if (hasWarnings)
      return <AlertTriangle className="w-5 h-5 text-warning" />;
    return <CheckCircle className="w-5 h-5 text-success" />;
  };

  const getTitle = () => {
    if (hasErrors) return 'Pendências Encontradas';
    if (hasWarnings) return 'Avisos de Conformidade';
    return 'Projeto Conforme';
  };

  const getDescription = () => {
    if (hasErrors)
      return 'Este projeto possui erros que impedem a finalização conforme Lei 14.133/2021';
    if (hasWarnings)
      return 'Este projeto possui avisos que devem ser revisados';
    return 'Todos os requisitos foram atendidos e o projeto está pronto para finalização';
  };

  return (
    <Card className={`border-2 ${getBorderColor()} ${getBackgroundColor()}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {getIcon()}
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">{getTitle()}</h3>
                <p className="text-xs text-muted-foreground">{getDescription()}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={hasErrors ? 'destructive' : hasWarnings ? 'secondary' : 'default'}
                className="text-xs"
              >
                {isValid ? 'Válido' : 'Pendente'}
              </Badge>
              {lastChecked && (
                <span className="text-xs text-muted-foreground">
                  {lastChecked.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex gap-4 text-xs">
            {validation.erros.length > 0 && (
              <div className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-destructive" />
                <span className="font-medium">
                  {validation.erros.length} {validation.erros.length === 1 ? 'erro' : 'erros'}
                </span>
              </div>
            )}
            {validation.avisos.length > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="font-medium">
                  {validation.avisos.length} {validation.avisos.length === 1 ? 'aviso' : 'avisos'}
                </span>
              </div>
            )}
            {validation.infos.length > 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-info" />
                <span className="font-medium">
                  {validation.infos.length} {validation.infos.length === 1 ? 'info' : 'infos'}
                </span>
              </div>
            )}
            {isValid && validation.erros.length === 0 && (
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                <span className="font-medium">Todos os requisitos atendidos</span>
              </div>
            )}
          </div>

          {/* Quick Error List (collapsed) */}
          {hasErrors && (
            <div className="space-y-1 pt-2 border-t">
              {validation.erros.slice(0, 3).map((erro, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <span className="text-red-600 dark:text-red-400">•</span>
                  <span className="text-muted-foreground">{erro.mensagem}</span>
                </div>
              ))}
              {validation.erros.length > 3 && (
                <div className="text-xs text-muted-foreground pl-4">
                  +{validation.erros.length - 3} outros erros
                </div>
              )}
            </div>
          )}

          {/* Auto-refresh indicator */}
          {autoRefresh && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">
                Atualização automática a cada {refreshInterval / 1000}s
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
