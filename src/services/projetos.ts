import api from './api';

// ============================================
// TypeScript Interfaces
// ============================================

export interface Projeto {
  id: string;
  tenantId: string;
  usuarioId: string;
  nome: string;
  descricao?: string;
  numeroProcesso?: string;
  objeto?: string;
  status: 'rascunho' | 'em_andamento' | 'finalizado' | 'cancelado';
  dataFinalizacao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ProjetoItem {
  id: string;
  projetoId: string;
  nome: string;
  descricao?: string;
  quantidade: number;
  unidadeMedida: string;
  ordem?: number;
  medianaCalculada?: number;
  quantidadeFontes: number;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Fornecedor {
  id: string;
  tenantId: string;
  cnpj: string;
  cnpjFormatado: string;
  tipoPessoa: 'PJ' | 'PF';
  razaoSocial: string;
  nomeFantasia?: string;
  nomeExibicao: string;
  porte?: string;
  naturezaJuridica?: string;
  situacao?: string;
  dataAbertura?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  email?: string;
  telefone?: string;
  atividadePrincipal?: { code: string; text: string };
  atividadesSecundarias?: Array<{ code: string; text: string }>;
  dadosCompletos: boolean;
  isAtivo: boolean;
  ultimaAtualizacaoReceita?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemFonte {
  id: string;
  projetoItemId: string;
  itemLicitacaoId: string;
  valorUnitario: number;
  ignoradoCalculo: boolean;
  justificativaExclusao?: string;
  dataLicitacao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemFonteDetalhada extends ItemFonte {
  // PNCP data
  descricaoPNCP: string;
  quantidadePNCP?: number;
  unidadeMedidaPNCP?: string;
  numeroControlePNCP: string;
  razaoSocialOrgao: string;
  municipioNome?: string;
  ufSigla?: string;
  numeroCompra?: string;

  // Fornecedor vencedor
  fornecedor?: Fornecedor;
}

export interface ValidationMessage {
  tipo: 'minimum_sources' | 'recency_check' | 'outlier_review';
  nivel: 'erro' | 'aviso' | 'info';
  mensagem: string;
  itemId?: string;
  fonteId?: string;
  dados?: any;
}

export interface ValidationResult {
  valido: boolean;
  erros: ValidationMessage[];
  avisos: ValidationMessage[];
  infos: ValidationMessage[];
}

export interface ProjetoComItens extends Projeto {
  itens?: ProjetoItem[];
}

export interface ProjetoItemComFontes extends ProjetoItem {
  fontes?: ItemFonteDetalhada[];
}

// DTO Types
export interface CreateProjetoDTO {
  nome: string;
  descricao?: string;
  numeroProcesso?: string;
  objeto?: string;
}

export interface UpdateProjetoDTO {
  nome?: string;
  descricao?: string;
  numeroProcesso?: string;
  objeto?: string;
}

export interface CreateItemDTO {
  nome: string;
  descricao?: string;
  quantidade: number;
  unidadeMedida: string;
  ordem?: number;
  observacoes?: string;
}

export interface UpdateItemDTO {
  nome?: string;
  descricao?: string;
  quantidade?: number;
  unidadeMedida?: string;
  ordem?: number;
  observacoes?: string;
}

// API Response Types
interface ApiResponse<_T = unknown> {
  success: boolean;
  message?: string;
  [key: string]: any;
}

// ============================================
// Projetos Service
// ============================================

export const projetosService = {
  // ========================================
  // Project CRUD
  // ========================================

  /**
   * Create a new project
   * Note: tenantId and usuarioId are automatically obtained from authenticated user
   */
  criar: async (data: CreateProjetoDTO): Promise<ApiResponse<{ projeto: Projeto }>> => {
    const response = await api.post('/projetos', data);
    return response.data;
  },

  /**
   * List all projects for current tenant
   * Note: tenantId is automatically obtained from authenticated user
   */
  listar: async (): Promise<ApiResponse<{ projetos: Projeto[] }>> => {
    const response = await api.get('/projetos');
    return response.data;
  },

  /**
   * Get project by ID with all items
   */
  buscarPorId: async (id: string): Promise<ApiResponse<{ projeto: Projeto; itens: ProjetoItem[] }>> => {
    const response = await api.get(`/projetos/${id}`);
    return response.data;
  },

  /**
   * Update project
   */
  atualizar: async (id: string, data: UpdateProjetoDTO): Promise<ApiResponse<{ projeto: Projeto }>> => {
    const response = await api.put(`/projetos/${id}`, data);
    return response.data;
  },

  /**
   * Delete project
   */
  deletar: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/projetos/${id}`);
    return response.data;
  },

  // ========================================
  // Compliance / Validation
  // ========================================

  /**
   * Validate project compliance (checks 3+ sources per item)
   */
  validar: async (projetoId: string): Promise<ApiResponse<{ validacao: ValidationResult }>> => {
    const response = await api.get(`/projetos/${projetoId}/validar`);
    return response.data;
  },

  /**
   * Finalize project (requires 3+ sources per item)
   */
  finalizar: async (
    projetoId: string,
    justificativaOverride?: string
  ): Promise<ApiResponse<{ projeto: Projeto; validacao: any }>> => {
    const payload = justificativaOverride ? { justificativaOverride } : {};
    const response = await api.post(`/projetos/${projetoId}/finalizar`, payload);
    return response.data;
  },

  // ========================================
  // Item Management
  // ========================================

  /**
   * Create item in project
   */
  criarItem: async (projetoId: string, data: CreateItemDTO): Promise<ApiResponse<{ item: ProjetoItem }>> => {
    const response = await api.post(`/projetos/${projetoId}/itens`, data);
    return response.data;
  },

  /**
   * List all items in project
   */
  listarItens: async (projetoId: string): Promise<ApiResponse<{ itens: ProjetoItem[] }>> => {
    const response = await api.get(`/projetos/${projetoId}/itens`);
    return response.data;
  },

  /**
   * Get item by ID with all sources
   * Returns item and fontes separately
   */
  buscarItem: async (itemId: string): Promise<ApiResponse<{ item: ProjetoItem; fontes: ItemFonteDetalhada[] }>> => {
    const response = await api.get(`/itens/${itemId}`);
    return response.data;
  },

  /**
   * Update item
   */
  atualizarItem: async (itemId: string, data: UpdateItemDTO): Promise<ApiResponse<{ item: ProjetoItem }>> => {
    const response = await api.put(`/itens/${itemId}`, data);
    return response.data;
  },

  /**
   * Delete item
   */
  deletarItem: async (itemId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/itens/${itemId}`);
    return response.data;
  },

  // ========================================
  // Source Management
  // ========================================

  /**
   * Add PNCP source to item
   * Auto-extracts price and recalculates median
   */
  adicionarFonte: async (
    itemId: string,
    itemLicitacaoId: string
  ): Promise<ApiResponse<{ fonte: ItemFonte; medianaAtualizada: number | null }>> => {
    const response = await api.post(`/itens/${itemId}/fontes`, { itemLicitacaoId });
    return response.data;
  },

  /**
   * Remove source from item
   * Triggers median recalculation
   */
  removerFonte: async (itemId: string, fonteId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/itens/${itemId}/fontes/${fonteId}`);
    return response.data;
  },

  /**
   * Mark source as ignored (outlier)
   * Requires justification (min 10 chars)
   */
  marcarFonteIgnorada: async (
    fonteId: string,
    justificativa: string
  ): Promise<ApiResponse<{ fonte: ItemFonte; medianaAtualizada: number | null }>> => {
    const response = await api.put(`/fontes/${fonteId}/ignorar`, { justificativa });
    return response.data;
  },

  /**
   * Unmark source as ignored (include in calculation)
   */
  marcarFonteIncluida: async (
    fonteId: string
  ): Promise<ApiResponse<{ fonte: ItemFonte; medianaAtualizada: number | null }>> => {
    const response = await api.put(`/fontes/${fonteId}/incluir`);
    return response.data;
  },

  // ========================================
  // PDF Generation
  // ========================================

  /**
   * Generate PDF report for project
   * Returns PDF as blob for download
   */
  gerarRelatorio: async (projetoId: string): Promise<Blob> => {
    const response = await api.post(
      `/projetos/${projetoId}/relatorio`,
      {},
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  /**
   * Get PDF report metadata/status
   */
  verificarRelatorio: async (
    projetoId: string
  ): Promise<ApiResponse<{ disponivel: boolean; geradoEm?: string }>> => {
    const response = await api.get(`/projetos/${projetoId}/relatorio/status`);
    return response.data;
  },
};
