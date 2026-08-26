"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/src/presentation/components/layout/protected-route";
import { ProtectedModule } from "@/src/presentation/components/layout/protected-feature";
import { Input } from "@/src/presentation/components/ui/input";
import {
  Loader2,
  Search,
  Phone,
  Instagram,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ScanLine,
  UserRound,
  X,
  Crown,
} from "lucide-react";
import { isAxiosError } from "axios";
import {
  useSearchGuests,
  useCheckInGuestByID,
  useGuestCategories,
} from "@/src/application/hooks/use-guest-query";
import { Guest, guestService } from "@/src/domain/services/guest.service";
import { toast } from "react-toastify";
import { OfflineBanner } from "@/src/presentation/components/admin/guest-checkin/offline-banner";
import { CheckInResultSheet } from "@/src/presentation/components/admin/guest-checkin/check-in-result-sheet";
import { useOnlineStatus } from "@/src/application/hooks/use-online-status";
import {
  enqueueCheckIn,
  flushCheckInQueue,
  isNetworkError,
  readCheckInQueue,
} from "@/src/lib/checkin/offline-queue";
import { cn } from "@/src/lib/utils";

function attendingBadge(guest: Guest): { label: string; className: string } {
  if (guest.status_attending === "going")
    return {
      label: "Konfirm Hadir",
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    };
  if (guest.status_attending === "not_going")
    return { label: "Absen", className: "bg-destructive/10 text-destructive" };
  return {
    label: "Menunggu",
    className: "bg-secondary text-secondary-foreground",
  };
}

function initialsOf(name: string): string {
  const words = name.split(" ").filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function GuestCheckInBypassPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [queue, setQueue] = useState(() => readCheckInQueue());
  const [directory, setDirectory] = useState<Guest[] | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultGuest, setResultGuest] = useState<Guest | null>(null);
  const [resultAt, setResultAt] = useState("");
  const online = useOnlineStatus();

  const bypassMutation = useCheckInGuestByID();
  const { data: searchResults, isLoading: isSearching } = useSearchGuests(
    debouncedSearch,
    true
  );

  // Kategori VIP dipakai untuk badge tamu pada daftar hasil.
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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Direktori tamu untuk pencarian OFFLINE: diambil sekali saat online
  // (ratusan tamu = payload kecil), lalu difilter lokal saat offline.
  useEffect(() => {
    if (!online || directory) return;
    guestService
      .listGuests({ page: 1, page_size: 1000 })
      .then((data) => setDirectory(data.items))
      .catch(() => {});
  }, [online]);

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
            `${res.flushedNames.length} check-in offline berhasil dikirim`
          );
        }
      })
      .finally(() => {
        flushingRef.current = false;
      });
  }, [online, queue.length]);

  const items: Guest[] = useMemo(() => {
    if (online) return searchResults?.items ?? [];
    const q = debouncedSearch.trim().toLowerCase();
    if (q.length < 2 || !directory) return [];
    return directory
      .filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.phone_number ?? "").includes(q) ||
          (g.instagram_username ?? "").toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [online, searchResults, directory, debouncedSearch]);

  const isCheckedIn = (guest: Guest) =>
    !!guest.check_in_at || queue.some((q) => q.key === `id:${guest.id}`);
  const isQueued = (guest: Guest) =>
    queue.some((q) => q.key === `id:${guest.id}`);

  const closeResult = () => {
    setResultOpen(false);
    setResultGuest(null);
    setResultAt("");
  };

  const handleBypassCheckIn = (guest: Guest) => {
    setCheckingId(guest.id);
    bypassMutation.mutate(guest.id, {
      onSuccess: (data) => {
        setResultGuest(data.guest);
        setResultAt(
          new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
        setSearchQuery("");
        setResultOpen(true);
      },
      onError: (err: unknown) => {
        if (isNetworkError(err)) {
          setQueue(
            enqueueCheckIn({
              key: `id:${guest.id}`,
              guestId: guest.id,
              label: guest.name,
            })
          );
          toast.info(
            "Anda offline — check-in masuk antrian dan terkirim otomatis saat koneksi kembali."
          );
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
        }
        if (
          message.toLowerCase().includes("already") ||
          message.toLowerCase().includes("sudah")
        ) {
          toast.warning("Tamu ini sudah melakukan check-in sebelumnya.");
        } else {
          toast.error(message);
        }
      },
      onSettled: () => setCheckingId(null),
    });
  };

  const renderResults = () => {
    if (debouncedSearch.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          {/* Ilustrasi ringkas */}
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-primary/[0.07]" />
            <UserRound
              className="relative h-9 w-9 text-muted-foreground/40"
              strokeWidth={1.6}
            />
            <span className="absolute -right-1.5 -top-1.5 flex h-8 w-8 rotate-6 items-center justify-center rounded-xl border border-border/40 bg-card shadow-md">
              <ScanLine className="h-4 w-4 text-primary" />
            </span>
          </div>

          <p className="text-[15px] font-extrabold tracking-tight text-foreground">
            Cari tamu untuk check-in manual
          </p>
          <p className="mt-1.5 max-w-[300px] text-[13px] leading-snug text-muted-foreground">
            Ketik nama, nomor HP, atau Instagram — minimal 2 huruf, lalu tekan
            tombol check-in di samping namanya.
          </p>

          <Link
            href="/admin/guest-checkin"
            className="mt-7 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-5 text-[12px] font-bold text-primary transition-all hover:bg-primary/20 active:scale-95"
          >
            <ScanLine className="h-4 w-4" />
            Tamu punya QR? Pindai saja
          </Link>
        </div>
      );
    }

    if (isSearching) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary/50" />
          <p className="text-[13px] font-medium">Mencari data tamu...</p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UserRound className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-[14px] font-bold tracking-tight text-foreground">
            Tidak ditemukan
          </p>
          <p className="mt-1 max-w-[280px] text-[13px] leading-snug text-muted-foreground">
            Coba ejaan lain, atau cari dengan nomor HP / Instagram tamu.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2.5">
        {items.map((guest) => {
          const checkedIn = isCheckedIn(guest);
          const badge = attendingBadge(guest);
          const pending = checkingId === guest.id;
          const isVipGuest = vipCategoryIds.has(guest.guest_category_id);
          return (
            <div
              key={guest.id}
              className={cn(
                "relative overflow-hidden rounded-2xl border bg-card transition-colors",
                checkedIn
                  ? "border-emerald-500/25 bg-emerald-500/[0.04]"
                  : "border-border/60 active:bg-muted/40"
              )}
            >
              {checkedIn ? (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              ) : null}

              <div className="flex items-center gap-3 py-3 pl-4 pr-3">
                {/* Avatar inisial */}
                <div
                  className={cn(
                    "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                    checkedIn
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : isVipGuest
                      ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-300"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {initialsOf(guest.name)}
                  {isVipGuest ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-sm">
                      <Crown className="h-2.5 w-2.5 text-white" fill="white" />
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-bold tracking-tight text-foreground">
                      {guest.name}
                    </p>
                    {isVipGuest ? (
                      <span className="shrink-0 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-500/15 to-yellow-500/15 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-300">
                        VIP
                      </span>
                    ) : null}
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-2 truncate text-[11px] text-muted-foreground">
                    <span className="shrink-0">{guest.category_name}</span>
                    {guest.phone_number ? (
                      <span className="flex min-w-0 items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{guest.phone_number}</span>
                      </span>
                    ) : guest.instagram_username ? (
                      <span className="flex min-w-0 items-center gap-1 font-semibold text-pink-500">
                        <Instagram className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          @{guest.instagram_username}
                        </span>
                      </span>
                    ) : null}
                    {!guest.phone_number &&
                    !guest.instagram_username &&
                    guest.note ? (
                      <span className="flex min-w-0 items-center gap-1 italic">
                        <span className="truncate">· {guest.note}</span>
                      </span>
                    ) : null}
                  </p>
                </div>

                {checkedIn ? (
                  <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3.5 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCheck className="h-4 w-4" />
                    Hadir
                  </span>
                ) : isQueued(guest) ? (
                  <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-amber-500/10 px-3.5 text-[12px] font-bold text-amber-600 dark:text-amber-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Antrian
                  </span>
                ) : (
                  <button
                    onClick={() => handleBypassCheckIn(guest)}
                    disabled={checkingId !== null}
                    className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-primary px-4 text-[12px] font-bold text-primary-foreground transition-all active:scale-95 disabled:opacity-60"
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {pending ? "Memproses" : "Check-in"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <ProtectedModule requiredRole={["Super Admin", "Admin"]}>
        <div className="min-h-screen bg-background pb-24 font-sans text-foreground transition-colors duration-300">
          {/* Header */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-primary/10 bg-card/80 px-4 py-3.5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-xl transition-all">
            <Link
              href="/admin"
              aria-label="Kembali ke admin"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/5 text-primary transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[17px] font-extrabold tracking-tight text-foreground">
              Check-in Manual
            </h1>
            <div className="w-10 shrink-0" />
          </header>

          <div className="mx-auto w-full max-w-[480px] px-4 md:max-w-2xl md:px-5 lg:max-w-5xl">
            {!online ? (
              <div className="mt-4">
                <OfflineBanner queueCount={queue.length} />
              </div>
            ) : null}

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                {/* Search bar */}
                <div className="relative mt-4">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, HP, atau IG..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 rounded-2xl border-border/60 bg-card pl-11 pr-11 text-[14px] shadow-sm focus-visible:ring-primary"
                    autoFocus
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery("")}
                      aria-label="Hapus pencarian"
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-muted/70 text-muted-foreground transition-all hover:bg-muted active:scale-95"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="min-h-[360px] pt-4">
                  {renderResults()}
                </div>
              </div>

              {/* Sidebar (laptop) */}
              <aside className="hidden lg:sticky lg:top-24 lg:flex lg:h-fit flex-col gap-4">
                <div className="rounded-2xl border border-border/50 bg-card p-4">
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <ScanLine className="h-3.5 w-3.5" />
                    Mode Lain
                  </p>
                  <p className="text-[12px] leading-snug text-muted-foreground">
                    Tamu membawa QR-nya? Pindai langsung lebih cepat daripada
                    cari manual satu per satu.
                  </p>
                  <Link
                    href="/admin/guest-checkin"
                    className="mt-3 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-primary/10 px-4 text-[12px] font-bold text-primary transition-all hover:bg-primary/20 active:scale-95"
                  >
                    Buka Scan QR
                  </Link>
                </div>
              </aside>
            </div>
          </div>

          {/* RESULT OVERLAY — tiket kehadiran, konsisten dengan halaman scan QR */}
          <CheckInResultSheet
            open={resultOpen}
            status="success"
            message="Terima kasih, kehadiran tamu telah dicatat."
            at={resultAt}
            guest={resultGuest}
            vip={resolveVip(resultGuest)}
            ctaLabel="Check-in Tamu Lain"
            onClose={closeResult}
          />
        </div>
      </ProtectedModule>
    </ProtectedRoute>
  );
}
