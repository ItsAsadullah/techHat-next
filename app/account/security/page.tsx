'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Key } from 'lucide-react';

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetSaved, setResetSaved] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [forgotSaving, setForgotSaving] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const passwordStrength = (pw: string) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(newPassword);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setResetSaved(true);
      setTimeout(() => setResetSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    }
    setSaving(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error('Enter your email'); return; }
    setForgotSaving(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/account/security?reset=true`,
      });
      if (error) throw error;
      setForgotSent(true);
      toast.success('Password reset email sent!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    }
    setForgotSaving(false);
  };

  const PasswordInput = ({
    value, onChange, show, onToggle, placeholder,
  }: { value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void; placeholder: string }) => (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />
      <button type="button" onClick={onToggle} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Security</h1>
            <p className="text-sm text-gray-500">Manage your password and account security</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-500" /> Change Password
        </h2>
        <p className="text-xs text-gray-400 mb-5">Use a strong password with at least 8 characters.</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <PasswordInput value={newPassword} onChange={setNewPassword} show={showNew} onToggle={() => setShowNew(v => !v)} placeholder="New password" />
            {newPassword && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strength >= 3 ? 'text-green-600' : strength === 2 ? 'text-blue-600' : 'text-red-500'}`}>
                  {strengthLabels[strength]}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} placeholder="Confirm new password" />
            {confirmPassword && (
              <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${confirmPassword === newPassword ? 'text-green-600' : 'text-red-500'}`}>
                {confirmPassword === newPassword
                  ? <><CheckCircle2 className="w-3.5 h-3.5" /> Passwords match</>
                  : <><AlertCircle className="w-3.5 h-3.5" /> Passwords do not match</>
                }
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              resetSaved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200'
            } disabled:opacity-60`}
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Updating…</>
            ) : resetSaved ? (
              <><CheckCircle2 className="w-4 h-4" />Password Updated!</>
            ) : (
              <><ShieldCheck className="w-4 h-4" />Update Password</>
            )}
          </button>
        </form>
      </motion.div>

      {/* Forgot / Reset via Email */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <h2 className="font-semibold text-gray-800 mb-1">Reset via Email</h2>
        <p className="text-xs text-gray-400 mb-5">Forgot your password? We'll send a reset link to your email.</p>

        {forgotSent ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-700 text-sm">Reset email sent!</p>
              <p className="text-xs text-green-600 mt-0.5">Check your inbox and follow the link to reset your password.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex gap-3">
            <input
              type="email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              type="submit"
              disabled={forgotSaving}
              className="px-5 py-3 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {forgotSaving ? 'Sending…' : 'Send'}
            </button>
          </form>
        )}
      </motion.div>

      {/* Security Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <h3 className="font-semibold text-blue-800 text-sm mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Security Tips
        </h3>
        <ul className="space-y-2 text-xs text-blue-700">
          <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Use at least 8 characters with a mix of letters, numbers, and symbols.</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Don't reuse passwords from other websites.</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">•</span>Never share your password with anyone.</li>
        </ul>
      </div>
    </div>
  );
}
