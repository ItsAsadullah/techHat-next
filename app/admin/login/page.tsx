'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

// Matrix rain chars
const MATRIX_CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff41';
      ctx.font = `${fontSize}px monospace`;
      for (let i = 0; i < drops.length; i++) {
        const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        ctx.fillStyle = Math.random() > 0.95 ? '#ffffff' : '#00ff41';
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      ctx.globalAlpha = 1;
    };

    const interval = setInterval(draw, 40);
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { clearInterval(interval); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 opacity-30" />;
}

function GlitchText({ text }: { text: string }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const t = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block">
      <span className={glitch ? 'opacity-0' : ''}>{text}</span>
      {glitch && (
        <>
          <span className="absolute inset-0 text-red-500 translate-x-[2px]">{text}</span>
          <span className="absolute inset-0 text-cyan-400 -translate-x-[2px]">{text}</span>
        </>
      )}
    </span>
  );
}

function ScanLine() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl">
      <div
        className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-green-400/40 to-transparent"
        style={{ animation: 'scanline 3s linear infinite' }}
      />
      <style>{`@keyframes scanline { 0% { top: 0%; } 100% { top: 100%; } }`}</style>
    </div>
  );
}

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    '> INITIALIZING SECURE CONNECTION...',
    '> CHECKING IP REPUTATION...',
    '> MONITORING ACTIVE: ALL ATTEMPTS LOGGED',
  ]);
  const [ipDisplay] = useState(() => `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`);
  const router = useRouter();

  useEffect(() => {
    const lines = [
      `> VISITOR IP: ${ipDisplay} [TRACKED]`,
      '> BIOMETRIC SCAN: PENDING...',
      '> UNAUTHORIZED ACCESS ATTEMPTS WILL BE PROSECUTED',
      '> THIS SYSTEM IS MONITORED 24/7',
    ];
    let i = 0;
    const t = setInterval(() => {
      if (i < lines.length) {
        setTerminalLines(prev => [...prev, lines[i++]]);
      } else {
        clearInterval(t);
      }
    }, 800);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setTerminalLines(prev => [...prev, '> IDENTITY VERIFIED. ACCESS GRANTED.', '> LOADING RESTRICTED AREA...']);
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 800);
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError(err.message || 'ACCESS DENIED — Invalid credentials');
      setTerminalLines(prev => [
        ...prev,
        `> ⚠ FAILED AUTH ATTEMPT #${newAttempts} — LOGGED`,
        `> IP ${ipDisplay} FLAGGED`,
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden font-mono">
      <MatrixRain />

      {/* Red danger glow corners */}
      <div className="fixed top-0 left-0 w-64 h-64 bg-red-900/20 blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-64 h-64 bg-red-900/20 blur-3xl pointer-events-none z-0" />
      <div className="fixed top-0 right-0 w-48 h-48 bg-green-900/10 blur-3xl pointer-events-none z-0" />

      {/* Warning tape top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-black text-[10px] font-black tracking-widest text-center py-1 overflow-hidden">
        <span className="animate-marquee inline-block whitespace-nowrap">
          ⚠ RESTRICTED ACCESS ⚠ &nbsp;&nbsp; UNAUTHORIZED ENTRY IS A CRIMINAL OFFENSE &nbsp;&nbsp; THIS SYSTEM IS MONITORED AND ALL ACTIVITY IS LOGGED &nbsp;&nbsp; ⚠ RESTRICTED ACCESS ⚠ &nbsp;&nbsp; UNAUTHORIZED ENTRY IS A CRIMINAL OFFENSE &nbsp;&nbsp; THIS SYSTEM IS MONITORED AND ALL ACTIVITY IS LOGGED &nbsp;&nbsp;
        </span>
      </div>

      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 18s linear infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .blink { animation: blink 1s step-end infinite; }
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.4} 94%{opacity:1} 96%{opacity:0.6} 97%{opacity:1} }
        .flicker { animation: flicker 5s infinite; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 30px #0a0a0a inset !important; -webkit-text-fill-color: #00ff41 !important; }
      `}</style>

      <div className="relative z-10 w-full max-w-lg mt-6">

        {/* CCTV badge */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2 text-red-500 text-xs font-black tracking-widest">
            <span className="w-2 h-2 rounded-full bg-red-500 blink inline-block" />
            REC ● LIVE MONITORING
          </div>
          <div className="text-green-400/60 text-[10px] tracking-widest">
            CAM_ID: SRV-{Math.floor(Math.random()*9000+1000)}
          </div>
        </div>

        {/* Main Panel */}
        <div className="relative border border-green-500/30 bg-black/90 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(0,255,65,0.1)] flicker">
          <ScanLine />

          {/* Top bar */}
          <div className="bg-green-500/10 border-b border-green-500/30 px-5 py-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.8)]" />
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
            </div>
            <div className="text-green-400 text-[11px] tracking-[0.3em] uppercase">
              <GlitchText text="SECURE_TERMINAL v4.2.1" />
            </div>
            <div className="text-red-400/70 text-[10px]">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>

          {/* Warning banner */}
          <div className="bg-red-950/50 border-b border-red-500/40 px-5 py-3 flex items-start gap-3">
            <span className="text-red-400 text-xl mt-0.5 shrink-0">☠</span>
            <div>
              <p className="text-red-400 text-xs font-black tracking-widest uppercase">UNAUTHORIZED ACCESS PROHIBITED</p>
              <p className="text-red-400/70 text-[10px] mt-0.5 leading-relaxed">
                This system is protected under the Digital Security Act. All access attempts are logged with IP, timestamp and device fingerprint. Unauthorized access is a criminal offense punishable by law.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-5">

            {/* Skull header */}
            <div className="text-center space-y-1">
              <div className="text-5xl select-none">💀</div>
              <h1 className="text-green-400 text-xl font-black tracking-[0.2em] uppercase">
                <GlitchText text="RESTRICTED ZONE" />
              </h1>
              <p className="text-green-500/50 text-[10px] tracking-[0.3em] uppercase">Identity Verification Required</p>
            </div>

            {/* Error */}
            {error && (
              <div className="border border-red-500/60 bg-red-950/40 rounded px-4 py-3 flex items-start gap-3">
                <span className="text-red-400 text-base shrink-0">⛔</span>
                <div>
                  <p className="text-red-400 text-xs font-black tracking-wider uppercase">ACCESS DENIED</p>
                  <p className="text-red-400/80 text-[11px] mt-0.5">{error}</p>
                  {attempts > 0 && (
                    <p className="text-red-500/60 text-[10px] mt-1">
                      ⚠ Attempt #{attempts} logged — {3 - Math.min(attempts, 2)} warning(s) remaining before lockout
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} autoComplete="on" className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-[10px] text-green-500/70 tracking-[0.3em] uppercase mb-1.5">
                  &gt; OPERATOR_ID
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500/60 text-sm select-none">@</span>
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black border border-green-500/40 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 rounded px-4 py-3 pl-8 text-green-400 text-sm placeholder-green-900 outline-none transition-all tracking-wide"
                    placeholder="operator@classified.sys"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-[10px] text-green-500/70 tracking-[0.3em] uppercase mb-1.5">
                  &gt; ENCRYPTION_KEY
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500/60 text-sm select-none">#</span>
                  <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-green-500/40 focus:border-green-400 focus:ring-1 focus:ring-green-500/30 rounded px-4 py-3 pl-8 text-green-400 text-sm placeholder-green-900 outline-none transition-all tracking-widest"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/60 hover:border-green-400 text-green-400 font-black text-sm tracking-[0.3em] uppercase rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,65,0.1)] hover:shadow-[0_0_30px_rgba(0,255,65,0.2)]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    VERIFYING IDENTITY...
                  </>
                ) : (
                  <>⚡ AUTHENTICATE</>
                )}
              </button>
            </form>

            {/* Terminal log */}
            <div className="border border-green-500/20 bg-black/60 rounded p-3 space-y-0.5 max-h-28 overflow-y-auto">
              {terminalLines.map((line, i) => (
                <p key={i} className="text-green-500/60 text-[10px] leading-relaxed tracking-wide font-mono">
                  {line}
                </p>
              ))}
              <p className="text-green-400/80 text-[10px]">
                &gt; <span className="blink">_</span>
              </p>
            </div>

            {/* IP warning */}
            <div className="text-center space-y-1 pt-1 border-t border-green-500/10">
              <p className="text-red-500/50 text-[9px] tracking-widest uppercase">
                ⚠ Your IP address {ipDisplay} has been recorded
              </p>
              <p className="text-green-500/30 text-[9px] tracking-widest">
                PROTECTED BY ENTERPRISE SECURITY FRAMEWORK
              </p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="text-center mt-3">
          <p className="text-green-900 text-[10px] tracking-widest">
            TechHat Systems © {new Date().getFullYear()} — CLASSIFIED INTERNAL INTERFACE
          </p>
        </div>
      </div>
    </div>
  );
}
