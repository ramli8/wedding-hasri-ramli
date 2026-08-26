import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invitationService,
  type InvitationDetail,
  type SubmitRsvpPayload,
  type SubmitGuestbookPayload,
} from '@/src/domain/services/invitation.service';

export const invitationKeys = {
  all: ['invitation'] as const,
  detail: (guestId?: string | null) =>
    [...invitationKeys.all, 'detail', guestId ?? null] as const,
  guestbook: (limit: number) =>
    [...invitationKeys.all, 'guestbook', limit] as const,
};

/**
 * Tamu aktif untuk seluruh halaman undangan. Diisi sekali oleh WeddingPage
 * dari searchParams server-component, lalu dipakai semua pemanggil
 * useInvitation() tanpa argumen agar satu cache entry yang sama
 * (personalisasi tamu ikut terkirim ke backend).
 */
let activeGuestId: string | null = null;

export function setActiveGuestId(guestId?: string | null): void {
  activeGuestId = guestId ?? null;
}

export function getActiveGuestId(): string | null {
  return activeGuestId;
}

export function useInvitation(
  guestId?: string | null,
  options?: { initialData?: InvitationDetail },
) {
  const effective =
    guestId === undefined ? activeGuestId : guestId;
  return useQuery({
    queryKey: invitationKeys.detail(effective),
    queryFn: () => invitationService.getPublicInvitation(effective),
    staleTime: 60_000,
    // Data yang sudah di-fetch server (RSC) → render pertama langsung penuh,
    // tanpa layar "Memuat undangan"; React Query tetap refetch sesuai staleTime.
    initialData: options?.initialData,
  });
}

export function useGuestbook(limit = 20) {
  return useQuery({
    queryKey: invitationKeys.guestbook(limit),
    queryFn: () => invitationService.listGuestbook(limit),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useSubmitRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitRsvpPayload) => invitationService.submitRsvp(payload),
    onSuccess: (_, variables) => {
      // Segarkan detail undangan agar guest_rsvp (jawaban tersimpan) ikut baru.
      queryClient.invalidateQueries({
        queryKey: invitationKeys.detail(variables.guest_id),
      });
    },
  });
}

export function useSubmitGuestbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitGuestbookPayload) =>
      invitationService.submitGuestbook(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...invitationKeys.all, 'guestbook'] });
    },
  });
}
