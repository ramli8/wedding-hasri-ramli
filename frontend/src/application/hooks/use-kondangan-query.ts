import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { kondanganService, GetKondangansParams, CreateKondanganRequest, UpdateKondanganRequest } from '@/src/domain/services/kondangan.service';

export const KONDANGAN_KEYS = {
  all: ['kondangans'] as const,
  lists: () => [...KONDANGAN_KEYS.all, 'list'] as const,
  list: (params: GetKondangansParams) => [...KONDANGAN_KEYS.lists(), params] as const,
  stats: () => [...KONDANGAN_KEYS.all, 'stats'] as const,
  details: () => [...KONDANGAN_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...KONDANGAN_KEYS.details(), id] as const,
  relations: () => [...KONDANGAN_KEYS.all, 'relations'] as const,
};

export function useKondangans(params: GetKondangansParams = {}) {
  return useQuery({
    queryKey: KONDANGAN_KEYS.list(params),
    queryFn: () => kondanganService.getKondangans(params),
    placeholderData: (prev) => prev,
  });
}

export function useInfiniteKondangans(params: Omit<GetKondangansParams, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: KONDANGAN_KEYS.list({ ...params, page: 0 }), // Using 0 as indicative for infinite
    queryFn: ({ pageParam = 1 }) => kondanganService.getKondangans({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });
}

export function useKondanganStats() {
  return useQuery({
    queryKey: KONDANGAN_KEYS.stats(),
    queryFn: () => kondanganService.getKondanganStats(),
  });
}

export function useKondangan(id: string) {
  return useQuery({
    queryKey: KONDANGAN_KEYS.detail(id),
    queryFn: () => kondanganService.getKondangan(id),
    enabled: !!id,
  });
}

export function useCreateKondangan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateKondanganRequest) => kondanganService.createKondangan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.stats() });
    },
  });
}

export function useUpdateKondangan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateKondanganRequest }) => 
      kondanganService.updateKondangan(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.stats() });
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteKondangan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => kondanganService.deleteKondangan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.stats() });
    },
  });
}

export function useKondanganRelations() {
  return useQuery({
    queryKey: KONDANGAN_KEYS.relations(),
    queryFn: () => kondanganService.getRelations(),
  });
}

export function useCreateKondanganRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => kondanganService.createRelation(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.relations() });
    },
  });
}

export function useDeleteKondanganRelation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => kondanganService.deleteRelation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.relations() });
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: KONDANGAN_KEYS.stats() });
    },
  });
}
