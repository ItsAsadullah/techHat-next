'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

import { createPortal } from 'react-dom';

import { useRouter } from 'next/navigation';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset states when modal closes or mode changes
  useEffect(() => {
    if (!isOpen) {
      setMode('login');
      setError(null);
      setSuccess(null);
      setLoading(false);
      setShowResendVerification(false);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResendVerification(false);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if user exists but email not confirmed
        if (
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('email not confirmed')
        ) {
          // Try to determine if it's an unverified email
          const msg = error.message.toLowerCase();
          if (msg.includes('email not confirmed')) {
            setError('Please verify your email before logging in. Check your inbox.');
            setShowResendVerification(true);
          } else {
            setError('Incorrect email or password. If you just registered, please verify your email first.');
            setShowResendVerification(true);
          }
        } else {
          setError(error.message);
        }
        return;
      }

      // Store Remember Me preference
      if (rememberMe) {
        localStorage.removeItem('no-remember-me');
      } else {
        localStorage.setItem('no-remember-me', '1');
      }
      sessionStorage.setItem('session-heartbeat', '1');

      // ── Credential Management API ──────────────────────────────────────────
      // Explicitly tell the browser to save this password. This is the
      // reliable way to trigger "Save password?" in Chrome/Firefox for SPAs
      // where the page doesn't do a traditional form POST.
      // Must be called BEFORE navigating away.
      try {
        if (typeof window !== 'undefined' && 'PasswordCredential' in window) {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: password,
            name: email,
          });
          await navigator.credentials.store(cred);
        }
      } catch {
        // Credential Management API not supported or blocked — no-op
      }

      // Check if user is admin — redirect to admin panel instead of account.
      const accessToken = data?.session?.access_token;
      try {
        const roleRes = await fetch('/api/account/role', {
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        });
        const roleData = await roleRes.json();
        if (roleData.isAdmin) {
          window.location.href = '/admin/dashboard';
          return;
        }
      } catch {
        // Role check failed — default to customer dashboard
      }
      window.location.href = '/account';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setSuccess('Verification email resent! Please check your inbox.');
      setShowResendVerification(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // If email confirmation is disabled (dev mode), user is immediately active
        const isActive = data.user.identities && data.user.identities.length > 0 && data.session;
        if (isActive) {
          // Save new credentials to browser password manager
          try {
            if (typeof window !== 'undefined' && 'PasswordCredential' in window) {
              const cred = new (window as any).PasswordCredential({ id: email, password, name: email });
              await navigator.credentials.store(cred);
            }
          } catch { /* not supported */ }
          setSuccess('Account created successfully! Welcome to TechHat 🎉');
          setTimeout(() => {
            onClose();
            router.refresh();
          }, 1200);
        } else {
          // Email confirmation required
          setSuccess('Registration successful! Please check your email to verify your account.');
          setTimeout(() => {
            setMode('login');
            setSuccess(null);
          }, 3000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen w-screen px-4 text-center sm:block sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/75 transition-opacity"
            aria-hidden="true"
          />

          {/* Centering trick for older browsers or fallback */}
          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative inline-block align-bottom bg-white rounded-2xl text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-[440px] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 font-heading">
                    {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {mode === 'login' 
                      ? 'Login to access your account' 
                      : 'Sign up to get started with TechHat'}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-white/50 rounded-full"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              {/* Error/Success Messages */}
              <AnimatePresence mode='wait'>
                  {error && (
                  <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg flex items-start gap-2 text-sm"
                  >
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span>{error}</span>
                        {showResendVerification && (
                          <button
                            type="button"
                            onClick={handleResendVerification}
                            className="block mt-1.5 text-xs font-semibold text-red-800 underline hover:no-underline"
                          >
                            Resend verification email →
                          </button>
                        )}
                      </div>
                  </motion.div>
                  )}
                  {success && (
                  <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mb-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2.5 rounded-lg flex items-start gap-2 text-sm"
                  >
                      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                      <span>{success}</span>
                  </motion.div>
                  )}
              </AnimatePresence>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button 
                  onClick={() => handleSocialLogin('facebook')}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-lg py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              {/* Forms */}
              <AnimatePresence mode='wait'>
                {mode === 'login' ? (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                  <form
                    id="auth-login-form"
                    onSubmit={handleLogin}
                    autoComplete="on"
                    method="post"
                    action="#"
                    className="space-y-4"
                  >
                    <div>
                      <label htmlFor="auth-login-email" className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <input 
                        id="auth-login-email"
                        name="email"
                        type="email" 
                        required 
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label htmlFor="auth-login-password-display" className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        {/*
                          Hidden type="password" input — browser password manager always
                          sees a real password field and tracks it for autofill/save.
                          NOT shown to user; synced via value prop.
                        */}
                        <input
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-hidden="true"
                          tabIndex={-1}
                          className="sr-only"
                          readOnly={showPassword} // prevent double-typing when visible input is active
                        />
                        {/* Visible display input — toggles type for show/hide; no name so browser ignores for saving */}
                        <input
                          id="auth-login-password-display"
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="off"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full px-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="text-gray-600">Remember me</span>
                      </label>
                      <button type="button" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                        Forgot Password?
                      </button>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                          <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                              Logging in...
                          </>
                      ) : 'LOGIN'}
                    </button>
                  </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                  <form
                    id="auth-register-form"
                    onSubmit={handleRegister}
                    autoComplete="on"
                    method="post"
                    action="#"
                    className="space-y-4"
                  >
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label htmlFor="auth-reg-name" className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                              <input 
                                  id="auth-reg-name"
                                  name="name"
                                  type="text" 
                                  required 
                                  autoComplete="name"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="John Doe"
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                              />
                          </div>
                          <div>
                              <label htmlFor="auth-reg-phone" className="block text-xs font-semibold text-gray-700 mb-1.5">Phone (Optional)</label>
                              <input 
                                  id="auth-reg-phone"
                                  name="tel"
                                  type="tel" 
                                  autoComplete="tel"
                                  value={phone}
                                  onChange={(e) => setPhone(e.target.value)}
                                  placeholder="+880..."
                                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                              />
                          </div>
                      </div>

                    <div>
                      <label htmlFor="auth-reg-email" className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <input 
                        id="auth-reg-email"
                        name="email"
                        type="email" 
                        required 
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label htmlFor="auth-reg-password-display" className="block text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                          <div className="relative">
                          {/* Hidden input for browser password manager */}
                          <input name="password" type="password" autoComplete="new-password"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            aria-hidden="true" tabIndex={-1} className="sr-only" readOnly={showPassword} />
                          {/* Visible display input */}
                          <input
                              id="auth-reg-password-display"
                              type={showPassword ? 'text' : 'password'}
                              required
                              autoComplete="off"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Min 6 chars"
                              className="w-full px-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                          />
                          <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          </div>
                      </div>
                      <div>
                          <label htmlFor="auth-reg-confirm-display" className="block text-xs font-semibold text-gray-700 mb-1.5">Confirm</label>
                          <div className="relative">
                          {/* Hidden input for browser password manager */}
                          <input name="confirmPassword" type="password" autoComplete="new-password"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            aria-hidden="true" tabIndex={-1} className="sr-only" readOnly={showPassword} />
                          {/* Visible display input */}
                          <input
                              id="auth-reg-confirm-display"
                              type={showPassword ? 'text' : 'password'}
                              required
                              autoComplete="off"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm"
                              className="w-full px-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all"
                          />
                          <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600">
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <input type="checkbox" required className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5" />
                      <label className="text-xs text-gray-600 leading-relaxed">
                          I agree to <a href="#" className="text-blue-600 hover:underline font-semibold">Terms & Conditions</a>
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                          <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                              Creating Account...
                          </>
                      ) : 'CREATE ACCOUNT'}
                    </button>
                  </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Toggle Mode */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                  <button 
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="ml-1 text-blue-600 font-bold hover:text-blue-700 hover:underline focus:outline-none"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Login'}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
