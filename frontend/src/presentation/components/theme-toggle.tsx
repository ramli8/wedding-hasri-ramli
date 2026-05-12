'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/src/lib/utils'

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Prevent hydration mismatch by only rendering after mount
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex h-9 items-center gap-1 rounded-full bg-muted/80 p-1 border border-border/50 opacity-50">
                <div className="h-7 w-7 rounded-full" />
                <div className="h-7 w-7 rounded-full" />
                <div className="h-7 w-7 rounded-full" />
            </div>
        )
    }

    return (
        <div className="flex h-9 items-center gap-1 rounded-full bg-muted/80 p-1 border border-border/50 shadow-inner">
            <button
                onClick={() => setTheme('light')}
                className={cn(
                    "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-300 ease-out",
                    theme === 'light'
                        ? "bg-[#fca55d] text-[#3b1f14] shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )}
                aria-label="Light theme"
                title="Light mode"
            >
                <Sun className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={cn(
                    "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-300 ease-out",
                    theme === 'dark'
                        ? "bg-[#fca55d] text-[#3b1f14] shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )}
                aria-label="Dark theme"
                title="Dark mode"
            >
                <Moon className="h-4 w-4" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={cn(
                    "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all duration-300 ease-out",
                    theme === 'system'
                        ? "bg-[#fca55d] text-[#3b1f14] shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                )}
                aria-label="System theme"
                title="System preference"
            >
                <Monitor className="h-4 w-4" />
            </button>
        </div>
    )
}
