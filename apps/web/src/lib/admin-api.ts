import {
  createDeviceResponseSchema,
  dashboardResponseSchema,
  deviceListResponseSchema,
  deviceResponseSchema,
  type EventInput,
  eventListResponseSchema,
  eventResponseSchema,
  type GroupInput,
  type GuestInput,
  groupListResponseSchema,
  groupResponseSchema,
  guestListResponseSchema,
  guestResponseSchema,
  importCommitResponseSchema,
  importPreviewResponseSchema,
  logResponseSchema,
  type MarkSentRequest,
  type ResolveRequest,
  reviewListResponseSchema,
  type SettingsInput,
  settingsResponseSchema,
} from "@wedding/shared";
import { okSchema, request, withBody } from "./api.js";

const base = "/v1/admin";

/** Filter daftar tamu di sisi klien (boolean/angka asli; server yang mengubahnya dari string). */
export type GuestQuery = {
  q?: string;
  groupId?: string;
  eventId?: string;
  sent?: "sent" | "unsent";
  onlyInstagram?: boolean;
  rombongan?: boolean;
  deleted?: boolean;
  page?: number;
  pageSize?: number;
};

function queryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === false) continue;
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export const adminApi = {
  settings: {
    get: () => request(`${base}/settings`, settingsResponseSchema),
    save: (input: SettingsInput) =>
      request(`${base}/settings`, settingsResponseSchema, withBody("PUT", input)),
  },

  events: {
    list: () => request(`${base}/events`, eventListResponseSchema),
    create: (input: EventInput) =>
      request(`${base}/events`, eventResponseSchema, withBody("POST", input)),
    update: (id: string, input: EventInput) =>
      request(`${base}/events/${id}`, eventResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/events/${id}`, okSchema, withBody("DELETE")),
  },

  groups: {
    list: () => request(`${base}/groups`, groupListResponseSchema),
    create: (input: GroupInput) =>
      request(`${base}/groups`, groupResponseSchema, withBody("POST", input)),
    update: (id: string, input: GroupInput) =>
      request(`${base}/groups/${id}`, groupResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/groups/${id}`, okSchema, withBody("DELETE")),
  },

  guests: {
    list: (query: GuestQuery) =>
      request(`${base}/guests${queryString(query)}`, guestListResponseSchema),
    create: (input: GuestInput) =>
      request(`${base}/guests`, guestResponseSchema, withBody("POST", input)),
    update: (id: string, input: GuestInput) =>
      request(`${base}/guests/${id}`, guestResponseSchema, withBody("PUT", input)),
    remove: (id: string) => request(`${base}/guests/${id}`, okSchema, withBody("DELETE")),
    restore: (id: string) =>
      request(`${base}/guests/${id}/restore`, guestResponseSchema, withBody("POST", {})),
    markSent: (id: string, input: MarkSentRequest) =>
      request(`${base}/guests/${id}/sent`, guestResponseSchema, withBody("POST", input)),
    importPreview: (csv: string) =>
      request(
        `${base}/guests/import/preview`,
        importPreviewResponseSchema,
        withBody("POST", { csv }),
      ),
    importCommit: (csv: string, skipDuplicates: boolean) =>
      request(
        `${base}/guests/import/commit`,
        importCommitResponseSchema,
        withBody("POST", { csv, skipDuplicates }),
      ),
  },

  devices: {
    list: () => request(`${base}/devices`, deviceListResponseSchema),
    create: (name: string) =>
      request(`${base}/devices`, createDeviceResponseSchema, withBody("POST", { name })),
    revoke: (id: string) =>
      request(`${base}/devices/${id}/revoke`, deviceResponseSchema, withBody("POST", {})),
    remove: (id: string) => request(`${base}/devices/${id}`, okSchema, withBody("DELETE")),
  },

  checkins: {
    dashboard: () => request(`${base}/checkins/dashboard`, dashboardResponseSchema),
    review: () => request(`${base}/checkins/review`, reviewListResponseSchema),
    resolve: (input: ResolveRequest) =>
      request(`${base}/checkins/resolve`, okSchema, withBody("POST", input)),
    log: (page: number) =>
      request(`${base}/checkins/log?page=${page}&pageSize=30`, logResponseSchema),
    undo: (id: string) => request(`${base}/checkins/${id}/undo`, okSchema, withBody("POST", {})),
    setPax: (id: string, pax: number) =>
      request(`${base}/checkins/${id}/pax`, okSchema, withBody("POST", { pax })),
  },
};

/** Tautan unduhan (dibuka langsung oleh browser, cookie sesi ikut terkirim). */
export const downloads = {
  guestsCsv: `/api${base}/guests/export.csv`,
  templateCsv: `/api${base}/guests/template.csv`,
};
