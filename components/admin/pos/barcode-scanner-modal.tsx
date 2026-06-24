'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ScanLine, Barcode, Camera, CameraOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<{ found: boolean; message?: string }>;
}

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'processing' | 'success';

// ── Not Found dialog ────────────────────────────────────────────────────
function NotFoundDialog({
  message,
  onOk,
  onCancel,
}: {
  message: string;
  onOk: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-gray-900 text-sm mb-1">Product Not Found</h3>
          <p className="text-gray-500 text-xs leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 h-10 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onOk}
            className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main scanner modal ──────────────────────────────────────────────────
export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);
  // Guard: only process one code at a time; also prevents re-trigger on re-open
  const processingRef = useRef(false);
  // Tracks modal open timestamp to ignore scan events from before modal opened
  const openedAtRef = useRef<number>(0);

  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [notFound, setNotFound] = useState<string | null>(null); // not-found dialog message

  // ── Handle a detected code ────────────────────────────────────────────
  const handleCode = useCallback(
    async (code: string, triggeredAt?: number) => {
      // Ignore codes triggered before this modal session opened
      if (triggeredAt && triggeredAt < openedAtRef.current) return;
      if (!code.trim() || processingRef.current) return;
      processingRef.current = true;
      setScannerState('processing');

      try {
        const result = await onScan(code.trim());
        if (result.found) {
          setScannerState('success');
          // Auto-close after success feedback
          setTimeout(() => {
            stopCamera();
            onClose();
          }, 600);
        } else {
          // Show not-found dialog instead of auto-resume
          setNotFound(result.message || 'This product is not in the product list.');
          setScannerState('scanning');
          processingRef.current = false;
        }
      } catch {
        setNotFound('Something went wrong. Please try again.');
        setScannerState('scanning');
        processingRef.current = false;
      }
    },
    [onScan, onClose]
  );

  // ── ZXing attach ─────────────────────────────────────────────────────
  const attachZXing = useCallback(async () => {
    if (!videoRef.current) return;
    const capturedOpenedAt = openedAtRef.current;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');
      if (!readerRef.current) {
        const hints = new Map();
        const formats = [
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.QR_CODE
        ];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(DecodeHintType.TRY_HARDER, true);

        readerRef.current = new BrowserMultiFormatReader(hints);
      }
      readerRef.current.decodeFromVideoElement(
        videoRef.current,
        (result: any) => {
          if (result && !processingRef.current) {
            handleCode(result.getText(), capturedOpenedAt);
          }
        }
      );
    } catch (e) {
      console.warn('ZXing attach error:', e);
    }
  }, [handleCode]);

  // ── Start camera ──────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setScannerState('requesting');
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScannerState('scanning');
      await attachZXing();
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Failed to access camera. Use manual input instead.';
      setCameraError(msg);
      setScannerState('idle');
      setActiveTab('manual');
    }
  }, [attachZXing]);

  // ── Stop camera ───────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    processingRef.current = false;
    try { readerRef.current?.reset?.(); } catch {}
    readerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ── Open / close lifecycle ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Record when this session started — prevents stale scan events
      openedAtRef.current = Date.now();
      processingRef.current = false;
      setScannerState('idle');
      setCameraError('');
      setManualCode('');
      setNotFound(null);
      setActiveTab('camera');
    } else {
      stopCamera();
    }
  }, [isOpen, stopCamera]);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    }
    return () => {
      // Cleanup when tab changes
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  // ── Manual submit ─────────────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleCode(manualCode);
    setManualCode('');
  };

  const handleTabChange = (tab: 'camera' | 'manual') => {
    stopCamera();
    setScannerState('idle');
    setCameraError('');
    setNotFound(null);
    setActiveTab(tab);
  };

  // ── Not Found dialog handlers ─────────────────────────────────────────
  const handleNotFoundOk = () => {
    setNotFound(null);
    stopCamera();
    onClose();
  };
  const handleNotFoundCancel = () => {
    setNotFound(null);
    // Resume scanning
    if (activeTab === 'camera') attachZXing();
  };

  if (!isOpen) return null;

  const isScanning = scannerState === 'scanning';
  const isProcessing = scannerState === 'processing';
  const isSuccess = scannerState === 'success';
  const isRequesting = scannerState === 'requesting';

  const bracketColor = isSuccess
    ? 'border-green-400'
    : isProcessing
    ? 'border-yellow-400'
    : 'border-blue-400';

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-black">
      {/* ── Header overlay ────────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <ScanLine className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">Barcode Scanner</h2>
            <p className="text-white/50 text-[10px]">Point camera at a barcode</p>
          </div>
        </div>
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* ── Camera view ───────────────────────────────────────────────── */}
      {activeTab === 'camera' && (
        <div className="flex-1 relative overflow-hidden">
          <video
            ref={videoRef}
            className={cn('absolute inset-0 w-full h-full object-cover', isRequesting && 'opacity-0')}
            muted playsInline autoPlay
          />

          {isRequesting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
              <p className="text-white/70 text-sm">Accessing camera…</p>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <CameraOff className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-white/70 text-sm text-center leading-relaxed max-w-xs">{cameraError}</p>
              <button onClick={startCamera} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors">
                Try Again
              </button>
            </div>
          )}

          {/* Viewfinder */}
          {!cameraError && (isScanning || isProcessing || isSuccess) && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 65% 45% at 50% 45%, transparent 70%, rgba(0,0,0,0.65) 100%)' }} />
              <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '22%' }}>
                <div className="relative w-72 h-48 sm:w-80 sm:h-52">
                  {[
                    'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl',
                    'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
                    'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                    'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
                  ].map((cls, i) => (
                    <div key={i} className={cn('absolute w-9 h-9 transition-colors duration-300', cls, bracketColor)} />
                  ))}

                  {isScanning && (
                    <div
                      className="absolute left-2 right-2 h-0.5 rounded-full bg-blue-400 opacity-90"
                      style={{ boxShadow: '0 0 8px 2px rgba(96,165,250,0.7)', animation: 'posBarScan 2s ease-in-out infinite' }}
                    />
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 text-yellow-300 animate-spin" />
                      </div>
                    </div>
                  )}
                  {isSuccess && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-green-500/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 className="h-8 w-8 text-green-300" />
                      </div>
                    </div>
                  )}
                </div>
                {isScanning && (
                  <p className="absolute text-white/50 text-xs text-center" style={{ top: 'calc(50% + 130px)' }}>
                    Align barcode within the frame
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Not-found dialog */}
          {notFound && (
            <NotFoundDialog message={notFound} onOk={handleNotFoundOk} onCancel={handleNotFoundCancel} />
          )}
        </div>
      )}

      {/* ── Manual input view ────────────────────────────────────────── */}
      {activeTab === 'manual' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-36 gap-5">
          <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center">
            <Barcode className="h-10 w-10 text-blue-400" />
          </div>
          <p className="text-white/50 text-xs text-center max-w-xs">
            Type a barcode, SKU, or model number to find a product
          </p>

          {/* Not-found dialog for manual tab */}
          {notFound && (
            <NotFoundDialog message={notFound} onOk={handleNotFoundOk} onCancel={handleNotFoundCancel} />
          )}
        </div>
      )}

      {/* ── Bottom bar: tabs + manual input ──────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/95 to-transparent">
        {activeTab === 'manual' && (
          <div className="px-4 pt-2 pb-2">
            <form onSubmit={handleManualSubmit} className="flex flex-col gap-2">
              <input
                autoFocus
                type="text"
                inputMode="text"
                placeholder="Type or paste barcode / SKU…"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full h-11 px-4 bg-white/10 border border-white/20 focus:border-blue-400 focus:outline-none text-white placeholder-white/40 rounded-xl font-mono text-sm"
              />
              <button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className="h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Looking up…</>
                  : <><ScanLine className="h-4 w-4" /> Find Product</>}
              </button>
            </form>
          </div>
        )}

        {/* Camera status */}
        {activeTab === 'camera' && isSuccess && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-sm rounded-full px-4 py-2.5 text-sm font-medium text-green-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Product added to cart!
            </div>
          </div>
        )}
        {activeTab === 'camera' && isProcessing && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm rounded-full px-4 py-2.5 text-sm font-medium text-yellow-200">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              Looking up product…
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-t border-white/10 bg-black/70 backdrop-blur-sm">
          <button
            onClick={() => handleTabChange('camera')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors',
              activeTab === 'camera' ? 'text-blue-400 border-t-2 border-blue-400 -mt-px' : 'text-white/50 hover:text-white/80'
            )}
          >
            <Camera className="h-3.5 w-3.5" /> Camera
          </button>
          <button
            onClick={() => handleTabChange('manual')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors',
              activeTab === 'manual' ? 'text-blue-400 border-t-2 border-blue-400 -mt-px' : 'text-white/50 hover:text-white/80'
            )}
          >
            <Barcode className="h-3.5 w-3.5" /> Manual
          </button>
        </div>
      </div>

      <style>{`
        @keyframes posBarScan {
          0%   { top: 4px; }
          50%  { top: calc(100% - 6px); }
          100% { top: 4px; }
        }
      `}</style>
    </div>
  );
}
