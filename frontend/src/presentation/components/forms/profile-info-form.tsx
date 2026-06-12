'use client'

import { useState } from 'react'
import { Input } from '@/src/presentation/components/ui/input'
import { Label } from '@/src/presentation/components/ui/label'
import { useAuth } from '@/src/application/hooks/use-auth'
import { Loader2, User } from 'lucide-react'
import toast from 'react-hot-toast'

export function ProfileInfoForm() {
    const { user, updateProfile, isLoading } = useAuth()
    const [name, setName] = useState(user?.name || '')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!name.trim()) {
            toast.error('Nama wajib diisi')
            return
        }

        if (name.trim().length < 2) {
            toast.error('Nama minimal 2 karakter')
            return
        }

        if (name === user?.name) {
            toast.info('Tidak ada perubahan')
            return
        }

        try {
            setIsSubmitting(true)
            await updateProfile({ name: name.trim() })
            toast.success('Profil berhasil diperbarui!')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal memperbarui profil')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-card rounded-[24px] p-6 border border-border/50 shadow-sm relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <User className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="font-bold text-[16px] tracking-tight">Informasi Pribadi</h3>
                    <p className="text-[12px] text-muted-foreground leading-snug">Ubah nama tampilan Anda</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="h-12 rounded-xl bg-muted/50 border-transparent text-[14px] px-4 opacity-70 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted-foreground/80 pl-1 mt-1">
                        Email akun Anda tidak dapat diubah
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name" className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">Nama Lengkap</Label>
                    <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama lengkap Anda"
                        required
                        minLength={2}
                        disabled={isSubmitting}
                        className="h-12 rounded-xl bg-muted/50 border-transparent text-[14px] px-4 focus-visible:ring-primary focus-visible:bg-background transition-colors"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-[13px] shadow-sm hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 gap-2 cursor-pointer"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    )
}
