import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
} from 'lucide-react';
import { projetosService, type Projeto } from '@/services/projetos';
import './PDFGenerator.css';

type TipoRelatorio = 'completo' | 'resumido' | 'xlsx';

interface PDFGeneratorProps {
  projeto: Projeto;
}

interface ReportTypeOption {
  id: TipoRelatorio;
  icon: typeof FileCheck;
  title: string;
  description: string;
  badge?: string;
  features: string[];
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
      const blob = await projetosService.gerarRelatorio(projeto.id, tipoRelatorio);
      const url = window.URL.createObjectURL(blob);
      const extensao = tipoRelatorio === 'xlsx' ? 'xlsx' : 'pdf';
      const nomeArquivo = `Relatorio_${tipoRelatorio}_${projeto.nome.replace(/\s+/g, '_')}_${
        new Date().toISOString().split('T')[0]
      }.${extensao}`;

      if (preview) {
        window.open(url, '_blank');
        setPreviewUrl(url);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setLastGenerated(new Date());

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

  const selectedReport = reportTypes.find((r) => r.id === tipoRelatorio)!;

  return (
    <div className="pdf-generator-container">
      {/* Header Section */}
      <div className="pdf-generator-header">
        <div className="header-content">
          <div className="header-icon">
            <Shield className="icon-shield" />
            <Sparkles className="icon-sparkle" />
          </div>
          <div className="header-text">
            <h2 className="header-title">Relatório de Conformidade</h2>
            <p className="header-subtitle">
              Gerar documentação oficial conforme Lei 14.133/2021
            </p>
          </div>
        </div>
        <Badge className="status-badge">
          <CheckCircle className="w-3.5 h-3.5" />
          Projeto Finalizado
        </Badge>
      </div>

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

      {/* Status Messages */}
      {lastGenerated && !generating && !error && (
        <div className="status-message success">
          <CheckCircle className="status-icon" />
          <div className="status-content">
            <strong className="status-title">Relatório gerado com sucesso!</strong>
            <span className="status-time">
              Último download:{' '}
              {lastGenerated.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}

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
          onClick={() => handleGenerate(false)}
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
                  Baixar {tipoRelatorio === 'xlsx' ? 'Planilha' : 'Relatório'}
                </span>
                <span className="button-subtitle">Download automático</span>
              </div>
            </>
          )}
        </Button>

        <Button
          onClick={() => handleGenerate(true)}
          disabled={generating || tipoRelatorio === 'xlsx'}
          variant="outline"
          size="lg"
          className="action-button secondary"
        >
          <ExternalLink className="button-icon" />
          <div className="button-content">
            <span className="button-title">Visualizar Relatório</span>
            <span className="button-subtitle">
              {tipoRelatorio === 'xlsx' ? 'Não disponível para Excel' : 'Abrir em nova aba'}
            </span>
          </div>
        </Button>
      </div>

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
  );
}
