import api from './api';

export interface TenantBrasaoUpload {
  tenantId: string;
  file: File;
}

/**
 * Faz upload do brasão para o backend, que então salva no Supabase Storage
 */
export async function uploadBrasao({ tenantId, file }: TenantBrasaoUpload): Promise<string> {
  // Validar arquivo no frontend antes de enviar
  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Tamanho máximo: 5 MB');
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Formato inválido. Use PNG, JPG ou SVG');
  }

  // Criar FormData com o arquivo
  const formData = new FormData();
  formData.append('brasao', file);

  // Enviar para o backend
  const response = await api.post(`/tenants/${tenantId}/brasao/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.brasaoUrl;
}

/**
 * Remove o brasão do tenant (define como null)
 */
export async function removerBrasao(tenantId: string): Promise<void> {
  await api.put(`/tenants/${tenantId}/brasao`, { brasaoUrl: null });
}
