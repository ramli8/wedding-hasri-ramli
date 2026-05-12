'use client';

import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/src/presentation/components/layout/main-layout';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule } from '@/src/presentation/components/layout/protected-feature';
import { Button } from '@/src/presentation/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Badge } from '@/src/presentation/components/ui/badge';
import { Input } from '@/src/presentation/components/ui/input';
import { Loader2, ScanQrCode, CameraOff, CheckCircle2, XCircle, User, Clock, AlertTriangle, Power } from 'lucide-react';
import { useCheckInGuest } from '@/src/application/hooks/use-guest-query';
import { Guest } from '@/src/domain/services/guest.service';
import { Html5Qrcode } from 'html5-qrcode';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import { Home } from 'lucide-react';

type ViewMode = 'idle' | 'scanner' | 'result';
type ResultStatus = 'success' | 'error' | 'warning';

async function stopSafely(scanner: Html5Qrcode | null) {
    if (!scanner) return;
    try { await scanner.stop(); } catch { /* already stopped - ok */ }
}

export default function GuestCheckInPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('idle');

    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState('');
    
    // Result State
    const [resultStatus, setResultStatus] = useState<ResultStatus>('success');
    const [resultMessage, setResultMessage] = useState('');
    const [checkedInGuest, setCheckedInGuest] = useState<Guest | null>(null);
    
    const [isFullscreen, setIsFullscreen] = useState(false);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);
    const onScanRef = useRef<((code: string) => void) | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const checkInMutation = useCheckInGuest();

    const startScanner = async () => {
        if (!scannerRef.current) return;

        setCameraError('');
        setCameraReady(false);

        try {
            await stopSafely(scannerRef.current);

            const onScanSuccess = (decodedText: string) => onScanRef.current?.(decodedText.trim());

            try {
                await scannerRef.current.start(
                    { facingMode: "environment" },
                    { fps: 15, qrbox: { width: 250, height: 250 } },
                    onScanSuccess,
                    () => {}
                );
            } catch (fallbackError) {
                // Fallback to front camera (user) for laptops/devices without rear camera
                await scannerRef.current.start(
                    { facingMode: "user" },
                    { fps: 15, qrbox: { width: 250, height: 250 } },
                    onScanSuccess,
                    () => {}
                );
            }

            if (mountedRef.current) {
                setCameraReady(true);
            }
        } catch (err: any) {
            if (!mountedRef.current) return;
            setCameraError(err?.message || 'Failed to start camera');
            setCameraReady(false);
        }
    };

    const handleCheckInRequest = (code: string) => {
        checkInMutation.mutate(code, {
            onSuccess: async (data) => {
                if (!mountedRef.current) return;
                setCheckedInGuest(data.guest);
                setResultStatus('success');
                setResultMessage('Terima kasih, kehadiran Anda telah dicatat.');
                setViewMode('result');
                toast.success(`Check-in berhasil: ${data.guest.name}`);
            },
            onError: async (err: any) => {
                if (!mountedRef.current) return;
                let message = err.response?.data?.error || err.message || 'Gagal melakukan check-in';
                
                const isAlreadyCheckedIn = message.toLowerCase().includes('already') || message.toLowerCase().includes('sudah');
                
                if (isAlreadyCheckedIn) {
                    message = 'Tamu ini sudah melakukan check-in sebelumnya.';
                } else if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('invalid')) {
                    message = 'Kode QR tidak valid atau tamu tidak ditemukan.';
                }
                
                setResultStatus(isAlreadyCheckedIn ? 'warning' : 'error');
                setResultMessage(message);
                setCheckedInGuest(null);
                setViewMode('result');
                
                if (isAlreadyCheckedIn) {
                    toast.warning(message);
                } else {
                    toast.error(message);
                }
            },
        });
    };

    useEffect(() => {
        mountedRef.current = true;

        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("qr-reader");
        }

        onScanRef.current = (code: string) => {
            if (code.length !== 6 || checkInMutation.isPending) return;
            // Prevent multiple triggers by checking if we are already transitioning
            if (resultMessage !== '') return;
            handleCheckInRequest(code);
        };

        return () => {
            mountedRef.current = false;
            if (scannerRef.current) {
                stopSafely(scannerRef.current);
            }
        };
    }, [checkInMutation.isPending, resultMessage]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        if (viewMode === 'scanner') {
            if (!cameraReady) {
                // Defer camera start to let React StrictMode settle and DOM remove 'hidden' classes
                timer = setTimeout(() => {
                    if (mountedRef.current) {
                        startScanner();
                    }
                }, 100);
            }
        } else {
            // Stop camera to save battery and allow clean restart when returning to scanner
            if (scannerRef.current) {
                stopSafely(scannerRef.current);
            }
            setCameraReady(false);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [viewMode, cameraReady]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleScanAgain = () => {
        setCheckedInGuest(null);
        setResultMessage('');
        setViewMode('scanner');
    };



    return (
        <ProtectedRoute>
            <ProtectedModule requiredRole={['Super Admin', 'Admin']}>
                <MainLayout>
                    <div 
                        ref={containerRef} 
                        className={`transition-all duration-300 fixed inset-0 z-[100] flex items-center justify-center p-0 overflow-hidden bg-background`}
                    >
                        {/* Background Image always shown */}
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80')] bg-cover bg-center z-0" />

                        {/* Floating Controls */}
                        <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
                            <Link href="/home" title="Dashboard">
                                <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-black/30 backdrop-blur-md text-white border-0 ring-1 ring-white/30 hover:bg-black/50 transition-all !shadow-none hover:text-white">
                                    <Home className="h-6 w-6" />
                                </Button>
                            </Link>
                            {viewMode !== 'idle' && (
                                <Button variant="ghost" size="icon" onClick={() => {
                                    setCheckedInGuest(null);
                                    setResultMessage('');
                                    setViewMode('idle');
                                }} className="h-14 w-14 rounded-2xl bg-red-500/20 backdrop-blur-md text-white border-0 ring-1 ring-red-500/50 hover:bg-red-500/40 transition-all !shadow-none hover:text-white" title="Tutup / Mode Standby">
                                    <Power className="h-6 w-6 text-red-100" />
                                </Button>
                            )}
                        </div>

                        {/* MAIN CONTENT AREA */}
                        <div className="w-full h-full max-w-none relative z-10 flex flex-col justify-center items-center">

                                    {/* IDLE VIEW */}
                                    {viewMode === 'idle' && (
                                        <div className="absolute inset-0 flex flex-col justify-end items-center pb-24 z-20">
                                            <Button 
                                                onClick={() => {
                                                    if (!document.fullscreenElement && containerRef.current?.requestFullscreen) {
                                                        containerRef.current.requestFullscreen();
                                                    }
                                                    setViewMode('scanner');
                                                }} 
                                                variant="ghost"
                                                className="h-20 px-12 text-2xl font-bold rounded-full bg-black/30 backdrop-blur-md text-white border-0 ring-1 ring-white/30 hover:bg-black/50 transition-all !shadow-none hover:text-white"
                                                size="lg"
                                            >
                                                <ScanQrCode className="mr-4 h-8 w-8" />
                                                Mulai Scan Kehadiran
                                            </Button>
                                        </div>
                                    )}

                                    {/* SCANNER VIEW */}
                                    <div className={viewMode === 'scanner' ? 'flex flex-col items-center justify-center w-full h-full animate-in fade-in zoom-in-95 duration-300' : 'hidden'}>
                                        <div className={`flex flex-col items-center justify-center w-full h-full bg-transparent p-6`}>
                                             <div className={`relative w-full mx-auto overflow-hidden !shadow-none max-w-2xl aspect-[4/3] rounded-[3rem] border-0 ring-1 ring-white/30 bg-black/30 backdrop-blur-md`}>
                                                <style>{`
                                                    #qr-reader {
                                                        position: absolute !important;
                                                        inset: 0 !important;
                                                        width: 100% !important;
                                                        height: 100% !important;
                                                        border: none !important;
                                                        outline: none !important;
                                                    }
                                                    #qr-reader > div {
                                                        width: 100% !important;
                                                        height: 100% !important;
                                                        border: none !important;
                                                    }
                                                    #qr-reader video {
                                                        width: 100% !important;
                                                        height: 100% !important;
                                                        object-fit: cover !important;
                                                    }
                                                    #qr-reader canvas {
                                                        display: none !important;
                                                    }
                                                    #qr-shaded-region {
                                                        border: none !important;
                                                        outline: none !important;
                                                        box-shadow: none !important;
                                                        stroke-width: 0 !important;
                                                    }
                                                `}</style>
                                                {!cameraReady && !cameraError && (
                                                    <div className="absolute inset-0 flex flex-col justify-center items-center z-10">
                                                        <Loader2 className={`${isFullscreen ? 'h-16 w-16' : 'h-10 w-10'} animate-spin text-white mb-6`} />
                                                        <span className={`${isFullscreen ? 'text-xl' : 'text-sm'} font-medium text-white/70 animate-pulse`}>Initializing camera...</span>
                                                    </div>
                                                )}
                                                {cameraError && (
                                                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 bg-destructive/10 z-10">
                                                        <CameraOff className="h-12 w-12 text-destructive mb-4" />
                                                        <p className="text-sm text-destructive font-medium mb-4">{cameraError}</p>
                                                    </div>
                                                )}
                                                <div id="qr-reader" />
                                                
                                                {/* Custom Viewfinder Overlay - Full Frame */}
                                                {cameraReady && (
                                                    <div className="absolute inset-0 pointer-events-none z-20">
                                                        {/* Corner brackets at the edges of the frame */}
                                                        <div className="absolute inset-4 md:inset-8">
                                                            <div className="absolute top-0 left-0 w-12 h-12 md:w-16 md:h-16 border-t-[6px] md:border-t-[8px] border-l-[6px] md:border-l-[8px] border-white/80 rounded-tl-3xl" />
                                                            <div className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 border-t-[6px] md:border-t-[8px] border-r-[6px] md:border-r-[8px] border-white/80 rounded-tr-3xl" />
                                                            <div className="absolute bottom-0 left-0 w-12 h-12 md:w-16 md:h-16 border-b-[6px] md:border-b-[8px] border-l-[6px] md:border-l-[8px] border-white/80 rounded-bl-3xl" />
                                                            <div className="absolute bottom-0 right-0 w-12 h-12 md:w-16 md:h-16 border-b-[6px] md:border-b-[8px] border-r-[6px] md:border-r-[8px] border-white/80 rounded-br-3xl" />
                                                        </div>
                                                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-2 rounded-full text-sm font-medium border border-white/20 whitespace-nowrap">
                                                            Arahkan kode QR ke dalam bingkai
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    {/* RESULT VIEW */}
                                    {viewMode === 'result' && (
                                        <div className="animate-in zoom-in-95 fade-in duration-500 ease-out w-full h-full flex items-center justify-center">
                                            
                                            <div className="flex flex-col w-full max-w-3xl bg-black/40 backdrop-blur-2xl border-0 ring-1 ring-white/30 rounded-[3rem] !shadow-none overflow-hidden">
                                                
                                                {/* Header Section (Status Indicator) */}
                                                <div className="w-full p-12 pb-10 flex flex-col items-center justify-center relative">
                                                    <div className="mb-8 animate-in zoom-in duration-500 delay-150 relative">
                                                        <div className="absolute inset-0 blur-3xl opacity-50">
                                                            {resultStatus === 'success' && <div className="w-full h-full bg-green-500 rounded-full" />}
                                                            {resultStatus === 'error' && <div className="w-full h-full bg-red-500 rounded-full" />}
                                                            {resultStatus === 'warning' && <div className="w-full h-full bg-orange-500 rounded-full" />}
                                                        </div>
                                                        {resultStatus === 'success' && <CheckCircle2 className="h-32 w-32 text-green-400 relative z-10 drop-shadow-[0_0_20px_rgba(74,222,128,1)]" />}
                                                        {resultStatus === 'error' && <XCircle className="h-32 w-32 text-red-400 relative z-10 drop-shadow-[0_0_20px_rgba(248,113,113,1)]" />}
                                                        {resultStatus === 'warning' && <AlertTriangle className="h-32 w-32 text-orange-400 relative z-10 drop-shadow-[0_0_20px_rgba(251,146,60,1)]" />}
                                                    </div>
                                                    
                                                    <h3 className="text-4xl sm:text-5xl font-bold tracking-widest text-white drop-shadow-md text-center uppercase">
                                                        {resultStatus === 'success' ? 'Check-In Berhasil' :
                                                         resultStatus === 'error' ? 'Check-In Gagal' :
                                                         'Sudah Check-In'}
                                                    </h3>
                                                    <p className="text-white/80 mt-6 text-xl sm:text-2xl text-center font-light tracking-wide">
                                                        {resultMessage}
                                                    </p>
                                                </div>

                                                {/* Guest Details Section (The "Ticket" body) */}
                                                {checkedInGuest && (
                                                    <div className="w-full p-12 bg-white/5 border-t border-white/10 flex flex-col space-y-10">
                                                        <div className="flex flex-col items-center text-center">
                                                            <p className="text-white/50 uppercase tracking-[0.3em] text-sm font-semibold mb-3">Nama Tamu</p>
                                                            <p className="text-4xl sm:text-6xl font-light text-white tracking-wide">{checkedInGuest.name}</p>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                                                            <div className="flex flex-col items-center">
                                                                <p className="text-white/50 uppercase tracking-[0.2em] text-xs font-semibold mb-3">Kategori</p>
                                                                <div className="px-6 py-2 rounded-full border-0 ring-1 ring-white/30 bg-white/10 text-white text-lg sm:text-xl font-medium tracking-wide">
                                                                    {checkedInGuest.category_name}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-center">
                                                                <p className="text-white/50 uppercase tracking-[0.2em] text-xs font-semibold mb-3">Kode VIP</p>
                                                                <div className="px-6 py-2 rounded-full border-0 ring-1 ring-white/30 bg-white/10 text-white font-mono text-lg sm:text-xl tracking-[0.2em]">
                                                                    {checkedInGuest.qr_code}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Footer */}
                                                <div className="w-full p-10 pt-6 flex justify-center bg-white/5">
                                                    <Button 
                                                        size="lg" 
                                                        variant="ghost"
                                                        className="h-20 text-2xl px-16 rounded-full bg-white/10 text-white border-0 ring-1 ring-white/30 hover:bg-white/20 transition-all w-full max-w-lg tracking-widest font-medium uppercase !shadow-none hover:text-white"
                                                        onClick={handleScanAgain}
                                                    >
                                                        Scan Tamu Berikutnya
                                                    </Button>
                                                </div>

                                            </div>

                                        </div>
                                    )}
                        </div>
                    </div>
                </MainLayout>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
