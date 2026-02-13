import api from './api';

export interface UF {
    codigoUf: string;
    sigla: string;
}

export interface Municipio {
    codigoIbge: string;
    nome: string;
    codigoUf: string;
    latitude: number;
    longitude: number;
}

export interface ListarUFsResponse {
    success: boolean;
    ufs: UF[];
}

export interface ListarMunicipiosResponse {
    success: boolean;
    municipios: Municipio[];
}

const CACHE_KEYS = {
    ufs: 'govprecos_ufs',
    municipiosPorUf: 'govprecos_municipios_',
};

// Cache válido por 7 dias
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

interface CacheItem<T> {
    data: T;
    timestamp: number;
}

function getFromCache<T>(key: string): T | null {
    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const item: CacheItem<T> = JSON.parse(cached);
        const now = Date.now();

        if (now - item.timestamp > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }

        return item.data;
    } catch {
        return null;
    }
}

function setToCache<T>(key: string, data: T): void {
    try {
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.warn('Erro ao salvar cache:', error);
    }
}

export const municipiosService = {
    listarUFs: async (): Promise<ListarUFsResponse> => {
        // Tenta pegar do cache primeiro
        const cached = getFromCache<UF[]>(CACHE_KEYS.ufs);
        if (cached) {
            return { success: true, ufs: cached };
        }

        // Se não tiver cache, busca da API
        const response = await api.get<ListarUFsResponse>('/municipios/ufs');

        if (response.data.success && response.data.ufs) {
            setToCache(CACHE_KEYS.ufs, response.data.ufs);
        }

        return response.data;
    },

    listarPorUF: async (codigoUf: string): Promise<ListarMunicipiosResponse> => {
        const cacheKey = CACHE_KEYS.municipiosPorUf + codigoUf;

        // Tenta pegar do cache primeiro
        const cached = getFromCache<Municipio[]>(cacheKey);
        if (cached) {
            return { success: true, municipios: cached };
        }

        // Se não tiver cache, busca da API
        const response = await api.get<ListarMunicipiosResponse>(`/municipios/por-uf/${codigoUf}`);

        if (response.data.success && response.data.municipios) {
            setToCache(cacheKey, response.data.municipios);
        }

        return response.data;
    },
};
