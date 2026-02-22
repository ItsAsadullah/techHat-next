'use client';

import { useState, useRef } from 'react';
import {
  Palette, Save, Loader2, Upload, Image as ImageIcon,
  Phone, Truck, X, Eye, Globe2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  updateBrandingSettings,
  type BrandingSettings,
} from '@/lib/actions/invoice-settings-actions';
import Image from 'next/image';

export function BrandingClient({ initial }: { initial: BrandingSettings }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BrandingSettings>(initial);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);

  const logoRef    = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof BrandingSettings>(key: K, val: BrandingSettings[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function uploadFile(file: File, field: 'siteLogo' | 'siteFavicon') {
    const type = field === 'siteLogo' ? 'logo' : 'favicon';
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'branding');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.url) throw new Error(data.error ?? 'Upload failed');
      set(field, data.url);
      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    const result = await updateBrandingSettings(form);
    setSaving(false);
    if (result.success) {
      toast.success('Branding settings saved — reload the site to see changes');
    } else {
      toast.error('Save failed: ' + result.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <Palette className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Branding & Header</h2>
            <p className="text-sm text-gray-500">Site logo, favicon, and top info bar</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* ── Site Logo ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4" /> Site Logo
        </h3>
        <p className="text-xs text-gray-400">Displayed in the navbar. Supports PNG or SVG. Recommended: max 200×60 px.</p>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-36 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {form.siteLogo ? (
              <Image src={form.siteLogo} alt="Logo preview" width={140} height={60} className="object-contain max-h-14" unoptimized />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={uploading === 'logo'}
                onClick={() => logoRef.current?.click()}
              >
                {uploading === 'logo'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Upload className="w-3.5 h-3.5" />}
                Upload Logo
              </Button>
              {form.siteLogo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-500 hover:text-red-600"
                  onClick={() => set('siteLogo', '')}
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-gray-400">PNG / SVG — max 2 MB</p>
          </div>

          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/svg+xml,image/jpeg,image/webp"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f, 'siteLogo');
              e.target.value = '';
            }}
          />
        </div>

        {/* URL fallback */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Or paste image URL</Label>
          <Input
            value={form.siteLogo}
            onChange={e => set('siteLogo', e.target.value)}
            placeholder="https://example.com/logo.png"
            className="rounded-xl h-9 text-sm"
          />
        </div>
      </div>

      <Separator />

      {/* ── Favicon ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Globe2 className="w-4 h-4" /> Favicon
        </h3>
        <p className="text-xs text-gray-400">Shown in the browser tab. Supports PNG or SVG. Recommended: 32×32 px.</p>

        <div className="flex items-center gap-4">
          {/* Preview */}
          <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
            {form.siteFavicon ? (
              <Image src={form.siteFavicon} alt="Favicon preview" width={32} height={32} className="object-contain" unoptimized />
            ) : (
              <Globe2 className="w-6 h-6 text-gray-300" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={uploading === 'favicon'}
                onClick={() => faviconRef.current?.click()}
              >
                {uploading === 'favicon'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Upload className="w-3.5 h-3.5" />}
                Upload Favicon
              </Button>
              {form.siteFavicon && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-red-500 hover:text-red-600"
                  onClick={() => set('siteFavicon', '')}
                >
                  <X className="w-3.5 h-3.5" /> Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-gray-400">PNG / SVG / ICO — max 1 MB</p>
          </div>

          <input
            ref={faviconRef}
            type="file"
            accept="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f, 'siteFavicon');
              e.target.value = '';
            }}
          />
        </div>

        {/* URL fallback */}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-500">Or paste image URL</Label>
          <Input
            value={form.siteFavicon}
            onChange={e => set('siteFavicon', e.target.value)}
            placeholder="https://example.com/favicon.png"
            className="rounded-xl h-9 text-sm"
          />
        </div>
      </div>

      <Separator />

      {/* ── Top Info Bar ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Eye className="w-4 h-4" /> Top Info Bar
        </h3>
        <p className="text-xs text-gray-400">The dark bar above the main navbar on the website.</p>

        <div className="space-y-4">
          {/* Hotline */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> Hotline Number
            </Label>
            <Input
              value={form.topbarHotline}
              onChange={e => set('topbarHotline', e.target.value)}
              placeholder="01700-000000"
              className="rounded-xl h-10"
            />
            <p className="text-[11px] text-gray-400">
              Displayed as: <span className="font-mono bg-gray-100 px-1 rounded">Hotline: {form.topbarHotline || '01700-000000'}</span>
            </p>
          </div>

          {/* Free delivery text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-gray-400" /> Free Delivery Text
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Show</span>
                <Switch
                  checked={form.topbarShowDelivery}
                  onCheckedChange={v => set('topbarShowDelivery', v)}
                />
              </div>
            </div>
            <Input
              value={form.topbarDelivery}
              onChange={e => set('topbarDelivery', e.target.value)}
              placeholder="Free Delivery on Orders Over ৳2,000"
              className="rounded-xl h-10"
              disabled={!form.topbarShowDelivery}
            />
          </div>
        </div>

        {/* Live preview */}
        <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-1.5 bg-gray-50 border-b border-gray-200">
            Preview
          </p>
          <div className="bg-gray-900 text-gray-300 text-xs px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                Hotline: {form.topbarHotline || '01700-000000'}
              </span>
              {form.topbarShowDelivery && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Truck className="w-3 h-3" />
                  {form.topbarDelivery || 'Free Delivery on Orders Over ৳2,000'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-gray-500">
              <span>Track Order</span>
              <span>EN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
