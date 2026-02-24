import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
    Upload,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react';
import { itensService, type ItemBusca, type UploadResponse } from '@/services/items';
import { projetosService } from '@/services/projetos';
import { UploadZone } from './UploadZone';
import { MatchReviewList } from './MatchReviewList';

type Step = 'upload' | 'processing' | 'review';

interface ExcelUploadSheetProps {
    open: boolean;
    onClose: () => void;
    projetoId?: string;
    onSuccess?: () => void;
}

export function ExcelUploadSheet({ open, onClose, projetoId, onSuccess }: ExcelUploadSheetProps) {
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('upload');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [matches, setMatches] = useState<UploadResponse | null>(null);
    const [selections, setSelections] = useState<Map<number, ItemBusca>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [isCreatingItems, setIsCreatingItems] = useState(false);

    const handleFileSelect = async (selectedFile: File) => {
        // Validate file
        if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
            setError('Formato inválido. Use .xlsx ou .xls');
            return;
        }

        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('Arquivo muito grande. Máximo 5MB');
            return;
        }

        setError(null);

        // Start upload
        await handleUpload(selectedFile);
    };

    const handleUpload = async (fileToUpload: File) => {
        setStep('processing');
        setUploadProgress(0);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await itensService.uploadPlanilha(fileToUpload);

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (response.linhas && response.linhas.length > 0) {
                setMatches(response);

                // Auto-select first match for each row (high confidence)
                const autoSelections = new Map<number, ItemBusca>();
                response.linhas.forEach((linha) => {
                    if (linha.matches && linha.matches.length > 0) {
                        // Auto-select first match
                        autoSelections.set(linha.linha, linha.matches[0]);
                    }
                });
                setSelections(autoSelections);

                setTimeout(() => setStep('review'), 300);
            } else {
                setError('Nenhum item encontrado na planilha');
                setStep('upload');
            }
        } catch (err) {
            console.error('Upload failed:', err);
            setError('Erro ao processar planilha. Tente novamente.');
            setStep('upload');
        }
    };

    const handleToggleSelection = (linha: number, item: ItemBusca) => {
        setSelections(prev => {
            const newMap = new Map(prev);
            if (newMap.get(linha)?.id === item.id) {
                // Deselect if clicking the same item
                newMap.delete(linha);
            } else {
                // Select this item
                newMap.set(linha, item);
            }
            return newMap;
        });
    };

    const handleSkipRow = (linha: number) => {
        setSelections(prev => {
            const newMap = new Map(prev);
            newMap.delete(linha);
            return newMap;
        });
    };

    const handleCreateQuotation = async () => {
        if (!matches) return;

        const selectedItems = Array.from(selections.entries());

        if (selectedItems.length === 0) {
            setError('Selecione pelo menos um item');
            return;
        }

        // Se temos um projetoId, adicionar itens ao projeto existente
        if (projetoId) {
            setIsCreatingItems(true);
            setError(null);

            try {
                // Criar cada item no projeto
                for (const [linha, itemSelecionado] of selectedItems) {
                    // Encontrar a linha correspondente nos matches
                    const linhaData = matches.linhas.find(l => l.linha === linha);
                    if (!linhaData) continue;

                    // Criar o item usando dados da planilha original
                    await projetosService.criarItem(projetoId, {
                        nome: linhaData.descricaoOriginal,
                        descricao: itemSelecionado.descricao,
                        quantidade: linhaData.quantidade || itemSelecionado.quantidade || 1,
                        unidadeMedida: linhaData.unidade || itemSelecionado.unidadeMedida,
                    });
                }

                // Sucesso - recarregar e fechar
                if (onSuccess) {
                    onSuccess();
                }
                handleReset();
            } catch (err) {
                console.error('Failed to create items:', err);
                setError('Erro ao criar itens. Tente novamente.');
            } finally {
                setIsCreatingItems(false);
            }
        } else {
            // Comportamento original: navegar para criar nova cotação
            const legacySelectedItems = Array.from(selections.values());
            navigate('/projetos/novo', {
                state: { selectedItems: legacySelectedItems }
            });
            handleReset();
        }
    };

    const handleReset = () => {
        setStep('upload');
        setUploadProgress(0);
        setMatches(null);
        setSelections(new Map());
        setError(null);
        onClose();
    };

    const acceptedCount = selections.size;
    const skippedCount = matches ? matches.linhas.length - selections.size : 0;

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && handleReset()}>
            <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Importar Planilha Excel
                    </SheetTitle>
                    <SheetDescription>
                        Envie sua planilha e revise as sugestões de itens encontrados
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <UploadZone onFileSelect={handleFileSelect} />
                    )}

                    {/* Step 2: Processing */}
                    {step === 'processing' && (
                        <div className="space-y-4 py-12">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                <div className="text-center space-y-2">
                                    <h3 className="font-semibold text-lg">Processando planilha...</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Analisando linhas e buscando correspondências
                                    </p>
                                </div>
                                <div className="w-full max-w-md space-y-2">
                                    <Progress value={uploadProgress} className="h-2" />
                                    <p className="text-xs text-center text-muted-foreground">
                                        {uploadProgress}% concluído
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review Matches */}
                    {step === 'review' && matches && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="space-y-1">
                                    <p className="font-semibold">
                                        {matches.linhas.length} {matches.linhas.length === 1 ? 'linha encontrada' : 'linhas encontradas'}
                                    </p>
                                    <div className="flex gap-4 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4 text-success" />
                                            {acceptedCount} aceito{acceptedCount !== 1 ? 's' : ''}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <X className="w-4 h-4 text-muted-foreground" />
                                            {skippedCount} pulado{skippedCount !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setStep('upload');
                                        setMatches(null);
                                        setSelections(new Map());
                                    }}
                                >
                                    Enviar Nova Planilha
                                </Button>
                            </div>

                            {/* Match Review List */}
                            <MatchReviewList
                                linhas={matches.linhas}
                                selections={selections}
                                onToggleSelection={handleToggleSelection}
                                onSkipRow={handleSkipRow}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'review' && (
                    <SheetFooter className="border-t pt-4 mt-4 sticky bottom-0 bg-background">
                        <div className="w-full space-y-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground">
                                <span>
                                    {acceptedCount} {acceptedCount === 1 ? 'item selecionado' : 'itens selecionados'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleReset}
                                    className="flex-1"
                                    disabled={isCreatingItems}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateQuotation}
                                    disabled={acceptedCount === 0 || isCreatingItems}
                                    className="flex-1"
                                >
                                    {isCreatingItems ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Adicionando itens...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            {projetoId
                                                ? `Adicionar ${acceptedCount} ${acceptedCount === 1 ? 'item' : 'itens'}`
                                                : `Criar Cotação com ${acceptedCount} ${acceptedCount === 1 ? 'item' : 'itens'}`
                                            }
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
