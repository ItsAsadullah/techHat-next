'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  Save, Plus, Trash2, GripVertical, Eye, EyeOff,
  Image as ImageIcon, ArrowUp, ArrowDown, Upload,
  Loader2, X, Megaphone, Zap, Layout, Monitor, PanelRight, Youtube,
} from 'lucide-react';
import {
  type HomepageBanner,
  type HomepageSectionConfig,
  type PromoBanner,
  type FlashSaleConfig,
  DEFAULT_BANNERS,
  DEFAULT_HOMEPAGE_SECTIONS,
  DEFAULT_PROMO_BANNERS,
} from '@/lib/homepage-types';
import {
  getAllHomepageBannersAdmin,
  saveHomepageBanners,
  getHomepageSections,
  saveHomepageSections,
  getPromoBanners,
  savePromoBanners,
  getFlashSaleConfig,
  saveFlashSaleConfig,
} from '@/lib/actions/homepage-actions';

// ─── Media upload field ───────────────────────────────────────────────────────

function MediaUploadField({
  label, value, onChange, accept = 'image/*', folder = 'homepage', placeholder = 'https://...', hint,
}: {
  label: string; value: string; onChange: (url: string) => void;
  accept?: string; folder?: string; placeholder?: string; hint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = value && (value.includes('.mp4') || value.includes('.webm') || value.includes('/video/'));

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.url) throw new Error(data.error ?? 'Upload failed');
      onChange(data.url);
      toast.success('Uploaded successfully');
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      {value && (
        <div className="relative mb-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 group">
          {isVideo
            ? <video src={value} className="w-full max-h-36 object-contain" muted loop playsInline controls />
            : <img src={value} alt="preview" className="w-full max-h-36 object-contain" />}
          <button
            type="button" onClick={() => onChange('')}
            className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full shadow hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          ><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ─── Single banner card (reusable) ───────────────────────────────────────────

function BannerCard({
  banner, index, onUpdate, onRemove, compact = false, showYoutube = false,
}: {
  banner: HomepageBanner; index?: number; onUpdate: (patch: Partial<HomepageBanner>) => void;
  onRemove?: () => void; compact?: boolean; showYoutube?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {index !== undefined && <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">#{index + 1}</span>}
          <button
            onClick={() => onUpdate({ isActive: !banner.isActive })}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${banner.isActive ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
          >
            {banner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {banner.isActive ? 'Active' : 'Hidden'}
          </button>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Desktop image */}
        <div className="sm:col-span-2">
          <MediaUploadField
            label="Image" value={banner.image} onChange={(url) => onUpdate({ image: url })}
            accept="image/*" folder="homepage/banners"
            hint={compact ? 'Recommended: 800×430px (landscape, ~1.86:1 ratio)' : 'Recommended: 1920×1050px (16:9 — use object-cover crop)'}
          />
        </div>

        {/* Video */}
        <div className="sm:col-span-2">
          <MediaUploadField
            label="Video (optional — plays instead of image)" value={banner.video || ''}
            onChange={(url) => onUpdate({ video: url })} accept="video/mp4,video/webm"
            folder="homepage/banners" placeholder="https://... (mp4 or webm)"
            hint="Upload mp4/webm to use as video background"
          />
        </div>

        {/* YouTube URL — bottom-right slot only */}
        {showYoutube && (
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                YouTube Video URL (optional — overrides image/video)
              </span>
            </label>
            <input
              value={banner.youtubeUrl || ''}
              onChange={(e) => onUpdate({ youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <p className="text-xs text-gray-400 mt-1">Autoplay, muted, looped. Click on video to pause/play. No controls shown.</p>
          </div>
        )}

        {!compact && (
          <div className="sm:col-span-2">
            <MediaUploadField
              label="Mobile Image (optional)" value={banner.mobileImage || ''}
              onChange={(url) => onUpdate({ mobileImage: url })} accept="image/*"
              folder="homepage/banners" hint="Recommended: 768×400px"
            />
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
          <input value={banner.title} onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>

        {/* Subtitle — only for main */}
        {!compact && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subtitle</label>
            <input value={banner.subtitle || ''} onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
        )}

        {/* CTA Text */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Button Text</label>
          <input value={banner.ctaText || ''} onChange={(e) => onUpdate({ ctaText: e.target.value })}
            placeholder="Shop Now"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>

        {/* CTA Link */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Button Link</label>
          <input value={banner.ctaLink || ''} onChange={(e) => onUpdate({ ctaLink: e.target.value })}
            placeholder="/products"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        </div>

        {!compact && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Badge Text</label>
            <input value={banner.badge || ''} onChange={(e) => onUpdate({ badge: e.target.value })}
              placeholder="e.g. New, Sale, Limited"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Placeholder card (empty slot) ───────────────────────────────────────────

function EmptySlotCard({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
    >
      <Plus className="w-6 h-6" />
      <span className="text-sm font-medium">Add {label}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomepageSettingsPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'sections' | 'promos' | 'flash-sale'>('banners');
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [flashConfig, setFlashConfig] = useState<FlashSaleConfig>({
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [b, s, p, f] = await Promise.all([
          getAllHomepageBannersAdmin(), getHomepageSections(), getPromoBanners(), getFlashSaleConfig(),
        ]);
        setBanners(b.length ? b : DEFAULT_BANNERS);
        setSections(s.length ? s : DEFAULT_HOMEPAGE_SECTIONS);
        setPromoBanners(p.length ? p : DEFAULT_PROMO_BANNERS);
        setFlashConfig(f);
      } catch { toast.error('Failed to load homepage settings'); }
      setLoading(false);
    }
    load();
  }, []);

  // ── Banner helpers ──────────────────────────────────────────────────────────

  const mainBanners        = banners.filter((b) => !b.slot || b.slot === 'main');
  const topRightBanners    = banners.filter((b) => b.slot === 'right-top');
  const bottomRightBanners = banners.filter((b) => b.slot === 'right-bottom');

  function updateBanner(id: string, patch: Partial<HomepageBanner>) {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeBanner(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  function addMainBanner() {
    setBanners((prev) => [
      ...prev,
      { id: Date.now().toString(), title: 'New Banner', subtitle: '', image: '', ctaText: 'Shop Now', ctaLink: '/products', isActive: true, order: prev.length + 1, slot: 'main' },
    ]);
  }

  function addRightBanner(slot: 'right-top' | 'right-bottom') {
    setBanners((prev) => [
      ...prev,
      { id: Date.now().toString(), title: slot === 'right-top' ? 'Top Offer' : 'Bottom Offer', image: '', ctaText: 'View', ctaLink: '/products', isActive: true, order: prev.length + 1, slot },
    ]);
  }

  // ── Promo helpers ───────────────────────────────────────────────────────────

  function updatePromo(i: number, patch: Partial<PromoBanner>) {
    setPromoBanners((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }

  function moveSectionUp(i: number) {
    if (i === 0) return;
    const updated = [...sections];
    [updated[i - 1], updated[i]] = [updated[i], updated[i - 1]];
    updated.forEach((s, idx) => (s.order = idx + 1));
    setSections(updated);
  }

  function moveSectionDown(i: number) {
    if (i === sections.length - 1) return;
    const updated = [...sections];
    [updated[i], updated[i + 1]] = [updated[i + 1], updated[i]];
    updated.forEach((s, idx) => (s.order = idx + 1));
    setSections(updated);
  }

  async function save(fn: () => Promise<{ success: boolean }>, msg: string) {
    setSaving(true);
    const r = await fn();
    setSaving(false);
    if (r.success) toast.success(msg); else toast.error('Save failed');
  }

  const tabs = [
    { id: 'banners' as const, label: 'Banners', icon: ImageIcon },
    { id: 'sections' as const, label: 'Sections', icon: Layout },
    { id: 'promos' as const, label: 'Promo', icon: Megaphone },
    { id: 'flash-sale' as const, label: 'Flash Sale', icon: Zap },
  ];

  if (loading) {
    return (
      <div className="p-8 animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <Layout className="w-5 h-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Homepage Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Control banners, section order, and promotional content</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            ><Icon className="w-4 h-4" />{tab.label}</button>
          );
        })}
      </div>

      {/* ─── BANNERS TAB ─────────────────────────────────────────────── */}
      {activeTab === 'banners' && (
        <div className="space-y-8">

          {/* ── Section 1: Main Carousel ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Monitor className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Main Banner (Carousel)</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Large left panel — slides automatically. Add multiple images.</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mt-0.5">Image size: 1920×1050px (16:9)</p>
              </div>
            </div>

            {mainBanners.map((banner, i) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                index={i}
                onUpdate={(patch) => updateBanner(banner.id, patch)}
                onRemove={() => removeBanner(banner.id)}
              />
            ))}

            <button onClick={addMainBanner}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
            ><Plus className="w-4 h-4" /> Add Carousel Slide</button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* ── Section 2: Top Right Banner ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PanelRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Top Right Banner</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Upper panel on the right side of the hero grid. Add multiple slides for a carousel.</p>
                <p className="text-xs text-purple-500 dark:text-purple-400 font-medium mt-0.5">Image size: 800×430px (~1.86:1)</p>
              </div>
            </div>

            {topRightBanners.map((banner, i) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                index={i}
                onUpdate={(patch) => updateBanner(banner.id, patch)}
                onRemove={() => removeBanner(banner.id)}
                compact
              />
            ))}

            <button onClick={() => addRightBanner('right-top')}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-purple-400 hover:text-purple-600 transition-colors w-full justify-center"
            ><Plus className="w-4 h-4" /> Add Top Right Slide</button>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* ── Section 3: Bottom Right Banner ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <PanelRight className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">Bottom Right Banner</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Lower panel on the right side. Supports carousel, mp4/webm, or YouTube video.</p>
                <p className="text-xs text-pink-500 dark:text-pink-400 font-medium mt-0.5">Image size: 800×430px (~1.86:1) · YouTube URL also accepted</p>
              </div>
            </div>

            {bottomRightBanners.map((banner, i) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                index={i}
                onUpdate={(patch) => updateBanner(banner.id, patch)}
                onRemove={() => removeBanner(banner.id)}
                compact
                showYoutube
              />
            ))}

            <button onClick={() => addRightBanner('right-bottom')}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-pink-400 hover:text-pink-600 transition-colors w-full justify-center"
            ><Plus className="w-4 h-4" /> Add Bottom Right Slide</button>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <button onClick={() => save(() => saveHomepageBanners(banners), 'Banners saved')} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save All Banners'}
            </button>
          </div>
        </div>
      )}

      {/* ─── SECTIONS TAB ────────────────────────────────────────────── */}
      {activeTab === 'sections' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Reorder sections and toggle visibility on the homepage.</p>
          {sections.map((section, i) => (
            <div key={section.id}
              className={`flex items-center gap-4 bg-white dark:bg-gray-800 border rounded-xl px-4 py-3 transition-colors ${section.isVisible ? 'border-gray-200 dark:border-gray-700' : 'border-gray-100 dark:border-gray-800 opacity-60'}`}
            >
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{section.title}</p>
                <p className="text-xs text-gray-400">{section.type}</p>
              </div>
              {section.type === 'deals-under' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Amount:</label>
                  <input type="number" value={section.config?.amount || 5000}
                    onChange={(e) => { const u = [...sections]; u[i].config = { ...u[i].config, amount: Number(e.target.value) }; setSections(u); }}
                    className="w-24 px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100" />
                </div>
              )}
              <div className="flex items-center gap-1">
                <button onClick={() => moveSectionUp(i)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowUp className="w-4 h-4" /></button>
                <button onClick={() => moveSectionDown(i)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><ArrowDown className="w-4 h-4" /></button>
                <button
                  onClick={() => { const u = [...sections]; u[i].isVisible = !u[i].isVisible; setSections(u); }}
                  className={`p-1.5 rounded-lg ${section.isVisible ? 'text-green-600 bg-green-50 dark:bg-green-900/30' : 'text-gray-400 bg-gray-50 dark:bg-gray-700'}`}
                >
                  {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button onClick={() => save(() => saveHomepageSections(sections), 'Section order saved')} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Section Order'}
            </button>
          </div>
        </div>
      )}

      {/* ─── PROMO BANNERS TAB ───────────────────────────────────────── */}
      {activeTab === 'promos' && (
        <div className="space-y-4">
          {promoBanners.map((pb, i) => (
            <div key={pb.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100">Promo Banner #{i + 1}</h3>
                <button onClick={() => setPromoBanners((prev) => prev.filter((_, j) => j !== i))} className="p-1.5 rounded-lg text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input value={pb.title} onChange={(e) => updatePromo(i, { title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">After Section #</label>
                  <input type="number" value={pb.afterSection} min={1} onChange={(e) => updatePromo(i, { afterSection: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div className="sm:col-span-2">
                  <MediaUploadField label="Promo Image (optional)" value={pb.image || ''} onChange={(url) => updatePromo(i, { image: url })} accept="image/*" folder="homepage/promos" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Gradient (e.g. from-blue-600 to-indigo-700)</label>
                  <input value={pb.bgColor || ''} onChange={(e) => updatePromo(i, { bgColor: e.target.value })} placeholder="from-blue-600 to-indigo-700"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Link</label>
                  <input value={pb.link || ''} onChange={(e) => updatePromo(i, { link: e.target.value })} placeholder="/products"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button onClick={() => setPromoBanners((prev) => [...prev, { id: Date.now().toString(), title: 'New Promo', subtitle: '', image: '', bgColor: 'from-blue-600 to-indigo-700', isActive: true, afterSection: 3 }])}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
            ><Plus className="w-4 h-4" /> Add Promo Banner</button>
            <button onClick={() => save(() => savePromoBanners(promoBanners), 'Promo banners saved')} disabled={saving}
              className="ml-auto flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Promo Banners'}
            </button>
          </div>
        </div>
      )}

      {/* ─── FLASH SALE TAB ──────────────────────────────────────────── */}
      {activeTab === 'flash-sale' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Flash Sale Configuration</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Active:</label>
              <button onClick={() => setFlashConfig({ ...flashConfig, isActive: !flashConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flashConfig.isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
              ><span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${flashConfig.isActive ? 'translate-x-6' : 'translate-x-1'}`} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
              <input type="datetime-local" value={flashConfig.endTime ? flashConfig.endTime.slice(0, 16) : ''}
                onChange={(e) => setFlashConfig({ ...flashConfig, endTime: new Date(e.target.value).toISOString() })}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Products marked as &quot;Flash Sale&quot; in the product editor will appear in the Flash Sale section.</p>
          </div>
          <div className="flex justify-end">
            <button onClick={() => save(() => saveFlashSaleConfig(flashConfig), 'Flash sale config saved')} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Flash Sale Config'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
