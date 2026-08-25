import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  weddingService,
  UpdateWeddingRequest,
  CreateCoupleRequest,
  UpdateCoupleRequest,
  CreateEventRequest,
  UpdateEventRequest,
  CreateStoryRequest,
  UpdateStoryRequest,
  CreateGalleryItemRequest,
  UpdateGalleryItemRequest,
  CreateFaqRequest,
  UpdateFaqRequest,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
  CreateEwalletRequest,
  UpdateEwalletRequest,
  CreateWishlistItemRequest,
  UpdateWishlistItemRequest,
  CreateSectionRequest,
  UpdateSectionRequest,
} from '@/src/domain/services/wedding.service';
import type {
  GuestbookReplyRequest,
} from '@/src/domain/services/wedding.service';

export const WEDDING_KEYS = {
  all: ['wedding'] as const,
  detail: () => [...WEDDING_KEYS.all, 'detail'] as const,
  couples: () => [...WEDDING_KEYS.all, 'couples'] as const,
  events: () => [...WEDDING_KEYS.all, 'events'] as const,
  story: () => [...WEDDING_KEYS.all, 'story'] as const,
  gallery: () => [...WEDDING_KEYS.all, 'gallery'] as const,
  faqs: () => [...WEDDING_KEYS.all, 'faqs'] as const,
  bankAccounts: () => [...WEDDING_KEYS.all, 'bank-accounts'] as const,
  ewallets: () => [...WEDDING_KEYS.all, 'ewallets'] as const,
  wishlist: () => [...WEDDING_KEYS.all, 'wishlist'] as const,
  sections: () => [...WEDDING_KEYS.all, 'sections'] as const,
  guestbook: () => [...WEDDING_KEYS.all, 'guestbook'] as const,
  rsvpSummary: () => [...WEDDING_KEYS.all, 'rsvp-summary'] as const,
};

// --- Wedding singleton ---

export function useWedding() {
  return useQuery({
    queryKey: WEDDING_KEYS.detail(),
    queryFn: () => weddingService.getWedding(),
    staleTime: 30000,
    retry: false,
  });
}

export function useUpdateWedding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: UpdateWeddingRequest) => weddingService.updateWedding(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.detail() });
    },
  });
}

// --- Couples ---

export function useCouples() {
  return useQuery({
    queryKey: WEDDING_KEYS.couples(),
    queryFn: () => weddingService.getCouples(),
    staleTime: 30000,
  });
}

export function useCreateCouple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateCoupleRequest) => weddingService.createCouple(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.couples() });
    },
  });
}

export function useUpdateCouple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateCoupleRequest }) =>
      weddingService.updateCouple(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.couples() });
    },
  });
}

// --- Events ---

export function useEvents() {
  return useQuery({
    queryKey: WEDDING_KEYS.events(),
    queryFn: () => weddingService.getEvents(),
    staleTime: 30000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateEventRequest) => weddingService.createEvent(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.events() });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateEventRequest }) =>
      weddingService.updateEvent(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.events() });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.events() });
    },
  });
}

// --- Story ---

export function useStories() {
  return useQuery({
    queryKey: WEDDING_KEYS.story(),
    queryFn: () => weddingService.getStories(),
    staleTime: 30000,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateStoryRequest) => weddingService.createStory(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.story() });
    },
  });
}

export function useUpdateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateStoryRequest }) =>
      weddingService.updateStory(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.story() });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.story() });
    },
  });
}

// --- Gallery ---

export function useGalleryItems() {
  return useQuery({
    queryKey: WEDDING_KEYS.gallery(),
    queryFn: () => weddingService.getGalleryItems(),
    staleTime: 30000,
  });
}

export function useCreateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateGalleryItemRequest) => weddingService.createGalleryItem(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.gallery() });
    },
  });
}

export function useUpdateGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateGalleryItemRequest }) =>
      weddingService.updateGalleryItem(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.gallery() });
    },
  });
}

export function useDeleteGalleryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteGalleryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.gallery() });
    },
  });
}

// --- FAQs ---

export function useFaqs() {
  return useQuery({
    queryKey: WEDDING_KEYS.faqs(),
    queryFn: () => weddingService.getFaqs(),
    staleTime: 30000,
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateFaqRequest) => weddingService.createFaq(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.faqs() });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateFaqRequest }) =>
      weddingService.updateFaq(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.faqs() });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.faqs() });
    },
  });
}

// --- Bank accounts ---

export function useBankAccounts() {
  return useQuery({
    queryKey: WEDDING_KEYS.bankAccounts(),
    queryFn: () => weddingService.getBankAccounts(),
    staleTime: 30000,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateBankAccountRequest) => weddingService.createBankAccount(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.bankAccounts() });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateBankAccountRequest }) =>
      weddingService.updateBankAccount(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.bankAccounts() });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.bankAccounts() });
    },
  });
}

// --- Ewallets ---

export function useEwallets() {
  return useQuery({
    queryKey: WEDDING_KEYS.ewallets(),
    queryFn: () => weddingService.getEwallets(),
    staleTime: 30000,
  });
}

export function useCreateEwallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateEwalletRequest) => weddingService.createEwallet(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.ewallets() });
    },
  });
}

export function useUpdateEwallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateEwalletRequest }) =>
      weddingService.updateEwallet(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.ewallets() });
    },
  });
}

export function useDeleteEwallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteEwallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.ewallets() });
    },
  });
}

// --- Wishlist ---

export function useWishlistItems() {
  return useQuery({
    queryKey: WEDDING_KEYS.wishlist(),
    queryFn: () => weddingService.getWishlistItems(),
    staleTime: 30000,
  });
}

export function useCreateWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateWishlistItemRequest) => weddingService.createWishlistItem(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.wishlist() });
    },
  });
}

export function useUpdateWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateWishlistItemRequest }) =>
      weddingService.updateWishlistItem(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.wishlist() });
    },
  });
}

export function useDeleteWishlistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteWishlistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.wishlist() });
    },
  });
}

// --- Sections ---

export function useSections() {
  return useQuery({
    queryKey: WEDDING_KEYS.sections(),
    queryFn: () => weddingService.getSections(),
    staleTime: 30000,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateSectionRequest) => weddingService.createSection(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.sections() });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateSectionRequest }) =>
      weddingService.updateSection(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.sections() });
    },
  });
}

// --- Ucapan: balasan admin ---

export function useAdminGuestbook() {
  return useQuery({
    queryKey: WEDDING_KEYS.guestbook(),
    queryFn: () => weddingService.getAdminGuestbook(),
    staleTime: 30000,
  });
}

export function useReplyGuestbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: GuestbookReplyRequest }) =>
      weddingService.replyGuestbook(id, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.guestbook() });
      queryClient.invalidateQueries({ queryKey: ['invitation'] });
    },
  });
}

export function useDeleteGuestbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => weddingService.deleteGuestbook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WEDDING_KEYS.guestbook() });
      queryClient.invalidateQueries({ queryKey: ['invitation'] });
    },
  });
}

// --- Ringkasan konfirmasi kehadiran ---

export function useRsvpSummary() {
  return useQuery({
    queryKey: WEDDING_KEYS.rsvpSummary(),
    queryFn: () => weddingService.getRsvpSummary(),
    staleTime: 30000,
  });
}
