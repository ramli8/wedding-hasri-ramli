import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestService, GuestCategoryListParams, CreateGuestCategoryRequest, UpdateGuestCategoryRequest } from '@/src/domain/services/guest.service';

// Query keys
export const guestKeys = {
  all: ['guests'] as const,
  categories: () => [...guestKeys.all, 'categories'] as const,
  categoryLists: () => [...guestKeys.categories(), 'list'] as const,
  categoryList: (params: GuestCategoryListParams) => [...guestKeys.categoryLists(), params] as const,
  categoryDetails: () => [...guestKeys.categories(), 'detail'] as const,
  categoryDetail: (id: number) => [...guestKeys.categoryDetails(), id] as const,
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
