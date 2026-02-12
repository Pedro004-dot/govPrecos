import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';

interface RecencyWarningProps {
  dataLicitacao?: string;
  thresholdMonths?: number; // default 12
  variant?: 'badge' | 'alert' | 'inline';
  showIcon?: boolean;
}

export function RecencyWarning({
  dataLicitacao,
  thresholdMonths = 12,
  variant = 'badge',
  showIcon = true,
}: RecencyWarningProps) {
  if (!dataLicitacao) return null;

  const calcularIdadeMeses = (dateString: string) => {
    const hoje = new Date();
    const dataLicitacao = new Date(dateString);
    const diffMs = hoje.getTime() - dataLicitacao.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  };

  const idadeMeses = calcularIdadeMeses(dataLicitacao);
  const isAntiga = idadeMeses > thresholdMonths;

  if (!isAntiga) return null;

  const formattedDate = new Date(dataLicitacao).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const getMessage = () => {
    if (idadeMeses < 18) {
      return `Fonte com ${idadeMeses} meses de idade`;
    } else if (idadeMeses < 24) {
      return `Fonte antiga (${idadeMeses} meses)`;
    } else {
      const anos = Math.floor(idadeMeses / 12);
      const mesesRestantes = idadeMeses % 12;
      return `Fonte muito antiga (${anos} ${anos === 1 ? 'ano' : 'anos'}${
        mesesRestantes > 0 ? ` e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}` : ''
      })`;
    }
  };

  const getSeverity = (): 'warning' | 'error' => {
    if (idadeMeses > 24) return 'error'; // >2 years
    return 'warning'; // 12-24 months
  };

  const severity = getSeverity();

  // Badge variant
  if (variant === 'badge') {
    return (
      <Badge
        variant={severity === 'error' ? 'destructive' : 'secondary'}
        className="gap-1 text-xs"
      >
        {showIcon && <Calendar className="w-3 h-3" />}
        {idadeMeses} meses
      </Badge>
    );
  }

  // Alert variant
  if (variant === 'alert') {
    return (
      <Alert
        variant={severity === 'error' ? 'destructive' : 'default'}
        className={
          severity === 'warning'
            ? 'border-warning/30 bg-warning/10'
            : ''
        }
      >
        {showIcon && (
          <AlertTriangle
            className={`h-4 w-4 ${
              severity === 'warning'
                ? 'text-warning'
                : 'text-destructive'
            }`}
          />
        )}
        <AlertDescription>
          <strong>{getMessage()}</strong> - Publicada em {formattedDate}. Considere buscar
          fontes mais recentes para melhor precisão nos preços de mercado.
        </AlertDescription>
      </Alert>
    );
  }

  // Inline variant
  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs ${
        severity === 'error'
          ? 'text-destructive'
          : 'text-warning'
      }`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5" />}
      <span className="font-medium">{getMessage()}</span>
    </div>
  );
}

// Helper function to calculate age in months (can be exported and used elsewhere)
export const calcularIdadeMeses = (dateString?: string): number | null => {
  if (!dateString) return null;
  const hoje = new Date();
  const dataLicitacao = new Date(dateString);
  const diffMs = hoje.getTime() - dataLicitacao.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
};

// Helper function to check if source is old
export const isFonteAntiga = (dateString?: string, thresholdMonths = 12): boolean => {
  const idade = calcularIdadeMeses(dateString);
  return idade !== null && idade > thresholdMonths;
};
