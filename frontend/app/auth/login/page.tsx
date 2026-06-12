'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/application/hooks/use-auth';
import { Input } from '@/src/presentation/components/ui/input';
import { Label } from '@/src/presentation/components/ui/label';
import { Alert, AlertDescription } from '@/src/presentation/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            await login({ email, password });
            router.push('/admin'); // Redirect to admin instead of /home
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans relative flex flex-col justify-center px-6 py-12">
            {/* Background Decorations (Optional subtle touch) */}
            <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-primary/10 to-transparent -z-10 pointer-events-none" />
            
            <div className="w-full max-w-[400px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* Header Section */}
                <div className="mb-10 text-center flex flex-col items-center">
                    <h1 className="text-[32px] font-bold tracking-tight mb-2">Selamat Datang</h1>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">
                        Masuk ke akun Anda untuk mengelola buku tamu dan undangan.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-medium p-4 rounded-[16px] flex items-center gap-2">
                            <AlertDescription>{error}</AlertDescription>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground ml-1">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="anda@contoh.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-12 rounded-xl bg-muted/50 border-transparent text-[14px] px-4 focus-visible:ring-primary focus-visible:bg-background transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <Label htmlFor="password" className="text-[12px] uppercase tracking-wider font-semibold text-muted-foreground">
                                Kata Sandi
                            </Label>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            className="h-12 rounded-xl bg-muted/50 border-transparent text-[14px] px-4 focus-visible:ring-primary focus-visible:bg-background transition-colors"
                        />
                        <div className="flex justify-end pt-1">
                            <Link
                                href="/auth/forgot-password"
                                className="text-[13px] text-primary font-semibold hover:underline"
                            >
                                Lupa kata sandi?
                            </Link>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-bold text-[13px] shadow-sm hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70 gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Memasuki...</span>
                                </>
                            ) : (
                                <span>Masuk</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
