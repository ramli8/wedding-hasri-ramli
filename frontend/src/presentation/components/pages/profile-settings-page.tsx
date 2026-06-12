'use client'

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route'
import { ProfileInfoForm } from '@/src/presentation/components/forms/profile-info-form'
import { ChangePasswordForm } from '@/src/presentation/components/forms/change-password-form'
import { useAuth } from '@/src/application/hooks/use-auth'
import { ChevronLeft } from 'lucide-react'

export function ProfileSettingsPage() {
    const { user } = useAuth()
    const router = useRouter()

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return 'U'
        const names = user.name.split(' ')
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase()
        }
        return user.name.substring(0, 2).toUpperCase()
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background text-foreground pb-24 relative font-sans">
                {/* Header Navbar */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 py-4 flex items-center justify-between">
                    <button 
                        onClick={() => router.push('/admin')}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/50 text-foreground hover:bg-muted active:scale-95 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-[17px] font-bold tracking-tight absolute left-1/2 -translate-x-1/2">
                        Pengaturan Profil
                    </h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Profile Header Area */}
                <div className="px-6 pt-8 pb-6 flex flex-col items-center border-b border-border/40 bg-card/30">
                    <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold border-4 border-background shadow-md mb-4">
                        {getUserInitials()}
                    </div>
                    <h2 className="text-[22px] font-bold tracking-tight mb-1">
                        {user?.name || 'Tamu'}
                    </h2>
                    <p className="text-[14px] text-muted-foreground">
                        {user?.email || 'user@example.com'}
                    </p>
                    {user?.is_oauth && user?.oauth_provider && (
                        <span className="mt-3 px-3 py-1 bg-muted rounded-full text-[12px] font-semibold text-muted-foreground">
                            Masuk dengan {user.oauth_provider}
                        </span>
                    )}
                </div>

                <div className="px-6 pt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Forms Sections */}
                    <div className="space-y-6">
                        <ProfileInfoForm />

                        {/* Only show password change for non-OAuth users */}
                        {!user?.is_oauth && (
                            <div className="pt-2">
                                <ChangePasswordForm />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
