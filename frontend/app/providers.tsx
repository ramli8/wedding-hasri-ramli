'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/src/lib/query-client'
import { ThemeProvider } from '@/src/presentation/components/theme-provider'
import { NextIntlClientProvider } from 'next-intl'
import Image from 'next/image'
import { useLocaleStore } from '@/src/infrastructure/stores/locale-store'
import { ReactNode, useEffect, useState } from 'react'

export function Providers({ children }: { children: ReactNode }) {
    const { locale, hasHydrated } = useLocaleStore();
    const [messages, setMessages] = useState<any>(null);

    useEffect(() => {
        if (!hasHydrated) {
            useLocaleStore.persist.rehydrate();
        }
    }, [hasHydrated]);

    useEffect(() => {
        // Load messages for current locale
        import(`../locales/${hasHydrated ? locale : 'en'}.json`)
            .then((msgs) => setMessages(msgs.default))
            .catch(() => setMessages({}));
    }, [locale, hasHydrated]);

    const loadingScreen = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f5ece4] dark:bg-[#1f1510]">
            {/* Loading Content */}
            <div className="relative flex flex-col items-center gap-6">
                {/* Animated Logo */}
                <div className="relative">
                    <div className="absolute inset-0 animate-ping opacity-10">
                        <Image src="/gns.png" alt="GNS" width={64} height={64} className="rounded dark:invert" />
                    </div>
                    <Image src="/gns.png" alt="GNS" width={64} height={64} className="rounded animate-pulse dark:invert" />
                </div>

                {/* Brand Name */}
                <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl font-bold tracking-tight text-[#3b1f14] dark:text-[#ede3da]">Wedding App</span>
                    <span className="text-sm text-[#a08070] dark:text-[#9e8a7a]">Loading your experience...</span>
                </div>

                {/* Loading Bar */}
                <div className="w-48 h-1 bg-[#ede3da] dark:bg-[#2a1c14] rounded-full overflow-hidden">
                    <div className="h-full bg-[#7a3318] dark:bg-[#b35428] rounded-full animate-loading-bar" />
                </div>
            </div>

            {/* Animation Styles */}
            <style jsx>{`
                @keyframes loading-bar {
                    0% { width: 0%; transform: translateX(0); }
                    50% { width: 70%; }
                    100% { width: 100%; transform: translateX(0); }
                }
                .animate-loading-bar {
                    animation: loading-bar 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
            {!messages ? loadingScreen : (
                <NextIntlClientProvider locale={hasHydrated ? locale : 'en'} messages={messages}>
                    <QueryClientProvider client={queryClient}>
                        {children}
                    </QueryClientProvider>
                </NextIntlClientProvider>
            )}
        </ThemeProvider>
    )
}
