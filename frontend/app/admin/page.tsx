"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    Users, 
    ScanQrCode, 
    UserCheck, 
    Gift, 
    Store,
    ShieldCheck,
    KeyRound,
    CircleUserRound,
    BookHeart,
    LogOut,
    ChevronRight,
    User
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
        { href: '/admin/guests', icon: <BookHeart className="w-6 h-6" />, title: 'Tamu', subtitle: 'Kelola undangan' },

        { href: '/admin/guest-checkin', icon: <ScanQrCode className="w-6 h-6" />, title: 'Pindai QR', subtitle: 'Check-in kamera' },
        { href: '/admin/guest-checkin-bypass', icon: <UserCheck className="w-6 h-6" />, title: 'Manual', subtitle: 'Tanpa kode QR' },
        { href: '/admin/kondangan', icon: <Gift className="w-6 h-6" />, title: 'Kondangan', subtitle: 'Data amplop' },
        { href: '/admin/vendors', icon: <Store className="w-6 h-6" />, title: 'Vendor', subtitle: 'Kru acara' },
    ];

    const systems: GridItem[] = [
        { href: '/admin/users', icon: <Users className="w-6 h-6" />, title: 'Pengguna', subtitle: 'Akses login' },
        { href: '/admin/roles', icon: <ShieldCheck className="w-6 h-6" />, title: 'Peran', subtitle: 'Hak pengguna' },
        { href: '/admin/permissions', icon: <KeyRound className="w-6 h-6" />, title: 'Izin', subtitle: 'Akses modul' },
        { href: '/settings/profile', icon: <CircleUserRound className="w-6 h-6" />, title: 'Profil Saya', subtitle: 'Info & Sandi' },
        { onClick: () => setIsLogoutDialogOpen(true), icon: <LogOut className="w-6 h-6" />, title: 'Keluar', subtitle: 'Akhiri sesi', isDestructive: true },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground pb-32 relative font-sans transition-colors duration-300">
            {/* Header Area */}
            <div className="bg-background px-5 pt-10 pb-6 flex justify-between items-start mb-2">
                <div 
                    onClick={() => router.push('/settings/profile')}
                    className="flex flex-col gap-1.5 cursor-pointer group"
                >
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground group-active:opacity-70 transition-opacity">
                        {hasHydrated ? (user?.name || 'Tamu') : 'Memuat...'}
                    </h1>
                    <div className="flex items-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest group-active:opacity-70 transition-opacity">
                            {hasHydrated ? (user?.roles?.join(', ') || 'Administrator') : '...'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center pt-1">
                    <ThemeToggle />
                </div>
            </div>

            {/* Quick Actions / Main Menu */}
            <div className="px-5 mb-8">
                <h2 className="text-[14px] font-bold text-muted-foreground mb-4 tracking-wider uppercase flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-primary"></div>
                    Layanan Utama
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    {modules.map((item, idx) => {
                        const isDestructive = item.isDestructive;

                        const content = (
                            <>
                                {/* Decorative subtle background element */}
                                <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-[60px] -z-0 opacity-50 transition-colors ${isDestructive ? 'bg-destructive/10' : 'bg-primary/10'}`} />
                                
                                <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center mb-4 shrink-0 z-10 border ${isDestructive ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                                    {item.icon}
                                </div>
                                <div className="flex flex-col z-10 w-full relative">
                                    <h3 className={`font-bold text-[15px] tracking-tight mb-1 ${isDestructive ? 'text-destructive' : 'text-foreground'}`}>
                                        {item.title}
                                    </h3>
                                    <p className="text-[12px] text-muted-foreground leading-snug">
                                        {item.subtitle}
                                    </p>
                                </div>
                            </>
                        );

                        const commonClasses = `relative overflow-hidden rounded-[24px] p-5 flex flex-col items-start border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all cursor-pointer active:scale-[0.97] ${isDestructive ? 'bg-destructive/5 border-destructive/10 hover:bg-destructive/10' : 'bg-primary/5 border-primary/10 hover:bg-primary/10'}`;

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
            <div className="px-5 mb-10">
                <h2 className="text-[14px] font-bold text-muted-foreground mb-4 tracking-wider uppercase flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-4 rounded-full bg-muted-foreground/50"></div>
                    Pengaturan Sistem
                </h2>
                <div className="flex flex-col gap-4">
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Keluar dari Aplikasi?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda harus masuk kembali untuk mengakses panel admin ini.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                logout();
                                router.push('/login');
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Keluar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
