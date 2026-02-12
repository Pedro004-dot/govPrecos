import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

interface SourceCounterProps {
  current: number;
  minimum?: number; // default 3
  itemName?: string;
  variant?: 'default' | 'compact';
  showIcon?: boolean;
}

/**
 * SourceCounter - Visual indicator for Law 14.133/2021 compliance
 *
 * Shows "X/3 sources" with color coding:
 * - Red (0-1): Critical - needs immediate attention
 * - Orange (2): Warning - almost there
 * - Green (3+): Compliant - meets legal requirement
 *
 * This component is central to the "fear-driven design" - public servants
 * can see at a glance if they're compliant or at risk of audit issues.
 */
export function SourceCounter({
  current,
  minimum = 3,
  itemName,
  variant = 'default',
  showIcon = true,
}: SourceCounterProps) {
  // Determine compliance status
  const isCompliant = current >= minimum;
  const isClose = current === minimum - 1;

  // Color classes based on status - using professional government color system
  const getColorClasses = () => {
    if (isCompliant) {
      return 'bg-success text-success-foreground border-success';
    }
    if (isClose) {
      return 'bg-warning text-warning-foreground border-warning';
    }
    return 'bg-destructive text-destructive-foreground border-destructive';
  };

  // Icon based on status
  const getIcon = () => {
    if (isCompliant) return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (isClose) return <AlertTriangle className="w-3.5 h-3.5" />;
    return <XCircle className="w-3.5 h-3.5" />;
  };

  // Helper text for tooltip/description
  const getHelperText = () => {
    if (isCompliant) {
      return `✓ Compliant - ${current} sources linked (Lei 14.133/2021)`;
    }
    const remaining = minimum - current;
    return `⚠️ Need ${remaining} more ${remaining === 1 ? 'source' : 'sources'} to comply`;
  };

  if (variant === 'compact') {
    return (
      <Badge
        className={`gap-1.5 font-medium ${getColorClasses()}`}
        title={getHelperText()}
      >
        {showIcon && getIcon()}
        {current}/{minimum}
      </Badge>
    );
  }

  // Default variant - more detailed
  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`gap-1.5 font-medium px-3 py-1 ${getColorClasses()}`}
        title={getHelperText()}
      >
        {showIcon && getIcon()}
        <span className="text-sm">
          {current}/{minimum} {current === 1 ? 'fonte' : 'fontes'}
        </span>
      </Badge>
      {itemName && !isCompliant && (
        <span className="text-xs text-muted-foreground">
          para "{itemName}"
        </span>
      )}
    </div>
  );
}

/**
 * SourceCounterText - Plain text version for non-badge contexts
 */
export function SourceCounterText({
  current,
  minimum = 3,
}: {
  current: number;
  minimum?: number;
}) {
  const isCompliant = current >= minimum;
  const remaining = minimum - current;

  if (isCompliant) {
    return (
      <span className="text-sm font-medium text-success">
        ✓ {current} fontes vinculadas
      </span>
    );
  }

  return (
    <span className="text-sm font-medium text-warning">
      {current}/{minimum} fontes • Faltam {remaining}
    </span>
  );
}
