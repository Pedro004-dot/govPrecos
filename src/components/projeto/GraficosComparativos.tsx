import { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { ItemFonteDetalhada, DistanciaFonte } from '@/services/projetos';
import { projetosService } from '@/services/projetos';

interface GraficosComparativosProps {
  fontes: ItemFonteDetalhada[];
  media: number;
  mediana: number;
  desvioPadrao: number;
  itemId: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return 'Sem data';
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Retorna a cor baseada no desvio percentual da média */
function getCorPorDesvio(valor: number, media: number): string {
  if (media === 0) return '#94a3b8'; // slate-400
  const desvioPercentual = ((valor - media) / media) * 100;

  if (desvioPercentual >= 70 || desvioPercentual <= -70) {
    return '#ef4444'; // red-500 (destructive)
  }
  if ((desvioPercentual >= 20 && desvioPercentual < 70) ||
      (desvioPercentual < -20 && desvioPercentual > -70)) {
    return '#f59e0b'; // amber-500 (warning)
  }
  return '#22c55e'; // green-500 (success)
}

export function GraficosComparativos({ fontes, media, mediana, desvioPadrao: _desvioPadrao, itemId }: GraficosComparativosProps) {
  const [distancias, setDistancias] = useState<DistanciaFonte[]>([]);
  const [loadingDistancias, setLoadingDistancias] = useState(false);
  const [erroDistancias, setErroDistancias] = useState<string | null>(null);

  // Buscar distâncias ao montar o componente
  useEffect(() => {
    const buscarDistancias = async () => {
      setLoadingDistancias(true);
      setErroDistancias(null);
      try {
        const res = await projetosService.buscarDistanciasItem(itemId);
        if (res.success && res.distancias) {
          setDistancias(res.distancias);
        } else {
          setErroDistancias('Não foi possível carregar distâncias');
        }
      } catch (error: any) {
        console.error('Erro ao buscar distâncias:', error);
        const msg = error?.response?.data?.message || error.message || 'Erro ao calcular distâncias';
        setErroDistancias(msg);
      } finally {
        setLoadingDistancias(false);
      }
    };

    buscarDistancias();
  }, [itemId]);

  // Preparar dados para gráfico de barras
  const dadosBarras = useMemo(() => {
    return fontes
      .filter((f) => !f.ignoradoCalculo)
      .map((f, index) => ({
        nome: `Fonte ${index + 1}`,
        nomeCompleto: f.fornecedorNome || 'Fornecedor não informado',
        cidade: f.fornecedorCidade || 'Cidade não informada',
        valor: f.valorUnitario,
        tipo: f.tipoOrigem === 'cotacao_direta' ? 'Cotação Direta' : 'Preço Governamental',
        data: f.dataLicitacao ?? f.dataCotacao,
        cor: getCorPorDesvio(f.valorUnitario, media),
      }))
      .sort((a, b) => a.valor - b.valor)
      .map((item, sortedIndex) => ({
        ...item,
        nome: `Fonte ${sortedIndex + 1}`,
      }));
  }, [fontes, media]);

  // Preparar dados para dispersão temporal
  const dadosTemporais = useMemo(() => {
    return fontes
      .filter((f) => !f.ignoradoCalculo && (f.dataLicitacao ?? f.dataCotacao))
      .map((f, index) => ({
        data: new Date((f.dataLicitacao ?? f.dataCotacao)!).getTime(),
        dataFormatada: formatDate(f.dataLicitacao ?? f.dataCotacao),
        valor: f.valorUnitario,
        nome: `Fonte ${index + 1}`,
        nomeCompleto: f.fornecedorNome || 'Fornecedor não informado',
        cidade: f.fornecedorCidade || 'Cidade não informada',
        cor: getCorPorDesvio(f.valorUnitario, media),
      }))
      .sort((a, b) => a.data - b.data);
  }, [fontes, media]);

  // Estatísticas para box plot (simulado com barras)
  const quartis = useMemo(() => {
    const valores = fontes
      .filter((f) => !f.ignoradoCalculo)
      .map((f) => f.valorUnitario)
      .sort((a, b) => a - b);

    if (valores.length === 0) return null;

    const q1Index = Math.floor(valores.length * 0.25);
    const q3Index = Math.floor(valores.length * 0.75);

    return {
      min: valores[0],
      q1: valores[q1Index],
      mediana: mediana,
      q3: valores[q3Index],
      max: valores[valores.length - 1],
    };
  }, [fontes, mediana]);

  // Preparar dados de distância
  const dadosDistancia = useMemo(() => {
    if (!distancias || distancias.length === 0) return [];

    return distancias
      .filter((d) => d.distanciaKm != null)
      .map((d, index) => {
        let cor = '#94a3b8'; // slate-400 (padrão)

        if (d.distanciaKm !== null) {
          if (d.distanciaKm <= 100) {
            cor = '#22c55e'; // green-500 (próximo)
          } else if (d.distanciaKm <= 500) {
            cor = '#f59e0b'; // amber-500 (médio)
          } else {
            cor = '#ef4444'; // red-500 (distante)
          }
        }

        return {
          nome: `Fonte ${index + 1}`,
          fornecedor: d.fornecedorNome || 'Desconhecido',
          municipio: d.municipioDestino || 'Não informado',
          uf: d.ufDestino || '',
          distanciaKm: d.distanciaKm,
          cor,
        };
      })
      .sort((a, b) => (a.distanciaKm || 0) - (b.distanciaKm || 0));
  }, [distancias]);

  // Estatísticas de distância
  const statsDistancia = useMemo(() => {
    const valores = dadosDistancia.map((d) => d.distanciaKm).filter((v): v is number => v != null);
    if (valores.length === 0) return null;

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const min = Math.min(...valores);
    const max = Math.max(...valores);

    return { media, min, max, total: valores.length };
  }, [dadosDistancia]);

  // Comparação por tipo de fonte
  const dadosPorTipo = useMemo(() => {
    const governamentais = fontes.filter(
      (f) => !f.ignoradoCalculo && f.tipoOrigem !== 'cotacao_direta'
    );
    const cotacoes = fontes.filter(
      (f) => !f.ignoradoCalculo && f.tipoOrigem === 'cotacao_direta'
    );

    const mediaGov =
      governamentais.length > 0
        ? governamentais.reduce((acc, f) => acc + f.valorUnitario, 0) / governamentais.length
        : 0;

    const mediaCot =
      cotacoes.length > 0
        ? cotacoes.reduce((acc, f) => acc + f.valorUnitario, 0) / cotacoes.length
        : 0;

    return [
      {
        tipo: 'Preços Governamentais',
        media: mediaGov,
        quantidade: governamentais.length,
      },
      {
        tipo: 'Cotação Direta',
        media: mediaCot,
        quantidade: cotacoes.length,
      },
    ].filter((d) => d.quantidade > 0);
  }, [fontes]);

  const CustomTooltipBarras = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-md shadow-lg p-3 text-sm">
          <p className="font-bold text-primary">{data.nome}</p>
          <p className="font-medium mt-1">{data.nomeCompleto}</p>
          <p className="text-muted-foreground text-xs">{data.cidade}</p>
          <p className="text-muted-foreground text-xs">{data.tipo}</p>
          <p className="font-bold mt-2">{formatCurrency(data.valor)}</p>
          {data.data && <p className="text-xs text-muted-foreground mt-1">Data: {formatDate(data.data)}</p>}
        </div>
      );
    }
    return null;
  };

  const CustomTooltipTemporal = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-md shadow-lg p-3 text-sm">
          <p className="font-bold text-primary">{data.nome}</p>
          <p className="font-medium mt-1">{data.nomeCompleto}</p>
          <p className="text-muted-foreground text-xs">{data.cidade}</p>
          <p className="text-muted-foreground text-xs mt-1">Data: {data.dataFormatada}</p>
          <p className="font-bold mt-2">{formatCurrency(data.valor)}</p>
        </div>
      );
    }
    return null;
  };

  if (fontes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Nenhuma fonte de preço disponível para gerar gráficos.</p>
          <p className="text-sm mt-2">Adicione preços governamentais ou cotações diretas para visualizar comparações.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gráfico 1: Comparação de Preços */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Comparação de Preços por Fonte</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Todos os preços ordenados do menor para o maior, com linhas de referência para média e mediana.
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={dadosBarras} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="nome"
                angle={-45}
                textAnchor="end"
                height={100}
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value ?? 0)}
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltipBarras />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />

              {/* Linhas de referência */}
              <ReferenceLine
                y={media}
                stroke="#3b82f6"
                strokeDasharray="5 5"
                label={{ value: 'Média', position: 'right', fill: '#3b82f6', fontSize: 12 }}
              />
              <ReferenceLine
                y={mediana}
                stroke="#8b5cf6"
                strokeDasharray="5 5"
                label={{ value: 'Mediana', position: 'right', fill: '#8b5cf6', fontSize: 12 }}
              />

              <Bar dataKey="valor" name="Valor Unitário" radius={[8, 8, 0, 0]}>
                {dadosBarras.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
              <span>Válido (-19% a +19%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
              <span>Elevado/Baixo (±20% a ±69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
              <span>Excessivo/Inexequível (≥±70%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 2: Evolução Temporal */}
      {dadosTemporais.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Evolução Temporal dos Preços</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dispersão dos preços ao longo do tempo (apenas fontes com data de referência).
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="data"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  dataKey="valor"
                  tickFormatter={(value) => formatCurrency(value ?? 0)}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltipTemporal />} />
                <ReferenceLine
                  y={media}
                  stroke="#3b82f6"
                  strokeDasharray="5 5"
                  label={{ value: 'Média', position: 'right', fill: '#3b82f6', fontSize: 12 }}
                />
                <ReferenceLine
                  y={mediana}
                  stroke="#8b5cf6"
                  strokeDasharray="5 5"
                  label={{ value: 'Mediana', position: 'right', fill: '#8b5cf6', fontSize: 12 }}
                />
                <Scatter name="Preços" data={dadosTemporais} fill="#3b82f6">
                  {dadosTemporais.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 3: Comparação por Tipo de Fonte */}
      {dadosPorTipo.length > 1 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Comparação Média por Tipo de Fonte</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comparação entre preços governamentais e cotações diretas.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosPorTipo} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="tipo"
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value ?? 0)}
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="media"
                  name="Preço Médio"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                  label={{
                    position: 'top',
                    formatter: (value: unknown) => formatCurrency(Number(value) || 0),
                    fontSize: 11,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 4: Distribuição Estatística (Box Plot Simulado) */}
      {quartis && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Análise de Distribuição dos Preços</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Visualização dos quartis estatísticos: mínimo, Q1 (25%), mediana (50%), Q3 (75%) e máximo.
            </p>
            <div className="grid grid-cols-5 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mínimo</p>
                  <p className="text-lg font-bold">{formatCurrency(quartis.min)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Q1 (25%)</p>
                  <p className="text-lg font-bold">{formatCurrency(quartis.q1)}</p>
                </CardContent>
              </Card>
              <Card className="bg-primary/10 border-primary">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-primary uppercase tracking-wider mb-1 font-semibold">Mediana (50%)</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(quartis.mediana)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Q3 (75%)</p>
                  <p className="text-lg font-bold">{formatCurrency(quartis.q3)}</p>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Máximo</p>
                  <p className="text-lg font-bold">{formatCurrency(quartis.max)}</p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6">
              <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 opacity-30"
                  style={{
                    left: `${((quartis.q1 - quartis.min) / (quartis.max - quartis.min)) * 100}%`,
                    right: `${100 - ((quartis.q3 - quartis.min) / (quartis.max - quartis.min)) * 100}%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{
                    left: `${((quartis.mediana - quartis.min) / (quartis.max - quartis.min)) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatCurrency(quartis.min)}</span>
                <span>{formatCurrency(quartis.max)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 5: Distância dos Fornecedores */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Distância dos Fornecedores até a Prefeitura</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Distância geográfica entre o município da prefeitura e cada fornecedor/licitação (em quilômetros).
          </p>

          {loadingDistancias ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Calculando distâncias...</span>
            </div>
          ) : erroDistancias ? (
            <div className="py-8 text-center">
              <p className="text-destructive font-medium mb-2">Erro ao calcular distâncias</p>
              <p className="text-sm text-muted-foreground">{erroDistancias}</p>
            </div>
          ) : dadosDistancia.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Não foi possível calcular distâncias.</p>
              <p className="text-sm mt-2">
                Verifique se o município da prefeitura está configurado nas configurações do tenant.
              </p>
            </div>
          ) : (
            <>
              {statsDistancia && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mais Próximo</p>
                      <p className="text-lg font-bold">{statsDistancia.min.toFixed(1)} km</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/10 border-primary">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-primary uppercase tracking-wider mb-1 font-semibold">Distância Média</p>
                      <p className="text-lg font-bold text-primary">{statsDistancia.media.toFixed(1)} km</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Mais Distante</p>
                      <p className="text-lg font-bold">{statsDistancia.max.toFixed(1)} km</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <ResponsiveContainer width="100%" height={Math.max(300, dadosDistancia.length * 40)}>
                <BarChart data={dadosDistancia} layout="vertical" margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `${value} km`}
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => value != null ? `${value.toFixed(1)} km` : ''}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div>
                            <p className="font-bold text-primary">{data.nome}</p>
                            <p className="font-medium text-sm mt-1">{data.fornecedor}</p>
                            <p className="text-xs text-muted-foreground">{data.municipio}{data.uf && ` / ${data.uf}`}</p>
                          </div>
                        );
                      }
                      return label;
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="distanciaKm" name="Distância (km)" radius={[0, 8, 8, 0]}>
                    {dadosDistancia.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                  <span>Próximo (0-100 km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                  <span>Médio (100-500 km)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                  <span>Distante (500 km)</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
