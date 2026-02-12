import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { SourceCounter } from './SourceCounter';
import { type ProjetoItem } from '@/services/projetos';

interface ItemCardProps {
  item: ProjetoItem;
  index: number;
  showActions?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddSources?: () => void;
  onManageSources?: () => void;
  onClick?: () => void;
  children?: React.ReactNode; // For expanded content (sources list)
}

/**
 * ItemCard - Display project item with compliance status
 *
 * Key features:
 * - Left: Item name, quantity, unit
 * - Right: Median price, subtotal, source counter
 * - Badge: "3/3 ✓" (green) or "1/3 ⚠️" (red/orange)
 * - Expandable to show sources
 * - Actions: Edit, Delete, Add Sources
 */
export function ItemCard({
  item,
  index,
  showActions = true,
  expandable = false,
  expanded = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSources,
  onManageSources,
  onClick,
  children,
}: ItemCardProps) {
  const isCompliant = item.quantidadeFontes >= 3;
  const hasMediana = item.medianaCalculada !== null && item.medianaCalculada !== undefined;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateSubtotal = () => {
    if (!hasMediana) return null;
    return item.medianaCalculada! * item.quantidade;
  };

  const subtotal = calculateSubtotal();

  return (
    <Card
      className={`transition-all border-2 ${
        isCompliant 
          ? 'border-success/30 bg-success/5' 
          : 'border-warning/30 bg-warning/5'
      } ${onClick ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4">
            {/* Left: Item Info */}
            <div className="flex items-start gap-3 flex-1">
              <Badge variant="outline" className="mt-1">
                {index + 1}
              </Badge>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium text-lg leading-tight">{item.nome}</h3>
                {item.descricao && (
                  <p className="text-sm text-muted-foreground">{item.descricao}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>
                    {item.quantidade} {item.unidadeMedida}
                  </span>
                  {hasMediana && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-foreground">
                        Mediana: {formatCurrency(item.medianaCalculada!)}/un
                      </span>
                    </>
                  )}
                  {subtotal !== null && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-primary">
                        Subtotal: {formatCurrency(subtotal)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Source Counter & Actions */}
            <div className="flex flex-col items-end gap-2">
              <SourceCounter
                current={item.quantidadeFontes}
                minimum={3}
                variant="compact"
              />
              {showActions && (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      title="Editar item"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      title="Remover item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                  {expandable && onToggleExpand && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand();
                      }}
                      title={expanded ? 'Ocultar fontes' : 'Ver fontes'}
                    >
                      {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons Row */}
          {showActions && (onAddSources || onManageSources) && (
            <div className="flex gap-2 pt-2 border-t">
              {item.quantidadeFontes < 3 && onAddSources ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddSources();
                  }}
                  className="flex-1 gap-2 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Fontes ({3 - item.quantidadeFontes} faltando)
                </Button>
              ) : onManageSources ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageSources();
                  }}
                  className="flex-1 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Gerenciar Fontes ({item.quantidadeFontes})
                </Button>
              ) : null}
            </div>
          )}

          {/* Expanded Content (Sources List) */}
          {expandable && expanded && children && (
            <div className="pt-3 border-t">
              {children}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ItemCardSkeleton - Loading state
 */
export function ItemCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-8 h-6 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
          <div className="w-16 h-6 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
