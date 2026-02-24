import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Shield,
  Sparkles,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { projetosService, type Projeto } from '@/services/projetos';
import './PDFGenerator.css';

type TipoRelatorio = 'completo' | 'resumido' | 'xlsx';

interface PDFGeneratorDialogProps {
  projeto: Projeto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ReportTypeOption {
  id: TipoRelatorio;
  icon: typeof FileCheck;
  title: string;
  description: string;
  badge?: string;
  features: string[];
}

interface CachedReport {
  blob: Blob;
  url: string;
  generatedAt: Date;
  fileName: string;
}

const reportTypes: ReportTypeOption[] = [
  {
    id: 'completo',
    icon: FileText,
    title: 'Relatório Completo',
    description: 'Documentação detalhada com todas as fontes e justificativas',
    badge: 'Recomendado',
    features: [
      'Capa institucional completa',
      'Metodologia Lei 14.133/2021',
      'Tabelas detalhadas com fontes PNCP',
      'Links clicáveis para verificação',
      'Cálculos e justificativas',
      'QR Code e seção de assinatura',
    ],
  },
  {
    id: 'resumido',
    icon: FileCheck,
    title: 'Relatório Resumido',
    description: 'Versão compacta com informações essenciais',
    features: [
      'Capa com dados do projeto',
      'Resumo executivo',
      'Top 3 fontes por item',
      'Resumo financeiro',
      'QR Code de acesso',
      'Área para assinatura',
    ],
  },
  {
    id: 'xlsx',
    icon: FileSpreadsheet,
    title: 'Planilha Excel',
    description: 'Dados estruturados para análise e processamento',
    features: [
      'Múltiplas abas organizadas',
      'Dados em formato de tabela',
      'Cálculos prontos para uso',
      'Fácil importação e análise',
    ],
  },
];

export function PDFGeneratorDialog({ projeto, open, onOpenChange }: PDFGeneratorDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('completo');

  // Cache de relatórios gerados (por tipo)
  const [cachedReports, setCachedReports] = useState<Record<TipoRelatorio, CachedReport | null>>({
    completo: null,
    resumido: null,
    xlsx: null,
  });

  // Limpar cache quando fechar o dialog
  useEffect(() => {
    if (!open) {
      // Revogar URLs de blob ao fechar
      Object.values(cachedReports).forEach(cache => {
        if (cache?.url) {
          window.URL.revokeObjectURL(cache.url);
        }
      });
    }
  }, [open]);

  const generateReport = async () => {
    setGenerating(true);
    setError(null);

    try {
      const blob = await projetosService.gerarRelatorio(projeto.id, tipoRelatorio);
      const url = window.URL.createObjectURL(blob);
      const extensao = tipoRelatorio === 'xlsx' ? 'xlsx' : 'pdf';
      const fileName = `Relatorio_${tipoRelatorio}_${projeto.nome.replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.${extensao}`;

      // Guardar no cache
      const cachedReport: CachedReport = {
        blob,
        url,
        generatedAt: new Date(),
        fileName,
      };

      setCachedReports(prev => ({
        ...prev,
        [tipoRelatorio]: cachedReport,
      }));

      return cachedReport;
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Erro desconhecido ao gerar relatório';
      setError(errorMessage);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const cached = cachedReports[tipoRelatorio];
      let report: CachedReport;

      if (cached) {
        // Usar relatório em cache
        report = cached;
      } else {
        // Gerar novo relatório
        report = await generateReport();
      }

      // Fazer download
      const link = document.createElement('a');
      link.href = report.url;
      link.download = report.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      // Erro já tratado no generateReport
    }
  };

  const handlePreview = async () => {
    try {
      const cached = cachedReports[tipoRelatorio];
      let report: CachedReport;

      if (cached) {
        // Usar relatório em cache
        report = cached;
      } else {
        // Gerar novo relatório
        report = await generateReport();
      }

      // Abrir preview
      window.open(report.url, '_blank');
    } catch (error) {
      // Erro já tratado no generateReport
    }
  };

  const handleForceRegenerate = () => {
    // Limpar cache do tipo atual
    const currentCache = cachedReports[tipoRelatorio];
    if (currentCache?.url) {
      window.URL.revokeObjectURL(currentCache.url);
    }

    setCachedReports(prev => ({
      ...prev,
      [tipoRelatorio]: null,
    }));

    setError(null);
  };

  const currentCached = cachedReports[tipoRelatorio];
  const hasExistingReport = currentCached !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Relatório de Conformidade</DialogTitle>
                <DialogDescription>
                  Documentação oficial conforme Lei 14.133/2021
                </DialogDescription>
              </div>
            </div>
            <Badge className="gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              Projeto Finalizado
            </Badge>
          </div>
        </DialogHeader>

        <div className="pdf-generator-container" style={{ background: 'transparent', padding: 0, boxShadow: 'none', border: 'none' }}>
          {/* Existing Report Info */}
          {hasExistingReport && (
            <div className="status-message success mb-6">
              <Clock className="status-icon" />
              <div className="status-content">
                <strong className="status-title">Relatório já gerado nesta sessão</strong>
                <span className="status-time">
                  Gerado em:{' '}
                  {currentCached.generatedAt.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <p className="text-sm text-slate-600 mt-2">
                  Você pode baixar ou visualizar o relatório já gerado sem esperar novamente.
                </p>
              </div>
            </div>
          )}

          {/* Report Type Selection */}
          <div className="report-types-section">
            <h3 className="section-title">Selecione o tipo de relatório</h3>
            <div className="report-types-grid">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = tipoRelatorio === type.id;

                return (
                  <button
                    key={type.id}
                    onClick={() => setTipoRelatorio(type.id)}
                    disabled={generating}
                    className={`report-type-card ${isSelected ? 'selected' : ''} ${
                      generating ? 'disabled' : ''
                    }`}
                  >
                    {type.badge && <span className="report-badge">{type.badge}</span>}

                    <div className="report-icon-wrapper">
                      <Icon className="report-icon" />
                    </div>

                    <div className="report-info">
                      <h4 className="report-title">{type.title}</h4>
                      <p className="report-description">{type.description}</p>
                    </div>

                    <ul className="report-features">
                      {type.features.map((feature, idx) => (
                        <li key={idx} className="feature-item">
                          <span className="feature-dot" />
                          <span className="feature-text">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="selection-indicator">
                      <div className="indicator-dot" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="status-message error">
              <AlertTriangle className="status-icon" />
              <div className="status-content">
                <strong className="status-title">Erro ao gerar relatório</strong>
                <p className="status-description">{error}</p>
                <span className="status-hint">
                  Se o erro persistir, verifique se todos os itens possuem fontes válidas.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <Button
              onClick={handleDownload}
              disabled={generating}
              size="lg"
              className="action-button primary"
            >
              {generating ? (
                <>
                  <Loader2 className="button-icon animate-spin" />
                  <div className="button-content">
                    <span className="button-title">
                      Gerando {tipoRelatorio === 'xlsx' ? 'planilha' : 'relatório'}...
                    </span>
                    <span className="button-subtitle">Processando dados</span>
                  </div>
                </>
              ) : (
                <>
                  {tipoRelatorio === 'xlsx' ? (
                    <FileSpreadsheet className="button-icon" />
                  ) : (
                    <Download className="button-icon" />
                  )}
                  <div className="button-content">
                    <span className="button-title">
                      {hasExistingReport ? 'Baixar' : 'Gerar e Baixar'} {tipoRelatorio === 'xlsx' ? 'Planilha' : 'Relatório'}
                    </span>
                    <span className="button-subtitle">
                      {hasExistingReport ? 'Download imediato' : 'Aguarde a geração'}
                    </span>
                  </div>
                </>
              )}
            </Button>

            <Button
              onClick={handlePreview}
              disabled={generating || tipoRelatorio === 'xlsx'}
              variant="outline"
              size="lg"
              className="action-button secondary"
            >
              <ExternalLink className="button-icon" />
              <div className="button-content">
                <span className="button-title">
                  {hasExistingReport ? 'Visualizar' : 'Gerar e Visualizar'}
                </span>
                <span className="button-subtitle">
                  {tipoRelatorio === 'xlsx' ? 'Não disponível para Excel' : hasExistingReport ? 'Abrir imediatamente' : 'Abrir após gerar'}
                </span>
              </div>
            </Button>
          </div>

          {/* Regenerate Option */}
          {hasExistingReport && (
            <div className="mt-6 p-4 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 mb-1">
                    Adicionou mais itens ou deseja gerar um novo relatório?
                  </p>
                  <p className="text-sm text-slate-600 mb-3">
                    Clique no botão abaixo para gerar uma nova versão atualizada do relatório com os dados mais recentes.
                  </p>
                  <Button
                    onClick={handleForceRegenerate}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={generating}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Gerar Novo Relatório
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Legal Notice */}
          <div className="legal-notice">
            <div className="notice-icon">📋</div>
            <div className="notice-content">
              <strong className="notice-title">Atenção Legal</strong>
              <p className="notice-text">
                Este relatório deve ser arquivado junto ao processo licitatório para fins de
                auditoria. Verifique se todos os dados estão corretos antes de assinar e anexar ao
                processo administrativo.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
