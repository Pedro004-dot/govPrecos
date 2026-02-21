import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { itensService } from '@/services/items';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            onFileSelect(files[0]);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleDownloadModelo = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evitar trigger do click do card
        setIsDownloading(true);
        try {
            await itensService.downloadModelo();
        } catch (error) {
            console.error('Erro ao baixar modelo:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card
                className={cn(
                    "border-2 border-dashed transition-all cursor-pointer hover:border-primary/50 hover:bg-muted/50",
                    isDragging && "border-primary bg-primary/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        {isDragging ? (
                            <>
                                <FileSpreadsheet className="w-16 h-16 text-primary animate-bounce" />
                                <div>
                                    <p className="text-lg font-semibold text-primary">
                                        Solte o arquivo aqui
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <Upload className="w-16 h-16 text-muted-foreground" />
                                <div className="space-y-2">
                                    <p className="text-lg font-semibold">
                                        Arraste sua planilha aqui
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        ou clique para selecionar
                                    </p>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Formatos aceitos: .xlsx, .xls</p>
                                    <p>Tamanho máximo: 5MB</p>
                                    <p>Máximo: 200 linhas</p>
                                </div>
                            </>
                        )}
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileInputChange}
                    />
                </CardContent>
            </Card>

            {/* Botão de Download do Modelo */}
            <div className="flex items-center justify-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadModelo}
                    disabled={isDownloading}
                    className="gap-2"
                >
                    <Download className="w-4 h-4" />
                    {isDownloading ? 'Baixando...' : 'Baixar Modelo de Planilha'}
                </Button>
            </div>
        </div>
    );
}
