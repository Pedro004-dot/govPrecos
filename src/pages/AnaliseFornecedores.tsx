import { useState } from 'react';
import { Search, Building2, FileText, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fornecedoresService, type ContratoGoverno, type DadosCnpj } from '@/services/fornecedores';

export function AnaliseFornecedores() {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(false);
  const [contratos, setContratos] = useState<ContratoGoverno[]>([]);
  const [dadosCnpj, setDadosCnpj] = useState<DadosCnpj | null>(null);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  const formatarCnpj = (valor: string) => {
    const numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 14) {
      return numeros
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return valor;
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCnpj(e.target.value);
    setCnpj(formatted);
  };

  const handleBuscar = async () => {
    if (!cnpj || cnpj.replace(/\D/g, '').length !== 14) {
      setError('Digite um CNPJ válido (14 dígitos)');
      return;
    }

    setError(null);
    setLoading(true);
    setLoadingDados(true);
    setBuscaRealizada(true);
    setPaginaAtual(1);

    try {
      // Buscar contratos e dados do CNPJ em paralelo
      const [resultContratos, resultDados] = await Promise.allSettled([
        fornecedoresService.consultarContratos({ cnpj, pagina: 1, tamanhoPagina: 10 }),
        fornecedoresService.buscarDadosCnpj(cnpj),
      ]);

      // Processar contratos
      if (resultContratos.status === 'fulfilled') {
        setContratos(resultContratos.value.contratos);
        setTotalRegistros(resultContratos.value.totalRegistros);
        setTotalPaginas(resultContratos.value.totalPaginas);
      } else {
        console.error('Erro ao buscar contratos:', resultContratos.reason);
        setError('Erro ao buscar contratos. Tente novamente.');
      }

      // Processar dados do CNPJ
      if (resultDados.status === 'fulfilled') {
        setDadosCnpj(resultDados.value.dadosCnpj);
      } else {
        console.warn('Dados do CNPJ não disponíveis:', resultDados.reason);
        // Não é erro crítico, apenas não exibe dados do fornecedor
      }
    } catch (err: any) {
      console.error('Erro na busca:', err);
      setError(err.response?.data?.message || 'Erro ao buscar dados. Tente novamente.');
    } finally {
      setLoading(false);
      setLoadingDados(false);
    }
  };

  const handlePaginar = async (novaPagina: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fornecedoresService.consultarContratos({
        cnpj,
        pagina: novaPagina,
        tamanhoPagina: 10,
      });

      setContratos(result.contratos);
      setPaginaAtual(novaPagina);
      setTotalPaginas(result.totalPaginas);
    } catch (err: any) {
      console.error('Erro ao paginar:', err);
      setError(err.response?.data?.message || 'Erro ao carregar página.');
    } finally {
      setLoading(false);
    }
  };

  const formatarValor = (valor?: number) => {
    if (!valor) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data?: string) => {
    if (!data) return 'N/A';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="animate-dash-in" style={{ animationDelay: '0ms' }}>
        <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
          GovPreços · Inteligência de mercado
        </p>
        <h1 className="font-display text-[2.8rem] leading-[1.05] font-normal text-foreground">
          Análise de fornecedores
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
          Consulte contratos governamentais e histórico de fornecedores por CNPJ.
        </p>
      </div>

      {/* Formulário de Busca */}
      <Card className="animate-dash-in" style={{ animationDelay: '80ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar por CNPJ
          </CardTitle>
          <CardDescription>
            Digite o CNPJ do fornecedor para consultar contratos governamentais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={handleCnpjChange}
                maxLength={18}
                disabled={loading}
              />
            </div>
            <Button onClick={handleBuscar} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar'
              )}
            </Button>
          </div>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Dados do Fornecedor */}
      {loadingDados ? (
        <Card className="animate-dash-in" style={{ animationDelay: '160ms' }}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : (
        dadosCnpj && (
          <Card className="animate-dash-in" style={{ animationDelay: '160ms' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Dados do Fornecedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Razão Social</p>
                  <p className="font-semibold text-base">{dadosCnpj.razaoSocial}</p>
                </div>
                {dadosCnpj.nomeFantasia && dadosCnpj.nomeFantasia !== dadosCnpj.razaoSocial && (
                  <div>
                    <p className="text-xs text-muted-foreground">Nome Fantasia</p>
                    <p className="font-medium">{dadosCnpj.nomeFantasia}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">CNPJ</p>
                    <p className="font-mono text-sm">{dadosCnpj.cnpj}</p>
                  </div>
                  {dadosCnpj.situacao && (
                    <div>
                      <p className="text-xs text-muted-foreground">Situação</p>
                      <Badge variant={dadosCnpj.situacao === 'ATIVA' ? 'default' : 'secondary'}>
                        {dadosCnpj.situacao}
                      </Badge>
                    </div>
                  )}
                </div>
                {(dadosCnpj.porte || dadosCnpj.naturezaJuridica) && (
                  <div className="grid grid-cols-2 gap-3">
                    {dadosCnpj.porte && (
                      <div>
                        <p className="text-xs text-muted-foreground">Porte</p>
                        <p className="text-sm">{dadosCnpj.porte}</p>
                      </div>
                    )}
                    {dadosCnpj.naturezaJuridica && (
                      <div>
                        <p className="text-xs text-muted-foreground">Natureza Jurídica</p>
                        <p className="text-sm">{dadosCnpj.naturezaJuridica}</p>
                      </div>
                    )}
                  </div>
                )}
                {dadosCnpj.municipio && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="text-sm">
                      {dadosCnpj.logradouro && `${dadosCnpj.logradouro}${dadosCnpj.numero ? `, ${dadosCnpj.numero}` : ''}`}
                      {dadosCnpj.logradouro && <br />}
                      {dadosCnpj.bairro && `${dadosCnpj.bairro} - `}
                      {dadosCnpj.municipio} / {dadosCnpj.uf}
                      {dadosCnpj.cep && ` - CEP: ${dadosCnpj.cep}`}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* Lista de Contratos */}
      {buscaRealizada && (
        <Card className="animate-dash-in" style={{ animationDelay: '240ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Itens Contratados
            </CardTitle>
            <CardDescription>
              {totalRegistros > 0
                ? `${totalRegistros} item${totalRegistros > 1 ? 'ns' : ''} contratado${totalRegistros > 1 ? 's' : ''} encontrado${totalRegistros > 1 ? 's' : ''}`
                : 'Nenhum item contratado encontrado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && contratos.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : contratos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum item contratado encontrado para este CNPJ</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contratos.map((contrato, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border p-4 space-y-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-base">{contrato.nomeOrgao}</p>
                        <p className="text-sm text-muted-foreground">
                          {contrato.nomeModalidadeCompra || 'Modalidade não informada'}
                        </p>
                      </div>
                      {contrato.valorGlobal && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Valor Global</p>
                          <p className="font-semibold text-lg text-primary">
                            {formatarValor(contrato.valorGlobal)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Informações do Item Contratado */}
                    {contrato.descricaoIitem && (
                      <div className="bg-primary/5 rounded-md p-3 border border-primary/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {contrato.tipoItem || 'Item'}
                          </Badge>
                          {contrato.numeroItem && (
                            <span className="text-xs text-muted-foreground font-mono">
                              #{contrato.numeroItem}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{contrato.descricaoIitem}</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          {contrato.quantidadeItem && (
                            <div>
                              <span className="text-muted-foreground">Qtd:</span>
                              <span className="ml-1 font-medium">{contrato.quantidadeItem}</span>
                            </div>
                          )}
                          {contrato.valorUnitarioItem && (
                            <div>
                              <span className="text-muted-foreground">Unit:</span>
                              <span className="ml-1 font-medium">{formatarValor(contrato.valorUnitarioItem)}</span>
                            </div>
                          )}
                          {contrato.valorTotalItem && (
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <span className="ml-1 font-medium text-primary">{formatarValor(contrato.valorTotalItem)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Contrato</p>
                        <p className="font-mono">{contrato.numeroContrato}</p>
                      </div>
                      {contrato.processo && (
                        <div>
                          <p className="text-xs text-muted-foreground">Processo</p>
                          <p className="font-mono">{contrato.processo}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm border-t border-border pt-3">
                      {contrato.dataVigenciaInicial && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Início:</span>
                          <span>{formatarData(contrato.dataVigenciaInicial)}</span>
                        </div>
                      )}
                      {contrato.dataVigenciaFinal && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Fim:</span>
                          <span>{formatarData(contrato.dataVigenciaFinal)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaginar(paginaAtual - 1)}
                      disabled={paginaAtual === 1 || loading}
                    >
                      Anterior
                    </Button>
                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                      Página {paginaAtual} de {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePaginar(paginaAtual + 1)}
                      disabled={paginaAtual === totalPaginas || loading}
                    >
                      Próxima
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
