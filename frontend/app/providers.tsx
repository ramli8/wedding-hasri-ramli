'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/src/lib/query-client'
import { ThemeProvider } from '@/src/presentation/components/theme-provider'
import { ToastifyWrapper } from '@/src/presentation/components/ui/toastify-wrapper'
import { NextIntlClientProvider } from 'next-intl'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useLocaleStore } from '@/src/infrastructure/stores/locale-store'
import { ReactNode, useEffect, useState } from 'react'

export function Providers({ children }: { children: ReactNode }) {
    const { locale, hasHydrated } = useLocaleStore();
    const [messages, setMessages] = useState<any>(null);
    const pathname = usePathname();
    // Undangan /wedding tidak memakai terjemahan dinamis —
    // jangan tahan render di balik splash loading locale.
    const isInvitationRoute = pathname?.startsWith('/wedding') ?? false;

    useEffect(() => {
        if (!hasHydrated) {
            useLocaleStore.persist.rehydrate();
        }
    }, [hasHydrated]);

    useEffect(() => {
        if (isInvitationRoute) return;
        // Load messages for current locale
        import(`../locales/${hasHydrated ? locale : 'id'}.json`)
            .then((msgs) => setMessages(msgs.default))
            .catch(() => setMessages({}));
    }, [locale, hasHydrated, isInvitationRoute]);

    const shouldShowLoadingScreen = !isInvitationRoute && !messages;

    const loadingScreen = (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#faf9f5] dark:bg-[#181715]">
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
                    <span className="text-2xl font-bold tracking-tight text-[#141413] dark:text-[#faf9f5]">Wedding App</span>
                    <span className="text-sm text-[#6c6a64] dark:text-[#a09d96]">Loading your experience...</span>
                </div>

                {/* Loading Bar */}
                <div className="w-48 h-1 bg-[#efe9de] dark:bg-[#252320] rounded-full overflow-hidden">
                    <div className="h-full bg-[#cc785c] rounded-full animate-loading-bar" />
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
            {!shouldShowLoadingScreen ? (
                <NextIntlClientProvider locale={hasHydrated ? locale : 'id'} messages={messages ?? {}}>
                    <QueryClientProvider client={queryClient}>
                        {children}
                        <ToastifyWrapper />
                    </QueryClientProvider>
                </NextIntlClientProvider>
            ) : loadingScreen}
        </ThemeProvider>
    )
}
