'use client'

import { useState } from 'react'
import { Input } from '@/src/presentation/components/ui/input'
import { Label } from '@/src/presentation/components/ui/label'
import { useAuth } from '@/src/application/hooks/use-auth'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify';

export function ChangePasswordForm() {
    const { changePassword, isLoading } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [formData, setFormData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const handleChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }))
    }

    const resetForm = () => {
        setFormData({
            oldPassword: '',
            newPassword: '',
            confirmPassword: '',
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
            toast.error('Semua kolom wajib diisi')
            return
        }

        if (formData.newPassword.length < 8) {
            toast.error('Kata sandi baru minimal 8 karakter')
            return
        }

        if (formData.newPassword === formData.oldPassword) {
            toast.error('Kata sandi baru harus berbeda dari yang lama')
            return
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Konfirmasi kata sandi tidak cocok')
            return
        }

        try {
            setIsSubmitting(true)
            await changePassword({
                old_password: formData.oldPassword,
                new_password: formData.newPassword,
            })
            toast.success('Kata sandi berhasil diubah! Anda akan dikeluarkan.')
            resetForm()
            // Note: User will be automatically logged out by the auth store
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Gagal mengubah kata sandi')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-card rounded-[24px] p-6 border border-border/50 shadow-sm relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 rounded-bl-full -z-10 pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <Lock className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="font-bold text-[16px] tracking-tight">Keamanan</h3>
                    <p className="text-[12px] text-muted-foreground leading-snug">Ubah kata sandi Anda</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="oldPassword" className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">Kata Sandi Saat Ini</Label>
                    <div className="relative">
                        <Input
                            id="oldPassword"
                            type={showOldPassword ? 'text' : 'password'}
                            value={formData.oldPassword}
                            onChange={handleChange('oldPassword')}
                            placeholder="Masukkan kata sandi lama"
                            required
                            disabled={isSubmitting}
                            className="h-12 rounded-xl bg-muted/50 border-transparent text-[14px] px-4 pr-12 focus-visible:ring-primary focus-visible:bg-background transition-colors"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            tabIndex={-1}
                        >
                            {showOldPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">Kata Sandi Baru</Label>
                    <div className="relative">
                        <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={formData.newPassword}
                            onChange={handleChange('newPassword')}
                            placeholder="Minimal 8 karakter"
                            required
                            minLength={8}
                            disabled={isSubmitting}
                            className="h-12 rounded-xl bg-muted/50 border-transparent text-[14px] px-4 pr-12 focus-visible:ring-primary focus-visible:bg-background transition-colors"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            tabIndex={-1}
                        >
                            {showNewPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">Konfirmasi Kata Sandi</Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            placeholder="Ketik ulang kata sandi baru"
                            required
                            disabled={isSubmitting}
                            className="h-12 rounded-xl bg-muted/50 border-transparent text-[14px] px-4 pr-12 focus-visible:ring-primary focus-visible:bg-background transition-colors"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting || isLoading}
                        className="w-full h-12 bg-destructive/10 text-destructive rounded-xl font-bold text-[13px] shadow-sm hover:bg-destructive/20 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 gap-2 cursor-pointer"
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Simpan
                    </button>
                    <p className="text-[11px] text-center text-muted-foreground/80 mt-3 px-2 leading-relaxed">
                        Anda akan dikeluarkan (*logged out*) secara otomatis setelah berhasil mengubah kata sandi demi keamanan.
                    </p>
                </div>
            </form>
        </div>
    )
}
