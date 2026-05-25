'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/src/presentation/components/layout/main-layout';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule } from '@/src/presentation/components/layout/protected-feature';
import { Button } from '@/src/presentation/components/ui/button';
import { Input } from '@/src/presentation/components/ui/input';
import { Card, CardContent } from '@/src/presentation/components/ui/card';
import { Badge } from '@/src/presentation/components/ui/badge';
import {
  Loader2, User, Search, Phone, Instagram,
  CheckCheck, CheckCircle2, MapPin, StickyNote, ScanFace,
} from 'lucide-react';
import { useSearchGuests, useCheckInGuestByID } from '@/src/application/hooks/use-guest-query';
import { Guest } from '@/src/domain/services/guest.service';
import { toast } from 'sonner';

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
  const statusLabel = guest.status_attending === 'going' ? 'Hadir' : guest.status_attending === 'not_going' ? 'Tidak Hadir' : 'Menunggu';

  return (
    <div
      className={`relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
        isCheckedIn
          ? 'bg-primary/5 border-primary/20'
          : 'bg-card border-border shadow-sm hover:shadow-md hover:border-primary/30'
      }`}
    >
      {/* Top section */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isCheckedIn ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {isCheckedIn ? <CheckCheck className="h-5 w-5" /> : <User className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-base leading-tight truncate">{guest.name}</h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-[11px] h-5 px-2 font-medium">
                  {guest.category_name}
                </Badge>
                <span className={`text-[11px] font-medium ${
                  guest.status_attending === 'going' ? 'text-green-600' :
                  guest.status_attending === 'not_going' ? 'text-red-500' :
                  'text-muted-foreground'
                }`}>
                  {statusLabel}
                </span>
              </div>
            </div>
          </div>

          {isCheckedIn ? (
            <div className="inline-flex items-center gap-1.5 text-primary font-medium px-3.5 py-1.5 bg-primary/10 rounded-full border border-primary/20 shrink-0">
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="text-xs">Hadir</span>
            </div>
          ) : (
            <Button
              onClick={() => onCheckIn(guest.id)}
              disabled={isCheckingIn}
              size="sm"
              className="rounded-full shrink-0 shadow-none"
            >
              {isCheckingIn ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Check-In
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Details section */}
      <div className="px-5 py-3 bg-muted/20 border-t border-border/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="space-y-1.5">
            {guest.phone_number && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{guest.phone_number}</span>
              </div>
            )}
            {guest.instagram_username && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Instagram className="h-3.5 w-3.5 shrink-0 text-pink-500/70" />
                <span className="truncate">@{guest.instagram_username}</span>
              </div>
            )}
            {!guest.phone_number && !guest.instagram_username && (
              <span className="text-xs italic text-muted-foreground/60">Tidak ada kontak</span>
            )}
          </div>
          <div className="space-y-1.5">
            {guest.address && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{guest.address}</span>
              </div>
            )}
            {guest.note && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0 text-yellow-600/70" />
                <span className="line-clamp-2 italic">{guest.note}</span>
              </div>
            )}
          </div>
        </div>
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
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-muted bg-muted/5">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Mencari data tamu...</p>
        </div>
      );
    }

    if (debouncedSearch.length < 2) return null;

    if (searchResults?.items?.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-destructive/20 bg-destructive/5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-4">
            <User className="h-6 w-6 text-destructive/60" />
          </div>
          <p className="text-base font-medium text-destructive/80">Tidak ada tamu ditemukan</p>
          <p className="text-sm text-destructive/60 mt-1">Coba kata kunci pencarian yang lain</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        <MainLayout>
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <ScanFace strokeWidth={1.5} className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Check-In Manual</h2>
                <p className="text-sm text-muted-foreground">Cari tamu berdasarkan nama, nomor HP, atau Instagram untuk check-in manual</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ketik minimal 2 karakter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
              autoFocus
            />
          </div>

          {/* Results */}
          <div className="min-h-[400px]">
            {renderResults()}
          </div>
        </MainLayout>
      </ProtectedModule>
    </ProtectedRoute>
  );
}
