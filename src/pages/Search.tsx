import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search as SearchIcon,
  Loader2,
  Plus,
  Link2,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Link as LinkIcon,
  ArrowRight,
} from 'lucide-react';
import { itensService, type ItemBusca } from '@/services/items';
import { projetosService, type ProjetoItem } from '@/services/projetos';
import { SourceCounter } from '@/components/projeto/SourceCounter';
import { DetalheItemSheet } from '@/components/busca/DetalheItemSheet';
import { CidadeRaioFilter, type CidadeRaioValue } from '@/components/busca/CidadeRaioFilter';
import { FiltrosResultados } from '@/components/busca/FiltrosResultados';

const LIMIT = 20;

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState<ItemBusca[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [linkingFontes, setLinkingFontes] = useState(false);
  const [itemContext, setItemContext] = useState<ProjetoItem | null>(null);
  const [detailItem, setDetailItem] = useState<ItemBusca | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cidadeRaio, setCidadeRaio] = useState<CidadeRaioValue>({ municipio: null, raioKm: null });
  const [itensFiltrados, setItensFiltrados] = useState<ItemBusca[]>([]);

  const itemIdFromUrl = searchParams.get('itemId');

  useEffect(() => {
    if (itemIdFromUrl) {
      loadItemContext(itemIdFromUrl);
    } else {
      setItemContext(null);
    }
  }, [itemIdFromUrl]);

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
      const off = Number(searchParams.get('offset')) || 0;
      setOffset(off);
      performSearch(query, LIMIT, off);
    }
  }, []);

  const loadItemContext = async (itemId: string) => {
    try {
      const response = await projetosService.buscarItem(itemId);
      if (response.success) setItemContext(response.item);
    } catch (error) {
      console.error('Failed to load item context:', error);
    }
  };

  const clearContext = () => {
    setItemContext(null);
    setSelectedItems(new Set());
    const next = new URLSearchParams(searchParams);
    next.delete('itemId');
    setSearchParams(next);
  };

  const performSearch = async (query: string, limit: number = LIMIT, off: number = 0, geoFilter?: CidadeRaioValue) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const geo = geoFilter ?? cidadeRaio;
      // Só envia raioKm se houver cidade selecionada (para filtro geográfico)
      const temCidade = geo.municipio != null;
      const data = await itensService.buscar({
        query,
        limit,
        offset: off,
        lat: geo.municipio?.latitude,
        lng: geo.municipio?.longitude,
        raioKm: temCidade ? (geo.raioKm ?? undefined) : undefined,
        ufSigla: geo.ufSigla ?? undefined,
      });
      if (data.success) {
        setSearchResults(data.itens || []);
        setTotal(data.total ?? 0);
        setOffset(off);
      } else {
        setSearchResults([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    const next = new URLSearchParams(searchParams);
    next.set('q', searchTerm);
    next.delete('offset');
    setSearchParams(next);
    setOffset(0);
    performSearch(searchTerm, LIMIT, 0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedItems(new Set());
    setSearchResults([]);
    setTotal(0);
    setOffset(0);
    setCidadeRaio({ municipio: null, raioKm: null, ufSigla: null });
    setSearchParams(new URLSearchParams());
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === itensFiltrados.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(itensFiltrados.map((i) => i.id)));
    }
  };

  const openDetail = (item: ItemBusca) => {
    setDetailItem(item);
    setDetailOpen(true);
  };

  const handleCreateQuotation = () => {
    const selected = searchResults.filter((i) => selectedItems.has(i.id));
    navigate('/projetos/novo', { state: { selectedItems: selected } });
  };

  const handleLinkToItem = async () => {
    if (linkingFontes) return;
    const itemIdToUse = itemContext?.id ?? itemIdFromUrl;
    if (!itemIdToUse) return;
    const ids = Array.from(selectedItems);
    if (ids.length === 0) return;
    setLinkingFontes(true);
    try {
      for (const itemLicitacaoId of ids) {
        await projetosService.adicionarFonte(itemIdToUse, itemLicitacaoId);
      }
      setSelectedItems(new Set());
      navigate(`/item/${itemIdToUse}/fontes`);
    } catch (error) {
      console.error('Failed to link sources:', error);
      alert('Erro ao vincular fontes.');
    } finally {
      setLinkingFontes(false);
    }
  };

  const goToPage = (newOffset: number) => {
    if (newOffset < 0 || newOffset >= total) return;
    const next = new URLSearchParams(searchParams);
    next.set('offset', String(newOffset));
    setSearchParams(next);
    setOffset(newOffset);
    performSearch(searchTerm, LIMIT, newOffset);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const allSelected = itensFiltrados.length > 0 && selectedItems.size === itensFiltrados.length;

  return (
    <div className="space-y-8 w-full animate-dash-in">

      {/* ── Page Header ──────────────────────────────────────── */}
      <div>
        <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
          GovPreços&nbsp;·&nbsp;
          {itemIdFromUrl ? (
            <span>Cotações&nbsp;·&nbsp;Detalhes&nbsp;·&nbsp;<span className="text-primary/50">Busca</span></span>
          ) : (
            <span className="text-primary/50">Busca rápida de preço</span>
          )}
          {searchTerm && (
            <span className="text-muted-foreground/40">&nbsp;·&nbsp;&ldquo;{searchTerm}&rdquo;</span>
          )}
        </p>
        <h1 className="font-display text-[2.4rem] leading-[1.05] font-normal text-foreground">
          Busca rápida de preço
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-lg leading-relaxed">
          Consulte preços praticados em licitações homologadas no PNCP.
        </p>
        <div className="mt-5 h-px bg-border" />
      </div>

      {/* ── Context Banner (when linking to an item) ─────────── */}
      {itemIdFromUrl && (
        <div className="relative rounded-xl overflow-hidden animate-dash-in" style={{ animationDelay: '40ms' }}>
          <div
            className="absolute inset-0"
            style={{ background: 'var(--banner-bg)' }}
          />
          <div
            className="absolute inset-0 rounded-xl ring-1 ring-inset"
            style={{ boxShadow: `inset 0 0 0 1px var(--banner-ring)` }}
          />
          <div className="relative px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'var(--banner-icon-bg)', color: 'var(--banner-icon-text)' }}
              >
                <Link2 className="w-4 h-4" />
              </div>
              <div>
                <p
                  className="font-mono text-[10px] uppercase tracking-widest mb-0.5"
                  style={{ color: 'var(--banner-label)' }}
                >
                  Vinculando fontes ao item
                </p>
                <p className="text-sm font-medium text-foreground/90">
                  {itemContext ? itemContext.nome : (
                    <span className="text-muted-foreground/50 animate-pulse">Carregando...</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SourceCounter
                current={(itemContext?.quantidadeFontes ?? 0) + selectedItems.size}
                minimum={3}
              />
              <button
                type="button"
                onClick={clearContext}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search Zone ──────────────────────────────────────── */}
      <div
        className="animate-dash-in"
        style={{ animationDelay: '80ms' }}
      >
        <Tabs defaultValue="busca" className="w-full">
          <TabsList variant="line" className="w-full max-w-xs grid grid-cols-2 mb-6">
            <TabsTrigger value="busca">Busca avançada</TabsTrigger>
          </TabsList>

          <TabsContent value="busca" className="space-y-6">

            {/* Search input panel */}
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
              {/* Main search row */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
                  <Input
                    placeholder="Descrição do item — ex.: Lápis preto, Resma de papel A4..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 h-11 bg-background/50 border-border/60 focus:border-primary/50 focus:bg-background transition-colors text-sm placeholder:text-muted-foreground/35"
                  />
                </div>
              </div>

              {/* Filtro de cidade e raio */}
              <CidadeRaioFilter
                value={cidadeRaio}
                onChange={setCidadeRaio}
              />

              {/* Botões de ação */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 text-xs"
                >
                  Limpar filtros
                </Button>
                <Button
                  size="sm"
                  onClick={handleSearch}
                  disabled={loading || !searchTerm.trim()}
                  className="h-9 text-xs bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <SearchIcon className="w-3.5 h-3.5 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Filtros dinâmicos */}
            {searchResults.length > 0 && (
              <FiltrosResultados
                itens={searchResults}
                onFiltrar={setItensFiltrados}
                temFiltroRegiao={!!cidadeRaio.municipio}
              />
            )}

            {/* Results controls row */}
            {itensFiltrados.length > 0 && (
              <div
                className="flex flex-wrap items-center justify-between gap-3 animate-dash-in"
                style={{ animationDelay: '0ms' }}
              >
                <span className="font-mono text-[11px] text-muted-foreground/40">
                  {itensFiltrados.length.toLocaleString('pt-BR')} de {searchResults.length.toLocaleString('pt-BR')} resultado{searchResults.length !== 1 ? 's' : ''}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                  onClick={handleSelectAll}
                >
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
            )}

            {/* ── Results Table ──────────────────────────────── */}
            {itensFiltrados.length > 0 && (
              <div className="rounded-xl border border-border/60 overflow-hidden animate-dash-in">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="w-10 bg-card/80" />
                      <TableHead className="bg-card/80 w-[35%]">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                          Descrição
                        </span>
                      </TableHead>
                      <TableHead className="text-right bg-card/80 w-[12%]">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                          Qtd.
                        </span>
                      </TableHead>
                      <TableHead className="w-[18%] bg-card/80">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                          Local
                        </span>
                      </TableHead>
                      <TableHead className="bg-card/80 w-[10%]">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                          {cidadeRaio.municipio ? 'Dist.' : 'Data'}
                        </span>
                      </TableHead>
                      <TableHead className="text-right bg-card/80 w-[15%]">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/50">
                          Valor Unit.
                        </span>
                      </TableHead>
                      <TableHead className="w-10 bg-card/80" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensFiltrados.map((item, index) => {
                      const isSelected = selectedItems.has(item.id);
                      return (
                        <TableRow
                          key={item.id}
                          className={`
                            cursor-pointer border-border/40 transition-colors duration-150
                            ${isSelected
                              ? '[background:hsl(var(--warning)/0.06)] [box-shadow:inset_3px_0_0_hsl(var(--warning))]'
                              : 'hover:bg-primary/[0.04]'
                            }
                            animate-dash-in
                          `}
                          style={{ animationDelay: `${index * 30}ms` }}
                          onClick={() => openDetail(item)}
                        >
                          <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                              className={isSelected ? 'border-amber-500/60 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500' : ''}
                            />
                          </TableCell>

                          <TableCell className="overflow-hidden max-w-0">
                            <button
                              type="button"
                              className="w-full text-left text-sm text-foreground/80 hover:text-primary transition-colors truncate font-medium leading-snug block"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetail(item);
                              }}
                            >
                              {item.descricao}
                            </button>
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="font-mono text-xs text-muted-foreground/60">
                              {item.quantidade != null
                                ? `${item.quantidade} ${item.unidadeMedida}`
                                : '—'}
                            </span>
                          </TableCell>

                          <TableCell className="overflow-hidden max-w-0">
                            {item.municipioNome || item.ufSigla ? (
                              <div className="flex flex-col gap-0.5">
                                {item.municipioNome && (
                                  <span className="text-xs text-foreground/70 truncate">
                                    {item.municipioNome}
                                  </span>
                                )}
                                {item.ufSigla && (
                                  <span className="font-mono text-[11px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded inline-block w-fit">
                                    {item.ufSigla}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground/30">—</span>
                            )}
                          </TableCell>

                          <TableCell>
                            {item.distanciaKm != null ? (
                              <span className="font-mono text-xs text-muted-foreground/60">
                                {item.distanciaKm.toFixed(0)} km
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground/40">—</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            {item.valorUnitarioEstimado != null ? (
                              <span className={`font-mono text-sm font-medium ${isSelected ? '[color:hsl(var(--warning))]' : 'text-foreground/80'}`}>
                                {formatCurrency(item.valorUnitarioEstimado)}
                              </span>
                            ) : (
                              <span className="font-mono text-xs text-muted-foreground/30">—</span>
                            )}
                          </TableCell>

                          <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground/30 hover:text-foreground hover:bg-muted/50"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  onClick={() => openDetail(item)}
                                  className="text-xs gap-2"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" />
                                  Ver detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => toggleItemSelection(item.id)}
                                  className="text-xs gap-2"
                                >
                                  {isSelected ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-amber-400" />
                                      Desmarcar
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5" />
                                      Selecionar
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* ── Pagination ─────────────────────────────────── */}
            {total > LIMIT && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="font-mono text-[11px] text-muted-foreground/50">
                  Página&nbsp;
                  <span className="text-foreground/70">{currentPage}</span>
                  &nbsp;de&nbsp;
                  <span className="text-foreground/70">{totalPages}</span>
                  &nbsp;·&nbsp;
                  <span className="text-foreground/70">{total.toLocaleString('pt-BR')}</span>
                  &nbsp;itens
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(offset - LIMIT)}
                    disabled={offset === 0}
                    className="h-8 text-xs gap-1 border-border/50"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(offset + LIMIT)}
                    disabled={offset + LIMIT >= total}
                    className="h-8 text-xs gap-1 border-border/50"
                  >
                    Próxima
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ── Empty State ────────────────────────────────── */}
            {!loading && searchResults.length === 0 && searchTerm && (
              <div className="rounded-xl border border-dashed border-border/50 bg-card/30 py-16 flex flex-col items-center text-center animate-dash-in">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/40 mb-4">
                  <SearchIcon className="w-5 h-5" />
                </div>
                <h3 className="font-medium text-sm text-foreground/70 mb-1">
                  Nenhum resultado encontrado
                </h3>
                <p className="font-mono text-xs text-muted-foreground/40 mt-1">
                  &ldquo;{searchTerm}&rdquo;
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="mt-5 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="w-3 h-3" />
                  Limpar busca
                </Button>
              </div>
            )}

            {/* ── Loading State ──────────────────────────────── */}
            {loading && (
              <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-4 py-3.5 border-b border-border/30 last:border-0 animate-pulse"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="h-4 w-4 rounded bg-muted/60 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 rounded bg-muted/60" style={{ width: `${55 + (i % 3) * 15}%` }} />
                      <div className="h-3 rounded bg-muted/40" style={{ width: `${30 + (i % 4) * 10}%` }} />
                    </div>
                    <div className="h-3.5 w-16 rounded bg-muted/40 shrink-0" />
                    <div className="h-3.5 w-20 rounded bg-muted/60 shrink-0" />
                  </div>
                ))}
              </div>
            )}

            {/* ── Initial State (no search yet) ──────────────── */}
            {!loading && searchResults.length === 0 && !searchTerm && (
              <div className="rounded-xl border border-dashed border-border/40 bg-card/20 py-20 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/8 text-primary/40 mb-5">
                  <SearchIcon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-normal text-foreground/50 mb-2">
                  Consulte preços do PNCP
                </h3>
                <p className="text-sm text-muted-foreground/40 max-w-xs leading-relaxed">
                  Digite a descrição do item acima para buscar preços em licitações homologadas.
                </p>
              </div>
            )}

          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <div className="rounded-xl border border-dashed border-border/40 bg-card/20 py-12 text-center">
              <p className="text-sm text-muted-foreground/40">
                Configurações da busca serão exibidas aqui.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Floating Action Bar ───────────────────────────────── */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-dash-in">
          <div className="relative rounded-xl overflow-hidden">
            {/* Glass background */}
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background: 'var(--fab-bg)',
                backdropFilter: 'blur(16px)',
              }}
            />
            {/* Ring */}
            <div
              className="absolute inset-0 rounded-xl ring-1 ring-inset"
              style={{ boxShadow: `inset 0 0 0 1px var(--fab-ring)` }}
            />
            {/* Glow */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 h-16 w-48 rounded-full opacity-20 pointer-events-none"
              style={{
                background: `radial-gradient(circle, var(--fab-glow) 0%, transparent 70%)`,
              }}
            />

            <div className="relative px-5 py-3.5 flex flex-wrap items-center gap-4">
              {itemIdFromUrl ? (
                <>
                  <SourceCounter
                    current={(itemContext?.quantidadeFontes ?? 0) + selectedItems.size}
                    minimum={3}
                  />
                  <div className="h-4 w-px bg-border/50" />
                  <span className="text-sm text-foreground/80 font-medium">
                    <span className="font-mono [color:hsl(var(--warning))]">{selectedItems.size}</span>
                    &nbsp;orçamento{selectedItems.size !== 1 ? 's' : ''} selecionado{selectedItems.size !== 1 ? 's' : ''}
                  </span>
                  <Button
                    onClick={handleLinkToItem}
                    disabled={linkingFontes}
                    size="sm"
                    className="gap-2 h-8 text-xs bg-primary hover:bg-primary/90"
                  >
                    {linkingFontes ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    Salvar orçamentos no item
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-foreground/80 font-medium">
                    <span className="font-mono [color:hsl(var(--warning))]">{selectedItems.size}</span>
                    &nbsp;item{selectedItems.size !== 1 ? 'ns' : ''} selecionado{selectedItems.size !== 1 ? 's' : ''}
                  </span>
                  <Button
                    onClick={handleCreateQuotation}
                    size="sm"
                    className="gap-2 h-8 text-xs bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar cotação
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={() => setSelectedItems(new Set())}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 transition-colors"
                title="Limpar seleção"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <DetalheItemSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        item={detailItem}
      />
    </div>
  );
}
