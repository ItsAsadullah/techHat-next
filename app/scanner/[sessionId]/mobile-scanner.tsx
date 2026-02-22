'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────
type AppState = 'init' | 'connect' | 'scanning' | 'error';

interface PendingScan {
  id: string;
  code: string;
  scannedAt: number;
}

// ─── Constants ────────────────────────────────────────────────────────
const STORAGE_KEY = 'th_scanner_sid';
const BLOCK_MS    = 2000;   // same code <2s  → hardware glitch, silent block
const PENDING_MS  = 20000;  // same code 2–20s → pending queue (manual send)

export default function MobileScanner({ sessionId }: { sessionId: string }) {
  const [appState,    setAppState]    = useState<AppState>('init');
  const [connected,   setConnected]   = useState(false);
  const [scanning,    setScanning]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [lastScan,    setLastScan]    = useState<{ code: string; ok: boolean } | null>(null);
  const [pending,     setPending]     = useState<PendingScan[]>([]);
  const [history,     setHistory]     = useState<{ code: string; time: number }[]>([]);
  const [scanCount,   setScanCount]   = useState(0);
  const [flashOn,     setFlashOn]     = useState(false);
  const [bottomTab,   setBottomTab]   = useState<'none' | 'history' | 'pending'>('none');
  const [connecting,  setConnecting]  = useState(false);
  const [manualCode,  setManualCode]  = useState('');
  const [flashGreen,  setFlashGreen]  = useState(false);
  const [flashOrange, setFlashOrange] = useState(false);
  const [dupMsg,      setDupMsg]      = useState('');   // duplicate scan popup

  const videoRef      = useRef<HTMLVideoElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const detectorRef   = useRef<any>(null);
  const rafRef        = useRef<number>(0);
  const lastDetectRef = useRef<number>(0);
  const audioCtxRef   = useRef<AudioContext | null>(null);
  const codeTimeMap   = useRef<Map<string, number>>(new Map());

  const api = typeof window !== 'undefined'
    ? `${window.location.origin}/api/scanner/${sessionId}`
    : '';

  // ─── Audio ────────────────────────────────────────────────────────
  const beep = useCallback((freq: number, dur: number, vol = 0.12) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch { /* web audio unavailable */ }
  }, []);

  const beepSuccess = useCallback(() => {
    beep(2200, 0.07);
    setTimeout(() => beep(2800, 0.07), 80);
  }, [beep]);

  const beepWarn = useCallback(() => {
    beep(700, 0.18, 0.1);
  }, [beep]);

  // ─── Connect to server ────────────────────────────────────────────
  const connectSession = useCallback(async (): Promise<boolean | 'no_admin'> => {
    try {
      const r = await fetch(api, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'connect' }),
      });
      if (r.ok) {
        localStorage.setItem(STORAGE_KEY, sessionId);
        setConnected(true);
        return true;
      }
      // Admin switch is OFF — special 403 error
      if (r.status === 403) {
        const data = await r.json().catch(() => ({}));
        if (data.error === 'no_admin') return 'no_admin';
      }
    } catch { /* network error */ }
    return false;
  }, [api, sessionId]);

  // ─── Send barcode to desktop ──────────────────────────────────────
  const sendCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      const r = await fetch(api, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      if (r.ok) {
        beepSuccess();
        if (navigator.vibrate) navigator.vibrate([60, 25, 60]);
        setScanCount(n => n + 1);
        setHistory(h => [{ code, time: Date.now() }, ...h.slice(0, 29)]);
        setLastScan({ code, ok: true });
        setFlashGreen(true);
        setTimeout(() => setFlashGreen(false), 400);
        return true;
      }
    } catch { /* network error */ }
    setLastScan({ code, ok: false });
    return false;
  }, [api, beepSuccess]);

  // ─── Code detected from camera ────────────────────────────────────
  const onDetected = useCallback((code: string) => {
    const now     = Date.now();
    const lastAt  = codeTimeMap.current.get(code) ?? 0;
    const elapsed = now - lastAt;

    if (elapsed < BLOCK_MS && lastAt > 0) return;           // hardware double-read
    codeTimeMap.current.set(code, now);

    if (elapsed < PENDING_MS && elapsed >= BLOCK_MS && lastAt > 0) {
      beepWarn();
      if (navigator.vibrate) navigator.vibrate(200);
      setFlashOrange(true);
      setTimeout(() => setFlashOrange(false), 400);
      // Show duplicate popup
      setDupMsg(code);
      setTimeout(() => setDupMsg(''), 2500);
      setPending(p => p.find(x => x.code === code) ? p : [
        ...p,
        { id: `${now}-${Math.random().toString(36).slice(2)}`, code, scannedAt: now },
      ]);
      setBottomTab('pending');
      return;
    }

    sendCode(code);
  }, [sendCode, beepWarn]);

  // ─── Start camera ─────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return;
    setError(null);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      }
      streamRef.current = stream;

      const vid = videoRef.current;
      vid.srcObject   = stream;
      vid.muted       = true;
      vid.playsInline = true;
      vid.setAttribute('playsinline', 'true');
      try { await vid.play(); } catch { /* ignore autoplay */ }

      const track = stream.getVideoTracks()[0];
      try {
        const caps = track.getCapabilities() as any;
        if (caps.focusMode?.includes('continuous')) {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
        }
      } catch { /* ignore */ }

      setScanning(true);

      const BD = (window as any).BarcodeDetector;
      if (BD) {
        const allFormats = ['ean_13','ean_8','upc_a','upc_e','code_128','code_39','code_93','qr_code','data_matrix','pdf417','aztec','itf','codabar'];
        let formats = allFormats;
        try {
          const supported: string[] = typeof BD.getSupportedFormats === 'function' ? await BD.getSupportedFormats() : [];
          if (supported.length > 0) formats = allFormats.filter(f => supported.includes(f));
        } catch { /* ignore */ }

        detectorRef.current = new BD({ formats });

        const loop = async () => {
          const now = Date.now();
          if (now - lastDetectRef.current >= 150) {
            lastDetectRef.current = now;
            try {
              const results = await (detectorRef.current as any).detect(videoRef.current!);
              if (results.length > 0 && results[0]?.rawValue) onDetected(results[0].rawValue);
            } catch { /* frame not ready */ }
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } else {
        const { BrowserMultiFormatReader, DecodeHintType } = await import('@zxing/library');
        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new BrowserMultiFormatReader(hints, 300);
        await reader.decodeFromStream(stream, videoRef.current!, (result) => {
          if (result) onDetected(result.getText());
        });
      }
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError' ? 'ক্যামেরা পারমিশন দেওয়া হয়নি। Settings থেকে Allow করুন।'
        : err.name === 'NotFoundError'  ? 'কোনো ক্যামেরা পাওয়া যায়নি।'
        : `ক্যামেরা চালু হয়নি: ${err.message}`;
      setError(msg);
      setScanning(false);
      setAppState('error');
    }
  }, [onDetected]);

  // ─── Stop camera ──────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    detectorRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setScanning(false);
  }, []);

  // ─── Toggle flash ─────────────────────────────────────────────────
  const toggleFlash = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities() as any;
      if (caps.torch) {
        await track.applyConstraints({ advanced: [{ torch: !flashOn } as any] });
        setFlashOn(f => !f);
      }
    } catch { /* torch unsupported */ }
  }, [flashOn]);

  // ─── Connect + start camera ───────────────────────────────────────
  // NOTE: startCamera is NOT called here directly — the video element only
  // exists in the DOM after appState changes to 'scanning'. We set the state
  // first, then a useEffect fires startCamera once the <video> ref is mounted.
  const handleConnect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    const result = await connectSession();
    if (result === true) {
      setAppState('scanning'); // renders <video> element → triggers the effect below
    } else if (result === 'no_admin') {
      setError('এডমিন প্যানেলে স্ক্যানার সুইচ চালু নেই।\nএডমিন প্যানেল খুলে সুইচ চালু করুন।');
      setAppState('connect'); // stay on connect screen (not error state) so user can retry
      // Clear the cached session so next attempt checks fresh
      localStorage.removeItem(STORAGE_KEY);
    } else {
      setError('সার্ভারে কানেক্ট হতে পারেনি।\nইন্টারনেট সংযোগ চেক করুন।');
      setAppState('error');
    }
    setConnecting(false);
  }, [connectSession]);

  // ─── Send a pending scan manually ────────────────────────────────
  const sendPending = useCallback((id: string) => {
    const scan = pending.find(p => p.id === id);
    if (!scan) return;
    codeTimeMap.current.set(scan.code, Date.now());
    sendCode(scan.code);
    setPending(p => p.filter(x => x.id !== id));
  }, [pending, sendCode]);

  // ─── Clear duplicate history ──────────────────────────────────────
  const clearHistory = useCallback(() => {
    codeTimeMap.current.clear();
    setPending([]);
  }, []);

  // ─── Start camera once scanning screen is mounted ─────────────────
  useEffect(() => {
    if (appState !== 'scanning' || scanning) return;
    // 50ms delay ensures the <video> element is in the DOM after the state change
    const t = setTimeout(() => startCamera(), 50);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState]);

  // ─── Init: check localStorage ─────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === sessionId) {
      handleConnect();
    } else {
      setAppState('connect');
    }
    return () => {
      stopCamera();
      fetch(api, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'disconnect' }),
      }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Connect Screen
  // ─────────────────────────────────────────────────────────────────
  if (appState === 'init' || appState === 'connect') {
    return (
      <div style={{ position:'fixed', inset:0, background:'linear-gradient(135deg,#0a0a0f 0%,#0d1117 50%,#0a0a0f 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>

        <div style={{ position:'absolute', top:'20%', left:'50%', transform:'translateX(-50%)', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle,rgba(37,99,235,0.15) 0%,transparent 70%)', pointerEvents:'none' }} />

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:40, position:'relative', zIndex:1 }}>
          <div style={{ width:80, height:80, borderRadius:20, background:'linear-gradient(135deg,#1d4ed8,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, boxShadow:'0 20px 60px rgba(37,99,235,0.4)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75V13.5zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75V13.5zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </div>
          <h1 style={{ color:'white', fontSize:26, fontWeight:700, letterSpacing:-0.5, marginBottom:4, textAlign:'center' }}>TechHat Scanner</h1>
          <p style={{ color:'#64748b', fontSize:13, letterSpacing:2, textTransform:'uppercase' }}>Professional Barcode Scanner</p>
        </div>

        <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'10px 20px', marginBottom:32, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', animation:'pls 2s infinite' }} />
          <span style={{ color:'#94a3b8', fontSize:11, fontFamily:'monospace', letterSpacing:1 }}>
            SESSION: {sessionId.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {error && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:12, padding:16, marginBottom:24, maxWidth:340, textAlign:'center' }}>
            <p style={{ color:'#f87171', fontSize:13, lineHeight:1.6, whiteSpace:'pre-line' }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={connecting}
          style={{ background: connecting ? 'rgba(37,99,235,0.5)' : 'linear-gradient(135deg,#1d4ed8,#2563eb)', border:'none', borderRadius:16, padding:'18px 48px', color:'white', fontSize:17, fontWeight:700, cursor: connecting ? 'not-allowed' : 'pointer', boxShadow: connecting ? 'none' : '0 12px 40px rgba(37,99,235,0.5)', display:'flex', alignItems:'center', gap:10, transition:'all 0.2s', letterSpacing:0.3 }}>
          {connecting ? (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ animation:'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity={0.3} />
                <path d="M12 3a9 9 0 019 9" />
              </svg>
              কানেক্ট হচ্ছে...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
              </svg>
              স্ক্যানারে কানেক্ট করুন
            </>
          )}
        </button>

        <p style={{ color:'#475569', fontSize:12, marginTop:20, textAlign:'center', maxWidth:280, lineHeight:1.6 }}>
          ডেস্কটপে স্ক্যানার চালু থাকলে বাটনে চাপুন। একবার কানেক্ট হলে পরের বার অটোমেটিক হবে।
        </p>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pls { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        `}} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Error Screen
  // ─────────────────────────────────────────────────────────────────
  if (appState === 'error' && !scanning) {
    return (
      <div style={{ position:'fixed', inset:0, background:'#0a0a0f', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(239,68,68,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <p style={{ color:'#f87171', fontSize:15, textAlign:'center', marginBottom:8, fontWeight:600 }}>সমস্যা হয়েছে</p>
        <p style={{ color:'#64748b', fontSize:13, textAlign:'center', marginBottom:32, lineHeight:1.7, maxWidth:300, whiteSpace:'pre-line' }}>{error}</p>
        <button onClick={() => { setError(null); setAppState('connect'); }}
          style={{ background:'#2563eb', border:'none', borderRadius:14, padding:'14px 36px', color:'white', fontSize:15, fontWeight:700, cursor:'pointer' }}>
          আবার চেষ্টা করুন
        </button>
        <style dangerouslySetInnerHTML={{ __html: `* { box-sizing:border-box; }` }} />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER: Main Scanning Screen
  // ─────────────────────────────────────────────────────────────────
  const pendingCount = pending.length;

  return (
    <div style={{ position:'fixed', inset:0, background:'#000', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* TOP BAR */}
      <div style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', padding:'10px 16px', paddingTop:'max(10px, env(safe-area-inset-top, 10px))', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:30, flexShrink:0, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#1d4ed8,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            </svg>
          </div>
          <div>
            <div style={{ color:'white', fontSize:13, fontWeight:700, lineHeight:1.2 }}>TechHat Scanner</div>
            <div style={{ color:'#475569', fontSize:10, fontFamily:'monospace' }}>{sessionId.slice(0, 10)}</div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {scanCount > 0 && (
            <div style={{ background:'rgba(37,99,235,0.2)', border:'1px solid rgba(37,99,235,0.4)', borderRadius:20, padding:'2px 10px' }}>
              <span style={{ color:'#60a5fa', fontSize:11, fontWeight:700 }}>{scanCount} scanned</span>
            </div>
          )}
          {pendingCount > 0 && (
            <button onClick={() => setBottomTab(t => t === 'pending' ? 'none' : 'pending')}
              style={{ background:'rgba(251,146,60,0.2)', border:'1px solid rgba(251,146,60,0.4)', borderRadius:20, padding:'2px 10px', cursor:'pointer' }}>
              <span style={{ color:'#fb923c', fontSize:11, fontWeight:700 }}>⏸ {pendingCount}</span>
            </button>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:5, background: connected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border:`1px solid ${connected ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius:20, padding:'3px 10px' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background: connected ? '#22c55e' : '#ef4444', animation:'pls 2s infinite' }} />
            <span style={{ color: connected ? '#4ade80' : '#f87171', fontSize:11, fontWeight:600 }}>{connected ? 'Live' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* CAMERA AREA */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <video ref={videoRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} playsInline muted autoPlay />

        {/* Success / warning flash */}
        {flashGreen  && <div style={{ position:'absolute', inset:0, background:'rgba(34,197,94,0.35)',   zIndex:20, pointerEvents:'none' }} />}
        {flashOrange && <div style={{ position:'absolute', inset:0, background:'rgba(251,146,60,0.35)', zIndex:20, pointerEvents:'none' }} />}
        {/* Duplicate scan popup */}
        {dupMsg && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(245,158,11,0.94)',
            borderRadius: 18,
            padding: '18px 28px',
            zIndex: 50,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            minWidth: 240,
            pointerEvents: 'none',
          }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, margin: 0, letterSpacing: 0.3 }}>
              ⚠️ ইতিমধ্যে স্ক্যান হয়েছে
            </p>
            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 8, fontFamily: 'monospace', margin: '8px 0 0', wordBreak: 'break-all' }}>
              {dupMsg}
            </p>
          </div>
        )}

        {/* Scanning overlay */}
        {scanning && (
          <div style={{ position:'absolute', inset:0, zIndex:10, pointerEvents:'none' }}>
            <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} />
            {/* Viewfinder */}
            <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-58%)', width:'72%', maxWidth:280, aspectRatio:'1/0.65', background:'transparent', boxShadow:'0 0 0 9999px rgba(0,0,0,0.4)', borderRadius:8 }}>
              {(['top','bottom'] as const).flatMap(v => (['left','right'] as const).map(h => (
                <div key={`${v}-${h}`} style={{ position:'absolute', [v]:-2, [h]:-2, width:22, height:22, borderTop: v==='top' ? '3px solid #22c55e' : 'none', borderBottom: v==='bottom' ? '3px solid #22c55e' : 'none', borderLeft: h==='left' ? '3px solid #22c55e' : 'none', borderRight: h==='right' ? '3px solid #22c55e' : 'none', borderRadius: h==='left'&&v==='top'?'4px 0 0 0':h==='right'&&v==='top'?'0 4px 0 0':h==='left'?'0 0 0 4px':'0 0 4px 0' }} />
              )))}
              <div style={{ position:'absolute', left:8, right:8, height:2, background:'linear-gradient(90deg,transparent,#ef4444,#f97316,#ef4444,transparent)', borderRadius:1, animation:'scan 2.5s ease-in-out infinite', boxShadow:'0 0 8px rgba(239,68,68,0.8)' }} />
            </div>
            <div style={{ position:'absolute', bottom:'30%', left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', borderRadius:20, padding:'5px 16px' }}>
              <span style={{ color:'#94a3b8', fontSize:12 }}>বারকোড ফ্রেমের মধ্যে রাখুন</span>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!scanning && !error && (
          <div style={{ position:'absolute', inset:0, background:'#0a0a0f', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:10 }}>
            <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(37,99,235,0.15)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, animation:'pls 2s infinite' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574v9.176A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <p style={{ color:'#64748b', fontSize:14 }}>ক্যামেরা চালু হচ্ছে...</p>
          </div>
        )}

        {/* Camera controls floating */}
        {scanning && (
          <div style={{ position:'absolute', right:14, bottom:14, display:'flex', flexDirection:'column', gap:10, zIndex:15 }}>
            <button onClick={toggleFlash} style={{ width:44, height:44, borderRadius:'50%', background: flashOn ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.12)', border: flashOn ? '1.5px solid rgba(251,191,36,0.6)' : '1.5px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={flashOn ? '#fbbf24' : 'white'} strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </button>
            <button onClick={clearHistory} title="Duplicate history reset" style={{ width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'1.5px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM PANEL */}
      <div style={{ background:'rgba(5,5,15,0.97)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.08)', zIndex:30, flexShrink:0, paddingBottom:'max(12px, env(safe-area-inset-bottom, 12px))' }}>

        {/* Last scan result */}
        {lastScan && (
          <div style={{ margin:'10px 12px 0', background: lastScan.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border:`1px solid ${lastScan.ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius:12, padding:'9px 14px', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, background: lastScan.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {lastScan.ok
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              }
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'white', fontSize:14, fontFamily:'monospace', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lastScan.code}</div>
              <div style={{ color: lastScan.ok ? '#4ade80' : '#f87171', fontSize:10, marginTop:1 }}>{lastScan.ok ? '✓ Desktop-এ পাঠানো হয়েছে' : '✗ পাঠাতে ব্যর্থ'}</div>
            </div>
          </div>
        )}

        {/* Pending scans */}
        {pendingCount > 0 && bottomTab === 'pending' && (
          <div style={{ margin:'8px 12px 0' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ color:'#fb923c', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>⏸ Pending ({pendingCount})</span>
              <button onClick={() => setPending([])} style={{ background:'none', border:'none', color:'#64748b', fontSize:10, cursor:'pointer', padding:'2px 6px' }}>সব বাতিল</button>
            </div>
            <div style={{ maxHeight:140, overflowY:'auto', display:'flex', flexDirection:'column', gap:4 }}>
              {pending.map(p => (
                <div key={p.id} style={{ background:'rgba(251,146,60,0.1)', border:'1px solid rgba(251,146,60,0.25)', borderRadius:9, padding:'7px 10px', display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ flex:1, color:'#fed7aa', fontSize:13, fontFamily:'monospace', fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.code}</span>
                  <span style={{ color:'#78716c', fontSize:10, flexShrink:0 }}>{new Date(p.scannedAt).toLocaleTimeString()}</span>
                  <button onClick={() => sendPending(p.id)} style={{ background:'rgba(251,146,60,0.3)', border:'1px solid rgba(251,146,60,0.5)', borderRadius:7, padding:'4px 12px', color:'#fb923c', fontSize:11, fontWeight:700, cursor:'pointer', flexShrink:0 }}>Send</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History panel */}
        {bottomTab === 'history' && history.length > 0 && (
          <div style={{ margin:'8px 12px 0' }}>
            <div style={{ marginBottom:6 }}>
              <span style={{ color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>History ({history.length})</span>
            </div>
            <div style={{ maxHeight:140, overflowY:'auto', display:'flex', flexDirection:'column', gap:3 }}>
              {history.map((h, i) => (
                <div key={i} style={{ background:'rgba(255,255,255,0.04)', borderRadius:8, padding:'6px 10px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ color:'#94a3b8', fontSize:12, fontFamily:'monospace' }}>{h.code}</span>
                  <span style={{ color:'#334155', fontSize:10 }}>{new Date(h.time).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs + manual input */}
        <div style={{ display:'flex', gap:6, padding:'10px 12px 0', alignItems:'center' }}>
          <button onClick={() => setBottomTab(t => t === 'history' ? 'none' : 'history')}
            style={{ flex:1, padding:'9px 4px', borderRadius:10, background: bottomTab==='history' ? 'rgba(100,116,139,0.25)' : 'rgba(255,255,255,0.06)', border:`1px solid ${bottomTab==='history' ? 'rgba(100,116,139,0.4)' : 'rgba(255,255,255,0.08)'}`, color: bottomTab==='history' ? '#94a3b8' : '#475569', fontSize:11, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>

          <div style={{ flex:3, display:'flex', gap:5 }}>
            <input type="text" inputMode="numeric" value={manualCode} onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && manualCode.trim()) { sendCode(manualCode.trim()); setManualCode(''); } }}
              placeholder="ম্যানুয়ালি টাইপ করুন..."
              style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:10, padding:'8px 12px', color:'white', fontSize:12, outline:'none', minWidth:0 }} />
            <button onClick={() => { if (manualCode.trim()) { sendCode(manualCode.trim()); setManualCode(''); } }} disabled={!manualCode.trim()}
              style={{ background: manualCode.trim() ? '#2563eb' : 'rgba(37,99,235,0.2)', border:'none', borderRadius:10, padding:'8px 14px', color: manualCode.trim() ? 'white' : '#1e3a8a', fontSize:12, fontWeight:700, cursor: manualCode.trim() ? 'pointer' : 'not-allowed', flexShrink:0, transition:'all 0.2s' }}>
              ↑
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan { 0%{top:8%} 50%{top:85%} 100%{top:8%} }
        @keyframes pls  { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        input::placeholder { color:#334155; }
        input:focus { border-color:rgba(37,99,235,0.6) !important; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.15); border-radius:2px; }
      `}} />
    </div>
  );
}
