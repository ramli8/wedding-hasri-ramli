import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  vendorService,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateAttributeRequest,
  UpdateAttributeRequest,
  CreateVendorRequest,
  UpdateVendorRequest,
  CreatePaymentRequest,
  UpdatePaymentRequest,
  UpdateAttributeValuesRequest,
} from '@/src/domain/services/vendor.service';

export const vendorKeys = {
  all: ['vendors'] as const,
  overview: (eventId: string) => [...vendorKeys.all, 'overview', eventId] as const,
  categories: () => [...vendorKeys.all, 'categories'] as const,
  categoryList: (eventId: string) => [...vendorKeys.categories(), 'list', eventId] as const,
  categoryDetail: (id: number) => [...vendorKeys.categories(), 'detail', id] as const,
  vendorDetail: (id: string) => [...vendorKeys.all, 'detail', id] as const,
  payments: (vendorId: string) => [...vendorKeys.all, 'payments', vendorId] as const,
};

// --- Overview ---

export function useVendorOverview(eventId: string) {
  return useQuery({
    queryKey: vendorKeys.overview(eventId),
    queryFn: () => vendorService.getOverview(eventId),
    enabled: !!eventId,
    staleTime: 30000,
  });
}

// --- Categories ---

export function useVendorCategories(eventId: string) {
  return useQuery({
    queryKey: vendorKeys.categoryList(eventId),
    queryFn: () => vendorService.listCategories(eventId),
    enabled: !!eventId,
    staleTime: 30000,
  });
}

export function useVendorCategory(id: number) {
  return useQuery({
    queryKey: vendorKeys.categoryDetail(id),
    queryFn: () => vendorService.getCategory(id),
    enabled: !!id,
  });
}

export function useCreateVendorCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => vendorService.createCategory(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categoryList(variables.event_id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.event_id) });
    },
  });
}

export function useUpdateVendorCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, eventId }: { id: number; data: UpdateCategoryRequest; eventId: string }) =>
      vendorService.updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categoryList(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.categoryDetail(variables.id) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useDeleteVendorCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, eventId }: { id: number; eventId: string }) => vendorService.deleteCategory(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categoryList(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useSelectVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, vendorId, eventId }: { categoryId: number; vendorId: string; eventId: string }) =>
      vendorService.selectVendor(categoryId, vendorId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useDeselectVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, eventId }: { categoryId: number; eventId: string }) =>
      vendorService.deselectVendor(categoryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

// --- Attributes ---

export function useCreateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data, eventId }: { categoryId: number; data: CreateAttributeRequest; eventId: string }) =>
      vendorService.createAttribute(categoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categoryDetail(variables.categoryId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, eventId }: { id: number; data: UpdateAttributeRequest; eventId: string }) =>
      vendorService.updateAttribute(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, eventId }: { id: number; eventId: string }) => vendorService.deleteAttribute(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

// --- Vendors ---

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data, eventId }: { categoryId: number; data: CreateVendorRequest; eventId: string }) =>
      vendorService.createVendor(categoryId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.categoryDetail(variables.categoryId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, eventId }: { id: string; data: UpdateVendorRequest; eventId: string }) =>
      vendorService.updateVendor(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, eventId }: { id: string; eventId: string }) => vendorService.deleteVendor(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useUpdateVendorAttributeValues() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, data, eventId }: { vendorId: string; data: UpdateAttributeValuesRequest; eventId: string }) =>
      vendorService.updateAttributeValues(vendorId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.all });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

// --- Payments ---

export function useVendorPayments(vendorId: string) {
  return useQuery({
    queryKey: vendorKeys.payments(vendorId),
    queryFn: () => vendorService.listPayments(vendorId),
    enabled: !!vendorId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vendorId, data, eventId }: { vendorId: string; data: CreatePaymentRequest; eventId: string }) =>
      vendorService.createPayment(vendorId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.payments(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, vendorId, eventId }: { id: number; data: UpdatePaymentRequest; vendorId: string; eventId: string }) =>
      vendorService.updatePayment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.payments(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, vendorId, eventId }: { id: number; vendorId: string; eventId: string }) =>
      vendorService.deletePayment(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: vendorKeys.payments(variables.vendorId) });
      queryClient.invalidateQueries({ queryKey: vendorKeys.overview(variables.eventId) });
    },
  });
}
