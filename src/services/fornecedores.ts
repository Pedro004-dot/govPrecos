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
};
