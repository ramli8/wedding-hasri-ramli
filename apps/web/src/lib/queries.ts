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

export const guestsQuery = (query: GuestQuery) =>
  queryOptions({
    queryKey: ["guests", query],
    queryFn: () => adminApi.guests.list(query),
    placeholderData: (previous) => previous,
  });

/** Menandai data sebagai usang setelah perubahan. Tamu ikut karena menampilkan kelompok/acara. */
export function useRefresh() {
  const queryClient = useQueryClient();
  return (...keys: ("settings" | "events" | "groups" | "guests")[]) =>
    Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: [key] })));
}
