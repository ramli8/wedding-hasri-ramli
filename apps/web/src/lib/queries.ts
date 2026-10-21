import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { adminApi, type GuestQuery } from "./admin-api.js";
import { api } from "./api.js";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: api.me,
  staleTime: 60_000,
  retry: false,
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
    ...keys: ("settings" | "events" | "groups" | "guests" | "devices" | "checkin" | "guestbook")[]
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
