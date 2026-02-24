import api from './api';

export interface Relatorio {
  id: string;
  pesquisaId: string;
  pesquisaNome: string | null;
  tenantId: string;
  tipo: string;
  urlAcesso: string | null;
  hashArquivo: string | null;
  geradoEm: string | null;
  criadoEm: string | null;
}

export interface RelatoriosListResponse {
  success: boolean;
  relatorios: Relatorio[];
}

export const relatoriosApi = {
  listar: async (): Promise<Relatorio[]> => {
    const response = await api.get<RelatoriosListResponse>('/relatorios');
    return response.data.relatorios ?? [];
  },
};
