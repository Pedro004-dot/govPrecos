import api from './api';

export interface ItemBusca {
    id: string;
    licitacaoId?: string;
    /**
     * Número de controle PNCP da licitação (ex: 04215147000150-1-000412/2025)
     */
    numeroControlePNCP?: string;
    /**
     * Data da licitação no PNCP (ISO string)
     */
    dataLicitacao?: string;
    numeroItem?: number;
    descricao: string;
    valorUnitarioEstimado: number;
    valorTotal?: number;
    unidadeMedida: string;
    quantidade?: number;
    distanciaKm?: number;
    municipioNome?: string | null;
    ufSigla?: string | null;
}

export interface BuscaItensResponse {
    success: boolean;
    itens: ItemBusca[];
    total: number;
    limit: number;
    offset: number;
}

export interface UploadResponse {
    linhas: Array<{
        linha: number;
        descricaoOriginal: string;
        quantidade?: number;
        unidade?: string;
        matches: ItemBusca[];
    }>;
}

const LIMIT = 20;

export interface BuscarOptions {
    query: string;
    limit?: number;
    offset?: number;
    lat?: number;
    lng?: number;
    raioKm?: number;
}

export const itensService = {
    buscar: async (
        queryOrOptions: string | BuscarOptions,
        limit: number = LIMIT,
        offset: number = 0
    ): Promise<BuscaItensResponse> => {
        // Suporte para API antiga (3 argumentos) e nova (objeto de opções)
        let params: Record<string, unknown>;

        if (typeof queryOrOptions === 'string') {
            params = { q: queryOrOptions, limit, offset };
        } else {
            const { query, lat, lng, raioKm, ...rest } = queryOrOptions;
            params = {
                q: query,
                limit: rest.limit ?? LIMIT,
                offset: rest.offset ?? 0,
                ...(lat != null && { lat }),
                ...(lng != null && { lng }),
                ...(raioKm != null && { raioKm }),
            };
        }

        const response = await api.get<BuscaItensResponse>('/itens-licitacao/buscar', { params });
        return response.data;
    },

    uploadPlanilha: async (file: File) => {
        const formData = new FormData();
        formData.append('arquivo', file);

        // Updated route: POST /api/itens-licitacao/upload-planilha
        const response = await api.post<UploadResponse>('/itens-licitacao/upload-planilha', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
