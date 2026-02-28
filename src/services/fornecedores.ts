import api, { getAuthParams } from './api';
import type { Fornecedor } from './projetos';

// ============================================
// API Response Types
// ============================================

interface ApiResponse {
  success: boolean;
  message?: string;
  [key: string]: any;
}

// ============================================
// Types para Análise de Fornecedores
// ============================================

export interface ContratoGoverno {
  // Dados do Órgão
  codigoOrgao: string;
  nomeOrgao: string;
  esfera?: string;
  poder?: string;

  // Dados da Unidade Gestora
  codigoUnidadeGestora?: string;
  nomeUnidadeGestora?: string;
  nomeUnidadeRealizadoraCompra?: string;

  // Dados do Contrato
  numeroContrato: string;
  processo?: string;
  numeroCompra?: string;
  codigoModalidadeCompra?: string;
  nomeModalidadeCompra?: string;
  dataVigenciaInicial?: string;
  dataVigenciaFinal?: string;
  valorGlobal?: number;
  numeroControlePncpContrato?: string | null;
  idCompra?: string;

  // Dados do Fornecedor
  niFornecedor: string;
  nomeRazaoSocialFornecedor: string;

  // DADOS DO ITEM (principal diferença)
  tipoItem?: string; // "Material", "Serviço"
  codigoItem?: number;
  numeroItem?: string;
  descricaoIitem?: string; // Nota: API tem typo "descricaoIitem"
  quantidadeItem?: number;
  valorUnitarioItem?: number;
  valorTotalItem?: number;

  [key: string]: any;
}

export interface DadosCnpj {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacao?: string;
  porte?: string;
  naturezaJuridica?: string;
  dataAbertura?: string;
  municipio?: string;
  uf?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  email?: string;
  telefone?: string;
  atividadePrincipal?: { code: string; text: string };
}

export interface ConsultaContratosParams {
  cnpj: string;
  pagina?: number;
  tamanhoPagina?: number;
  dataVigenciaInicialMin?: string;
  dataVigenciaInicialMax?: string;
}

// ============================================
// Fornecedores Service
// ============================================

export const fornecedoresService = {
  /**
   * Busca fornecedor por ID.
   */
  buscarPorId: async (id: string): Promise<ApiResponse & { fornecedor: Fornecedor }> => {
    const { tenantId } = getAuthParams();
    const response = await api.get(`/fornecedores/${id}`, {
      params: { tenantId },
    });
    return response.data;
  },

  /**
   * Lista todos os fornecedores de um tenant.
   */
  listar: async (): Promise<ApiResponse & { fornecedores: Fornecedor[]; total: number }> => {
    const { tenantId } = getAuthParams();
    const response = await api.get('/fornecedores', {
      params: { tenantId },
    });
    return response.data;
  },

  /**
   * Busca e vincula fornecedor a um item de licitação.
   * Fluxo completo:
   * 1. Verifica cache (se item já tem fornecedor)
   * 2. Busca resultado na API PNCP
   * 3. Busca ou cria fornecedor (com dados da ReceitaWS)
   * 4. Vincula fornecedor ao item
   *
   * @param itemLicitacaoId ID do item de licitação
   * @returns Fornecedor vinculado
   */
  vincularFornecedor: async (
    itemLicitacaoId: string
  ): Promise<ApiResponse & { fornecedor: Fornecedor }> => {
    const { tenantId } = getAuthParams();
    const response = await api.post(
      `/itens-licitacao/${itemLicitacaoId}/vincular-fornecedor`,
      { tenantId }
    );
    return response.data;
  },

  /**
   * Consulta contratos governamentais por CNPJ.
   */
  consultarContratos: async (
    params: ConsultaContratosParams
  ): Promise<
    ApiResponse & {
      contratos: ContratoGoverno[];
      totalRegistros: number;
      totalPaginas: number;
      paginaAtual: number;
    }
  > => {
    const { tenantId } = getAuthParams();
    const response = await api.get('/fornecedores/analise/contratos', {
      params: {
        tenantId,
        cnpj: params.cnpj,
        pagina: params.pagina,
        tamanhoPagina: params.tamanhoPagina,
        dataVigenciaInicialMin: params.dataVigenciaInicialMin,
        dataVigenciaInicialMax: params.dataVigenciaInicialMax,
      },
    });
    return response.data;
  },

  /**
   * Busca dados básicos de um CNPJ na ReceitaWS.
   */
  buscarDadosCnpj: async (cnpj: string): Promise<ApiResponse & { dadosCnpj: DadosCnpj }> => {
    const { tenantId } = getAuthParams();
    const response = await api.get('/fornecedores/analise/dados-cnpj', {
      params: { tenantId, cnpj },
    });
    return response.data;
  },
};
