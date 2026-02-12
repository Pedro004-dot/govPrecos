import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
}

export function UploadZone({ onFileSelect }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
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

    return (
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
    );
}
