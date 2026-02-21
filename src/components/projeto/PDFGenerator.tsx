import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { projetosService, type Projeto } from '@/services/projetos';

type TipoRelatorio = 'completo' | 'resumido' | 'xlsx';

interface PDFGeneratorProps {
  projeto: Projeto;
}

export function PDFGenerator({ projeto }: PDFGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('completo');
  const [, setPreviewUrl] = useState<string | null>(null);

  const handleGenerate = async (preview: boolean = false) => {
    setGenerating(true);
    setError(null);

    try {
      // Generate report and get blob
      const blob = await projetosService.gerarRelatorio(projeto.id, tipoRelatorio);

      // Create URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Determine file extension based on type
      const extensao = tipoRelatorio === 'xlsx' ? 'xlsx' : 'pdf';
      const nomeArquivo = `Relatorio_${tipoRelatorio}_${projeto.nome.replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.${extensao}`;

      if (preview) {
        // Open in new tab for preview
        window.open(url, '_blank');
        setPreviewUrl(url);
      } else {
        // Download directly
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setLastGenerated(new Date());

      // Don't revoke URL immediately if preview
      if (!preview) {
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Erro desconhecido ao gerar relatório';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-success/30 bg-success/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-success" />
            <CardTitle>Relatório de Conformidade</CardTitle>
          </div>
          <Badge className="gap-1 bg-success text-success-foreground">
            <CheckCircle className="w-3 h-3" />
            Projeto Finalizado
          </Badge>
        </div>
        <CardDescription>
          Gerar documentação oficial conforme Lei 14.133/2021
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tipo de Relatório Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Relatório</label>
          <Select
            value={tipoRelatorio}
            onValueChange={(value) => setTipoRelatorio(value as TipoRelatorio)}
            disabled={generating}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o tipo de relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completo">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>PDF Completo</span>
                </span>
              </SelectItem>
              <SelectItem value="resumido">
                <span className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  <span>PDF Resumido</span>
                </span>
              </SelectItem>
              <SelectItem value="xlsx">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Planilha Excel (XLSX)</span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report Contents Info */}
        <div className="p-4 border rounded-lg bg-background">
          <h4 className="font-semibold text-sm mb-3">
            {tipoRelatorio === 'xlsx' ? 'Conteúdo da Planilha:' : 'Conteúdo do Relatório PDF:'}
          </h4>
          {tipoRelatorio === 'xlsx' ? (
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Abas: Resumo, Itens, Fontes e Estatísticas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Dados organizados em tabelas para análise</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Valores e cálculos prontos para uso</span>
              </div>
            </div>
          ) : tipoRelatorio === 'resumido' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Capa com dados do projeto</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Resumo executivo</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Itens com top 3 fontes principais</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Resumo financeiro</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>QR Code para acesso online</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Seção para assinatura</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Capa com dados do projeto e identificação do órgão</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Metodologia de pesquisa (Lei 14.133/2021)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Tabelas detalhadas por item com fontes PNCP</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Links clicáveis para verificação no PNCP</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Cálculo de mediana e valores totais</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Justificativas de outliers (se aplicável)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Resumo financeiro do projeto</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Extrato de fontes utilizadas</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>QR Code para acesso online</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Seção para assinatura do responsável</span>
              </div>
            </div>
          )}
        </div>

        {/* Last Generated Info */}
        {lastGenerated && !generating && (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle className="h-4 w-4 text-success" />
            <AlertDescription className="text-sm">
              <strong>Relatório gerado com sucesso!</strong>
              <br />
              <span className="text-xs text-muted-foreground">
                Último download:{' '}
                {lastGenerated.toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Erro ao gerar relatório:</strong>
              <br />
              {error}
              <br />
              <span className="text-xs mt-2 block">
                Se o erro persistir, verifique se todos os itens possuem fontes válidas e tente
                novamente.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Generation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            size="lg"
            className="gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <div className="text-left flex-1">
                  <div className="font-semibold">
                    Gerando {tipoRelatorio === 'xlsx' ? 'Planilha' : 'PDF'}...
                  </div>
                  <div className="text-xs opacity-90">Processando dados</div>
                </div>
              </>
            ) : (
              <>
                {tipoRelatorio === 'xlsx' ? (
                  <FileSpreadsheet className="w-5 h-5" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                <div className="text-left flex-1">
                  <div className="font-semibold">
                    Baixar {tipoRelatorio === 'xlsx' ? 'Planilha' : 'Relatório'}
                  </div>
                  <div className="text-xs opacity-90">Download automático</div>
                </div>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleGenerate(true)}
            disabled={generating}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            <div className="text-left flex-1">
              <div className="font-semibold">Visualizar PDF</div>
              <div className="text-xs text-muted-foreground">Abrir em nova aba</div>
            </div>
          </Button>
        </div>

        {/* Legal Notice */}
        <div className="p-3 border rounded-lg bg-info/10 border-info/30">
          <p className="text-xs text-info">
            <strong>📋 Atenção:</strong> Este relatório deve ser arquivado junto ao processo
            licitatório para fins de auditoria. Verifique se todos os dados estão corretos antes
            de assinar e anexar ao processo administrativo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
