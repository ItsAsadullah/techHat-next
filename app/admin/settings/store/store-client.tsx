'use client';

import { useState } from 'react';
import { Store, Phone, Mail, MapPin, Globe, Save, Loader2, MessageCircle, Truck, PackageOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  updateStoreSettings, updateShippingSettings,
  type StoreSettings, type ShippingSettings,
} from '@/lib/actions/invoice-settings-actions';
import type { LucideIcon } from 'lucide-react';

// ── Field component defined OUTSIDE parent to prevent remount on each keystroke ──
interface FieldProps {
  label: string;
  id: string;
  icon?: LucideIcon;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
}

function Field({ label, id, icon: Icon, value, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        className="rounded-xl h-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export function StoreSettingsClient({
  initial,
  initialShipping,
}: {
  initial: StoreSettings;
  initialShipping: ShippingSettings;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StoreSettings>(initial);
  const [shipping, setShipping] = useState<ShippingSettings>(initialShipping);

  function set(key: keyof StoreSettings, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function setS(key: keyof ShippingSettings, val: string) {
    setShipping((f) => ({ ...f, [key]: Number(val) || 0 }));
  }

  async function handleSave() {
    setSaving(true);
    const [r1, r2] = await Promise.all([
      updateStoreSettings(form),
      updateShippingSettings(shipping),
    ]);
    setSaving(false);
    if (r1.success && r2.success) {
      toast.success('Store & shipping settings saved');
    } else {
      toast.error('Save failed: ' + (r1.error ?? r2.error));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-xl"><Store className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Store Information</h2>
            <p className="text-sm text-gray-500">Business identity &amp; contact details — saved to database</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Business Identity */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Business Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Store Name" id="storeName" icon={Store} value={form.storeName ?? ''} onChange={(v) => set('storeName', v)} placeholder="TechHat" />
          <Field label="Tagline" id="tagline" value={form.tagline ?? ''} onChange={(v) => set('tagline', v)} placeholder="Your one-stop tech shop" />
        </div>
      </div>

      <Separator />

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Primary Phone" id="phone" icon={Phone} value={form.phone ?? ''} onChange={(v) => set('phone', v)} placeholder="+880 1XXX-XXXXXX" />
          <Field label="Alternative Phone" id="altPhone" icon={Phone} value={form.altPhone ?? ''} onChange={(v) => set('altPhone', v)} placeholder="+880 1XXX-XXXXXX" />
          <Field label="Email Address" id="email" icon={Mail} value={form.email ?? ''} onChange={(v) => set('email', v)} placeholder="info@techhat.com" type="email" />
          <Field label="Website" id="website" icon={Globe} value={form.website ?? ''} onChange={(v) => set('website', v)} placeholder="https://techhat.com" />
        </div>
      </div>

      <Separator />

      {/* Address */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Address</h3>
        <Field label="Street Address" id="address" icon={MapPin} value={form.address ?? ''} onChange={(v) => set('address', v)} placeholder="Street, Area" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="City" id="city" value={form.city ?? ''} onChange={(v) => set('city', v)} placeholder="Dhaka" />
          <Field label="Country" id="country" value={form.country ?? ''} onChange={(v) => set('country', v)} placeholder="Bangladesh" />
        </div>
      </div>

      <Separator />

      {/* Order Buttons */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Order Button Numbers</h3>
          <p className="text-xs text-gray-400 mt-1">এই নম্বরগুলো প্রোডাক্ট পেজে &quot;Order on WhatsApp&quot; ও &quot;Call for Order&quot; বাটনে ব্যবহার হবে</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-green-500" />
              WhatsApp Order Number
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">880</span>
              <input
                type="tel"
                className="w-full pl-10 pr-3 h-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1XXXXXXXXX (without country code)"
                value={form.whatsappNumber ?? ''}
                onChange={(e) => set('whatsappNumber', e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-400">যেমন: 1712345678 → wa.me/8801712345678</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              Call for Order Number
            </label>
            <input
              type="tel"
              className="w-full px-3 h-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="01XXXXXXXXX"
              value={form.callNumber ?? ''}
              onChange={(e) => set('callNumber', e.target.value)}
            />
            <p className="text-xs text-gray-400">যেমন: 09678300400</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Regional */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Currency</Label>
            <select
              value={form.currency}
              onChange={(e) => set('currency', e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BDT">BDT — Bangladeshi Taka</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </div>
          <Field label="Currency Symbol" id="currencySymbol" value={form.currencySymbol ?? ''} onChange={(v) => set('currencySymbol', v)} placeholder="৳" />
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Timezone</Label>
            <select
              value={form.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</option>
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
            </select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Shipping & Delivery */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Shipping & Delivery Charges</h3>
        </div>
        <p className="text-xs text-gray-400 -mt-2">
          এই রেট গুলো চেকআউটে অর্ডার মোটের সাথে যোগ হবে। শিপিং চার্জ এখান থেকে পরিবর্তন করলে সব জায়গায় আপডেট হয়ে যাবে।
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-green-500" /> Dhaka Shipping (৳)
            </Label>
            <Input
              type="number"
              value={String(shipping.shippingDhaka)}
              onChange={(e) => setS('shippingDhaka', e.target.value)}
              placeholder="60"
              className="rounded-xl h-10"
              min="0"
            />
            <p className="text-xs text-gray-400">ঢাকার মধ্যে ডেলিভারি চার্জ</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-orange-500" /> Outside Dhaka (৳)
            </Label>
            <Input
              type="number"
              value={String(shipping.shippingOutsideDhaka)}
              onChange={(e) => setS('shippingOutsideDhaka', e.target.value)}
              placeholder="120"
              className="rounded-xl h-10"
              min="0"
            />
            <p className="text-xs text-gray-400">ঢাকার বাইরে ডেলিভারি চার্জ</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <PackageOpen className="w-3.5 h-3.5 text-blue-500" /> Free Delivery Threshold (৳)
            </Label>
            <Input
              type="number"
              value={String(shipping.freeDeliveryThreshold)}
              onChange={(e) => setS('freeDeliveryThreshold', e.target.value)}
              placeholder="0 (disabled)"
              className="rounded-xl h-10"
              min="0"
            />
            <p className="text-xs text-gray-400">এর বেশি অর্ডারে ফ্রি ডেলিভারি। 0 = বন্ধ</p>
          </div>
        </div>
      </div>
    </div>
  );
}