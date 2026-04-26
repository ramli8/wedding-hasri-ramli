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

export interface Guest {
  id: string;
  guest_category_id: number;
  category_name: string;
  qr_code: string;
  name: string;
  phone_number: string | null;
  instagram_username: string | null;
  address: string | null;
  note: string | null;
  status_attending: 'pending' | 'going' | 'not_going';
  status_sent: 'pending' | 'sent';
  check_in_at: string | null;
  check_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuestListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category_id?: number;
  status_attending?: string;
  status_sent?: string;
  is_checked_in?: boolean;
  sort_by?: string;
  sort_dir?: string;
}

export interface GuestListResponse {
  items: Guest[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateGuestRequest {
  guest_category_id: number;
  name: string;
  phone_number?: string | null;
  instagram_username?: string | null;
  address?: string | null;
  note?: string | null;
}

export interface UpdateGuestRequest {
  guest_category_id?: number;
  name?: string;
  phone_number?: string | null;
  instagram_username?: string | null;
  address?: string | null;
  note?: string | null;
  status_attending?: string;
  status_sent?: string;
  check_in_at?: string | null;
  check_out_at?: string | null;
}

export const guestService = {
  // Categories
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

  // Guests
  async listGuests(params: GuestListParams = {}): Promise<GuestListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.category_id) queryParams.set('category_id', params.category_id.toString());
    if (params.status_attending) queryParams.set('status_attending', params.status_attending);
    if (params.status_sent) queryParams.set('status_sent', params.status_sent);
    if (params.is_checked_in !== undefined) queryParams.set('is_checked_in', params.is_checked_in.toString());
    if (params.sort_by) queryParams.set('sort_by', params.sort_by);
    if (params.sort_dir) queryParams.set('sort_dir', params.sort_dir);

    const response = await apiClient.get<GuestListResponse>(`/v1/guests?${queryParams.toString()}`);
    return response.data;
  },

  async getGuest(id: string): Promise<Guest> {
    const response = await apiClient.get<Guest>(`/v1/guests/${id}`);
    return response.data;
  },

  async createGuest(data: CreateGuestRequest): Promise<Guest> {
    const response = await apiClient.post<Guest>('/v1/guests', data);
    return response.data;
  },

  async updateGuest(id: string, data: UpdateGuestRequest): Promise<Guest> {
    const response = await apiClient.put<Guest>(`/v1/guests/${id}`, data);
    return response.data;
  },

  async deleteGuest(id: string): Promise<void> {
    await apiClient.delete(`/v1/guests/${id}`);
  },

  async listDeletedGuests(params: GuestListParams = {}): Promise<GuestListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.page_size) queryParams.set('page_size', params.page_size.toString());
    if (params.search) queryParams.set('search', params.search);

    const response = await apiClient.get<GuestListResponse>(`/v1/guests/deleted?${queryParams.toString()}`);
    return response.data;
  },

  async restoreGuest(id: string): Promise<void> {
    await apiClient.post(`/v1/guests/${id}/restore`);
  },

  async updateStatusSent(id: string, status: string = 'sent'): Promise<void> {
    await apiClient.put(`/v1/guests/${id}/status-sent?status=${status}`);
  },
};
