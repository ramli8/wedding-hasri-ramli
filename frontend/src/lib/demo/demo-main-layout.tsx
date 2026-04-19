'use client'

import { ReactNode, useState } from 'react'
import { Navbar } from '@/src/presentation/components/layout/navbar'
import { DemoSidebar } from '@/src/lib/demo/demo-sidebar'

interface DemoMainLayoutProps {
    children: ReactNode
}

export function DemoMainLayout({ children }: DemoMainLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-background">
            <DemoSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className="lg:pl-[280px]">
                <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
                <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
