import { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  fps?: number;
  qrbox?: number;
  aspectRatio?: number;
}

const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 30, // High FPS for faster scanning
  qrbox = 280,
  aspectRatio = 1.0,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanning = useRef(false);

  useEffect(() => {
    const qrCodeRegionId = 'qr-reader';

    // Initialize scanner
    const initScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);

        // Optimized config for maximum speed - NO ASPECT RATIO to fill container
        const config = {
          fps: fps, // High frame rate for faster detection
          qrbox: { width: qrbox, height: qrbox },
          // Remove aspectRatio to let video fill naturally
          // Performance optimizations
          disableFlip: false, // Enable flip for better detection
          // Experimental features for better performance
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Use native barcode detector if available
          }
        };

        await scannerRef.current.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Success callback - only trigger once per scan
            if (!isScanning.current) {
              isScanning.current = true;
              onScanSuccess(decodedText);
              
              // Reset after a short delay to allow next scan
              setTimeout(() => {
                isScanning.current = false;
              }, 1000);
            }
          },
          (errorMessage) => {
            // Error callback - usually just "No QR code found"
            // We can safely ignore these
            if (onScanError && errorMessage.includes('NotFoundException') === false) {
              onScanError(errorMessage);
            }
          }
        );
      } catch (err: any) {
        console.error('Failed to start scanner:', err);
        if (onScanError) {
          onScanError(err.message || 'Failed to start camera');
        }
      }
    };

    initScanner();

    // Cleanup
    return () => {
      if (scannerRef.current) {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current
            .stop()
            .then(() => {
              scannerRef.current?.clear();
            })
            .catch((err) => {
              console.error('Error stopping scanner:', err);
            });
        }
      }
    };
  }, [onScanSuccess, onScanError, fps, qrbox, aspectRatio]);

  return (
    <div
      id="qr-reader"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#000',
      }}
    >
      <style>{`
        #qr-reader {
          position: relative !important;
          background: #000 !important;
        }
        #qr-reader__scan_region {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          background: transparent !important;
        }
        #qr-reader video {
          position: absolute !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          min-width: 150% !important;
          min-height: 150% !important;
          width: 150% !important;
          height: auto !important;
          max-width: none !important;
          max-height: none !important;
          object-fit: cover !important;
        }
        #qr-reader__dashboard_section {
          display: none !important;
        }
        #qr-reader__camera_selection {
          display: none !important;
        }
        #qr-reader canvas {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default QRScanner;
