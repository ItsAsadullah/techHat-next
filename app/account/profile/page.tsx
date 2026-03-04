'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { User, Camera, Save, CheckCircle2, Mail, Phone, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setFullName(session.user.user_metadata?.full_name || '');
        setPhone(session.user.user_metadata?.phone || '');
        setLoading(false);
      }
    });
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = user?.user_metadata?.avatar_url;

      // Upload avatar via Cloudinary (uses /api/upload)
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        formData.append('folder', 'avatars');
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          avatarUrl = uploadData.url;
        } else {
          console.warn('Avatar upload skipped:', uploadData.error);
        }
      }

      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName.trim(), phone: phone.trim(), avatar_url: avatarUrl },
      });

      if (error) throw error;

      // Update DB user record
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim(), avatarUrl }),
        });
      }

      setUser((prev: any) => ({
        ...prev,
        user_metadata: { ...prev.user_metadata, full_name: fullName.trim(), phone: phone.trim(), avatar_url: avatarUrl },
      }));
      setSaved(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="bg-white rounded-2xl p-5 h-24 shadow-sm border border-gray-100" />
        <div className="bg-white rounded-2xl p-5 h-64 shadow-sm border border-gray-100" />
      </div>
    );
  }

  const initials = (fullName || user?.email || 'U').slice(0, 2).toUpperCase();
  const currentAvatar = avatarPreview || user?.user_metadata?.avatar_url;
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h1 className="text-lg font-bold text-gray-800">Edit Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Update your personal information</p>
      </div>

      {/* Avatar + Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-24" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">{initials}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="pb-2">
              <p className="font-bold text-gray-800">{fullName || user?.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> Member since {memberSince}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-1">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <Mail className="w-4 h-4 text-blue-500" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-gray-700 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <CheckCircle2 className={`w-4 h-4 ${user?.email_confirmed_at ? 'text-green-500' : 'text-yellow-500'}`} />
              <div>
                <p className="text-xs text-gray-400">Email Status</p>
                <p className="text-sm text-gray-700">{user?.email_confirmed_at ? 'Verified' : 'Unverified'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={user?.email || ''}
                readOnly
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed here. Contact support if needed.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                type="tel"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-200 hover:shadow-lg'
            } disabled:opacity-60`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : saved ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
