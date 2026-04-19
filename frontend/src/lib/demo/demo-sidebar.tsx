'use client'

import { useState } from 'react'
import {
    X, LayoutDashboard, User, Settings,
    Shield, LogOut, Users, ShieldCheck, Key, BookOpen, AlertTriangle, Beaker
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { Button } from '@/src/presentation/components/ui/button'
import { MOCK_USER } from '@/src/lib/demo/mock-data'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/src/presentation/components/ui/dropdown-menu'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

interface DemoSidebarProps {
    isOpen: boolean
    onClose: () => void
}

interface DemoMenuItem {
    label: string
    href?: string
    icon: any
    children?: DemoMenuItem[]
}

const demoMenuItems: DemoMenuItem[] = [
    {
        label: 'Home',
        href: '/demo/home',
        icon: LayoutDashboard,
    },
    {
        label: 'Documentation',
        href: '/demo/docs',
        icon: BookOpen,
    },
    {
        label: 'User Management',
        icon: Shield,
        children: [
            {
                label: 'Users',
                href: '/demo/admin/users',
                icon: Users,
            },
            {
                label: 'Roles',
                href: '/demo/admin/roles',
                icon: ShieldCheck,
            },
            {
                label: 'Permissions',
                href: '/demo/admin/permissions',
                icon: Key,
            },
        ],
    },
]

export function DemoSidebar({ isOpen, onClose }: DemoSidebarProps) {
    const user = MOCK_USER
    const pathname = usePathname()
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['User Management'])

    const getUserInitials = () => {
        if (!user?.name) return 'U'
        const names = user.name.split(' ')
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase()
        }
        return user.name.substring(0, 2).toUpperCase()
    }

    const toggleMenu = (label: string) => {
        setExpandedMenus(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        )
    }

    const isActive = (href: string) => pathname === href

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-transform duration-300 ease-in-out',
                    'lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex h-16 items-center justify-between border-b px-4">
                    <div className="flex items-center space-x-2">
                        <Image src="/gns.png" alt="GNS" className="h-8 w-8 rounded-lg dark:invert" width={8} height={8} />
                        <span className="text-xl font-bold">GNS</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Beaker className="h-3 w-3" />
                            Demo
                        </span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="lg:hidden"
                        aria-label="Close sidebar"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {demoMenuItems.map((item, index) => {
                        if (item.children) {
                            const isExpanded = expandedMenus.includes(item.label)
                            const hasActiveChild = item.children.some(c => c.href && isActive(c.href))
                            return (
                                <div key={index} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(item.label)}
                                        className={cn(
                                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                                            hasActiveChild && 'text-primary'
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="flex-1 text-left">{item.label}</span>
                                        <svg
                                            className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {isExpanded && (
                                        <div className="ml-4 space-y-1">
                                            {item.children.map((child, childIdx) => (
                                                <Link
                                                    key={childIdx}
                                                    href={child.href || '#'}
                                                    onClick={onClose}
                                                    className={cn(
                                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted',
                                                        child.href && isActive(child.href) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
                                                    )}
                                                >
                                                    <child.icon className="h-4 w-4" />
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        return (
                            <Link
                                key={index}
                                href={item.href || '#'}
                                onClick={onClose}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                                    item.href && isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer - User Profile */}
                <div className="border-t p-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex w-full items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 transition-colors hover:bg-muted">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                                    {getUserInitials()}
                                </div>
                                <div className="flex-1 overflow-hidden text-left">
                                    <p className="truncate text-sm font-medium">
                                        {user?.name || 'User Name'}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                        {user?.email || 'user@example.com'}
                                    </p>
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem asChild>
                                <a href="/demo/settings/profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <a href="/demo/settings/preference" className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <a href="/demo" className="cursor-pointer text-red-600 focus:text-red-600">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Exit Demo</span>
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>
        </>
    )
}
