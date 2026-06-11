'use client'

import { ReactNode } from 'react'
import { Navbar } from './navbar'
import { BottomNav } from './bottom-nav'

interface MainLayoutProps {
    children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="min-h-screen bg-background pb-16">
            <Navbar />
            
            <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
                {children}
            </main>

            <BottomNav />
        </div>
    )
}
