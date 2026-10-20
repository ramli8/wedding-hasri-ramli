import { useCallback, useEffect, useRef, useState } from "react";
import { createQrDetector, type QrDetector } from "./detector.js";

export type CameraState = "idle" | "starting" | "running" | "error";

const SAME_CODE_COOLDOWN_MS = 3_000;
const SCAN_INTERVAL_MS = 120;

function describeError(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError")
    return "Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser.";
  if (name === "NotFoundError") return "Kamera tidak ditemukan di perangkat ini.";
  if (name === "NotReadableError") return "Kamera sedang dipakai aplikasi lain.";
  if (!window.isSecureContext) return "Kamera hanya bisa dipakai lewat HTTPS.";
  return err instanceof Error ? err.message : "Kamera tidak bisa dibuka.";
}

/**
 * Kamera belakang + pemindai QR. `paused` menahan pembacaan (mis. saat hasil sedang tampil)
 * tanpa mematikan kamera, supaya scan berikutnya langsung siap.
 */
export function useCamera(onCode: (raw: string) => void, paused: boolean) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<QrDetector | null>(null);
  const frameRef = useRef<number>(0);
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const pausedRef = useRef(paused);
  const onCodeRef = useRef(onCode);
  const lastRef = useRef<{ raw: string; at: number }>({ raw: "", at: 0 });

  const [state, setState] = useState<CameraState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [torch, setTorch] = useState({ supported: false, on: false });
  const [detectorKind, setDetectorKind] = useState<QrDetector["kind"] | null>(null);

  pausedRef.current = paused;
  onCodeRef.current = onCode;

  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    void lockRef.current?.release().catch(() => {});
    lockRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorch({ supported: false, on: false });
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    setState("starting");
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Elemen video tidak ditemukan");
      video.srcObject = stream;
      await video.play();

      detectorRef.current ??= await createQrDetector();
      setDetectorKind(detectorRef.current.kind);

      const capabilities = stream.getVideoTracks()[0]?.getCapabilities?.() as
        | { torch?: boolean }
        | undefined;
      setTorch({ supported: !!capabilities?.torch, on: false });
      void navigator.wakeLock?.request("screen").then((lock) => {
        lockRef.current = lock;
      });

      let last = 0;
      let busy = false;
      const tick = (time: number) => {
        frameRef.current = requestAnimationFrame(tick);
        if (pausedRef.current || busy || time - last < SCAN_INTERVAL_MS) return;
        if (video.readyState < 2) return;
        last = time;
        busy = true;
        detectorRef.current
          ?.detect(video)
          .then((values) => {
            for (const raw of values) {
              const now = Date.now();
              if (raw === lastRef.current.raw && now - lastRef.current.at < SAME_CODE_COOLDOWN_MS)
                continue;
              lastRef.current = { raw, at: now };
              onCodeRef.current(raw);
              break;
            }
          })
          .catch(() => {})
          .finally(() => {
            busy = false;
          });
      };
      frameRef.current = requestAnimationFrame(tick);
      setState("running");
    } catch (err) {
      stop();
      setError(describeError(err));
      setState("error");
    }
  }, [stop]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torch.on;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorch((t) => ({ ...t, on: next }));
    } catch {
      /* senter tidak tersedia pada kamera ini */
    }
  }, [torch.on]);

  // Kunci layar dilepas saat tab disembunyikan; ambil lagi saat kembali.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && streamRef.current && !lockRef.current) {
        void navigator.wakeLock?.request("screen").then((lock) => {
          lockRef.current = lock;
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, state, error, torch, detectorKind, start, stop, toggleTorch };
}
