import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  Search as SearchIcon,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { itensService, type ItemBusca } from '@/services/items';
import { projetosService, type ProjetoItem, type ItemFonteDetalhada } from '@/services/projetos';
import { CardResultadoExpandivel } from '@/components/busca/CardResultadoExpandivel';
import { CidadeRaioFilter, type CidadeRaioValue } from '@/components/busca/CidadeRaioFilter';
import { FiltrosResultados } from '@/components/busca/FiltrosResultados';

const LIMIT = 20;

export function BuscarItensParaItem() {
  const { id: projetoId, itemId } = useParams<{ id: string; itemId: string }>();
  const navigate = useNavigate();

  const [projetoNome, setProjetoNome] = useState<string>('');
  const [itemContext, setItemContext] = useState<ProjetoItem | null>(null);
  const [fontesVinculadas, setFontesVinculadas] = useState<ItemFonteDetalhada[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ItemBusca[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [loadingContext, setLoadingContext] = useState(true);
  const [cidadeRaio, setCidadeRaio] = useState<CidadeRaioValue>({ municipio: null, raioKm: null });
  const [itensFiltrados, setItensFiltrados] = useState<ItemBusca[]>([]);

  // Set de IDs de licitações já vinculadas ao item
  const idsVinculados = useMemo(() => {
    return new Set(fontesVinculadas.map((f) => f.itemLicitacaoId));
  }, [fontesVinculadas]);

  // Filtra resultados para remover os já vinculados
  const resultadosFiltrados = useMemo(() => {
    return results.filter((item) => !idsVinculados.has(item.id));
  }, [results, idsVinculados]);

  const resultadosOcultados = results.length - resultadosFiltrados.length;

  useEffect(() => {
    if (!projetoId || !itemId) return;
    loadContext();
  }, [projetoId, itemId]);

  const loadContext = async () => {
    if (!projetoId || !itemId) return;
    setLoadingContext(true);
    try {
      const [projRes, itemRes] = await Promise.all([
        projetosService.buscarPorId(projetoId),
        projetosService.buscarItem(itemId),
      ]);
      if (projRes.success && projRes.projeto) setProjetoNome(projRes.projeto.nome);
      if (itemRes.success && itemRes.item) {
        setItemContext(itemRes.item);
        setSearchTerm(itemRes.item.nome);
        setFontesVinculadas(itemRes.fontes || []);
      }
    } catch (e) {
      console.error('Failed to load context:', e);
    } finally {
      setLoadingContext(false);
    }
  };

  const performSearch = async (off: number = 0) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const data = await itensService.buscar({
        query: searchTerm,
        limit: LIMIT,
        offset: off,
        lat: cidadeRaio.municipio?.latitude,
        lng: cidadeRaio.municipio?.longitude,
        raioKm: cidadeRaio.raioKm ?? undefined,
      });
      if (data.success) {
        setResults(data.itens || []);
        setTotal(data.total ?? 0);
        setOffset(off);
      } else {
        setResults([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    performSearch(0);
  };

  const handleClearFilters = () => {
    setSearchTerm(itemContext?.nome ?? '');
    setSelectedIds(new Set());
    setResults([]);
    setTotal(0);
    setOffset(0);
    setCidadeRaio({ municipio: null, raioKm: null });
  };

  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === itensFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itensFiltrados.map((i) => i.id)));
    }
  };

  const handleVincular = async () => {
    if (!itemId || linking || selectedIds.size === 0) return;
    setLinking(true);
    try {
      for (const itemLicitacaoId of selectedIds) {
        await projetosService.adicionarFonte(itemId, itemLicitacaoId);
      }
      setSelectedIds(new Set());
      navigate(`/projeto/${projetoId}/item/${itemId}`);
    } catch (error) {
      console.error('Failed to link sources:', error);
      alert('Erro ao vincular fontes.');
    } finally {
      setLinking(false);
    }
  };

  const goToPage = (newOffset: number) => {
    if (newOffset < 0 || newOffset >= total) return;
    performSearch(newOffset);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const currentPage = Math.floor(offset / LIMIT) + 1;
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  if (loadingContext) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho: voltar + título + breadcrumb */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/projeto/${projetoId}`)}
          aria-label="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Preços Governamentais Art 5º Inc. I</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cotações / {projetoNome || '…'} / {itemContext?.nome || '…'}
          </p>
        </div>
      </div>

      {/* Card contexto: Cotação de / Descrição */}
      <Card className="border border-border bg-card">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Cotação de: {projetoNome || '—'}</p>
          <p className="font-semibold">Descrição: {itemContext?.nome || '—'}</p>
        </CardContent>
      </Card>

      {/* Pesquisa */}
      <div className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 flex gap-2">
                  <Input
                    placeholder="Descrição do item"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="h-10"
                  />
                  <label className="flex items-center gap-2 shrink-0 text-sm text-muted-foreground whitespace-nowrap">
                    <Checkbox disabled />
                    Busca exata
                  </label>
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <CidadeRaioFilter
                    value={cidadeRaio}
                    onChange={setCidadeRaio}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                 
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                    Limpar filtro
                  </Button>
                  <Button
                    size="sm"
                    className="bg-success text-success-foreground hover:bg-success/90"
                    onClick={handleSearch}
                    disabled={loading || !searchTerm.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <SearchIcon className="w-4 h-4" />
                    )}
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros dinâmicos */}
          {resultadosFiltrados.length > 0 && (
            <FiltrosResultados
              itens={resultadosFiltrados}
              onFiltrar={setItensFiltrados}
              temFiltroRegiao={!!cidadeRaio.municipio}
            />
          )}

          {/* Contagem + Selecionar todos */}
          {itensFiltrados.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {itensFiltrados.length} de {resultadosFiltrados.length} resultado(s)
                </span>
                {resultadosOcultados > 0 && (
                  <span className="text-xs text-muted-foreground/60">
                    ({resultadosOcultados} já vinculado(s))
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="bg-success/10 text-success hover:bg-success/20 border-success/30"
                onClick={handleSelectAll}
              >
                {selectedIds.size === itensFiltrados.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            </div>
          )}

          {/* Resultados: cards expansíveis (dados da licitação no card, abrir pra baixo) */}
          {itensFiltrados.length > 0 && (
            <div className="space-y-3">
              {itensFiltrados.map((item) => (
                <CardResultadoExpandivel
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={toggleSelect}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {total > LIMIT && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} · {total} itens
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(offset - LIMIT)}
                  disabled={offset === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(offset + LIMIT)}
                  disabled={offset + LIMIT >= total}
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {!loading && resultadosFiltrados.length === 0 && searchTerm && (
            <Card>
              <CardContent className="py-12 text-center">
                <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                {results.length > 0 ? (
                  <>
                    <h3 className="text-lg font-medium mb-2">Todos os resultados já foram vinculados</h3>
                    <p className="text-muted-foreground">
                      {results.length} resultado(s) encontrado(s), mas todos já estão vinculados a este item.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-muted-foreground">Termo: &quot;<strong>{searchTerm}</strong>&quot;</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {loading && (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Buscando itens...</p>
              </CardContent>
            </Card>
          )}
      </div>

      {/* Barra de ações: vincular ao item */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="shadow-xl border-2 border-primary">
            <CardContent className="p-4 flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium">
                {selectedIds.size} item(ns) selecionado(s)
              </span>
              <Button onClick={handleVincular} disabled={linking} className="gap-2">
                {linking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Vincular ao item
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Limpar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
