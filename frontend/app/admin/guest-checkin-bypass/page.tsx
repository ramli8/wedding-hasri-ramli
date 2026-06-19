'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/src/presentation/components/layout/main-layout';
import Link from 'next/link';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule } from '@/src/presentation/components/layout/protected-feature';
import { Button } from '@/src/presentation/components/ui/button';
import { Input } from '@/src/presentation/components/ui/input';
import { Card, CardContent } from '@/src/presentation/components/ui/card';
import { Badge } from '@/src/presentation/components/ui/badge';
import {
  Loader2, User, Search, Phone, Instagram,
  CheckCheck, CheckCircle2, MapPin, StickyNote, ScanFace, ChevronLeft
} from 'lucide-react';
import { useSearchGuests, useCheckInGuestByID } from '@/src/application/hooks/use-guest-query';
import { Guest } from '@/src/domain/services/guest.service';
import { toast } from 'react-toastify';

function GuestCard({
  guest,
  onCheckIn,
  isCheckingIn,
  isCheckedIn,
}: {
  guest: Guest;
  onCheckIn: (id: string) => void;
  isCheckingIn: boolean;
  isCheckedIn: boolean;
}) {
  return (
    <div
      className={`bg-card rounded-[24px] p-4 shadow-sm border relative overflow-hidden transition-colors ${
        isCheckedIn ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/50"
      }`}
    >
      {/* Header: Category and Name */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isCheckedIn ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/10 text-primary"
            }`}>
              {isCheckedIn ? <CheckCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-foreground tracking-tight leading-none">
                {guest.name}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${isCheckedIn ? "bg-emerald-500/60" : "bg-primary/60"}`}></span>
                {guest.category_name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {isCheckedIn ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
              Hadir
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                guest.status_attending === "going"
                  ? "bg-green-500/10 text-green-600"
                  : guest.status_attending === "not_going"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary text-secondary-foreground"
              }`}
            >
              {guest.status_attending === "going"
                ? "Konfirm Hadir"
                : guest.status_attending === "not_going"
                  ? "Absen"
                  : "Menunggu"}
            </span>
          )}
        </div>
      </div>

      {/* Body: Contact and Notes in styled boxes */}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="bg-muted/30 p-3 rounded-2xl border border-border/30">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Kontak
          </p>
          <div className="flex flex-col gap-1">
            {guest.phone_number ? (
              <div className="flex items-center gap-1.5 text-[12px] text-emerald-600 font-semibold truncate">
                <Phone className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{guest.phone_number}</span>
              </div>
            ) : guest.instagram_username ? (
              <div className="flex items-center gap-1.5 text-[12px] text-pink-600 font-semibold truncate">
                <Instagram className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">@{guest.instagram_username}</span>
              </div>
            ) : (
              <span className="text-[12px] text-muted-foreground font-medium">
                -
              </span>
            )}
          </div>
        </div>

        <div className="bg-muted/30 p-3 rounded-2xl border border-border/30">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Alamat / Catatan
          </p>
          <div className="flex flex-col gap-1">
            {guest.address ? (
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground font-medium line-clamp-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span className="line-clamp-1">{guest.address}</span>
              </div>
            ) : guest.note ? (
              <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground font-medium line-clamp-1">
                <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" /> <span className="line-clamp-1 italic">{guest.note}</span>
              </div>
            ) : (
              <span className="text-[12px] text-muted-foreground font-medium">
                -
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-border/40">
        {!isCheckedIn ? (
          <button
            onClick={() => onCheckIn(guest.id)}
            disabled={isCheckingIn}
            className="w-full h-11 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isCheckingIn ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Check-In Sekarang
              </>
            )}
          </button>
        ) : (
          <div className="w-full h-11 bg-emerald-500/10 text-emerald-600 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2">
            <CheckCheck className="h-4 w-4" />
            Tamu Sudah Hadir
          </div>
        )}
      </div>
    </div>
  );
}

export default function GuestCheckInBypassPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [recentlyCheckedIn, setRecentlyCheckedIn] = useState<Record<string, boolean>>({});

  const bypassMutation = useCheckInGuestByID();
  const { data: searchResults, isLoading: isSearching } = useSearchGuests(debouncedSearch, true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleBypassCheckIn = (guestId: string) => {
    bypassMutation.mutate(guestId, {
      onSuccess: (data) => {
        setRecentlyCheckedIn(prev => ({ ...prev, [guestId]: true }));
        toast.success(`Check-in berhasil: ${data.guest.name}`);
      },
      onError: (err: any) => {
        let message = err.response?.data?.error || err.message || 'Gagal melakukan check-in';
        const isAlreadyCheckedIn = message.toLowerCase().includes('already') || message.toLowerCase().includes('sudah');
        if (isAlreadyCheckedIn) {
          message = 'Tamu ini sudah melakukan check-in sebelumnya.';
          setRecentlyCheckedIn(prev => ({ ...prev, [guestId]: true }));
          toast.warning(message);
        } else {
          toast.error(message);
        }
      },
    });
  };

  const renderResults = () => {
    if (isSearching) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary/50" />
          <p className="text-[13px] font-medium">Mencari data tamu...</p>
        </div>
      );
    }

    if (debouncedSearch.length < 2) return null;

    if (searchResults?.items?.length === 0) {
      return (
        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6 py-12">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center w-full px-4">
            <h2 className="text-[19px] font-bold tracking-tight mb-2 text-foreground">Tidak ditemukan</h2>
            <p className="text-[13px] text-muted-foreground leading-snug">
              Tidak ada tamu yang cocok dengan pencarian Anda.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{searchResults?.items?.length || 0}</span> tamu ditemukan
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {searchResults?.items?.map((guest) => (
            <GuestCard
              key={guest.id}
              guest={guest}
              onCheckIn={handleBypassCheckIn}
              isCheckingIn={bypassMutation.isPending}
              isCheckedIn={!!guest.check_in_at || !!recentlyCheckedIn[guest.id]}
            />
          ))}
        </div>
      </>
    );
  };

  return (
    <ProtectedRoute>
      <ProtectedModule requiredRole={['Super Admin', 'Admin']}>
        <div className="min-h-screen bg-background text-foreground pb-24 relative font-sans transition-colors duration-300">
          <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
            <Link
              href="/admin"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-foreground">
              Check-in Manual
            </h1>
            <div className="w-10 shrink-0" />
          </div>

          <div className="px-6">
            <p className="text-[13px] text-muted-foreground text-center mb-6 leading-snug px-2">
              Cari tamu berdasarkan nama, nomor HP, atau Instagram untuk melakukan check-in
            </p>

            {/* Search */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari nama, HP, atau IG..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 rounded-full bg-card border-border/60 shadow-sm h-12 text-[14px] focus-visible:ring-primary"
                autoFocus
              />
            </div>

            {/* Results */}
            <div className="min-h-[400px]">
              {renderResults()}
            </div>
          </div>
        </div>
      </ProtectedModule>
    </ProtectedRoute>
  );
}
