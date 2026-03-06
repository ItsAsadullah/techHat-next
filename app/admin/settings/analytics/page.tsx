'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3, Save, Loader2, Eye, EyeOff, Facebook, Globe, Tag, Info, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getAnalyticsSettings, updateAnalyticsSettings, type AnalyticsSettings } from '@/lib/actions/invoice-settings-actions';

// ─── Platform config ──────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    key: 'metaPixelId' as const,
    label: 'Meta (Facebook) Pixel ID',
    placeholder: '123456789012345',
    desc: 'Facebook/Meta Ads pixel — enables ViewContent, AddToCart, Purchase event tracking',
    icon: Facebook,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    docUrl: 'https://www.facebook.com/business/help/952192354843755',
    docLabel: 'Find Pixel ID',
  },
  {
    key: 'googleAnalyticsId' as const,
    label: 'Google Analytics 4 ID',
    placeholder: 'G-XXXXXXXXXX',
    desc: 'Connects your site to Google Analytics 4 for traffic & conversion analysis',
    icon: BarChart3,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
    docUrl: 'https://support.google.com/analytics/answer/9304153',
    docLabel: 'Setup GA4',
  },
  {
    key: 'googleTagManagerId' as const,
    label: 'Google Tag Manager ID',
    placeholder: 'GTM-XXXXXXX',
    desc: 'Optional — use GTM to manage multiple tracking codes from one dashboard',
    icon: Tag,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-50',
    docUrl: 'https://support.google.com/tagmanager/answer/6103696',
    docLabel: 'Setup GTM',
  },
  {
    key: 'tiktokPixelId' as const,
    label: 'TikTok Pixel ID',
    placeholder: 'CXXXXXXXXXXXXXXXXXX',
    desc: 'Enable TikTok Ads tracking for your website',
    icon: Globe,
    iconColor: 'text-pink-500',
    iconBg: 'bg-pink-50',
    docUrl: 'https://ads.tiktok.com/help/article/tiktok-pixel',
    docLabel: 'Setup TikTok Pixel',
  },
];

const EMPTY: AnalyticsSettings = {
  metaPixelId: '',
  googleAnalyticsId: '',
  googleTagManagerId: '',
  tiktokPixelId: '',
};

export default function AnalyticsSettingsPage() {
  const [form, setForm] = useState<AnalyticsSettings>(EMPTY);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalyticsSettings().then((data) => {
      setForm(data);
      setLoading(false);
    });
  }, []);

  const set = (key: keyof AnalyticsSettings, val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  async function handleSave() {
    setSaving(true);
    const result = await updateAnalyticsSettings(form);
    setSaving(false);
    if (result.success) {
      toast.success('Analytics settings saved');
    } else {
      toast.error('Save failed: ' + result.error);
    }
  }

  const activeCount = Object.values(form).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-xl">
            <BarChart3 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Analytics & Tracking</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeCount} of {PLATFORMS.length} platforms configured
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </Button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Tracking IDs here are stored in the database and used automatically across all pages.
          Once saved, all pixel events (PageView, ViewContent, AddToCart, Purchase) will fire on your live site.
        </p>
      </div>

      <Separator />

      {/* Platform Cards */}
      <div className="space-y-5">
        {PLATFORMS.map((p) => {
          const Icon = p.icon;
          const val = form[p.key];
          const reveal = showValues[p.key];
          const isSet = !!val;

          return (
            <div
              key={p.key}
              className={`rounded-xl border p-5 transition-all ${
                isSet
                  ? 'border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-900/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${p.iconBg}`}>
                    <Icon className={`w-4 h-4 ${p.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{p.label}</p>
                      {isSet && (
                        <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded-full">
                          ✓ Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{p.desc}</p>
                  </div>
                </div>
                <a
                  href={p.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0"
                >
                  {p.docLabel} <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Tracking ID
                </Label>
                <div className="relative">
                  <Input
                    type={reveal ? 'text' : 'password'}
                    value={val}
                    onChange={(e) => set(p.key, e.target.value)}
                    placeholder={p.placeholder}
                    className="rounded-xl pr-10 font-mono text-sm"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowValues((s) => ({ ...s, [p.key]: !s[p.key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">How it works</p>
        <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 list-disc list-inside">
          <li><strong>Meta Pixel</strong> — fires PageView on every page, ViewContent on product pages, AddToCart when user adds to cart, InitiateCheckout at checkout step 2, and Purchase on successful order.</li>
          <li><strong>Google Analytics</strong> — tracks pageviews and user sessions automatically via gtag.js.</li>
          <li><strong>Google Tag Manager</strong> — if set, loads GTM container which can manage all your tags.</li>
          <li><strong>TikTok Pixel</strong> — fires PageView on every page for TikTok Ads retargeting.</li>
        </ul>
      </div>
    </div>
  );
}
