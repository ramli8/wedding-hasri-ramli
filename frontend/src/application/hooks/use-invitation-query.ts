import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  invitationService,
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

export function useInvitation(guestId?: string | null) {
  return useQuery({
    queryKey: invitationKeys.detail(guestId),
    queryFn: () => invitationService.getPublicInvitation(guestId),
    staleTime: 60_000,
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
  return useMutation({
    mutationFn: (payload: SubmitRsvpPayload) => invitationService.submitRsvp(payload),
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
