"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
    Users, 
    UserCheck, 
    CalendarHeart, 
    Briefcase,
    Shield,
    Key,
    User,
    CheckCircle2,
    Bell,
    Home,
    Settings,
    LogOut,
    Grid
} from 'lucide-react';
import { ThemeToggle } from '@/src/presentation/components/theme-toggle';
import { useAuth } from '@/src/application/hooks/use-auth';

export default function AdminMenuPage() {
    const [activeTab, setActiveTab] = useState<'modules' | 'system'>('modules');
    const { user, hasHydrated } = useAuth();


    const modules = [
        { href: '/admin/guests', icon: <Users className="w-6 h-6" />, title: 'Tamu', subtitle: 'Kelola data tamu' },
        { href: '/admin/guest-categories', icon: <User className="w-6 h-6" />, title: 'Kategori', subtitle: 'Pengelompokan tamu' },
        { href: '/admin/guest-checkin', icon: <UserCheck className="w-6 h-6" />, title: 'Check-in', subtitle: 'Pindai & verifikasi' },
        { href: '/admin/guest-checkin-bypass', icon: <CheckCircle2 className="w-6 h-6" />, title: 'Bypass', subtitle: 'Check-in manual' },
        { href: '/admin/kondangan', icon: <CalendarHeart className="w-6 h-6" />, title: 'Kondangan', subtitle: 'Data hadiah & amplop' },
        { href: '/admin/vendors', icon: <Briefcase className="w-6 h-6" />, title: 'Vendor', subtitle: 'Mitra & staf' },
    ];

    const systems = [
        { href: '/admin/users', icon: <Users className="w-6 h-6" />, title: 'Pengguna', subtitle: 'Akses aplikasi' },
        { href: '/admin/roles', icon: <Shield className="w-6 h-6" />, title: 'Peran', subtitle: 'Tingkat akses' },
        { href: '/admin/permissions', icon: <Key className="w-6 h-6" />, title: 'Izin', subtitle: 'Kontrol akses' },
    ];

    const currentItems = activeTab === 'modules' ? modules : systems;

    return (
        <div className="min-h-screen bg-background text-foreground pb-32 relative font-sans transition-colors duration-300">
            {/* Header Area */}
            <div className="px-6 pt-12 pb-6 flex justify-between items-start">
                <div className="flex flex-col justify-center">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground line-clamp-1">
                        {hasHydrated ? (user?.name || 'Tamu') : 'Memuat...'}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5 capitalize">
                        {hasHydrated ? (user?.roles?.join(', ') || 'Tidak Ada Peran') : ''}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="px-6 mb-8">
                <div className="bg-card border border-border/50 rounded-full p-1.5 flex shadow-sm">
                    <button 
                        onClick={() => setActiveTab('modules')}
                        className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${activeTab === 'modules' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Modul
                    </button>
                    <button 
                        onClick={() => setActiveTab('system')}
                        className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${activeTab === 'system' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Sistem
                    </button>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="px-6 grid grid-cols-2 gap-4">
                {currentItems.map((item, idx) => (
                    <Link 
                        key={idx} 
                        href={item.href}
                        className="bg-card border border-border/40 rounded-[24px] p-5 flex flex-col items-start shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="text-primary bg-muted/50 p-3 rounded-2xl mb-4">
                            {item.icon}
                        </div>
                        <h3 className="font-semibold text-[15px] text-card-foreground mb-1">{item.title}</h3>
                        <p className="text-[12px] text-muted-foreground">{item.subtitle}</p>
                    </Link>
                ))}
            </div>


        </div>
    );
}
