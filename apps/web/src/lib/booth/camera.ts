import { useCallback, useEffect, useRef, useState } from "react";
import { getBoothMeta, setBoothMeta } from "./db.js";

export type BoothCamera = { deviceId: string; label: string };

/** Kamera Fujifilm (mode USB WEBCAM) diutamakan bila belum ada pilihan petugas. */
const PREFERRED = /x-a7|fujifilm|fuji/i;

/** Pesan saat kamera yang sedang dipakai mati atau kabelnya tercabut. */
export const CAMERA_LOST =
  "Kamera terputus. Periksa kabel USB dan baterai kamera; booth tersambung lagi otomatis.";

function describeError(err: unknown): string {
  const name = err instanceof Error || err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError") return "Izin kamera ditolak. Izinkan kamera untuk situs ini.";
  if (name === "NotFoundError") return "Kamera tidak ditemukan. Periksa kabel USB kamera.";
  if (name === "NotReadableError")
    return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu lalu coba lagi.";
  if (name === "OverconstrainedError") return "Kamera yang dipilih tidak tersedia.";
  if (!window.isSecureContext) return "Kamera hanya bisa dipakai lewat HTTPS atau localhost.";
  return err instanceof Error ? err.message : "Kamera tidak bisa dibuka.";
}

const isLive = (stream: MediaStream | null) =>
  !!stream && stream.getVideoTracks().some((track) => track.readyState === "live");

/**
 * Kamera booth: resolusi setinggi mungkin (ideal 1920×1080), layar dijaga tetap menyala. Pilihan
 * kamera disimpan di perangkat. Kamera yang terputus (baterai habis, kabel tercabut) ditandai
 * sebagai galat dan dibuka lagi otomatis begitu perangkat USB-nya muncul kembali; booth tidak
 * pernah diam-diam pindah ke webcam laptop.
 */
export function useBoothCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lockRef = useRef<WakeLockSentinel | null>(null);
  /** Kamera yang diminta terakhir; dipakai saat menyambung ulang. */
  const wantedRef = useRef<string | null>(null);
  /** Nomor panggilan `open` terakhir: hasil panggilan yang sudah tersusul dibuang. */
  const seqRef = useRef(0);
  const [cameras, setCameras] = useState<BoothCamera[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const lockScreen = useCallback(async () => {
    const lock = await navigator.wakeLock?.request("screen").catch(() => null);
    // Browser melepas kunci saat tab tersembunyi; kosongkan agar bisa diminta lagi.
    lock?.addEventListener("release", () => {
      if (lockRef.current === lock) lockRef.current = null;
    });
    lockRef.current = lock ?? null;
  }, []);

  const stop = useCallback(() => {
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    void lockRef.current?.release().catch(() => {});
    lockRef.current = null;
  }, []);

  const listCameras = useCallback(async () => {
    // Label kamera baru terbaca setelah izin diberikan.
    const list = (await navigator.mediaDevices.enumerateDevices())
      .filter((d) => d.kind === "videoinput")
      .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Kamera ${i + 1}` }));
    setCameras(list);
    return list;
  }, []);

  const open = useCallback(
    async (wanted: string | null): Promise<void> => {
      const seq = ++seqRef.current;
      wantedRef.current = wanted;
      stop();
      setError(null);
      setSize(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            ...(wanted ? { deviceId: { exact: wanted } } : {}),
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (seq !== seqRef.current) {
          // Sudah ada permintaan yang lebih baru (ganti kamera, sambung ulang): lepas yang ini.
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        track?.addEventListener("ended", () => {
          if (streamRef.current !== stream) return;
          stop();
          setSize(null);
          setError(CAMERA_LOST);
        });

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
          if (seq !== seqRef.current) return;
          if (video.videoWidth > 0) {
            setSize({ width: video.videoWidth, height: video.videoHeight });
          } else {
            // Bingkai pertama belum tiba: ukuran diisi saat metadata siap.
            video.addEventListener(
              "loadedmetadata",
              () => {
                if (seq === seqRef.current && video.videoWidth > 0) {
                  setSize({ width: video.videoWidth, height: video.videoHeight });
                }
              },
              { once: true },
            );
          }
        }
        const list = await listCameras();
        if (seq !== seqRef.current) return;
        const current = track?.getSettings().deviceId ?? wanted;
        setDeviceId(current ?? null);

        // Belum ada pilihan dan ada kamera Fujifilm: pindah ke sana sekali.
        if (!wanted) {
          const fuji = list.find((c) => PREFERRED.test(c.label));
          if (fuji && fuji.deviceId !== current) {
            await setBoothMeta("cameraDeviceId", fuji.deviceId);
            return open(fuji.deviceId);
          }
        }
        await lockScreen();
      } catch (err) {
        if (seq !== seqRef.current) return;
        // Kamera pilihan tidak tersambung: jangan diam-diam pindah ke webcam laptop. Tunggu kamera
        // dicolok lagi (devicechange) atau petugas memilih kamera lain.
        const name = err instanceof Error || err instanceof DOMException ? err.name : "";
        if (wanted && (name === "OverconstrainedError" || name === "NotFoundError")) {
          await listCameras().catch(() => {});
          setError(CAMERA_LOST);
          return;
        }
        setError(describeError(err));
      }
    },
    [stop, lockScreen, listCameras],
  );

  const choose = useCallback(
    async (id: string) => {
      await setBoothMeta("cameraDeviceId", id);
      await open(id);
    },
    [open],
  );

  useEffect(() => {
    let cancelled = false;
    void getBoothMeta("cameraDeviceId").then((saved) => {
      if (!cancelled) void open(saved ?? null);
    });
    // Layar menyala lagi setelah tab kembali terlihat (wake lock dilepas browser saat tersembunyi).
    const onVisible = async () => {
      if (document.visibilityState === "visible" && streamRef.current && !lockRef.current) {
        await lockScreen();
      }
    };
    // Kamera dicolok ulang atau kamera baru muncul: perbarui daftar, dan sambung ulang bila
    // kamera sedang mati.
    const onDeviceChange = async () => {
      if (cancelled) return;
      const saved = (await getBoothMeta("cameraDeviceId")) ?? wantedRef.current;
      if (isLive(streamRef.current)) {
        const list = await listCameras().catch(() => []);
        const current = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId;
        // Masih memakai kamera lain sementara kamera pilihan baru muncul lagi: pindah kembali.
        if (saved && current !== saved && list.some((c) => c.deviceId === saved)) {
          void open(saved);
        }
        return;
      }
      // Id kamera bisa berubah bila dicolok ke port USB lain: pakai kamera Fujifilm yang ada.
      const list = await listCameras().catch(() => []);
      const fuji = list.find((c) => PREFERRED.test(c.label));
      const next = saved && list.some((c) => c.deviceId === saved) ? saved : fuji?.deviceId;
      if (next && next !== saved) await setBoothMeta("cameraDeviceId", next);
      if (!cancelled && next) void open(next);
    };
    document.addEventListener("visibilitychange", onVisible);
    navigator.mediaDevices?.addEventListener("devicechange", onDeviceChange);
    return () => {
      cancelled = true;
      seqRef.current += 1;
      document.removeEventListener("visibilitychange", onVisible);
      navigator.mediaDevices?.removeEventListener("devicechange", onDeviceChange);
      stop();
    };
  }, [open, stop, lockScreen, listCameras]);

  return {
    videoRef,
    cameras,
    deviceId,
    error,
    size,
    choose,
    retry: () => open(wantedRef.current ?? deviceId),
  };
}
