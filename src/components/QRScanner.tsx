import { useEffect, useRef, useState, useContext } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import AppSettingContext from '@/providers/AppSettingProvider';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
  facingMode?: 'user' | 'environment';
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 30, // High FPS for faster scanning
  qrbox = 280,
  aspectRatio = 1.0,
  facingMode = 'environment',
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { colorPref } = useContext(AppSettingContext);

  // Dynamic color based on theme
  const getThemeColor = () => {
    const colorMap: Record<string, string> = {
      pink: '236, 72, 153',      // pink-500
      blue: '59, 130, 246',       // blue-500
      purple: '168, 85, 247',     // purple-500
      green: '34, 197, 94',       // green-500
      orange: '249, 115, 22',     // orange-500
      red: '239, 68, 68',         // red-500
    };
    return colorMap[colorPref] || '34, 197, 94'; // default green
  };

  const themeColor = getThemeColor();

  useEffect(() => {
    const qrCodeRegionId = 'qr-reader';
    let mounted = true;

    // Initialize scanner
    const startScanner = async () => {
      // If scanner instance already exists, stop it first
      if (scannerRef.current) {
        try {
          // Check if it's running
          const state = scannerRef.current.getState();
          if (
            state === Html5QrcodeScannerState.SCANNING ||
            state === Html5QrcodeScannerState.PAUSED
          ) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
          scannerRef.current = null;
        } catch (e) {
          console.warn('Error stopping previous scanner:', e);
        }
        
        // Small delay to ensure camera is fully released
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (!mounted) return;

      try {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);

        // Force square qrbox - 250x250 fixed
        const config: any = {
          fps: fps,
          qrbox: { width: 250, height: 250 },
          disableFlip: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
          showTorchButtonIfSupported: false,
          showZoomSliderIfSupported: false,
          formatsToSupport: undefined,
          aspectRatio: 1,
        };

        const cameraConfig = { facingMode: facingMode };

        await scannerRef.current.start(
          cameraConfig,
          config,
          (decodedText) => {
            // Success callback - only trigger once per scan
            if (!isScanning.current) {
              isScanning.current = true;
              setScanSuccess(true);
              onScanSuccess(decodedText);

              // Reset after a short delay to allow next scan
              setTimeout(() => {
                isScanning.current = false;
                setScanSuccess(false);
              }, 1000);
            }
          },
          (errorMessage) => {
            if (
              onScanError &&
              errorMessage.includes('NotFoundException') === false
            ) {
              onScanError(errorMessage);
            }
          }
        );

        // Aggressive cleanup - remove all black backgrounds
        setTimeout(() => {
          // Hide dashboard
          const dashboard = document.querySelector('#qr-reader__dashboard_section');
          if (dashboard) {
            (dashboard as HTMLElement).style.display = 'none';
          }

          // Remove black backgrounds from all elements
          const qrReader = document.querySelector('#qr-reader');
          if (qrReader) {
            const allElements = qrReader.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.tagName !== 'VIDEO' && htmlEl.tagName !== 'CANVAS') {
                htmlEl.style.background = 'transparent';
                htmlEl.style.backgroundColor = 'transparent';
              }
            });

            // Ensure video is positioned correctly
            const video = qrReader.querySelector('video');
            if (video) {
              (video as HTMLVideoElement).style.objectFit = 'cover';
              (video as HTMLVideoElement).style.width = '100%';
              (video as HTMLVideoElement).style.height = '100%';
            }
          }
          
          // Set mounted flag to show overlay
          setIsMounted(true);
        }, 200);
      } catch (err: any) {
        console.error('Failed to start scanner:', err);
        if (onScanError && mounted) {
          onScanError(err.message || 'Gagal mengakses kamera. Pastikan permission kamera diizinkan.');
        }
      }
    };

    startScanner();

    // Cleanup
    return () => {
      mounted = false;
      
      // Clear cleanup interval if exists
      if ((window as any).__qrCleanupInterval) {
        clearInterval((window as any).__qrCleanupInterval);
      }
      
      // Properly stop scanner on unmount or facingMode change
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
            scannerRef.current.stop().then(() => {
              if (scannerRef.current) {
                scannerRef.current.clear();
              }
            }).catch(console.error);
          }
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, [onScanSuccess, onScanError, fps, qrbox, aspectRatio, facingMode]);

  console.log('QRScanner rendering, isMounted:', isMounted);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        id="qr-reader"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      />
      
      {/* Scanning Overlay - Show after mounted */}
      {isMounted && (
        <div 
          className="qr-scanner-overlay"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '250px',
            height: '250px',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
        {/* Corner Brackets - Modern Minimalist */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '32px',
          height: '32px',
          borderTop: `3px solid rgba(${themeColor}, 0.9)`,
          borderLeft: `3px solid rgba(${themeColor}, 0.9)`,
          borderRadius: '4px 0 0 0',
          filter: `drop-shadow(0 2px 8px rgba(${themeColor}, 0.4))`,
        }}></div>
        <div style={{
          position: 'absolute',
          top: '0',
          right: '0',
          width: '32px',
          height: '32px',
          borderTop: `3px solid rgba(${themeColor}, 0.9)`,
          borderRight: `3px solid rgba(${themeColor}, 0.9)`,
          borderRadius: '0 4px 0 0',
          filter: `drop-shadow(0 2px 8px rgba(${themeColor}, 0.4))`,
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '32px',
          height: '32px',
          borderBottom: `3px solid rgba(${themeColor}, 0.9)`,
          borderLeft: `3px solid rgba(${themeColor}, 0.9)`,
          borderRadius: '0 0 0 4px',
          filter: `drop-shadow(0 2px 8px rgba(${themeColor}, 0.4))`,
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '32px',
          height: '32px',
          borderBottom: `3px solid rgba(${themeColor}, 0.9)`,
          borderRight: `3px solid rgba(${themeColor}, 0.9)`,
          borderRadius: '0 0 4px 0',
          filter: `drop-shadow(0 2px 8px rgba(${themeColor}, 0.4))`,
        }}></div>
        
        {/* Scanning Line */}
        <div style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          width: '100%',
          height: '2px',
          background: `linear-gradient(90deg, transparent 0%, rgba(${themeColor}, 0.2) 20%, rgba(${themeColor}, 1) 50%, rgba(${themeColor}, 0.2) 80%, transparent 100%)`,
          boxShadow: `0 0 15px rgba(${themeColor}, 0.8), 0 0 30px rgba(${themeColor}, 0.5)`,
          animation: 'qr-scan 2.5s ease-in-out infinite',
        }}></div>
        
        {/* Success Overlay */}
        {scanSuccess && (
          <div className="qr-success-overlay">
            <svg className="qr-success-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}
        </div>
      )}

      <style>{`
        /* Remove ALL backgrounds aggressively */
        #qr-reader,
        #qr-reader *,
        #qr-reader > div,
        #qr-reader__scan_region,
        #qr-reader__scan_region *,
        #qr-reader__scan_region > div,
        #qr-reader__scan_region > div > div,
        #qr-reader__camera_feed,
        div[id^="qr-reader"],
        div[id*="qr-reader"] {
          background: transparent !important;
          background-color: transparent !important;
          background-image: none !important;
        }

        /* Container setup */
        #qr-reader {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Video - full coverage */
        #qr-reader video,
        #qr-reader__scan_region video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
        }

        /* Canvas (QR corners overlay) */
        #qr-reader canvas,
        #qr-reader__scan_region canvas {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 2 !important;
          pointer-events: none !important;
          display: none !important;
        }

        /* Scan region positioning */
        #qr-reader__scan_region {
          width: 100% !important;
          height: 100% !important;
          position: relative !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Hide dashboard/controls */
        #qr-reader__dashboard_section,
        #qr-reader__dashboard_section_csr,
        #qr-reader__camera_selection,
        #qr-reader__header_message {
          display: none !important;
        }

        /* QR Scanner Overlay */
        .qr-scanner-overlay {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          width: 250px !important;
          height: 250px !important;
          z-index: 999 !important;
          pointer-events: none !important;
        }

        /* Corner Brackets */
        .qr-corner {
          position: absolute !important;
          width: 40px !important;
          height: 40px !important;
          border: 3px solid #fff !important;
          filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.5)) !important;
          animation: qr-pulse 2s ease-in-out infinite !important;
        }

        .qr-corner-tl {
          top: 0;
          left: 0;
          border-right: none;
          border-bottom: none;
          border-radius: 8px 0 0 0;
        }

        .qr-corner-tr {
          top: 0;
          right: 0;
          border-left: none;
          border-bottom: none;
          border-radius: 0 8px 0 0;
        }

        .qr-corner-bl {
          bottom: 0;
          left: 0;
          border-right: none;
          border-top: none;
          border-radius: 0 0 0 8px;
        }

        .qr-corner-br {
          bottom: 0;
          right: 0;
          border-left: none;
          border-top: none;
          border-radius: 0 0 8px 0;
        }

        /* Scanning Line */
        .qr-scan-line {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          height: 3px !important;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 20%,
            rgba(255, 255, 255, 0.9) 50%,
            rgba(255, 255, 255, 0.1) 80%,
            transparent 100%
          ) !important;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.8),
                      0 0 40px rgba(255, 255, 255, 0.4) !important;
          animation: qr-scan 2s linear infinite !important;
        }

        /* Success Overlay */
        .qr-success-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(16, 185, 129, 0.15);
          backdrop-filter: blur(4px);
          border-radius: 16px;
          animation: qr-success-fade 0.5s ease-out;
        }

        .qr-success-icon {
          width: 80px;
          height: 80px;
          color: #10b981;
          filter: drop-shadow(0 0 12px rgba(16, 185, 129, 0.6));
          animation: qr-success-scale 0.5s ease-out;
        }

        /* Animations */
        @keyframes qr-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        @keyframes qr-scan {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(250px);
            opacity: 0;
          }
        }

        @keyframes qr-success-fade {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes qr-success-scale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
