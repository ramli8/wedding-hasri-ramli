import { useCallback, useEffect, useRef, useState } from "react";
import { getMeta, setMeta } from "./db.js";
import { createQrDetector, type QrDetector } from "./detector.js";

export type CameraState = "idle" | "starting" | "running" | "error";
export type CameraFacing = "environment" | "user";

const SAME_CODE_COOLDOWN_MS = 3_000;
const SCAN_INTERVAL_MS = 120;

function describeError(err: unknown): string {
  // OverconstrainedError di Chrome bukan turunan DOMException, jadi nama dibaca langsung.
  const name = err instanceof Error || err instanceof DOMException ? err.name : "";
  if (name === "OverconstrainedError")
    return "Kamera yang dipilih tidak tersedia di perangkat ini.";
  if (name === "NotAllowedError")
    return "Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser.";
  if (name === "NotFoundError") return "Kamera tidak ditemukan di perangkat ini.";
  if (name === "NotReadableError")
    return "Kamera sedang dipakai (aplikasi, tab, atau kamera lain di halaman ini). Matikan kamera lalu nyalakan lagi.";
  if (!window.isSecureContext) return "Kamera hanya bisa dipakai lewat HTTPS.";
  return err instanceof Error ? err.message : "Kamera tidak bisa dibuka.";
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Arah kamera menurut labelnya (Android: "camera2 0, facing back"; iOS: "Back Camera"). */
export function facingFromLabel(label: string): CameraFacing | null {
  if (/\b(back|rear|environment|belakang)\b/i.test(label)) return "environment";
  if (/\b(front|user|depan|facetime)\b/i.test(label)) return "user";
  return null;
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
  const [facing, setFacing] = useState<CameraFacing>("environment");
  /** Lebih dari satu kamera: tombol ganti kamera ditampilkan. */
  const [canSwitch, setCanSwitch] = useState(false);
  const facingRef = useRef<CameraFacing>("environment");
  const lastErrorRef = useRef<string | null>(null);
  /**
   * Naik setiap kali kamera dimatikan. Pembukaan kamera yang dimulai sebelum `stop` dan baru selesai
   * sesudahnya harus membuang stream-nya sendiri; tanpa itu stream "yatim" tetap memegang kamera dan
   * kamera lain gagal dibuka (NotReadableError, "sedang dipakai aplikasi lain"). Ini terjadi mis.
   * saat efek dijalankan dua kali oleh React StrictMode.
   */
  const genRef = useRef(0);
  /** Pembukaan kamera yang sedang berjalan; panggilan `start` kedua menunggu yang ini. */
  const openingRef = useRef<{ gen: number; promise: Promise<boolean> } | null>(null);

  pausedRef.current = paused;
  onCodeRef.current = onCode;

  const stop = useCallback(() => {
    genRef.current += 1;
    cancelAnimationFrame(frameRef.current);
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    void lockRef.current?.release().catch(() => {});
    lockRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setTorch({ supported: false, on: false });
    setState("idle");
  }, []);

  const open = useCallback(
    async (wanted: { facing: CameraFacing; deviceId?: string } | undefined, gen: number) => {
      const stale = () => genRef.current !== gen;
      setState("starting");
      setError(null);
      try {
        const chosen = wanted?.facing ?? (await getMeta("cameraFacing")) ?? "environment";
        // Kamera yang pernah dipilih diminta lagi (ideal, bukan wajib: id bisa berubah).
        const deviceId = wanted ? wanted.deviceId : await getMeta("cameraDeviceId");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            ...(wanted?.deviceId
              ? { deviceId: { exact: wanted.deviceId } }
              : {
                  facingMode: { ideal: chosen },
                  ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
                }),
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (stale() || streamRef.current) {
          for (const track of stream.getTracks()) track.stop();
          return false;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error("Elemen video tidak ditemukan");
        video.srcObject = stream;
        await video.play();

        detectorRef.current ??= await createQrDetector();
        // Dimatikan saat masih menyiapkan: `stop` sudah melepas stream ini.
        if (stale()) return false;
        setDetectorKind(detectorRef.current.kind);

        // Daftar kamera baru lengkap setelah izin diberikan, jadi dihitung di sini.
        void navigator.mediaDevices
          .enumerateDevices?.()
          .then((list) => setCanSwitch(list.filter((d) => d.kind === "videoinput").length > 1))
          .catch(() => {});
        // Kamera yang benar-benar dipakai bisa berbeda dari yang diminta (mis. laptop hanya punya
        // kamera depan); cermin di layar mengikuti kamera sebenarnya.
        const actual = stream.getVideoTracks()[0]?.getSettings?.().facingMode;
        const effective: CameraFacing =
          actual === "user" || actual === "environment" ? actual : chosen;
        facingRef.current = effective;
        setFacing(effective);

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
        return true;
      } catch (err) {
        // Sudah dimatikan atau diganti pembukaan lain: jangan menimpa status kamera yang baru.
        if (stale()) return false;
        stop();
        lastErrorRef.current = describeError(err);
        setError(lastErrorRef.current);
        setState("error");
        return false;
      }
    },
    [stop],
  );

  /** Membuka kamera. Aman dipanggil berkali-kali: hanya satu stream yang pernah aktif. */
  const start = useCallback(
    async (wanted?: { facing: CameraFacing; deviceId?: string }): Promise<boolean> => {
      if (streamRef.current) return true;
      const pending = openingRef.current;
      if (pending) {
        if (pending.gen === genRef.current) return pending.promise;
        // Pembukaan lama yang sudah dibatalkan: tunggu sampai stream-nya dilepas dulu.
        await pending.promise.catch(() => false);
        if (streamRef.current) return true;
      }
      const gen = genRef.current;
      const promise = open(wanted, gen);
      openingRef.current = { gen, promise };
      try {
        return await promise;
      } finally {
        if (openingRef.current?.promise === promise) openingRef.current = null;
      }
    },
    [open],
  );

  /**
   * Ganti kamera depan/belakang; pilihan disimpan untuk pembukaan berikutnya.
   *
   * - Kamera tujuan dicari dari labelnya ("back"/"front", "belakang"/"depan") lalu dibuka lewat id,
   *   karena sebagian browser mengabaikan permintaan arah kamera.
   * - Banyak HP Android belum melepas kamera lama sesaat setelah dimatikan (NotReadableError), jadi
   *   membuka kamera baru dicoba ulang beberapa kali dengan jeda.
   * - Bila tetap gagal, kamera sebelumnya dibuka lagi agar scan tidak terhenti, dan alasannya
   *   dikembalikan untuk ditampilkan.
   */
  const switchCamera = useCallback(async (): Promise<string | null> => {
    const currentId = () => streamRef.current?.getVideoTracks()[0]?.getSettings?.().deviceId;
    const before = currentId();
    const previous = facingRef.current;
    const next: CameraFacing = previous === "user" ? "environment" : "user";

    const cameras = (await navigator.mediaDevices.enumerateDevices().catch(() => [])).filter(
      (d) => d.kind === "videoinput" && d.deviceId,
    );
    const byLabel = cameras.find((d) => d.deviceId !== before && facingFromLabel(d.label) === next);
    // Tanpa label yang jelas: kamera mana pun selain yang sedang dipakai.
    const fallback = cameras.find((d) => d.deviceId !== before);

    const openWithRetry = async (wanted: { facing: CameraFacing; deviceId?: string }) => {
      for (const delay of [150, 500, 1000]) {
        await sleep(delay);
        if (await start(wanted)) return true;
      }
      return false;
    };

    stop();
    let opened = await openWithRetry(
      byLabel ? { facing: next, deviceId: byLabel.deviceId } : { facing: next },
    );
    // Arah kamera diabaikan browser dan kamera yang sama terbuka lagi: pilih kamera lain lewat id.
    if (opened && !byLabel && before && currentId() === before && fallback) {
      stop();
      opened = await openWithRetry({ facing: next, deviceId: fallback.deviceId });
    }
    if (!opened) {
      const reason = lastErrorRef.current ?? "Kamera tidak bisa dibuka.";
      await openWithRetry(before ? { facing: previous, deviceId: before } : { facing: previous });
      return `Gagal pindah ke kamera ${next === "user" ? "depan" : "belakang"}: ${reason}`;
    }

    await setMeta("cameraFacing", facingRef.current);
    const chosenId = currentId();
    if (chosenId) await setMeta("cameraDeviceId", chosenId);
    return null;
  }, [start, stop]);

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

  return {
    videoRef,
    state,
    error,
    torch,
    detectorKind,
    facing,
    canSwitch,
    start,
    stop,
    toggleTorch,
    switchCamera,
  };
}
