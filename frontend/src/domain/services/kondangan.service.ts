import apiClient from './api-client';

export interface KondanganResponse {
  id: string;
  couple_name: string;
  relation_id: number;
  relation: string;
  side: string;
  gift_type: string;
  gift_name: string | null;
  nominal: number | null;
  created_at: string;
  updated_at: string;
}

export interface KondanganRelationResponse {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface KondanganListResponse {
  items: KondanganResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface KondanganStatsResponse {
  total_kondangan: number;
  total_uang: number;
  total_kado: number;
  total_pengeluaran: number;
  rata_rata: number;
  max_uang: number;
  max_kado: number;
}

export interface CreateKondanganRequest {
  couple_name: string;
  relation_id: number;
  side: string;
  gift_type: string;
  gift_name?: string | null;
  nominal?: number | null;
}

export interface UpdateKondanganRequest {
  couple_name?: string;
  relation_id?: number;
  side?: string;
  gift_type?: string;
  gift_name?: string | null;
  nominal?: number | null;
}

export interface GetKondangansParams {
  page?: number;
  page_size?: number;
  search?: string;
  relation_id?: number;
  side?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export const kondanganService = {
  async getKondangans(params?: GetKondangansParams): Promise<KondanganListResponse> {
    const response = await apiClient.get<{data: KondanganListResponse}>('/v1/kondangan', { params });
    return response.data.data;
  },

  async getKondanganStats(): Promise<KondanganStatsResponse> {
    const response = await apiClient.get<{data: KondanganStatsResponse}>('/v1/kondangan/stats');
    return response.data.data;
  },

  async createKondangan(data: CreateKondanganRequest): Promise<KondanganResponse> {
    const response = await apiClient.post<{data: KondanganResponse}>('/v1/kondangan', data);
    return response.data.data;
  },

  async getKondangan(id: string): Promise<KondanganResponse> {
    const response = await apiClient.get<{data: KondanganResponse}>(`/v1/kondangan/${id}`);
    return response.data.data;
  },

  async updateKondangan(id: string, data: UpdateKondanganRequest): Promise<KondanganResponse> {
    const response = await apiClient.put<{data: KondanganResponse}>(`/v1/kondangan/${id}`, data);
    return response.data.data;
  },

  async deleteKondangan(id: string): Promise<void> {
    await apiClient.delete(`/v1/kondangan/${id}`);
  },

  async getRelations(): Promise<KondanganRelationResponse[]> {
    const response = await apiClient.get<{data: KondanganRelationResponse[]}>('/v1/kondangan/relations');
    return response.data.data;
  },

  async createRelation(name: string): Promise<KondanganRelationResponse> {
    const response = await apiClient.post<{data: KondanganRelationResponse}>('/v1/kondangan/relations', { name });
    return response.data.data;
  },

  async deleteRelation(id: number): Promise<void> {
    await apiClient.delete(`/v1/kondangan/relations/${id}`);
  },
};
