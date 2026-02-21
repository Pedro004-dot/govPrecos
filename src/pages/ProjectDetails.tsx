import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Upload,
  FileText,
  Pencil,
  Search,
  CheckCircle,
  Package,
} from 'lucide-react';
import {
  projetosService,
  type Projeto,
  type ProjetoItem,
} from '@/services/projetos';
import { ExcelUploadSheet } from '@/components/excel/ExcelUploadSheet';
import { PDFGenerator } from '@/components/projeto/PDFGenerator';
import { AdicionarItemSheet } from '@/components/projeto/AdicionarItemSheet';
import { ItemSuccessDialog } from '@/components/projeto/ItemSuccessDialog';

type FormulaType = 'media' | 'mediana' | 'menor_preco';

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [itens, setItens] = useState<ProjetoItem[]>([]);
  const [formula, setFormula] = useState<FormulaType>('media');
  const [searchTerm, setSearchTerm] = useState('');
  const [excelUploadOpen, setExcelUploadOpen] = useState(false);
  const [novoItemOpen, setNovoItemOpen] = useState(false);
  const [editingNome, setEditingNome] = useState(false);
  const [nomeEditado, setNomeEditado] = useState('');

  // Success dialog state
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [lastCreatedItem, setLastCreatedItem] = useState<{ id: string; nome: string } | null>(null);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await projetosService.buscarPorId(id);
      console.log('Projeto carregado:', response);
      if (response.success) {
        setProjeto(response.projeto);
        setItens(response.itens || []);
        setNomeEditado(response.projeto.nome);
        console.log('Status do projeto:', response.projeto.status);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNome = async () => {
    if (!id || !projeto) return;

    try {
      const response = await projetosService.atualizar(id, { nome: nomeEditado });
      if (response.success) {
        setProjeto(response.projeto);
        setEditingNome(false);
      }
    } catch (error) {
      console.error('Failed to update nome:', error);
    }
  };

  const handleFinalizarProjeto = async () => {
    console.log('handleFinalizarProjeto chamado', { id, projeto: projeto?.status });
    if (!id || !projeto) {
      console.log('Saindo - sem id ou projeto');
      return;
    }

    try {
      console.log('Chamando API finalizar...');
      const response = await projetosService.finalizar(id);
      console.log('Resposta da API:', response);
      if (response.success) {
        setProjeto(response.projeto);
        alert('✅ Projeto finalizado com sucesso! Agora você pode gerar o relatório.');
      }
    } catch (error: any) {
      console.error('Failed to finalize project:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Erro ao finalizar projeto';
      alert('❌ Erro: ' + errorMessage);
    }
  };

  const handleGerarRelatorio = () => {
    console.log('handleGerarRelatorio chamado', { status: projeto?.status });
    if (!projeto) return;

    if (projeto.status === 'finalizado') {
      setTimeout(() => {
        document.getElementById('pdf-generator')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      alert('Finalize a cotação para gerar o relatório');
    }
  };

  const handleItemCreated = (itemId: string, itemNome: string) => {
    setLastCreatedItem({ id: itemId, nome: itemNome });
    setSuccessDialogOpen(true);
  };

  const handleAddAnother = () => {
    setSuccessDialogOpen(false);
    setNovoItemOpen(true);
  };

  const handleSearchPrices = () => {
    if (!id || !lastCreatedItem) return;
    navigate(`/projeto/${id}/item/${lastCreatedItem.id}/buscar`);
    setSuccessDialogOpen(false);
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    setLastCreatedItem(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateTotalValue = () => {
    return itens.reduce((sum, item) => {
      if (item.medianaCalculada !== null && item.medianaCalculada !== undefined) {
        return sum + item.medianaCalculada * item.quantidade;
      }
      return sum;
    }, 0);
  };

  const getItemValue = (item: ProjetoItem): number => {
    if (item.medianaCalculada !== null && item.medianaCalculada !== undefined) {
      return item.medianaCalculada;
    }
    return 0;
  };

  const getItemTotal = (item: ProjetoItem): number => {
    const unitValue = getItemValue(item);
    return unitValue * item.quantidade;
  };

  const filteredItens = itens.filter((item) =>
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Debug: Log do estado atual
  console.log('Estado atual:', {
    loading,
    projeto: projeto ? { id: projeto.id, nome: projeto.nome, status: projeto.status } : null,
    itensCount: itens.length
  });

  const totalValue = calculateTotalValue();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!projeto) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Cotação não encontrada</h3>
        <Button onClick={() => navigate('/')}>Voltar</Button>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 w-full">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="animate-dash-in" style={{ animationDelay: '0ms' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-3 hover:text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          GovPreços&nbsp;·&nbsp;Minhas cotações
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingNome ? (
              <Input
                value={nomeEditado}
                onChange={(e) => setNomeEditado(e.target.value)}
                className="font-display text-[2rem] h-auto py-1 px-2 max-w-lg border-primary/30 focus:border-primary bg-transparent"
                onBlur={handleSaveNome}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNome();
                  if (e.key === 'Escape') { setNomeEditado(projeto.nome); setEditingNome(false); }
                }}
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="font-display text-[2.4rem] leading-[1.05] font-normal text-foreground truncate">
                  {projeto.nome}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditingNome(true)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground/50">
              Criado em {formatDate(projeto.criadoEm)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {projeto.status !== 'finalizado' && (
              <Button
                size="sm"
                className="h-9 gap-1.5 px-4 bg-success text-success-foreground hover:bg-success/90"
                onClick={handleFinalizarProjeto}
              >
                <CheckCircle className="w-4 h-4" />
                Finalizar
              </Button>
            )}
            {projeto.status === 'finalizado' && (
              <Button
                size="sm"
                className="h-9 gap-1.5 px-4"
                onClick={handleGerarRelatorio}
              >
                <FileText className="w-4 h-4" />
                Gerar relatório
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 h-px bg-border" />
      </div>

      {/* ── Info Bar ────────────────────────────────────────── */}
      <div
        className="animate-dash-in grid grid-cols-1 sm:grid-cols-3 gap-3"
        style={{ animationDelay: '60ms' }}
      >
        {/* Total value */}
        <div className="rounded-xl bg-card border border-border px-5 py-4 flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Valor total estimado
          </span>
          <p className="font-display text-[1.8rem] leading-none text-primary">
            {formatCurrency(totalValue)}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
            mediana
          </p>
        </div>

        {/* Item count */}
        <div className="rounded-xl bg-card border border-border px-5 py-4 flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Itens
          </span>
          <p className="font-display text-[1.8rem] leading-none text-foreground">
            {itens.length}
          </p>
          <p className="font-mono text-[10px] text-muted-foreground/40 uppercase tracking-wider">
            na cotação
          </p>
        </div>

        {/* Formula selector */}
        <div className="rounded-xl bg-card border border-border px-5 py-4 flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
            Fórmula de cálculo
          </span>
          <Select value={formula} onValueChange={(v) => setFormula(v as FormulaType)}>
            <SelectTrigger className="h-8 text-xs border-border/60 bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="media">Média aritmética</SelectItem>
              <SelectItem value="mediana">Mediana</SelectItem>
              <SelectItem value="menor_preco">Menor preço válido</SelectItem>
            </SelectContent>
          </Select>
          <p className="font-mono text-[9px] text-muted-foreground/35 leading-snug">
            Apenas visualização — não altera o relatório
          </p>
        </div>
      </div>

      {/* Excel Upload Sheet */}
      <ExcelUploadSheet
        open={excelUploadOpen}
        onClose={() => setExcelUploadOpen(false)}
      />

      {/* Adicionar item a cotação */}
      <AdicionarItemSheet
        open={novoItemOpen}
        onClose={() => setNovoItemOpen(false)}
        projeto={projeto}
        onSuccess={loadProject}
        onItemCreated={handleItemCreated}
      />

      {/* Success Dialog */}
      <ItemSuccessDialog
        open={successDialogOpen}
        itemNome={lastCreatedItem?.nome || ''}
        onAddAnother={handleAddAnother}
        onSearchPrices={handleSearchPrices}
        onClose={handleSuccessDialogClose}
      />

      {/* ── Items Table ─────────────────────────────────────── */}
      <div
        className="animate-dash-in rounded-xl border border-border/60 overflow-hidden"
        style={{ animationDelay: '120ms' }}
      >
        {/* Table toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between px-4 py-3 border-b border-border/60 bg-card/60">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
              <Input
                placeholder="Filtrar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8 text-sm bg-background/50 border-border/50"
              />
            </div>
            <span className="font-mono text-[11px] text-muted-foreground/40 shrink-0">
              {filteredItens.length} {filteredItens.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs border-border/50"
              onClick={() => setExcelUploadOpen(true)}
            >
              <Upload className="w-3.5 h-3.5" />
              Importar
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setNovoItemOpen(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              Novo item
            </Button>
          </div>
        </div>

        {/* Table */}
        {filteredItens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card/30">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-sm text-foreground/80 mb-1">
              {searchTerm ? 'Nenhum item encontrado' : 'Sem itens na cotação'}
            </h3>
            <p className="text-xs text-muted-foreground/60 mb-5 max-w-xs">
              {searchTerm
                ? 'Nenhum item corresponde à busca'
                : 'Adicione itens para começar a pesquisar preços'}
            </p>
            {!searchTerm && (
              <Button size="sm" className="gap-1.5 h-8" onClick={() => setNovoItemOpen(true)}>
                <Plus className="w-3.5 h-3.5" />
                Adicionar item
              </Button>
            )}
          </div>
        ) : (
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead className="w-12 bg-card/80">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">#</span>
                </TableHead>
                <TableHead className="bg-card/80 w-[35%]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">Nome</span>
                </TableHead>
                <TableHead className="text-right bg-card/80 w-[13%]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">Unit.</span>
                </TableHead>
                <TableHead className="text-right bg-card/80 w-[8%]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">Qtd.</span>
                </TableHead>
                <TableHead className="text-right bg-card/80 w-[8%]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">Und.</span>
                </TableHead>
                <TableHead className="text-right bg-card/80 w-[13%]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">Total</span>
                </TableHead>
                <TableHead className="text-center bg-card/80 w-[9%]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">Fontes</span>
                </TableHead>
                <TableHead className="text-center bg-card/80 w-[14%]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItens.map((item, index) => {
                const unitValue = getItemValue(item);
                const totalItemValue = getItemTotal(item);
                const isCompliant = item.quantidadeFontes >= 3;

                return (
                  <TableRow key={item.id} className="border-border/40 hover:bg-primary/[0.03] transition-colors">
                    <TableCell>
                      <span className="font-mono text-[11px] text-muted-foreground/40">{index + 1}</span>
                    </TableCell>
                    <TableCell className="overflow-hidden max-w-0">
                      <div>
                        <p className="text-sm font-medium text-foreground/80 truncate">{item.nome}</p>
                        {item.tamanhoUnidade && (
                          <p className="text-xs text-primary/60 font-mono truncate">
                            📏 {item.tamanhoUnidade}
                          </p>
                        )}
                        {item.descricao && (
                          <p className="text-xs text-muted-foreground/50 truncate">{item.descricao}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-xs text-foreground/70">
                        {unitValue > 0 ? formatCurrency(unitValue) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-xs text-muted-foreground/60">{item.quantidade}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {item.unidadeMedida}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono text-sm font-medium text-foreground/80">
                        {totalItemValue > 0 ? formatCurrency(totalItemValue) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-mono text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isCompliant
                          ? 'bg-success/10 text-success'
                          : item.quantidadeFontes === 2
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                      }`}>
                        {item.quantidadeFontes}/3
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted/60"
                          onClick={() => navigate(`/projeto/${id}/item/${item.id}`)}
                          title="Detalhamento"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground/60 hover:text-primary hover:bg-primary/10"
                          onClick={() => navigate(`/projeto/${id}/item/${item.id}/buscar`)}
                          title="Buscar fontes"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* PDF Generator (quando finalizado) */}
      {projeto.status === 'finalizado' && (
        <div id="pdf-generator" className="animate-dash-in" style={{ animationDelay: '160ms' }}>
          <PDFGenerator projeto={projeto} />
        </div>
      )}
    </div>
  );
}
