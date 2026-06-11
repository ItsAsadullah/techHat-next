'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ScanLine, Barcode, Camera, CameraOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => Promise<{ found: boolean; message?: string }>;
}

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'processing' | 'success' | 'error';

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<any>(null);
  const isScanningRef = useRef(false);

  const [scannerState, setScannerState] = useState<ScannerState>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');

  // ── Handle a detected code ────────────────────────────────────────────
  const handleCode = useCallback(
    async (code: string) => {
      if (!code.trim()) return;
      isScanningRef.current = false;
      setScannerState('processing');
      setStatusMessage('Looking up product…');

      try {
        const result = await onScan(code.trim());
        if (result.found) {
          setScannerState('success');
          setStatusMessage(result.message || 'Product added to cart!');
          setTimeout(() => {
            stopCamera();
            onClose();
          }, 700);
        } else {
          setScannerState('error');
          setStatusMessage(result.message || 'No product found. Try scanning again.');
          // Resume scanning after 2s
          setTimeout(() => {
            setScannerState('scanning');
            setStatusMessage('');
            isScanningRef.current = true;
            attachZXing();
          }, 2000);
        }
      } catch {
        setScannerState('error');
        setStatusMessage('Error looking up product. Please try again.');
        setTimeout(() => {
          setScannerState('scanning');
          setStatusMessage('');
          isScanningRef.current = true;
          attachZXing();
        }, 2000);
      }
    },
    [onScan, onClose]
  );

  // ── Attach ZXing continuous decode ───────────────────────────────────
  const attachZXing = useCallback(async () => {
    if (!videoRef.current || !isScanningRef.current) return;
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }
      // decodeFromVideoElement fires callback on every successful decode
      readerRef.current.decodeFromVideoElement(
        videoRef.current,
        (result: any, _err: any) => {
          if (result && isScanningRef.current) {
            handleCode(result.getText());
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

      isScanningRef.current = true;
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
      setScannerState('error');
      setActiveTab('manual');
    }
  }, [attachZXing]);

  // ── Stop camera ───────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    try {
      readerRef.current?.reset?.();
    } catch {}
    readerRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // ── Lifecycle ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannerState('idle');
      setStatusMessage('');
      setCameraError('');
      setManualCode('');
      setActiveTab('camera');
    }
  }, [isOpen, stopCamera]);

  // ── Manual submit ─────────────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCode(manualCode);
    setManualCode('');
  };

  const handleTabChange = (tab: 'camera' | 'manual') => {
    stopCamera();
    setScannerState('idle');
    setStatusMessage('');
    setCameraError('');
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  const isScanning = scannerState === 'scanning';
  const isProcessing = scannerState === 'processing';
  const isSuccess = scannerState === 'success';
  const isErr = scannerState === 'error';
  const isRequesting = scannerState === 'requesting';

  const bracketColor = isSuccess
    ? 'border-green-400'
    : isProcessing
    ? 'border-yellow-400'
    : isErr && !cameraError
    ? 'border-red-400'
    : 'border-blue-400';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-safe-top py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10 shrink-0">
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

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-black/90 to-transparent">
        {/* Tab bar */}
        <div className="flex border-t border-white/10 bg-black/60 backdrop-blur-sm shrink-0">
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

        {/* Manual input panel */}
        {activeTab === 'manual' && (
          <div className="px-4 pb-4 pt-2 bg-black/80 backdrop-blur-sm">
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
              {statusMessage && (
                <p className={cn('text-xs flex items-center gap-1.5', isSuccess ? 'text-green-300' : isErr ? 'text-red-300' : 'text-yellow-300')}>
                  {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
                  {isSuccess && <CheckCircle2 className="h-3 w-3" />}
                  {isErr && <AlertCircle className="h-3 w-3" />}
                  {statusMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={isProcessing || !manualCode.trim()}
                className="h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Looking up…</> : <><ScanLine className="h-4 w-4" /> Find Product</>}
              </button>
            </form>
          </div>
        )}

        {/* Status overlay at bottom of camera view */}
        {activeTab === 'camera' && statusMessage && (
          <div className="px-4 pb-4">
            <div className={cn(
              'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium backdrop-blur-sm',
              isProcessing ? 'bg-yellow-500/20 text-yellow-200' : isSuccess ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            )}>
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
              {isSuccess && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {isErr && <AlertCircle className="h-4 w-4 shrink-0" />}
              {statusMessage}
            </div>
          </div>
        )}
      </div>

      {/* ── Camera View ────────────────────────────────────────────── */}
      {activeTab === 'camera' && (
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className={cn(
              'absolute inset-0 w-full h-full object-cover',
              (isRequesting) && 'opacity-0'
            )}
            muted
            playsInline
            autoPlay
          />

          {/* Requesting state */}
          {isRequesting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
              <p className="text-white/70 text-sm">Accessing camera…</p>
            </div>
          )}

          {/* Camera denied */}
          {isErr && cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 bg-black">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <CameraOff className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-white/70 text-sm text-center leading-relaxed max-w-xs">{cameraError}</p>
              <button
                onClick={startCamera}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Viewfinder overlay */}
          {!cameraError && (isScanning || isProcessing || isSuccess || isErr) && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Dark vignette */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse 65% 45% at 50% 45%, transparent 70%, rgba(0,0,0,0.65) 100%)'
              }} />

              {/* Viewfinder box */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ paddingBottom: '20%' }}>
                <div className="relative w-72 h-48 sm:w-80 sm:h-52">
                  {/* Corner brackets */}
                  {[
                    'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl',
                    'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
                    'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                    'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
                  ].map((cls, i) => (
                    <div key={i} className={cn('absolute w-9 h-9 transition-colors duration-300', cls, bracketColor)} />
                  ))}

                  {/* Animated scan line */}
                  {isScanning && (
                    <div
                      className={cn('absolute left-2 right-2 h-0.5 rounded-full opacity-90', 'bg-blue-400')}
                      style={{
                        boxShadow: '0 0 8px 2px rgba(96,165,250,0.7)',
                        animation: 'posBarScan 2s ease-in-out infinite',
                      }}
                    />
                  )}

                  {/* Success / error icon center */}
                  {isSuccess && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-green-500/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle2 className="h-8 w-8 text-green-300" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Hint below viewfinder */}
                {isScanning && (
                  <p className="absolute text-white/50 text-xs text-center" style={{ top: 'calc(50% + 130px)' }}>
                    Align barcode within the frame
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual tab — fullscreen */}
      {activeTab === 'manual' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-48">
          <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-4">
            <Barcode className="h-10 w-10 text-blue-400" />
          </div>
          <p className="text-white/50 text-xs text-center max-w-xs">
            Type a barcode, SKU, or model number to find a product
          </p>
        </div>
      )}

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
