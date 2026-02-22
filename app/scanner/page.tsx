'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type Status = 'checking' | 'waiting' | 'ready' | 'opening' | 'error';

export default function ScannerPage() {
  const [status,    setStatus]    = useState<Status>('checking');
  const [sessionId, setSessionId] = useState('');
  const [error,     setError]     = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll /api/scanner/active every 3 seconds
  const checkSession = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/scanner/active');
      if (res.ok) {
        const { sessionId: sid } = await res.json();
        setSessionId(sid);
        setStatus('ready');
        return true;
      }
    } catch { /* ignore network errors */ }
    return false;
  }, []);

  useEffect(() => {
    // Initial check
    checkSession().then((found) => {
      if (!found) setStatus('waiting');
    });

    // Poll every 3 seconds
    pollRef.current = setInterval(async () => {
      const found = await checkSession();
      if (found && pollRef.current) {
        clearInterval(pollRef.current); // stop polling once session found
        pollRef.current = null;
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(async () => {
    if (!sessionId) return;
    setStatus('opening');
    setError('');
    // Double-check session is still active before redirecting
    try {
      const res = await fetch('/api/scanner/active');
      if (!res.ok) {
        setStatus('waiting');
        setSessionId('');
        // Restart polling
        pollRef.current = setInterval(async () => {
          const found = await checkSession();
          if (found && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }, 3000);
        return;
      }
      const { sessionId: sid } = await res.json();
      localStorage.setItem('th_scanner_sid', sid);
      window.location.href = `/scanner/${sid}`;
    } catch {
      setError('সার্ভারে কানেক্ট হতে পারেনি।');
      setStatus('ready');
    }
  }, [sessionId, checkSession]);

  /* ── helpers ─────────────────────────────────────────────────── */
  const isReady   = status === 'ready';
  const isWaiting = status === 'waiting' || status === 'checking';
  const isOpening = status === 'opening';

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(145deg, #060608 0%, #0d1117 50%, #060608 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>

      {/* Background glow */}
      <div style={{
        position: 'fixed', top: '25%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%', pointerEvents: 'none',
        background: isReady
          ? 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
        transition: 'background 1s',
      }} />

      {/* ── Card ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        background: 'rgba(13,17,23,0.92)',
        border: `1px solid ${isReady ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 28,
        padding: '44px 36px 40px',
        maxWidth: 380,
        width: '100%',
        boxShadow: isReady
          ? '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,197,94,0.06)'
          : '0 32px 80px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)',
        textAlign: 'center',
        transition: 'border-color 0.5s, box-shadow 0.5s',
      }}>

        {/* ── Icon ─────────────────────────────────────────────── */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: isReady
            ? 'linear-gradient(135deg, #16a34a, #22c55e)'
            : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: isReady
            ? '0 16px 48px rgba(34,197,94,0.4)'
            : '0 16px 48px rgba(37,99,235,0.4)',
          transition: 'background 0.5s, box-shadow 0.5s',
          position: 'relative',
        }}>
          {isReady ? (
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2H4a2 2 0 0 0-2 2v4" />
              <path d="M18 2h2a2 2 0 0 1 2 2v4" />
              <path d="M6 22H4a2 2 0 0 1-2-2v-4" />
              <path d="M18 22h2a2 2 0 0 0 2-2v-4" />
              <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.5" />
              <line x1="9" y1="9" x2="9" y2="15" />
              <line x1="12" y1="9" x2="12" y2="15" />
              <line x1="15" y1="9" x2="15" y2="15" />
            </svg>
          ) : (
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          )}

          {/* Pulse ring when waiting */}
          {isWaiting && (
            <>
              <div style={{
                position: 'absolute', inset: -8, borderRadius: '50%',
                border: '2px solid rgba(37,99,235,0.3)',
                animation: 'ring 2s ease-out infinite',
              }} />
              <div style={{
                position: 'absolute', inset: -16, borderRadius: '50%',
                border: '1.5px solid rgba(37,99,235,0.15)',
                animation: 'ring 2s ease-out infinite 0.5s',
              }} />
            </>
          )}
        </div>

        {/* ── Title ───────────────────────────────────────────── */}
        <h1 style={{
          color: '#f1f5f9',
          fontSize: '1.55rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          margin: '0 0 10px',
        }}>TechHat Scanner</h1>

        {/* ── Status pill ──────────────────────────────────────── */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 14px',
          borderRadius: 999,
          background: isReady
            ? 'rgba(34,197,94,0.1)'
            : status === 'checking'
              ? 'rgba(100,116,139,0.15)'
              : 'rgba(245,158,11,0.1)',
          border: `1px solid ${isReady ? 'rgba(34,197,94,0.3)' : status === 'checking' ? 'rgba(100,116,139,0.2)' : 'rgba(245,158,11,0.25)'}`,
          marginBottom: 24,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: isReady ? '#22c55e' : status === 'checking' ? '#64748b' : '#f59e0b',
            boxShadow: isReady ? '0 0 6px #22c55e' : 'none',
            animation: isWaiting && status !== 'checking' ? 'blink 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: '0.78rem', fontWeight: 600,
            color: isReady ? '#86efac' : status === 'checking' ? '#94a3b8' : '#fcd34d',
          }}>
            {status === 'checking' && 'সংযোগ যাচাই হচ্ছে…'}
            {status === 'waiting'  && 'সুইচ চালু হওয়ার অপেক্ষায়…'}
            {status === 'ready'    && 'সেশন প্রস্তুত!'}
            {status === 'opening'  && 'খুলছে…'}
          </span>
        </div>

        {/* ── Description ──────────────────────────────────────── */}
        <p style={{
          color: '#64748b',
          fontSize: '0.875rem',
          lineHeight: 1.7,
          margin: '0 0 32px',
        }}>
          {isReady
            ? <>সেশন পাওয়া গেছে।<br />নিচের বাটন চাপলে স্ক্যানার খুলবে।</>
            : <>এডমিন প্যানেলে <strong style={{ color: '#94a3b8' }}>Scanner</strong> সুইচ চালু করুন।<br />চালু হলে এখানে অটো দেখা যাবে।</>
          }
        </p>

        {/* ── Session ID badge (when ready) ─────────────────────── */}
        {isReady && sessionId && (
          <div style={{
            background: 'rgba(34,197,94,0.06)',
            border: '1px solid rgba(34,197,94,0.12)',
            borderRadius: 10,
            padding: '8px 14px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span style={{
              color: '#4ade80', fontSize: '0.72rem',
              fontFamily: 'monospace', letterSpacing: '0.05em',
            }}>
              {sessionId.slice(0, 8).toUpperCase()}…
            </span>
          </div>
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12, padding: '12px 16px',
            marginBottom: 20, color: '#fca5a5',
            fontSize: '0.83rem', lineHeight: 1.6,
          }}>
            {error}
          </div>
        )}

        {/* ── Connect button ────────────────────────────────────── */}
        <button
          onClick={handleConnect}
          disabled={!isReady || isOpening}
          style={{
            width: '100%',
            padding: '17px 28px',
            background: !isReady || isOpening
              ? 'rgba(30,41,59,0.8)'
              : 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            border: `1.5px solid ${!isReady || isOpening ? 'rgba(255,255,255,0.06)' : 'rgba(34,197,94,0.4)'}`,
            borderRadius: 16,
            color: !isReady || isOpening ? '#475569' : 'white',
            fontSize: '1.05rem',
            fontWeight: 700,
            letterSpacing: '0.01em',
            cursor: !isReady || isOpening ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 0.3s',
            boxShadow: !isReady || isOpening ? 'none' : '0 10px 32px rgba(34,197,94,0.35)',
          }}
        >
          {isOpening ? (
            <>
              <div style={{
                width: 20, height: 20,
                border: '2.5px solid rgba(255,255,255,0.2)',
                borderTopColor: '#22c55e',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite', flexShrink: 0,
              }} />
              <span style={{ color: '#64748b' }}>খুলছে…</span>
            </>
          ) : isWaiting ? (
            <>
              <div style={{
                width: 20, height: 20,
                border: '2px solid rgba(100,116,139,0.3)',
                borderRadius: '50%', flexShrink: 0,
              }} />
              অপেক্ষায়…
            </>
          ) : (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2H4a2 2 0 0 0-2 2v4" />
                <path d="M18 2h2a2 2 0 0 1 2 2v4" />
                <path d="M6 22H4a2 2 0 0 1-2-2v-4" />
                <path d="M18 22h2a2 2 0 0 0 2-2v-4" />
                <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.5" />
                <line x1="9" y1="9" x2="9" y2="15" />
                <line x1="12" y1="9" x2="12" y2="15" />
                <line x1="15" y1="9" x2="15" y2="15" />
              </svg>
              স্ক্যানার খুলুন
            </>
          )}
        </button>

        {/* Waiting hint */}
        {isWaiting && (
          <p style={{ color: '#334155', fontSize: '0.75rem', marginTop: 16 }}>
            প্রতি ৩ সেকেন্ডে সার্ভার চেক করা হচ্ছে…
          </p>
        )}
      </div>

      <p style={{ color: '#1a2332', fontSize: '0.72rem', marginTop: 28 }}>
        TechHat Admin — Scanner System
      </p>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes ring  { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}