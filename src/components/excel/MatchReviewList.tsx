import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react';
import { useState } from 'react';
import { type ItemBusca, type UploadResponse } from '@/services/items';

interface MatchReviewListProps {
    linhas: UploadResponse['linhas'];
    selections: Map<number, ItemBusca>;
    onToggleSelection: (linha: number, item: ItemBusca) => void;
    onSkipRow: (linha: number) => void;
}

export function MatchReviewList({
    linhas,
    selections,
    onToggleSelection,
    onSkipRow
}: MatchReviewListProps) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([linhas[0]?.linha]));

    const toggleRow = (linha: number) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(linha)) {
                newSet.delete(linha);
            } else {
                newSet.add(linha);
            }
            return newSet;
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="space-y-3">
            {linhas.map((linha) => {
                const isExpanded = expandedRows.has(linha.linha);
                const selectedItem = selections.get(linha.linha);
                const hasMatches = linha.matches && linha.matches.length > 0;

                return (
                    <Card
                        key={linha.linha}
                        className={`transition-all ${
                            selectedItem
                                ? 'border-2 border-success/50 bg-success/10'
                                : hasMatches
                                ? 'border-2 hover:border-primary/50'
                                : 'border-2 border-warning/50 bg-warning/10'
                        }`}
                    >
                        <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleRow(linha.linha)}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono">
                                            Linha {linha.linha}
                                        </Badge>
                                        {selectedItem ? (
                                            <Badge className="gap-1 bg-success text-success-foreground">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Aceito
                                            </Badge>
                                        ) : !hasMatches ? (
                                            <Badge variant="destructive" className="gap-1">
                                                <AlertCircle className="w-3 h-3" />
                                                Sem correspondências
                                            </Badge>
                                        ) : null}
                                    </div>
                                    <CardTitle className="text-base font-medium">
                                        {linha.descricaoOriginal}
                                    </CardTitle>
                                    {linha.quantidade && (
                                        <p className="text-sm text-muted-foreground">
                                            Quantidade: {linha.quantidade} {linha.unidade || ''}
                                        </p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRow(linha.linha);
                                    }}
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </CardHeader>

                        {isExpanded && (
                            <CardContent>
                                {!hasMatches ? (
                                    <Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            Nenhuma correspondência encontrada no histórico de licitações.
                                            Tente buscar manualmente ou pule esta linha.
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {linha.matches!.length} {linha.matches!.length === 1 ? 'correspondência encontrada' : 'correspondências encontradas'}:
                                        </p>

                                        <RadioGroup
                                            value={selectedItem?.id || ''}
                                            onValueChange={(itemId) => {
                                                const item = linha.matches!.find(m => m.id === itemId);
                                                if (item) {
                                                    onToggleSelection(linha.linha, item);
                                                }
                                            }}
                                        >
                                            <div className="space-y-3">
                                                {linha.matches!.slice(0, 3).map((match, index) => (
                                                    <div
                                                        key={match.id}
                                                        className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                                            selectedItem?.id === match.id
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:border-primary/50'
                                                        }`}
                                                        onClick={() => onToggleSelection(linha.linha, match)}
                                                    >
                                                        <RadioGroupItem
                                                            value={match.id}
                                                            id={`${linha.linha}-${match.id}`}
                                                            className="mt-1"
                                                        />
                                                        <Label
                                                            htmlFor={`${linha.linha}-${match.id}`}
                                                            className="flex-1 cursor-pointer space-y-1"
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="font-medium leading-tight">
                                                                    {match.descricao}
                                                                </p>
                                                                {index === 0 && !selectedItem && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        Sugerido
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                                                <span>
                                                                    <strong className="text-foreground">
                                                                        {formatCurrency(match.valorUnitarioEstimado)}
                                                                    </strong>
                                                                    /un
                                                                </span>
                                                                <span>•</span>
                                                                <span>
                                                                    {match.quantidade || '-'} {match.unidadeMedida}
                                                                </span>
                                                            </div>
                                                        </Label>
                                                    </div>
                                                ))}

                                                {linha.matches!.length > 3 && (
                                                    <p className="text-xs text-center text-muted-foreground">
                                                        + {linha.matches!.length - 3} mais {linha.matches!.length - 3 === 1 ? 'correspondência' : 'correspondências'}
                                                    </p>
                                                )}
                                            </div>
                                        </RadioGroup>

                                        <div className="flex gap-2 pt-2">
                                            {selectedItem && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onSkipRow(linha.linha)}
                                                    className="gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Pular esta linha
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                );
            })}
        </div>
    );
}
