'use client'

import { UserNav } from '@/src/presentation/components/layout/user-nav'

export function Navbar() {
    return (
        <nav className="sticky top-0 z-30 border-b bg-background">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/gns.png" alt="GNS" className="h-8 w-8 rounded-lg dark:invert" />
                    <span className="text-xl font-bold">Wedding</span>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2">
                    <UserNav />
                </div>
            </div>
        </nav>
    )
}
