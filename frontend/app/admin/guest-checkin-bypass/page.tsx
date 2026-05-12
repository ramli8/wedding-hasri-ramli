'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/src/presentation/components/layout/main-layout';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule } from '@/src/presentation/components/layout/protected-feature';
import { Button } from '@/src/presentation/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Input } from '@/src/presentation/components/ui/input';
import { Badge } from '@/src/presentation/components/ui/badge';
import { Loader2, CheckCircle2, User, Search, Phone, Instagram, CheckCheck, MapPin, StickyNote } from 'lucide-react';
import { useSearchGuests, useCheckInGuestByID } from '@/src/application/hooks/use-guest-query';
import { Guest } from '@/src/domain/services/guest.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function GuestCheckInBypassPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [recentlyCheckedIn, setRecentlyCheckedIn] = useState<Record<string, boolean>>({});

    const bypassMutation = useCheckInGuestByID();
    const { data: searchResults, isLoading: isSearching } = useSearchGuests(debouncedSearch, true);

    // Debounce search input
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

    return (
        <ProtectedRoute>
            <ProtectedModule requiredRole={['Super Admin', 'Admin']}>
                <MainLayout>
                    {/* Independent Page Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">Bypass Check-In</h2>
                                <p className="text-muted-foreground mt-1 text-base">
                                    Cari tamu berdasarkan nama, nomor HP, atau Instagram untuk check-in manual.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex flex-col space-y-6">
                                {/* Search Input */}
                                <div className="relative max-w-2xl">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                                    <Input
                                        placeholder="Ketik minimal 2 karakter..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 h-12 text-lg"
                                        autoFocus
                                    />
                                </div>

                                {/* Results List */}
                                <div className="space-y-4 min-h-[400px]">
                                    {isSearching ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-muted rounded-xl">
                                            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
                                            <p className="text-lg">Mencari data tamu...</p>
                                        </div>
                                    ) : debouncedSearch.length < 2 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-muted/10">
                                            <Search className="h-16 w-16 mb-4 opacity-20 text-primary" />
                                            <p className="text-xl font-medium">Cari Tamu</p>
                                            <p className="text-sm mt-2 max-w-md text-center opacity-70">Mulai ketik nama, nomor HP, atau username Instagram untuk menemukan data tamu.</p>
                                        </div>
                                    ) : searchResults?.items?.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-destructive/5 border-destructive/20">
                                            <User className="h-16 w-16 mb-4 opacity-20 text-destructive" />
                                            <p className="text-xl font-medium text-destructive/80">Tidak ada tamu ditemukan</p>
                                            <p className="text-sm mt-2 opacity-70 text-destructive/60">Coba kata kunci pencarian yang lain.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {searchResults?.items?.map((guest) => {
                                                const isCheckedIn = guest.check_in_at || recentlyCheckedIn[guest.id];
                                                
                                                return (
                                                    <div 
                                                        key={guest.id} 
                                                        className={`flex flex-col p-5 rounded-2xl border transition-all duration-200 ${
                                                            isCheckedIn 
                                                                ? 'bg-primary/5 border-primary/20 shadow-sm' 
                                                                : 'bg-card border-border shadow-sm hover:shadow-md hover:border-primary/30'
                                                        }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div className="flex-1 pr-4">
                                                                <h4 className="text-xl font-bold text-card-foreground leading-tight">{guest.name}</h4>
                                                                <Badge variant="secondary" className="mt-2 font-medium bg-secondary/50 text-secondary-foreground">
                                                                    {guest.category_name}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex-shrink-0">
                                                                {isCheckedIn ? (
                                                                    <div className="inline-flex items-center gap-1.5 text-primary font-medium px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                                                        <CheckCheck className="h-4 w-4" />
                                                                        <span className="text-sm">Sudah Hadir</span>
                                                                    </div>
                                                                ) : (
                                                                    <Button
                                                                        onClick={() => handleBypassCheckIn(guest.id)}
                                                                        disabled={bypassMutation.isPending}
                                                                        className="rounded-full px-6 h-10 shadow-none bg-primary/90 hover:bg-primary text-primary-foreground font-semibold"
                                                                    >
                                                                        {bypassMutation.isPending ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                                Check-In
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 mt-auto pt-4 border-t border-border/50 text-sm text-muted-foreground">
                                                            
                                                            {/* Contact Info */}
                                                            <div className="space-y-2">
                                                                {guest.phone_number && (
                                                                    <div className="flex items-center gap-2 text-foreground/80">
                                                                        <Phone className="h-4 w-4 text-primary/60" />
                                                                        <span>{guest.phone_number}</span>
                                                                    </div>
                                                                )}
                                                                {guest.instagram_username && (
                                                                    <div className="flex items-center gap-2 text-foreground/80">
                                                                        <Instagram className="h-4 w-4 text-pink-500/70" />
                                                                        <span>@{guest.instagram_username}</span>
                                                                    </div>
                                                                )}
                                                                {!guest.phone_number && !guest.instagram_username && (
                                                                    <span className="italic opacity-50 text-xs">Tidak ada kontak</span>
                                                                )}
                                                            </div>

                                                            {/* Address & Note Info */}
                                                            <div className="space-y-2">
                                                                {guest.address && (
                                                                    <div className="flex items-start gap-2 text-foreground/80">
                                                                        <MapPin className="h-4 w-4 mt-0.5 text-primary/60 flex-shrink-0" />
                                                                        <span className="line-clamp-2" title={guest.address}>{guest.address}</span>
                                                                    </div>
                                                                )}
                                                                {guest.note && (
                                                                    <div className="flex items-start gap-2 text-foreground/80">
                                                                        <StickyNote className="h-4 w-4 mt-0.5 text-yellow-600/70 flex-shrink-0" />
                                                                        <span className="line-clamp-2 italic" title={guest.note}>{guest.note}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </MainLayout>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
