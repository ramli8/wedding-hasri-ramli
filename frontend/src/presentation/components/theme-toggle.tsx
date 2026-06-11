'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/presentation/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Prevent hydration mismatch by only rendering after mount
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className="relative w-11 h-11 bg-card border border-border/50 rounded-full flex items-center justify-center shadow-sm text-foreground opacity-50">
                <Sun className="h-5 w-5" />
            </button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative w-11 h-11 bg-card border border-border/50 rounded-full flex items-center justify-center shadow-sm text-foreground hover:bg-accent transition-colors focus:outline-none">
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/50">
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer rounded-lg">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer rounded-lg">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer rounded-lg">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
