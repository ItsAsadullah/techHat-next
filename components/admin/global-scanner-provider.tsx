'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useScanner, ADMIN_SCANNER_SESSION_KEY } from '@/lib/hooks/use-scanner';
import { toast } from 'sonner';

// Use an object so that scanning the same barcode twice in a row still triggers
// a fresh state change (different `t` value each time).
export interface ScanEvent {
    code: string;
    t: number; // Date.now()
}

interface GlobalScannerContextType {
    isConnected: boolean;
    scannerUrl: string;
    sessionId: string | null;
    startSession: () => void;
    stopSession: () => void;
    lastScannedCode: string | null;      // kept for convenience (simple consumers)
    lastScanEvent: ScanEvent | null;     // use this if same-code-twice matters
}

const GlobalScannerContext = createContext<GlobalScannerContextType | undefined>(undefined);

export function GlobalScannerProvider({ children }: { children: React.ReactNode }) {
    const [lastScanEvent, setLastScanEvent] = useState<ScanEvent | null>(null);

    // On every admin panel mount, deactivate any lingering session on the server.
    // This ensures the switch always starts as OFF after a page refresh — the server
    // state must match the UI default (globalThis survives hot-reloads but the UI resets).
    useEffect(() => {
        const savedId = localStorage.getItem(ADMIN_SCANNER_SESSION_KEY);
        if (savedId) {
            fetch('/api/scanner/activate', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: savedId }),
            }).catch(() => {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount only

    // This function handles where to inject the scanned code
    const handleScan = useCallback((code: string) => {
        const event: ScanEvent = { code, t: Date.now() };
        setLastScanEvent(event);

        // 1. Check for focused input first
        const activeElement = document.activeElement as HTMLElement;
        const isInput = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;

        if (isInput) {
            const input = activeElement as HTMLInputElement;
            if (!input.readOnly && !input.disabled) {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(input, code);
                } else {
                    input.value = code;
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                toast.success(`Scanned: ${code}`);
                return;
            }
        }

        // 2. data-scan-target="auto-focus" fallback
        const autoFocusTarget = document.querySelector('[data-scan-target="auto-focus"]') as HTMLInputElement | null;
        if (autoFocusTarget) {
            autoFocusTarget.focus();
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(autoFocusTarget, code);
            } else {
                autoFocusTarget.value = code;
            }
            autoFocusTarget.dispatchEvent(new Event('input', { bubbles: true }));
            toast.success(`Scanned: ${code}`);
            return;
        }

        // 3. Fallback notification — components like POSProductGrid handle it via lastScanEvent
        toast.info(`Scanned: ${code}`);
    }, []);

    const {
        sessionId,
        active,
        mobileConnected,
        scannerUrl,
        startSession,
        stopSession
    } = useScanner({
        onScan: handleScan,
        onStatusChange: (connected) => {
            if (connected) toast.success('Mobile scanner connected!');
            else if (active) toast.warning('Mobile scanner disconnected');
        }
    });

    // start/stop is controlled by the Switch toggle in the admin header ScannerStatus component.

    return (
        <GlobalScannerContext.Provider value={{
            isConnected: mobileConnected,
            scannerUrl,
            sessionId,
            startSession,
            stopSession,
            lastScannedCode: lastScanEvent?.code ?? null,
            lastScanEvent,
        }}>
            {children}
        </GlobalScannerContext.Provider>
    );
}

export function useGlobalScanner() {
    const context = useContext(GlobalScannerContext);
    if (context === undefined) {
        throw new Error('useGlobalScanner must be used within a GlobalScannerProvider');
    }
    return context;
}
