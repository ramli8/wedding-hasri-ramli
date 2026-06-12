"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    UserCheck, 
    CalendarHeart, 
    Briefcase,
    Shield,
    Key,
    User,
    CheckCircle2,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '@/src/presentation/components/theme-toggle';
import { useAuth } from '@/src/application/hooks/use-auth';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/src/presentation/components/ui/alert-dialog';

type GridItem = {
    href?: string;
    onClick?: () => void;
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    isDestructive?: boolean;
};

export default function AdminMenuPage() {
    const router = useRouter();
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const { user, hasHydrated, logout } = useAuth();

    const modules: GridItem[] = [
        { href: '/admin/guests', icon: <Users className="w-6 h-6" />, title: 'Tamu', subtitle: 'Kelola undangan' },

        { href: '/admin/guest-checkin', icon: <UserCheck className="w-6 h-6" />, title: 'Pindai QR', subtitle: 'Check-in kamera' },
        { href: '/admin/guest-checkin-bypass', icon: <CheckCircle2 className="w-6 h-6" />, title: 'Manual', subtitle: 'Tanpa kode QR' },
        { href: '/admin/kondangan', icon: <CalendarHeart className="w-6 h-6" />, title: 'Kondangan', subtitle: 'Data amplop' },
        { href: '/admin/vendors', icon: <Briefcase className="w-6 h-6" />, title: 'Vendor', subtitle: 'Kru acara' },
    ];

    const systems: GridItem[] = [
        { href: '/admin/users', icon: <Users className="w-6 h-6" />, title: 'Pengguna', subtitle: 'Akses login' },
        { href: '/admin/roles', icon: <Shield className="w-6 h-6" />, title: 'Peran', subtitle: 'Hak pengguna' },
        { href: '/admin/permissions', icon: <Key className="w-6 h-6" />, title: 'Izin', subtitle: 'Akses modul' },
        { href: '/settings/profile', icon: <User className="w-6 h-6" />, title: 'Profil Saya', subtitle: 'Info & Sandi' },
        { onClick: () => setIsLogoutDialogOpen(true), icon: <LogOut className="w-6 h-6" />, title: 'Keluar', subtitle: 'Akhiri sesi', isDestructive: true },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground pb-32 relative font-sans transition-colors duration-300">
            {/* Header Area (Sticky & Backdrop Blur) */}
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40 px-6 pt-8 pb-4 flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.push('/settings/profile')}
                        className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-primary shrink-0 transition-transform active:scale-95 cursor-pointer"
                    >
                        <User className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                            Selamat datang 👋
                        </p>
                        <h1 className="text-[17px] font-bold tracking-tight text-foreground leading-none">
                            {hasHydrated ? (user?.name || 'Tamu') : 'Memuat...'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center">
                    <ThemeToggle />
                </div>
            </div>

            {/* Quick Actions / Main Menu */}
            <div className="px-6 mb-8">
                <h2 className="text-[14px] font-bold text-muted-foreground mb-4 tracking-wider uppercase flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-primary"></div>
                    Layanan Utama
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {modules.map((item, idx) => {
                        const content = (
                            <>
                                <div className={`w-[46px] h-[46px] rounded-full flex items-center justify-center mb-4 shrink-0 ${item.isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                    {item.icon}
                                </div>
                                <h3 className={`font-bold text-[15px] tracking-tight mb-1 ${item.isDestructive ? 'text-destructive' : 'text-foreground'}`}>
                                    {item.title}
                                </h3>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    {item.subtitle}
                                </p>
                            </>
                        );

                        const commonClasses = `bg-card rounded-[24px] p-5 flex flex-col items-start border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all cursor-pointer active:scale-95 active:bg-muted/50 ${item.isDestructive ? 'border-destructive/30 hover:border-destructive/50 hover:bg-destructive/5' : 'border-border/50 hover:border-primary/20'}`;

                        if (item.onClick) {
                            return (
                                <button key={idx} onClick={item.onClick} className={`${commonClasses} text-left w-full`}>
                                    {content}
                                </button>
                            );
                        }

                        return (
                            <Link key={idx} href={item.href!} className={commonClasses}>
                                {content}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Settings & System */}
            <div className="px-6 mb-10">
                <h2 className="text-[14px] font-bold text-muted-foreground mb-4 tracking-wider uppercase flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-4 rounded-full bg-muted-foreground/50"></div>
                    Pengaturan Sistem
                </h2>
                <div className="flex flex-col gap-3">
                    {systems.map((item, idx) => {
                        const content = (
                            <>
                                <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${item.isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/5 text-foreground'}`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className={`font-bold text-[15px] ${item.isDestructive ? 'text-destructive' : 'text-foreground'}`}>
                                        {item.title}
                                    </h3>
                                    <p className="text-[12px] text-muted-foreground">
                                        {item.subtitle}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                            </>
                        );
                        
                        const commonClasses = `bg-card p-4 rounded-2xl flex items-center gap-4 border border-border/50 shadow-sm transition-all cursor-pointer active:scale-95 active:bg-muted/50 ${item.isDestructive ? 'border-destructive/30 hover:bg-destructive/5' : 'hover:border-primary/20'}`;
                        
                        if (item.onClick) {
                            return <button key={idx} onClick={item.onClick} className={`${commonClasses} w-full`}>{content}</button>;
                        }
                        return <Link key={idx} href={item.href!} className={commonClasses}>{content}</Link>;
                    })}
                </div>
            </div>

            {/* Logout Confirmation Dialog (iOS Mobile Style) */}
            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogContent className="w-[80vw] max-w-[300px] p-0 rounded-2xl overflow-hidden gap-0 bg-background/90 backdrop-blur-xl border border-border/50 shadow-2xl">
                    <AlertDialogHeader className="p-5 pb-4 text-center">
                        <AlertDialogTitle className="text-[17px] font-semibold text-center tracking-tight">
                            Keluar dari Aplikasi?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-[13px] text-center mt-1 text-muted-foreground leading-snug">
                            Anda harus masuk kembali untuk mengakses panel admin ini.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex flex-col border-t border-border/50">
                        <AlertDialogAction 
                            onClick={() => {
                                logout();
                                router.push('/login');
                            }}
                            className="w-full h-[46px] bg-transparent hover:bg-destructive/10 text-destructive font-semibold rounded-none border-b border-border/50 transition-colors active:bg-muted"
                        >
                            Keluar
                        </AlertDialogAction>
                        <AlertDialogCancel 
                            className="w-full h-[46px] bg-transparent hover:bg-muted/50 text-foreground font-medium rounded-none border-0 m-0 transition-colors active:bg-muted"
                        >
                            Batal
                        </AlertDialogCancel>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
