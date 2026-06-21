'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2, Lock, Eye, EyeOff, KeyRound, AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

// ── Defined OUTSIDE parent to prevent focus loss on mobile ──
interface PwInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggleShow: () => void;
}
function PwInput({ label, value, onChange, show, onToggleShow }: PwInputProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl pr-10"
          placeholder="••••••••"
        />
        <button type="button" onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────────────────────

export default function SecuritySettingsPage() {
  const [saving, setSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwords, setPasswords] = useState({ old: '', new: '', confirm: '' });

  async function handleChangePassword() {
    if (!passwords.old || !passwords.new || !passwords.confirm) {
      toast.error('Please fill all password fields'); return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match'); return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters'); return;
    }
    setSaving(true);
    try {
      // Verify old password by re-authenticating
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) throw new Error('No active session found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: passwords.old,
      });
      if (signInError) {
        toast.error('Current password is incorrect');
        setSaving(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwords.new,
      });
      if (updateError) throw updateError;

      toast.success('Password changed successfully');
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || 'Password change failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-xl"><ShieldCheck className="w-5 h-5 text-gray-700" /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Security</h2>
          <p className="text-sm text-gray-500">Password & access control settings</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Change Password</h3>
        </div>
        <div className="space-y-3 max-w-sm">
          <PwInput label="Current Password" value={passwords.old} onChange={(v) => setPasswords(p => ({ ...p, old: v }))} show={showOld} onToggleShow={() => setShowOld(!showOld)} />
          <PwInput label="New Password" value={passwords.new} onChange={(v) => setPasswords(p => ({ ...p, new: v }))} show={showNew} onToggleShow={() => setShowNew(!showNew)} />
          <PwInput label="Confirm New Password" value={passwords.confirm} onChange={(v) => setPasswords(p => ({ ...p, confirm: v }))} show={showConfirm} onToggleShow={() => setShowConfirm(!showConfirm)} />
          <Button onClick={handleChangePassword} disabled={saving}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white rounded-xl gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Change Password
          </Button>
        </div>
      </div>

      <Separator />

      {/* Session & Access */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Session & Access</h3>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex gap-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900">Role access is enforced by Supabase and server-side checks.</p>
            <p className="text-xs text-blue-700 mt-1">
              Login alerts, two-factor authentication, session timeout, and global session revocation are not active yet.
              They are shown here as planned security features instead of saveable settings.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Email alert on new login', desc: 'Requires an audit-log and email notification worker.' },
            { label: 'Two-Factor Authentication', desc: 'Requires Supabase MFA enrollment and verification flow.' },
            { label: 'Auto logout timeout', desc: 'Requires a central session policy and client enforcement.' },
            { label: 'Global session revocation', desc: 'Requires admin API support for revoking user sessions.' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-200 text-gray-600">Planned</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-red-500">Danger Zone</h3>
        </div>
        <div className="border border-red-200 rounded-xl p-4 bg-red-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Clear all session data</p>
            <p className="text-xs text-gray-500 mt-0.5">Force logout all active sessions</p>
          </div>
          <Button variant="outline" onClick={() => toast.info('Global session revocation is not implemented yet. Use Supabase Auth controls for now.')}
            className="border-red-300 text-red-600 hover:bg-red-100 rounded-xl text-xs">
            View Status
          </Button>
        </div>
      </div>
    </div>
  );
}
