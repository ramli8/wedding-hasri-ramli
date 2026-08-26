"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/src/presentation/components/layout/protected-route";
import { ProtectedModule } from "@/src/presentation/components/layout/protected-feature";
import {
  Loader2,
  ScanQrCode,
  CameraOff,
  User,
  SwitchCamera,
  Smartphone,
  QrCode,
} from "lucide-react";
import {
  useCheckInGuest,
  useGuestCategories,
} from "@/src/application/hooks/use-guest-query";
import { Guest, guestService } from "@/src/domain/services/guest.service";
import type { Html5Qrcode } from "html5-qrcode";
import { isAxiosError } from "axios";
import { ChevronLeft } from "lucide-react";
import { toast } from "react-toastify";
import { OfflineBanner } from "@/src/presentation/components/admin/guest-checkin/offline-banner";
import {
  CheckInResultSheet,
  type ResultStatus,
} from "@/src/presentation/components/admin/guest-checkin/check-in-result-sheet";
import { useOnlineStatus } from "@/src/application/hooks/use-online-status";
import {
  enqueueCheckIn,
  flushCheckInQueue,
  isNetworkError,
  readCheckInQueue,
} from "@/src/lib/checkin/offline-queue";

type ViewMode = "idle" | "scanner" | "result";

async function stopSafely(scanner: Html5Qrcode | null) {
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
  } catch {
    /* already stopped - ok */
  }
}

export default function GuestCheckInPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("idle");

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Result State
  const [resultStatus, setResultStatus] = useState<ResultStatus>("success");
  const [resultMessage, setResultMessage] = useState("");
  const [resultAt, setResultAt] = useState("");
  const [checkedInGuest, setCheckedInGuest] = useState<Guest | null>(null);
  const [guestIsVip, setGuestIsVip] = useState(false);

  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [queue, setQueue] = useState(() => readCheckInQueue());
  const online = useOnlineStatus();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(true);
  const onScanRef = useRef<((code: string) => void) | null>(null);

  const checkInMutation = useCheckInGuest();

  // Kategori VIP dipakai untuk membedakan tampilan notifikasi check-in.
  const { data: categoriesData } = useGuestCategories({
    page: 1,
    page_size: 100,
  });
  const vipCategoryIds = useMemo(
    () =>
      new Set(
        (categoriesData?.items ?? [])
          .filter((c) => c.is_vip)
          .map((c) => c.id)
      ),
    [categoriesData]
  );
  const resolveVip = (guest: Guest | null | undefined) =>
    !!guest && vipCategoryIds.has(guest.guest_category_id);

  const startScanner = async (mode: "environment" | "user" = facingMode) => {
    setCameraError("");
    setCameraReady(false);

    try {
      // Dynamic import: lib QR (~100KB gz) hanya diunduh saat kamera dipakai.
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
        "html5-qrcode"
      );
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
          verbose: false,
        });
      }

      await stopSafely(scannerRef.current);

      const onScanSuccess = (decodedText: string) =>
        onScanRef.current?.(decodedText.trim());

      try {
        await scannerRef.current.start(
          { facingMode: mode },
          { fps: 30 },
          onScanSuccess,
          () => {}
        );
        if (mountedRef.current) setFacingMode(mode);
      } catch {
        // Fallback to the other camera
        const fallbackMode = mode === "environment" ? "user" : "environment";
        await scannerRef.current.start(
          { facingMode: fallbackMode },
          { fps: 30 },
          onScanSuccess,
          () => {}
        );
        if (mountedRef.current) setFacingMode(fallbackMode);
      }

      if (mountedRef.current) {
        setCameraReady(true);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setCameraError(
        err instanceof Error ? err.message : "Failed to start camera"
      );
      setCameraReady(false);
    }
  };

  // Kirim antrian offline begitu koneksi kembali (atau saat halaman dibuka).
  const flushingRef = useRef(false);
  useEffect(() => {
    if (!online || flushingRef.current || queue.length === 0) return;
    flushingRef.current = true;
    flushCheckInQueue()
      .then((res) => {
        setQueue(readCheckInQueue());
        if (res.flushedNames.length > 0) {
          toast.success(
            `${res.flushedNames.length} check-in offline berhasil terkirim`
          );
        }
      })
      .finally(() => {
        flushingRef.current = false;
      });
  }, [online, queue.length]);

  const markResultTime = () =>
    setResultAt(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

  const handleCheckInRequest = (code: string) => {
    checkInMutation.mutate(code, {
      onSuccess: async (data) => {
        if (!mountedRef.current) return;
        setCheckedInGuest(data.guest);
        setGuestIsVip(resolveVip(data.guest));
        setResultStatus("success");
        setResultMessage("Terima kasih, kehadiran Anda telah dicatat.");
        markResultTime();
        setViewMode("result");
      },
      onError: async (err, variables: string) => {
        if (!mountedRef.current) return;

        if (isNetworkError(err)) {
          const q = enqueueCheckIn({
            key: `qr:${code}`,
            qrCode: code,
            label: `QR ${code}`,
          });
          setQueue(q);
          setCheckedInGuest(null);
          setGuestIsVip(false);
          setResultStatus("warning");
          setResultMessage(
            `Anda offline — check-in kode ${code} masuk antrian dan terkirim otomatis saat koneksi kembali.`
          );
          markResultTime();
          setViewMode("result");
          return;
        }

        let message = "Gagal melakukan check-in";
        if (isAxiosError(err)) {
          message =
            (typeof err.response?.data?.error === "string"
              ? err.response.data.error
              : null) ??
            err.message ??
            message;
        } else if (err instanceof Error) {
          message = err.message;
        }

        const isAlreadyCheckedIn =
          message.toLowerCase().includes("already") ||
          message.toLowerCase().includes("sudah");

        if (isAlreadyCheckedIn) {
          message = "Tamu ini sudah melakukan check-in sebelumnya.";
          try {
            const searchRes = await guestService.listGuests({
              search: variables,
            });
            const found = searchRes.items?.[0] ?? null;
            setCheckedInGuest(found);
            setGuestIsVip(resolveVip(found));
          } catch {
            setCheckedInGuest(null);
            setGuestIsVip(false);
          }
        } else if (
          message.toLowerCase().includes("not found") ||
          message.toLowerCase().includes("invalid")
        ) {
          message = "Kode QR tidak valid atau tamu tidak ditemukan.";
          setCheckedInGuest(null);
          setGuestIsVip(false);
        } else {
          setCheckedInGuest(null);
          setGuestIsVip(false);
        }

        setResultStatus(isAlreadyCheckedIn ? "warning" : "error");
        setResultMessage(message);
        markResultTime();
        setViewMode("result");
      },
    });
  };

  useEffect(() => {
    onScanRef.current = (code: string) => {
      if (!code || checkInMutation.isPending) return;
      // Prevent multiple triggers by checking if we are already transitioning
      if (resultMessage !== "") return;
      handleCheckInRequest(code);
    };
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopSafely(scannerRef.current);
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (viewMode === "scanner") {
      if (!cameraReady) {
        // Defer camera start to let React StrictMode settle and DOM remove 'hidden' classes
        timer = setTimeout(() => {
          if (mountedRef.current) {
            startScanner();
          }
        }, 100);
      }
    } else {
      // Stop camera to save battery and allow clean restart when returning to scanner
      stopSafely(scannerRef.current);
      setCameraReady(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [viewMode, cameraReady]);

  const backToScanner = () => {
    setCheckedInGuest(null);
    setResultMessage("");
    setResultAt("");
    setGuestIsVip(false);
    setViewMode("scanner");
  };

  return (
    <ProtectedRoute>
      <ProtectedModule requiredRole={["Super Admin", "Admin"]}>
        <div className="min-h-screen bg-background font-sans text-foreground transition-colors duration-300">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-primary/10 bg-card/80 px-4 py-3.5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all md:px-5">
            <Link
              href="/admin"
              aria-label="Kembali ke admin"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/5 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[17px] font-extrabold tracking-tight text-foreground">
              Pindai QR Tamu
            </h1>
            <div className="w-10 shrink-0" />
          </header>

          <div className="mx-auto w-full max-w-[480px] px-4 pb-24 md:max-w-2xl md:px-5 lg:max-w-6xl">
            {!online ? (
              <div className="mt-4 lg:hidden">
                <OfflineBanner queueCount={queue.length} />
              </div>
            ) : null}

            <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              {/* Kolom utama: scanner */}
              <div className="mx-auto flex min-h-[440px] w-full min-w-0 flex-col md:min-h-[520px] lg:max-w-none">
                {/* IDLE VIEW */}
                {viewMode === "idle" && (
                  <div className="flex w-full flex-1 animate-in flex-col items-center justify-center rounded-[32px] border border-border/50 bg-card/40 px-6 py-14 fade-in duration-300 md:py-20">
                    {/* Ilustrasi QR */}
                    <div className="relative mb-9 flex h-44 w-44 items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-primary/10" />
                      <span className="absolute right-3 top-4 flex h-10 w-10 rotate-6 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                        <QrCode className="h-5 w-5" />
                      </span>
                      <span className="absolute bottom-4 left-3 flex h-10 w-10 -rotate-6 items-center justify-center rounded-2xl bg-primary/85 text-primary-foreground shadow-lg shadow-primary/25">
                        <Smartphone className="h-5 w-5" />
                      </span>
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-border/40 bg-card shadow-[0_10px_36px_rgba(0,0,0,0.10)]">
                        <ScanQrCode
                          className="h-11 w-11 text-primary"
                          strokeWidth={1.7}
                        />
                      </div>
                    </div>

                    <h2 className="text-center text-[20px] font-extrabold tracking-tight text-foreground">
                      Scan QR Tamu
                    </h2>
                    <p className="mb-8 mt-2 max-w-[280px] text-center text-[13px] leading-snug text-muted-foreground">
                      Arahkan kamera ke kode QR undangan tamu untuk mencatat
                      kehadiran secara otomatis.
                    </p>
                    <div className="flex w-full max-w-[300px] flex-col items-center gap-3">
                      <button
                        onClick={() => {
                          setFacingMode("environment");
                          setViewMode("scanner");
                        }}
                        className="h-[52px] w-full cursor-pointer rounded-2xl bg-primary text-[15px] font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 active:scale-95"
                      >
                        Mulai Pindai
                      </button>
                      <button
                        onClick={() => {
                          setFacingMode("user");
                          setViewMode("scanner");
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold text-primary transition-all hover:bg-primary/10 active:scale-95"
                      >
                        <User className="h-4 w-4" />
                        Gunakan Kamera Depan
                      </button>
                    </div>
                  </div>
                )}

                {/* SCANNER VIEW */}
                <div
                  className={
                    viewMode === "scanner"
                      ? "flex w-full flex-1 animate-in flex-col fade-in zoom-in-95 duration-300"
                      : "hidden"
                  }
                >
                  <div className="relative mx-auto flex aspect-[3/4] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-[28px] border border-border/50 bg-black shadow-lg transition-all duration-300 md:aspect-[4/3] lg:max-w-lg">
                    <style>{`
                      #qr-reader { width: 100% !important; height: 100% !important; border: none !important; background: transparent !important; display: flex !important; align-items: center; justify-content: center; }
                      #qr-reader video { width: 100% !important; height: 100% !important; display: block !important; object-fit: cover !important; }
                      #qr-shaded-region { display: none !important; }
                      @keyframes laserSweep {
                        0%, 100% { top: 16%; opacity: 0.9; }
                        50% { top: 84%; opacity: 1; }
                      }
                    `}</style>

                    {!cameraReady && !cameraError && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                        <span className="text-[13px] font-medium">
                          Membuka kamera...
                        </span>
                      </div>
                    )}
                    {cameraError && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background p-6 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                          <CameraOff className="h-7 w-7 text-destructive" />
                        </div>
                        <p className="max-w-[240px] text-[13px] font-medium leading-snug text-destructive">
                          {cameraError}
                        </p>
                        <button
                          onClick={() => startScanner()}
                          className="mt-5 h-11 cursor-pointer rounded-2xl bg-primary px-6 text-[13px] font-bold text-primary-foreground transition-all active:scale-95"
                        >
                          Coba Lagi
                        </button>
                      </div>
                    )}
                    <div id="qr-reader" />

                    {cameraReady && (
                      <div className="pointer-events-none absolute inset-0 z-20">
                        {/* Caption di dalam viewfinder */}
                        <p className="absolute inset-x-6 top-5 text-center text-[12.5px] font-medium leading-snug text-white/95 drop-shadow-md">
                          Arahkan kode QR pada undangan tamu
                          <br />
                          ke dalam bingkai
                        </p>

                        {/* Bingkai sudut tipis */}
                        <div className="absolute inset-x-8 inset-y-[72px] md:inset-x-12 md:inset-y-16">
                          <div className="absolute left-0 top-0 h-10 w-10 rounded-tl-xl border-l-2 border-t-2 border-white/95" />
                          <div className="absolute right-0 top-0 h-10 w-10 rounded-tr-xl border-r-2 border-t-2 border-white/95" />
                          <div className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-xl border-b-2 border-l-2 border-white/95" />
                          <div className="absolute bottom-0 right-0 h-10 w-10 rounded-br-xl border-b-2 border-r-2 border-white/95" />
                        </div>

                        {/* Laser scan line */}
                        <div
                          className="absolute left-8 right-8 h-[3px] rounded-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_18px_4px_rgba(52,211,153,0.55)] md:left-12 md:right-12"
                          style={{ animation: "laserSweep 2.6s ease-in-out infinite" }}
                        />
                      </div>
                    )}

                    {/* LOADING OVERLAY WHEN SCANNED */}
                    {checkInMutation.isPending && (
                      <div className="absolute inset-0 z-30 flex animate-in flex-col items-center justify-center bg-black/60 text-white backdrop-blur-md fade-in duration-200">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <span className="text-[15px] font-bold tracking-wide">
                          Memverifikasi Data...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Kontrol di bawah viewfinder */}
                  {cameraReady && (
                    <div className="mx-auto mt-5 flex w-full max-w-md flex-col items-center gap-1.5">
                      <button
                        onClick={() =>
                          startScanner(
                            facingMode === "environment" ? "user" : "environment"
                          )
                        }
                        className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-primary/5 text-[13px] font-bold text-primary transition-all hover:bg-primary/10 active:scale-95"
                      >
                        <SwitchCamera className="h-4 w-4" />
                        Ganti ke Kamera{" "}
                        {facingMode === "environment" ? "Depan" : "Belakang"}
                      </button>
                      <button
                        onClick={() => setViewMode("idle")}
                        className="cursor-pointer rounded-full px-4 py-2 text-[12px] font-semibold text-muted-foreground transition-all hover:bg-muted/60 hover:text-foreground active:scale-95"
                      >
                        Tutup Kamera
                      </button>
                    </div>
                  )}
                </div>

                {/* Placeholder saat result menutup layar */}
                {viewMode === "result" && <div className="flex-1" />}
              </div>

              {/* Sidebar (laptop) */}
              <aside className="hidden flex-col gap-4 lg:sticky lg:top-24 lg:flex lg:h-fit">
                {!online ? <OfflineBanner queueCount={queue.length} /> : null}

                <div className="rounded-2xl border border-border/50 bg-card p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Mode Lain
                  </p>
                  <p className="text-[12px] leading-snug text-muted-foreground">
                    Tamu kehilangan QR? Lakukan check-in manual dengan
                    pencarian nama.
                  </p>
                  <Link
                    href="/admin/guest-checkin-bypass"
                    className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary/10 px-4 text-[12px] font-bold text-primary transition-all hover:bg-primary/20 active:scale-95"
                  >
                    Buka Check-in Manual
                  </Link>
                </div>
              </aside>
            </div>
          </div>

          {/* RESULT OVERLAY — tiket kehadiran gaya bottom sheet */}
          <CheckInResultSheet
            open={viewMode === "result"}
            status={resultStatus}
            message={resultMessage}
            at={resultAt}
            guest={checkedInGuest}
            vip={guestIsVip}
            ctaLabel="Pindai Tamu Berikutnya"
            autoDismissMs={5000}
            onClose={backToScanner}
          />
        </div>
      </ProtectedModule>
    </ProtectedRoute>
  );
}
