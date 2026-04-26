import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestService, GuestCategoryListParams, CreateGuestCategoryRequest, UpdateGuestCategoryRequest, GuestListParams, CreateGuestRequest, UpdateGuestRequest } from '@/src/domain/services/guest.service';

// Query keys
export const guestKeys = {
  all: ['guests'] as const,
  // Categories
  categories: () => [...guestKeys.all, 'categories'] as const,
  categoryLists: () => [...guestKeys.categories(), 'list'] as const,
  categoryList: (params: GuestCategoryListParams) => [...guestKeys.categoryLists(), params] as const,
  categoryDetails: () => [...guestKeys.categories(), 'detail'] as const,
  categoryDetail: (id: number) => [...guestKeys.categoryDetails(), id] as const,
  // Individual Guests
  guests: () => [...guestKeys.all, 'individual'] as const,
  guestLists: () => [...guestKeys.guests(), 'list'] as const,
  guestList: (params: GuestListParams) => [...guestKeys.guestLists(), params] as const,
  guestDetails: () => [...guestKeys.guests(), 'detail'] as const,
  guestDetail: (id: string) => [...guestKeys.guestDetails(), id] as const,
  guestDeletedLists: () => [...guestKeys.guests(), 'deleted'] as const,
  guestDeletedList: (params: GuestListParams) => [...guestKeys.guestDeletedLists(), params] as const,
};

/**
 * Hook to fetch guest categories with pagination
 */
export function useGuestCategories(params: GuestCategoryListParams = {}) {
  return useQuery({
    queryKey: guestKeys.categoryList(params),
    queryFn: () => guestService.listCategories(params),
    staleTime: 30000,
  });
}

/**
 * Hook to fetch single guest category
 */
export function useGuestCategory(id: number) {
  return useQuery({
    queryKey: guestKeys.categoryDetail(id),
    queryFn: () => guestService.getCategory(id),
    enabled: !!id,
  });
}

/**
 * Hook to create guest category
 */
export function useCreateGuestCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGuestCategoryRequest) => guestService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.categoryLists() });
    },
  });
}

/**
 * Hook to update guest category
 */
export function useUpdateGuestCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateGuestCategoryRequest }) =>
      guestService.updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guestKeys.categoryLists() });
      queryClient.invalidateQueries({ queryKey: guestKeys.categoryDetail(variables.id) });
    },
  });
}

/**
 * Hook to delete guest category
 */
export function useDeleteGuestCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => guestService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.categoryLists() });
    },
  });
}

/**
 * Hook to fetch individual guests with pagination and filters
 */
export function useGuests(params: GuestListParams = {}) {
  return useQuery({
    queryKey: guestKeys.guestList(params),
    queryFn: () => guestService.listGuests(params),
    staleTime: 30000,
  });
}

/**
 * Hook to fetch soft-deleted guests
 */
export function useDeletedGuests(params: GuestListParams = {}) {
  return useQuery({
    queryKey: guestKeys.guestDeletedList(params),
    queryFn: () => guestService.listDeletedGuests(params),
    staleTime: 30000,
  });
}

/**
 * Hook to fetch single guest
 */
export function useGuest(id: string) {
  return useQuery({
    queryKey: guestKeys.guestDetail(id),
    queryFn: () => guestService.getGuest(id),
    enabled: !!id,
  });
}

/**
 * Hook to create guest
 */
export function useCreateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGuestRequest) => guestService.createGuest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.guestLists() });
    },
  });
}

/**
 * Hook to update guest
 */
export function useUpdateGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGuestRequest }) =>
      guestService.updateGuest(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guestKeys.guestLists() });
      queryClient.invalidateQueries({ queryKey: guestKeys.guestDetail(variables.id) });
    },
  });
}

/**
 * Hook to delete guest
 */
export function useDeleteGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => guestService.deleteGuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.guestLists() });
      queryClient.invalidateQueries({ queryKey: guestKeys.guestDeletedLists() });
    },
  });
}

/**
 * Hook to restore deleted guest
 */
export function useRestoreGuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => guestService.restoreGuest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestKeys.guestLists() });
      queryClient.invalidateQueries({ queryKey: guestKeys.guestDeletedLists() });
    },
  });
}

/**
 * Hook to update guest status_sent
 */
export function useUpdateGuestStatusSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status?: string }) => guestService.updateStatusSent(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: guestKeys.guestLists() });
      queryClient.invalidateQueries({ queryKey: guestKeys.guestDetail(variables.id) });
    },
  });
}
