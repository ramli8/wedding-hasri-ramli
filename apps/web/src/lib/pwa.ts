import { registerSW } from "virtual:pwa-register";
import { useSyncExternalStore } from "react";

type PwaState = { needRefresh: boolean; offlineReady: boolean };

let state: PwaState = { needRefresh: false, offlineReady: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
};

const updateSW = registerSW({
  onNeedRefresh: () => set({ needRefresh: true }),
  onOfflineReady: () => set({ offlineReady: true }),
});

/** Memasang versi baru dan memuat ulang. Panggil hanya saat penjaga memilihnya. */
export const applyUpdate = () => updateSW(true);

export function usePwaState(): PwaState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
}
