import apiClient from './api-client';

export interface GuestCategory {
  id: number;
  name: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestCategoryListParams {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface GuestCategoryListResponse {
  items: GuestCategory[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateGuestCategoryRequest {
  name: string;
  start_time: string | null;
  end_time: string | null;
}

export interface UpdateGuestCategoryRequest {
  name?: string;
  start_time: string | null;
  end_time: string | null;
}

export const guestService = {
  async listCategories(params: GuestCategoryListParams = {}): Promise<GuestCategoryListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);

    const response = await apiClient.get<GuestCategoryListResponse>(`/v1/guests/categories?${queryParams.toString()}`);
    return response.data;
  },

  async getCategory(id: number): Promise<GuestCategory> {
    const response = await apiClient.get<GuestCategory>(`/v1/guests/categories/${id}`);
    return response.data;
  },

  async createCategory(data: CreateGuestCategoryRequest): Promise<GuestCategory> {
    const response = await apiClient.post<GuestCategory>('/v1/guests/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: UpdateGuestCategoryRequest): Promise<GuestCategory> {
    const response = await apiClient.put<GuestCategory>(`/v1/guests/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/v1/guests/categories/${id}`);
  },
};
