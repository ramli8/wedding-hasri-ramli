'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Switch } from '@/src/presentation/components/ui/switch'

export function ThemeToggle() {
    const { theme, resolvedTheme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Prevent hydration mismatch by only rendering after mount
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center gap-2 bg-card border border-border/50 h-11 px-3.5 rounded-full opacity-50 shadow-sm">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <div className="w-9 h-5 rounded-full bg-input" />
                <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
        )
    }

    const isDark = theme === 'dark' || resolvedTheme === 'dark';

    return (
        <div className="flex items-center gap-2 bg-card border border-border/50 h-11 px-3.5 rounded-full shadow-sm transition-colors hover:bg-accent/30">
            <Sun className={`h-[16px] w-[16px] transition-colors ${!isDark ? 'text-amber-500' : 'text-muted-foreground/40'}`} />
            <Switch 
                checked={isDark} 
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} 
                className="data-[state=checked]:bg-primary"
                title="Ganti Tema"
            />
            <Moon className={`h-[16px] w-[16px] transition-colors ${isDark ? 'text-blue-500' : 'text-muted-foreground/40'}`} />
        </div>
    )
}
