'use client'

import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route'
import { ProfileInfoForm } from '@/src/presentation/components/forms/profile-info-form'
import { ChangePasswordForm } from '@/src/presentation/components/forms/change-password-form'
import { useAuth } from '@/src/application/hooks/use-auth'
import { ChevronLeft, User } from 'lucide-react'

export function ProfileSettingsPage() {
    const { user } = useAuth()
    const router = useRouter()


    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background text-foreground pb-24 relative font-sans">
                {/* Header Navbar */}
                <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
                    <button 
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 text-foreground">
                        Profil Saya
                    </h1>
                    <div className="w-10 shrink-0" />
                </div>

                {/* Main Content Layout */}
                <div className="px-5 pt-6 pb-12 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Modern Profile Identity Card */}
                    <div className="bg-primary/5 border border-primary/10 rounded-[24px] p-6 flex items-start gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden">
                        {/* Decorative subtle background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-[100px] -z-0 opacity-50" />
                        
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 z-10 border border-primary/20">
                            <User className="w-5 h-5" />
                        </div>
                        
                        <div className="flex flex-col gap-1 z-10 pt-0.5">
                            <h2 className="text-[20px] font-bold tracking-tight text-foreground leading-none">
                                {user?.name || 'Tamu'}
                            </h2>
                            <p className="text-[13px] font-medium text-muted-foreground">
                                {user?.email || 'user@example.com'}
                            </p>
                            {user?.is_oauth && user?.oauth_provider && (
                                <div className="mt-2.5">
                                    <span className="inline-flex px-2.5 py-1 bg-background border border-border/50 rounded-md text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
                                        Via {user.oauth_provider}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Forms Sections */}
                    <ProfileInfoForm />

                    {/* Only show password change for non-OAuth users */}
                    {!user?.is_oauth && (
                        <ChangePasswordForm />
                    )}
                </div>
            </div>
        </ProtectedRoute>
    )
}
