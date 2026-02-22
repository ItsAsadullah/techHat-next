'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Settings2,
  Layout,
  Megaphone,
  Zap,
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
  getHomepageBanners,
  saveHomepageBanners,
  getHomepageSections,
  saveHomepageSections,
  getPromoBanners,
  savePromoBanners,
  getFlashSaleConfig,
  saveFlashSaleConfig,
} from '@/lib/actions/homepage-actions';

export default function AdminHomepagePage() {
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
          getHomepageBanners(),
          getHomepageSections(),
          getPromoBanners(),
          getFlashSaleConfig(),
        ]);
        setBanners(b.length ? b : DEFAULT_BANNERS);
        setSections(s.length ? s : DEFAULT_HOMEPAGE_SECTIONS);
        setPromoBanners(p.length ? p : DEFAULT_PROMO_BANNERS);
        setFlashConfig(f);
      } catch (err) {
        toast.error('Failed to load homepage settings');
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSaveBanners = async () => {
    setSaving(true);
    const result = await saveHomepageBanners(banners);
    if (result.success) toast.success('Banners saved');
    else toast.error('Failed to save banners');
    setSaving(false);
  };

  const handleSaveSections = async () => {
    setSaving(true);
    const result = await saveHomepageSections(sections);
    if (result.success) toast.success('Sections saved');
    else toast.error('Failed to save sections');
    setSaving(false);
  };

  const handleSavePromos = async () => {
    setSaving(true);
    const result = await savePromoBanners(promoBanners);
    if (result.success) toast.success('Promo banners saved');
    else toast.error('Failed to save promo banners');
    setSaving(false);
  };

  const handleSaveFlash = async () => {
    setSaving(true);
    const result = await saveFlashSaleConfig(flashConfig);
    if (result.success) toast.success('Flash sale config saved');
    else toast.error('Failed to save');
    setSaving(false);
  };

  const addBanner = () => {
    setBanners([
      ...banners,
      {
        id: Date.now().toString(),
        title: 'New Banner',
        subtitle: 'Banner subtitle',
        image: '',
        ctaText: 'Shop Now',
        ctaLink: '/products',
        isActive: true,
        order: banners.length + 1,
      },
    ]);
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const updated = [...sections];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updated.forEach((s, i) => (s.order = i + 1));
    setSections(updated);
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const updated = [...sections];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    updated.forEach((s, i) => (s.order = i + 1));
    setSections(updated);
  };

  const tabs = [
    { id: 'banners' as const, label: 'Hero Banners', icon: ImageIcon },
    { id: 'sections' as const, label: 'Sections', icon: Layout },
    { id: 'promos' as const, label: 'Promo Banners', icon: Megaphone },
    { id: 'flash-sale' as const, label: 'Flash Sale', icon: Zap },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Homepage Management</h1>
        <p className="text-gray-500 text-sm mt-1">
          Control hero banners, section order, visibility, and promotional content
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── BANNERS TAB ──────────────────────────────────── */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          {banners.map((banner, i) => (
            <div key={banner.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Banner #{i + 1}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const updated = [...banners];
                      updated[i].isActive = !updated[i].isActive;
                      setBanners(updated);
                    }}
                    className={`p-1.5 rounded-lg ${banner.isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
                  >
                    {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setBanners(banners.filter((_, j) => j !== i))}
                    className="p-1.5 rounded-lg text-red-500 bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    value={banner.title}
                    onChange={(e) => {
                      const updated = [...banners];
                      updated[i].title = e.target.value;
                      setBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Subtitle</label>
                  <input
                    value={banner.subtitle || ''}
                    onChange={(e) => {
                      const updated = [...banners];
                      updated[i].subtitle = e.target.value;
                      setBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                  <input
                    value={banner.image}
                    onChange={(e) => {
                      const updated = [...banners];
                      updated[i].image = e.target.value;
                      setBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CTA Text</label>
                  <input
                    value={banner.ctaText || ''}
                    onChange={(e) => {
                      const updated = [...banners];
                      updated[i].ctaText = e.target.value;
                      setBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">CTA Link</label>
                  <input
                    value={banner.ctaLink || ''}
                    onChange={(e) => {
                      const updated = [...banners];
                      updated[i].ctaLink = e.target.value;
                      setBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Badge Text</label>
                  <input
                    value={banner.badge || ''}
                    onChange={(e) => {
                      const updated = [...banners];
                      updated[i].badge = e.target.value;
                      setBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    placeholder="e.g. New, Sale, Limited"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button
              onClick={addBanner}
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Banner
            </button>
            <button
              onClick={handleSaveBanners}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors ml-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Banners'}
            </button>
          </div>
        </div>
      )}

      {/* ─── SECTIONS TAB ─────────────────────────────────── */}
      {activeTab === 'sections' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 mb-4">
            Drag sections to reorder. Toggle visibility to show/hide on the homepage.
          </p>
          {sections.map((section, i) => (
            <div
              key={section.id}
              className={`flex items-center gap-4 bg-white border rounded-xl px-4 py-3 transition-colors ${
                section.isVisible ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{section.title}</p>
                <p className="text-xs text-gray-400">{section.type}</p>
              </div>
              {section.type === 'deals-under' && (
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Amount:</label>
                  <input
                    type="number"
                    value={section.config?.amount || 5000}
                    onChange={(e) => {
                      const updated = [...sections];
                      updated[i].config = { ...updated[i].config, amount: Number(e.target.value) };
                      setSections(updated);
                    }}
                    className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              )}
              <div className="flex items-center gap-1">
                <button onClick={() => moveSectionUp(i)} className="p-1.5 text-gray-400 hover:text-gray-600">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveSectionDown(i)} className="p-1.5 text-gray-400 hover:text-gray-600">
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const updated = [...sections];
                    updated[i].isVisible = !updated[i].isVisible;
                    setSections(updated);
                  }}
                  className={`p-1.5 rounded-lg ${section.isVisible ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}
                >
                  {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSections}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Section Order'}
            </button>
          </div>
        </div>
      )}

      {/* ─── PROMO BANNERS TAB ────────────────────────────── */}
      {activeTab === 'promos' && (
        <div className="space-y-4">
          {promoBanners.map((pb, i) => (
            <div key={pb.id} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Promo Banner #{i + 1}</h3>
                <button
                  onClick={() => setPromoBanners(promoBanners.filter((_, j) => j !== i))}
                  className="p-1.5 rounded-lg text-red-500 bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                  <input
                    value={pb.title}
                    onChange={(e) => {
                      const updated = [...promoBanners];
                      updated[i].title = e.target.value;
                      setPromoBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">After Section #</label>
                  <input
                    type="number"
                    value={pb.afterSection}
                    onChange={(e) => {
                      const updated = [...promoBanners];
                      updated[i].afterSection = Number(e.target.value);
                      setPromoBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Gradient (e.g. from-blue-600 to-indigo-700)
                  </label>
                  <input
                    value={pb.bgColor || ''}
                    onChange={(e) => {
                      const updated = [...promoBanners];
                      updated[i].bgColor = e.target.value;
                      setPromoBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Link</label>
                  <input
                    value={pb.link || ''}
                    onChange={(e) => {
                      const updated = [...promoBanners];
                      updated[i].link = e.target.value;
                      setPromoBanners(updated);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setPromoBanners([
                  ...promoBanners,
                  {
                    id: Date.now().toString(),
                    title: 'New Promo',
                    subtitle: '',
                    image: '',
                    bgColor: 'from-blue-600 to-indigo-700',
                    isActive: true,
                    afterSection: 3,
                  },
                ])
              }
              className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Promo Banner
            </button>
            <button
              onClick={handleSavePromos}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors ml-auto"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Promo Banners'}
            </button>
          </div>
        </div>
      )}

      {/* ─── FLASH SALE TAB ───────────────────────────────── */}
      {activeTab === 'flash-sale' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-800">Flash Sale Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Active:</label>
              <button
                onClick={() => setFlashConfig({ ...flashConfig, isActive: !flashConfig.isActive })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  flashConfig.isActive ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    flashConfig.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="datetime-local"
                value={flashConfig.endTime ? flashConfig.endTime.slice(0, 16) : ''}
                onChange={(e) =>
                  setFlashConfig({
                    ...flashConfig,
                    endTime: new Date(e.target.value).toISOString(),
                  })
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>

            <p className="text-sm text-gray-500">
              Products marked as &quot;Flash Sale&quot; in the product editor will appear in the Flash Sale section.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveFlash}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Flash Sale Config'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
