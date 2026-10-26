import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { adminApi, type GuestQuery, type ReceivedGiftFilter } from "./admin-api.js";
import { api } from "./api.js";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: api.me,
  staleTime: 60_000,
  retry: false,
});

export const seoQuery = queryOptions({
  queryKey: ["seo"],
  queryFn: async () => (await adminApi.seo.get()).seo,
});

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => (await adminApi.settings.get()).settings,
});

export const eventsQuery = queryOptions({
  queryKey: ["events"],
  queryFn: async () => (await adminApi.events.list()).items,
});

export const groupsQuery = queryOptions({
  queryKey: ["groups"],
  queryFn: async () => (await adminApi.groups.list()).items,
});

export const devicesQuery = queryOptions({
  queryKey: ["devices"],
  queryFn: async () => (await adminApi.devices.list()).items,
  refetchInterval: 10_000,
});

/** Dashboard hari-H: disegarkan tiap 5 detik. */
export const dashboardQuery = queryOptions({
  queryKey: ["checkin", "dashboard"],
  queryFn: adminApi.checkins.dashboard,
  refetchInterval: 5_000,
  retry: false,
});

export const reviewQuery = queryOptions({
  queryKey: ["checkin", "review"],
  queryFn: async () => (await adminApi.checkins.review()).items,
  refetchInterval: 5_000,
  retry: false,
});

export const logQuery = (page: number) =>
  queryOptions({
    queryKey: ["checkin", "log", page],
    queryFn: () => adminApi.checkins.log(page),
    placeholderData: (previous) => previous,
  });

export const guestsQuery = (query: GuestQuery) =>
  queryOptions({
    queryKey: ["guests", query],
    queryFn: () => adminApi.guests.list(query),
    placeholderData: (previous) => previous,
  });

/** Menandai data sebagai usang setelah perubahan. Tamu ikut karena menampilkan kelompok/acara. */
export function useRefresh() {
  const queryClient = useQueryClient();
  return (
    ...keys: (
      | "settings"
      | "seo"
      | "events"
      | "groups"
      | "guests"
      | "devices"
      | "checkin"
      | "guestbook"
      | "invitation"
      | "received-gifts"
      | "vendors"
    )[]
  ) => Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}

export const rsvpQuery = (eventId?: string) =>
  queryOptions({
    queryKey: ["rsvp", eventId ?? null],
    queryFn: () => adminApi.rsvps.list(eventId),
    refetchInterval: 15_000,
    retry: false,
  });

export const guestbookQuery = (query: { page: number; hidden?: boolean }) =>
  queryOptions({
    queryKey: ["guestbook", query],
    queryFn: () => adminApi.guestbook.list(query),
    placeholderData: (previous) => previous,
  });

export const coupleQuery = queryOptions({
  queryKey: ["invitation", "couple"],
  queryFn: async () => (await adminApi.invitation.couple()).couple,
});

export const storyQuery = queryOptions({
  queryKey: ["invitation", "story"],
  queryFn: async () => (await adminApi.invitation.story()).items,
});

export const galleryQuery = queryOptions({
  queryKey: ["invitation", "gallery"],
  queryFn: async () => (await adminApi.invitation.gallery()).items,
});

export const giftsQuery = queryOptions({
  queryKey: ["invitation", "gifts"],
  queryFn: async () => (await adminApi.invitation.gifts()).items,
});

export const faqsQuery = queryOptions({
  queryKey: ["invitation", "faqs"],
  queryFn: async () => (await adminApi.invitation.faqs()).items,
});

export const wishesQuery = queryOptions({
  queryKey: ["invitation", "wishes"],
  queryFn: async () => (await adminApi.invitation.wishes()).items,
});

export const layoutQuery = queryOptions({
  queryKey: ["invitation", "layout"],
  queryFn: () => adminApi.invitation.layout(),
});

export const receivedGiftsQuery = (query: ReceivedGiftFilter) =>
  queryOptions({
    queryKey: ["received-gifts", query],
    queryFn: () => adminApi.receivedGifts.list(query),
    placeholderData: (previous) => previous,
  });

export const vendorsQuery = queryOptions({
  queryKey: ["vendors"],
  queryFn: () => adminApi.vendors.overview(),
});

export const homeQuery = queryOptions({
  queryKey: ["home"],
  queryFn: () => adminApi.home(),
  refetchInterval: 30_000,
  retry: false,
});
