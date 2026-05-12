'use client'

import {
    X, Gauge, Tags, Contact, UserRound,
    Users, ShieldCheck, Key
} from 'lucide-react'
import { SidebarItem, SidebarMenuItem } from './sidebar-item'
import { cn } from '@/src/lib/utils'
import { Button } from '@/src/presentation/components/ui/button'
import { ThemeToggle } from '@/src/presentation/components/theme-toggle'

import Image from 'next/image'

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

const menuItems: SidebarMenuItem[] = [
    {
        label: 'Home',
        href: '/home',
        icon: Gauge,
    },
    {
        label: 'User Management',
        icon: Users,
        anyRole: ['Super Admin', 'Admin'],
        children: [
            {
                label: 'Users',
                href: '/admin/users',
                icon: Users,
                permission: 'users.read',
            },
            {
                label: 'Roles',
                href: '/admin/roles',
                icon: ShieldCheck,
                permission: 'roles.read',
            },
            {
                label: 'Permissions',
                href: '/admin/permissions',
                icon: Key,
                permission: 'permissions.read',
            },
        ],
    },
    {
        label: 'Guest Management',
        icon: Contact,
        anyRole: ['Super Admin', 'Admin'],
        children: [
            {
                label: 'Guests',
                href: '/admin/guests',
                icon: UserRound,
                permission: 'guests.read',
            },
            {
                label: 'Categories',
                href: '/admin/guest-categories',
                icon: Tags,
                permission: 'guest_categories.read',
            },
        ],
    },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {


    return (
        <>
            {/* Backdrop for mobile/tablet */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-border bg-sidebar transition-transform duration-300 ease-in-out',
                    // Mobile: slide in from left
                    'lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Sidebar Header — Brand area with primary bg */}
                <div className="flex h-16 items-center justify-between bg-[hsl(var(--sidebar-header-bg))] px-4">
                    <div className="flex items-center space-x-2">
                        <Image src="/gns.png" alt="GNS" width={32} height={32} className="h-8 w-8 rounded-lg brightness-0 invert" />
                        <span className="text-xl font-bold text-white">Wedding</span>
                    </div>

                    {/* Close button (mobile/tablet only) */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden text-white hover:bg-white/10"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    <div className="flex justify-center mb-4 mt-2">
                        <ThemeToggle />
                    </div>
                    {menuItems.map((item, index) => (
                        <SidebarItem
                            key={index}
                            item={item}
                            onNavigate={onClose}
                        />
                    ))}
                </nav>
            </aside>
        </>
    )
}
