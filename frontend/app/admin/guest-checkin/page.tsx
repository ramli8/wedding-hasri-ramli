'use client';

import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/src/presentation/components/layout/main-layout';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule } from '@/src/presentation/components/layout/protected-feature';
import { Button } from '@/src/presentation/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Badge } from '@/src/presentation/components/ui/badge';
import { Input } from '@/src/presentation/components/ui/input';
import { Loader2, ScanQrCode, CameraOff, CheckCircle2, XCircle, User, Clock, AlertTriangle, Power, RefreshCcw } from 'lucide-react';
import { useCheckInGuest } from '@/src/application/hooks/use-guest-query';
import { Guest, guestService } from '@/src/domain/services/guest.service';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type ViewMode = 'idle' | 'scanner' | 'result';
type ResultStatus = 'success' | 'error' | 'warning';

async function stopSafely(scanner: Html5Qrcode | null) {
    if (!scanner) return;
    try {
        if (scanner.isScanning) {
            await scanner.stop();
        }
    } catch { /* already stopped - ok */ }
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
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);
    const onScanRef = useRef<((code: string) => void) | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const checkInMutation = useCheckInGuest();

    const startScanner = async (mode: "environment" | "user" = facingMode) => {
        if (!scannerRef.current) return;

        setCameraError('');
        setCameraReady(false);

        try {
            await stopSafely(scannerRef.current);

            const onScanSuccess = (decodedText: string) => onScanRef.current?.(decodedText.trim());

            try {
                await scannerRef.current.start(
                    { facingMode: mode },
                    { fps: 30 },
                    onScanSuccess,
                    () => {}
                );
                if (mountedRef.current) setFacingMode(mode);
            } catch (fallbackError) {
                // Fallback to the other camera
                const fallbackMode = mode === "environment" ? "user" : "environment";
                await scannerRef.current.start(
                    { facingMode: fallbackMode },
                    { fps: 30 },
                    onScanSuccess,
                    () => {}
                );
                if (mountedRef.current) setFacingMode(fallbackMode);
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

    // Toggling dynamically removed to avoid html5-qrcode internal bugs. Camera is now chosen beforehand.

    const handleCheckInRequest = (code: string) => {
        checkInMutation.mutate(code, {
            onSuccess: async (data) => {
                if (!mountedRef.current) return;
                setCheckedInGuest(data.guest);
                setResultStatus('success');
                setResultMessage('Terima kasih, kehadiran Anda telah dicatat.');
                setViewMode('result');
            },
            onError: async (err: any, variables: string) => {
                if (!mountedRef.current) return;
                let message = err.response?.data?.error || err.message || 'Gagal melakukan check-in';
                
                const isAlreadyCheckedIn = message.toLowerCase().includes('already') || message.toLowerCase().includes('sudah');
                
                if (isAlreadyCheckedIn) {
                    message = 'Tamu ini sudah melakukan check-in sebelumnya.';
                    try {
                        const searchRes = await guestService.listGuests({ search: variables });
                        if (searchRes.items && searchRes.items.length > 0) {
                            setCheckedInGuest(searchRes.items[0]);
                        } else {
                            setCheckedInGuest(null);
                        }
                    } catch (e) {
                        setCheckedInGuest(null);
                    }
                } else if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('invalid')) {
                    message = 'Kode QR tidak valid atau tamu tidak ditemukan.';
                    setCheckedInGuest(null);
                } else {
                    setCheckedInGuest(null);
                }
                
                setResultStatus(isAlreadyCheckedIn ? 'warning' : 'error');
                setResultMessage(message);
                setViewMode('result');
            },
        });
    };

    useEffect(() => {
        onScanRef.current = (code: string) => {
            if (!code || checkInMutation.isPending) return;
            // Prevent multiple triggers by checking if we are already transitioning
            if (resultMessage !== '') return;
            handleCheckInRequest(code);
        };
    });

    useEffect(() => {
        mountedRef.current = true;

        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode("qr-reader", { 
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                verbose: false
            });
        }

        return () => {
            mountedRef.current = false;
            if (scannerRef.current) {
                stopSafely(scannerRef.current);
            }
        };
    }, []);

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

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (viewMode === 'result') {
            const delay = resultStatus === 'error' ? 5000 : 5000;
            timer = setTimeout(() => {
                if (mountedRef.current) {
                    setCheckedInGuest(null);
                    setResultMessage('');
                    setViewMode('scanner');
                }
            }, delay);
        }
        return () => clearTimeout(timer);
    }, [viewMode, resultStatus]);

    const handleScanAgain = () => {
        setCheckedInGuest(null);
        setResultMessage('');
        setViewMode('scanner');
    };



    return (
        <ProtectedRoute>
            <ProtectedModule requiredRole={['Super Admin', 'Admin']}>
                <div className="min-h-screen bg-background text-foreground flex flex-col relative font-sans transition-colors duration-300">
                    {/* Sticky Mobile Header */}
                    <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
                        <Link
                            href="/admin"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-foreground">
                            Pindai QR Tamu
                        </h1>
                        <div className="w-10 shrink-0" />
                    </div>

                    <div className="flex-1 flex flex-col px-6 pb-24" ref={containerRef}>
                        {/* IDLE VIEW */}
                        {viewMode === 'idle' && (
                            <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ScanQrCode className="w-10 h-10 text-primary" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-[19px] font-bold tracking-tight mb-2 text-foreground">Scan QR Tamu</h2>
                                    <p className="text-[13px] text-muted-foreground leading-snug px-4">
                                        Arahkan kamera ke kode QR undangan tamu untuk mencatat kehadiran secara otomatis.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3 w-full max-w-[280px]">
                                    <button 
                                        onClick={() => { setFacingMode('environment'); setViewMode('scanner'); }} 
                                        className="h-12 w-full bg-primary text-primary-foreground rounded-xl text-[14px] font-bold active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <ScanQrCode className="w-5 h-5" />
                                        Gunakan Kamera Belakang
                                    </button>
                                    <button 
                                        onClick={() => { setFacingMode('user'); setViewMode('scanner'); }} 
                                        className="h-12 w-full bg-primary/10 text-primary border border-primary/20 rounded-xl text-[14px] font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <User className="w-5 h-5" />
                                        Gunakan Kamera Depan
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SCANNER VIEW */}
                        <div className={viewMode === 'scanner' ? 'w-full flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-300' : 'hidden'}>
                            <div className={`relative w-full max-w-2xl mx-auto rounded-[32px] overflow-hidden bg-black border border-border/50 shadow-sm flex flex-col items-center justify-center transition-all duration-300 ${!cameraReady ? 'min-h-[300px]' : ''}`}>
                                <style>{`
                                    #qr-reader { width: 100% !important; border: none !important; background: transparent !important; }
                                    #qr-reader video { width: 100% !important; height: auto !important; display: block !important; object-fit: contain !important; }
                                    #qr-shaded-region { display: none !important; }
                                `}</style>
                                {!cameraReady && !cameraError && (
                                    <div className="absolute inset-0 flex flex-col justify-center items-center z-10 text-white">
                                        <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                        <span className="text-[13px] font-medium">Membuka kamera...</span>
                                    </div>
                                )}
                                {cameraError && (
                                    <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 bg-destructive/10 z-10">
                                        <CameraOff className="h-10 w-10 text-destructive mb-3" />
                                        <p className="text-[13px] text-destructive font-medium">{cameraError}</p>
                                    </div>
                                )}
                                <div id="qr-reader" />
                                
                                {cameraReady && (
                                    <div className="absolute inset-0 pointer-events-none z-20">
                                        <div className="absolute inset-3 md:inset-5">
                                            <div className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-white/80 rounded-tl-[1.5rem]" />
                                            <div className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-white/80 rounded-tr-[1.5rem]" />
                                            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-white/80 rounded-bl-[1.5rem]" />
                                            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-white/80 rounded-br-[1.5rem]" />
                                        </div>
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-[12px] font-medium border border-white/20 whitespace-nowrap">
                                            Arahkan QR ke dalam bingkai
                                        </div>
                                    </div>
                                )}

                                {/* LOADING OVERLAY WHEN SCANNED */}
                                {checkInMutation.isPending && (
                                    <div className="absolute inset-0 z-30 flex flex-col justify-center items-center bg-black/60 backdrop-blur-md text-white animate-in fade-in duration-200">
                                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                        <span className="text-[15px] font-bold tracking-wide">Memverifikasi Data...</span>
                                    </div>
                                )}
                            </div>
                            
                        </div>

                        {/* RESULT VIEW */}
                        {viewMode === 'result' && (
                            <div className="w-full flex-1 flex flex-col justify-center animate-in zoom-in-95 fade-in duration-300">
                                <div className="w-[90vw] max-w-[380px] min-w-[300px] mx-auto bg-card rounded-[32px] border border-border/40 shadow-xl overflow-hidden text-center flex flex-col items-center relative p-10">
                                    {/* Icon */}
                                    <div className="mb-6">
                                        {resultStatus === 'success' && <CheckCircle2 className="h-16 w-16 text-emerald-500" strokeWidth={1.5} />}
                                        {resultStatus === 'error' && <XCircle className="h-16 w-16 text-destructive" strokeWidth={1.5} />}
                                        {resultStatus === 'warning' && <AlertTriangle className="h-16 w-16 text-orange-500" strokeWidth={1.5} />}
                                    </div>
                                    
                                    {/* Title & Message */}
                                    <h3 className="text-[20px] font-semibold tracking-tight mb-2 text-foreground">
                                        {resultStatus === 'success' ? 'Check-In Berhasil' :
                                         resultStatus === 'error' ? 'Check-In Gagal' :
                                         'Sudah Check-In'}
                                    </h3>
                                    <p className="text-[14px] text-muted-foreground mb-8">
                                        {resultMessage}
                                    </p>

                                    {/* Content Block */}
                                    {checkedInGuest && (
                                        <div className="w-full flex flex-col items-center gap-4 border-t border-border/40 pt-6 mt-2">
                                            <div className="text-center w-full">
                                                <p className="text-[12px] text-muted-foreground uppercase tracking-widest font-semibold mb-2">Nama Tamu</p>
                                                <h4 className="text-[26px] sm:text-[30px] font-black tracking-tight text-foreground leading-tight">
                                                    {checkedInGuest.name}
                                                </h4>
                                            </div>
                                            
                                            <div className="w-full bg-muted/40 rounded-2xl p-4 mt-2 border border-border/50">
                                                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 text-center">Kategori Undangan</p>
                                                <div className="flex justify-center">
                                                    <span className={`px-5 py-2 font-bold rounded-full text-[15px] border ${
                                                        resultStatus === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                        resultStatus === 'error' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                        'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                                    }`}>
                                                        {checkedInGuest.category_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <style>{`
                                        @keyframes growWidth {
                                            from { width: 0%; }
                                            to { width: 100%; }
                                        }
                                        .animate-grow {
                                            animation: growWidth linear forwards;
                                        }
                                    `}</style>
                                    <div 
                                        className={`absolute bottom-0 left-0 h-[4px] animate-grow ${
                                            resultStatus === 'success' ? 'bg-emerald-500' : 
                                            resultStatus === 'error' ? 'bg-destructive' : 'bg-orange-500'
                                        }`} 
                                        style={{ animationDuration: '5s' }} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
