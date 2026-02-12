import api from './api';

// ══════════════════════════════════════════════════════════════════════
// Types - Users
// ══════════════════════════════════════════════════════════════════════

export type UserPerfil = 'super_admin' | 'admin' | 'operador' | 'auditor';

export interface User {
  id: string;
  authId: string | null;
  tenantId: string | null;
  email: string;
  nome: string;
  perfil: UserPerfil;
  isSuperAdmin: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateUserPayload {
  tenantId: string | null;
  email: string;
  nome: string;
  perfil: UserPerfil;
  senha?: string;
  enviarEmail?: boolean;
}

export interface UpdateUserPayload {
  nome?: string;
  perfil?: UserPerfil;
  ativo?: boolean;
}

// ══════════════════════════════════════════════════════════════════════
// Types - Tenants
// ══════════════════════════════════════════════════════════════════════

export type TenantTipo = 'prefeitura' | 'camara';

export interface Tenant {
  id: string;
  cnpj: string;
  nome: string;
  tipo: TenantTipo;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface TenantWithStats extends Tenant {
  estatisticas?: {
    usuarios: number;
    projetos: number;
    projetosFinalizados: number;
  };
}

export interface CreateTenantPayload {
  cnpj: string;
  nome: string;
  tipo: TenantTipo;
}

export interface UpdateTenantPayload {
  nome?: string;
  tipo?: TenantTipo;
  ativo?: boolean;
}

// ══════════════════════════════════════════════════════════════════════
// Types - Audit Logs
// ══════════════════════════════════════════════════════════════════════

export interface AuditLog {
  id: string;
  usuarioId: string;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  dadosAntes: Record<string, any> | null;
  dadosDepois: Record<string, any> | null;
  ip: string | null;
  userAgent: string | null;
  criadoEm: string;
}

// ══════════════════════════════════════════════════════════════════════
// Users API
// ══════════════════════════════════════════════════════════════════════

export const usersApi = {
  /**
   * List users (filtered by tenant for non-super admins)
   */
  list: async (params?: {
    tenantId?: string;
    incluirInativos?: boolean;
  }): Promise<User[]> => {
    const response = await api.get<{ success: boolean; usuarios: User[] }>(
      '/users',
      { params }
    );
    return response.data.usuarios;
  },

  /**
   * Get user by ID
   */
  get: async (id: string): Promise<User> => {
    const response = await api.get<{ success: boolean; usuario: User }>(
      `/users/${id}`
    );
    return response.data.usuario;
  },

  /**
   * Create a new user
   */
  create: async (payload: CreateUserPayload): Promise<User> => {
    const response = await api.post<{ success: boolean; usuario: User }>(
      '/users',
      payload
    );
    return response.data.usuario;
  },

  /**
   * Update a user
   */
  update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const response = await api.put<{ success: boolean; usuario: User }>(
      `/users/${id}`,
      payload
    );
    return response.data.usuario;
  },

  /**
   * Deactivate a user
   */
  deactivate: async (id: string): Promise<User> => {
    const response = await api.delete<{ success: boolean; usuario: User }>(
      `/users/${id}`
    );
    return response.data.usuario;
  },

  /**
   * Activate a user
   */
  activate: async (id: string): Promise<User> => {
    const response = await api.post<{ success: boolean; usuario: User }>(
      `/users/${id}/ativar`
    );
    return response.data.usuario;
  },

  /**
   * Reset user password (admin action)
   */
  resetPassword: async (id: string, novaSenha: string): Promise<void> => {
    await api.post(`/users/${id}/reset-password`, { novaSenha });
  },
};

// ══════════════════════════════════════════════════════════════════════
// Tenants API
// ══════════════════════════════════════════════════════════════════════

export const tenantsApi = {
  /**
   * List all tenants
   */
  list: async (params?: {
    incluirInativos?: boolean;
  }): Promise<Tenant[]> => {
    const response = await api.get<{ success: boolean; tenants: Tenant[] }>(
      '/tenants',
      { params }
    );
    return response.data.tenants;
  },

  /**
   * Get tenant by ID with stats
   */
  get: async (id: string): Promise<TenantWithStats> => {
    const response = await api.get<{
      success: boolean;
      tenant: Tenant;
      estatisticas: TenantWithStats['estatisticas'];
    }>(`/tenants/${id}`);
    return {
      ...response.data.tenant,
      estatisticas: response.data.estatisticas,
    };
  },

  /**
   * Create a new tenant
   */
  create: async (payload: CreateTenantPayload): Promise<Tenant> => {
    const response = await api.post<{ success: boolean; tenant: Tenant }>(
      '/tenants',
      payload
    );
    return response.data.tenant;
  },

  /**
   * Update a tenant
   */
  update: async (id: string, payload: UpdateTenantPayload): Promise<Tenant> => {
    const response = await api.put<{ success: boolean; tenant: Tenant }>(
      `/tenants/${id}`,
      payload
    );
    return response.data.tenant;
  },

  /**
   * Deactivate a tenant
   */
  deactivate: async (id: string): Promise<Tenant> => {
    const response = await api.delete<{ success: boolean; tenant: Tenant }>(
      `/tenants/${id}`
    );
    return response.data.tenant;
  },

  /**
   * Activate a tenant
   */
  activate: async (id: string): Promise<Tenant> => {
    const response = await api.post<{ success: boolean; tenant: Tenant }>(
      `/tenants/${id}/ativar`
    );
    return response.data.tenant;
  },
};

export default { users: usersApi, tenants: tenantsApi };
