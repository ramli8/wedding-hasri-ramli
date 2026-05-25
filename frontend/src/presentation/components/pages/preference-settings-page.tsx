'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Check } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useTranslations } from '@/src/presentation/hooks/use-locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card'
import { Label } from '@/src/presentation/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/src/presentation/components/ui/radio-group'
import { Button } from '@/src/presentation/components/ui/button'
import { Separator } from '@/src/presentation/components/ui/separator'
import { toast } from 'sonner'
import { MainLayout } from '../layout/main-layout'
import { ProtectedRoute } from '../layout/protected-route'

export function PreferenceSettingsPage() {
    const t = useTranslations('settings.preferences')
    const tCommon = useTranslations('common')
    const { theme, setTheme } = useTheme()

    const [selectedTheme, setSelectedTheme] = useState(theme || 'dark')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    useEffect(() => {
        if (theme) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedTheme(theme)
        }
    }, [theme])

    const handleSave = () => {
        if (selectedTheme !== theme) {
            setTheme(selectedTheme)
        }
        toast.success(t('changesSaved'))
    }

    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-muted-foreground">{tCommon('loading')}</div>
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <MainLayout>
                <div className="space-y-6 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
                        <p className="text-muted-foreground mt-2">
                            Kelola preferensi dan pengaturan aplikasi Anda
                        </p>
                    </div>

                    <Separator />

                    {/* Theme Settings */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <CardTitle>{t('theme.title')}</CardTitle>
                                <CardDescription>{t('theme.description')}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={selectedTheme} onValueChange={setSelectedTheme}>
                                <div className="flex flex-col gap-3">
                                    <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${selectedTheme === 'light'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-foreground/20 hover:bg-muted/50'
                                        }`} onClick={() => setSelectedTheme('light')}>
                                        <RadioGroupItem value="light" id="light" />
                                        <Label htmlFor="light" className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                                            <Sun className="h-4 w-4" />
                                            {t('theme.light')}
                                        </Label>
                                        {selectedTheme === 'light' && (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        )}
                                    </div>

                                    <div className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${selectedTheme === 'dark'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-foreground/20 hover:bg-muted/50'
                                        }`} onClick={() => setSelectedTheme('dark')}>
                                        <RadioGroupItem value="dark" id="dark" />
                                        <Label htmlFor="dark" className="flex-1 cursor-pointer font-medium flex items-center gap-2">
                                            <Moon className="h-4 w-4" />
                                            {t('theme.dark')}
                                        </Label>
                                        {selectedTheme === 'dark' && (
                                            <Check className="h-5 w-5 text-emerald-500" />
                                        )}
                                    </div>
                                </div>
                            </RadioGroup>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedTheme(theme || 'dark')
                            }}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            onClick={handleSave}
                        >
                            {t('saveChanges')}
                        </Button>
                    </div>
                </div>
            </MainLayout>
        </ProtectedRoute>
    )
}
