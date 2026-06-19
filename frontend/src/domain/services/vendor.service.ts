import apiClient from './api-client';

export interface VendorAttribute {
  id: number;
  category_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AttributeValueResponse {
  id: number;
  vendor_id: string;
  attribute_id: number;
  value: string | null;
}

export interface PaymentResponse {
  id: number;
  vendor_id: string;
  date: string;
  amount: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface VendorResponse {
  id: string;
  category_id: number;
  name: string;
  contact_person: string | null;
  phone_number: string | null;
  instagram: string | null;
  address: string | null;
  reference_price: number | null;
  contract_amount: number | null;
  payment_status: 'unpaid' | 'partial' | 'paid';
  note: string | null;
  attribute_values: AttributeValueResponse[];
  payments: PaymentResponse[];
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  id: number;
  event_id: string;
  name: string;
  selected_vendor_id: string | null;
  attributes: VendorAttribute[];
  vendors: VendorResponse[];
  created_at: string;
  updated_at: string;
}

export interface CategoryListResponse {
  items: CategoryResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface OverviewResponse {
  categories: CategoryResponse[];
}

export interface CreateCategoryRequest {
  event_id: string;
  name: string;
}

export interface UpdateCategoryRequest {
  name?: string;
}

export interface CreateAttributeRequest {
  name: string;
  sort_order: number;
}

export interface UpdateAttributeRequest {
  name?: string;
  sort_order?: number;
}

export interface CreateVendorRequest {
  name: string;
  contact_person?: string | null;
  phone_number?: string | null;
  instagram?: string | null;
  address?: string | null;
  reference_price?: number | null;
  contract_amount?: number | null;
  payment_status?: string;
  note?: string | null;
  attribute_values?: Record<number, string | null>;
}

export interface UpdateVendorRequest {
  name?: string;
  contact_person?: string | null;
  phone_number?: string | null;
  instagram?: string | null;
  address?: string | null;
  reference_price?: number | null;
  contract_amount?: number | null;
  payment_status?: string;
  note?: string | null;
}

export interface CreatePaymentRequest {
  date: string;
  amount: number;
  note?: string | null;
}

export interface UpdatePaymentRequest {
  date?: string;
  amount?: number;
  note?: string | null;
}

export interface UpdateAttributeValuesRequest {
  values: Record<number, string | null>;
}

export interface SelectVendorResponse {
  category_id: number;
  selected_vendor_id: string | null;
}

export const vendorService = {
  // Overview
  async getOverview(eventId: string): Promise<OverviewResponse> {
    const response = await apiClient.get<OverviewResponse>(`/v1/vendors/overview?event_id=${eventId}`);
    return response.data;
  },

  // Categories
  async listCategories(eventId: string): Promise<CategoryListResponse> {
    const response = await apiClient.get<CategoryListResponse>(`/v1/vendors/categories?event_id=${eventId}`);
    return response.data;
  },

  async getCategory(id: number): Promise<CategoryResponse> {
    const response = await apiClient.get<CategoryResponse>(`/v1/vendors/categories/${id}`);
    return response.data;
  },

  async createCategory(data: CreateCategoryRequest): Promise<CategoryResponse> {
    const response = await apiClient.post<CategoryResponse>('/v1/vendors/categories', data);
    return response.data;
  },

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<CategoryResponse> {
    const response = await apiClient.put<CategoryResponse>(`/v1/vendors/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/v1/vendors/categories/${id}`);
  },

  async selectVendor(categoryId: number, vendorId: string): Promise<SelectVendorResponse> {
    const response = await apiClient.post<SelectVendorResponse>(`/v1/vendors/categories/${categoryId}/select/${vendorId}`, {});
    return response.data;
  },

  async deselectVendor(categoryId: number): Promise<SelectVendorResponse> {
    const response = await apiClient.delete<SelectVendorResponse>(`/v1/vendors/categories/${categoryId}/select`);
    return response.data;
  },

  // Attributes
  async createAttribute(categoryId: number, data: CreateAttributeRequest): Promise<VendorAttribute> {
    const response = await apiClient.post<VendorAttribute>(`/v1/vendors/categories/${categoryId}/attributes`, data);
    return response.data;
  },

  async listAttributes(categoryId: number): Promise<VendorAttribute[]> {
    const response = await apiClient.get<VendorAttribute[]>(`/v1/vendors/categories/${categoryId}/attributes`);
    return response.data;
  },

  async updateAttribute(id: number, data: UpdateAttributeRequest): Promise<VendorAttribute> {
    const response = await apiClient.put<VendorAttribute>(`/v1/vendors/attributes/${id}`, data);
    return response.data;
  },

  async deleteAttribute(id: number): Promise<void> {
    await apiClient.delete(`/v1/vendors/attributes/${id}`);
  },

  // Vendors
  async createVendor(categoryId: number, data: CreateVendorRequest): Promise<VendorResponse> {
    const response = await apiClient.post<VendorResponse>(`/v1/vendors/categories/${categoryId}/vendors`, data);
    return response.data;
  },

  async listVendors(categoryId: number): Promise<VendorResponse[]> {
    const response = await apiClient.get<VendorResponse[]>(`/v1/vendors/categories/${categoryId}/vendors`);
    return response.data;
  },

  async getVendor(id: string): Promise<VendorResponse> {
    const response = await apiClient.get<VendorResponse>(`/v1/vendors/${id}`);
    return response.data;
  },

  async updateVendor(id: string, data: UpdateVendorRequest): Promise<VendorResponse> {
    const response = await apiClient.put<VendorResponse>(`/v1/vendors/${id}`, data);
    return response.data;
  },

  async deleteVendor(id: string): Promise<void> {
    await apiClient.delete(`/v1/vendors/${id}`);
  },

  async updateAttributeValues(vendorId: string, data: UpdateAttributeValuesRequest): Promise<void> {
    await apiClient.put(`/v1/vendors/${vendorId}/attribute-values`, data);
  },

  // Payments
  async createPayment(vendorId: string, data: CreatePaymentRequest): Promise<PaymentResponse> {
    const response = await apiClient.post<PaymentResponse>(`/v1/vendors/${vendorId}/payments`, data);
    return response.data;
  },

  async listPayments(vendorId: string): Promise<PaymentResponse[]> {
    const response = await apiClient.get<PaymentResponse[]>(`/v1/vendors/${vendorId}/payments`);
    return response.data;
  },

  async updatePayment(id: number, data: UpdatePaymentRequest): Promise<PaymentResponse> {
    const response = await apiClient.put<PaymentResponse>(`/v1/vendors/payments/${id}`, data);
    return response.data;
  },

  async deletePayment(id: number): Promise<void> {
    await apiClient.delete(`/v1/vendors/payments/${id}`);
  },
};
