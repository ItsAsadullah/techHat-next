'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Stable localStorage key for the admin scanner session
export const ADMIN_SCANNER_SESSION_KEY = 'th_admin_scanner_sid';

interface UseScannerOptions {
  onScan: (code: string) => void;
  onStatusChange?: (connected: boolean) => void;
}

export function useScanner({ onScan, onStatusChange }: UseScannerOptions) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [mobileConnected, setMobileConnected] = useState(false);
  const [scannerUrl, setScannerUrl] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const onScanRef = useRef(onScan);
  const onStatusChangeRef = useRef(onStatusChange);

  // Keep refs in sync
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // Accept an optional preferred session ID (e.g. restored from localStorage)
  const startSession = useCallback(async (preferredId?: string) => {
    // Reuse existing persistent session or generate new one
    const id = preferredId || localStorage.getItem(ADMIN_SCANNER_SESSION_KEY) || crypto.randomUUID();
    setSessionId(id);
    // Persist so the same session survives page navigation
    localStorage.setItem(ADMIN_SCANNER_SESSION_KEY, id);

    // Explicitly mark this session as admin-active on the server.
    // This is checked by /api/scanner/active and the mobile connect handler.
    await fetch(`/api/scanner/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: id }),
    }).catch(() => {});  // fire-and-forget

    // Build scanner URL for mobile — must use LAN IP so phone can reach it
    // Always use HTTPS so mobile camera (getUserMedia) works
    const protocol = 'https:';
    const port = window.location.port;
    let host = window.location.hostname;

    // If accessing via localhost, fetch the server's LAN IP
    if (host === 'localhost' || host === '127.0.0.1') {
      try {
        const res = await fetch('/api/scanner/ip');
        const data = await res.json();
        if (data.ip && data.ip !== 'localhost') {
          host = data.ip;
        }
      } catch {
        // Keep current hostname as fallback
      }
    }

    const origin = `${protocol}//${host}${port ? ':' + port : ''}`;
    const url = `${origin}/scanner/${id}`;
    setScannerUrl(url);

    // Connect to SSE endpoint
    const es = new EventSource(`/api/scanner/${id}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'scan' && data.code) {
          onScanRef.current(data.code);
        }

        if (data.type === 'status') {
          setMobileConnected(data.connected);
          onStatusChangeRef.current?.(data.connected);
        }

        if (data.type === 'connected') {
          // SSE connected successfully
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect
    };

    setActive(true);
  }, []);

  const stopSession = useCallback(() => {
    // Tell server to deactivate session (switch OFF) before closing SSE
    const id = sessionId;
    if (id) {
      fetch(`/api/scanner/activate`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id }),
      }).catch(() => {});
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setSessionId(null);
    setActive(false);
    setMobileConnected(false);
    setScannerUrl('');
  }, [sessionId]);

  // Cleanup on unmount — deactivate session and close SSE
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      // Also deactivate on the server so mobile can't connect after tab close
      const saved = localStorage.getItem(ADMIN_SCANNER_SESSION_KEY);
      if (saved) {
        // Use sendBeacon for reliability on page unload, fall back to fetch
        const body = JSON.stringify({ sessionId: saved });
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon('/api/scanner/deactivate', blob);
        } else {
          fetch('/api/scanner/activate', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
          }).catch(() => {});
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    sessionId,
    active,
    mobileConnected,
    scannerUrl,
    startSession,
    stopSession,
  };
}
