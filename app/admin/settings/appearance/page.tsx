'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Palette, Save, Loader2, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const THEMES = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'system', label: 'System', icon: Monitor },
];

const ACCENT_COLORS = [
  { key: 'blue', label: 'Blue', bg: '#2563EB' },
  { key: 'indigo', label: 'Indigo', bg: '#4F46E5' },
  { key: 'violet', label: 'Violet', bg: '#7C3AED' },
  { key: 'emerald', label: 'Emerald', bg: '#059669' },
  { key: 'orange', label: 'Orange', bg: '#EA580C' },
  { key: 'rose', label: 'Rose', bg: '#E11D48' },
];

export default function AppearanceSettingsPage() {
  const { setTheme, theme: currentTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    theme: 'light',
    accentColor: 'blue',
    sidebarCompact: false,
    showBreadcrumbs: true,
    animationsEnabled: true,
    tableRowsPerPage: '20',
    dateFormat: 'DD MMM YYYY',
  });

  useEffect(() => {
    const s = localStorage.getItem('appearanceSettings');
    if (s) {
      const parsed = JSON.parse(s);
      setSettings(parsed);
      if (parsed.theme) setTheme(parsed.theme);
    }
  }, []);

  // Keep settings.theme in sync with the real next-themes value
  useEffect(() => {
    if (currentTheme && currentTheme !== settings.theme) {
      setSettings((prev) => ({ ...prev, theme: currentTheme }));
    }
  }, [currentTheme]);

  function handleThemeChange(theme: string) {
    setSettings({ ...settings, theme });
    setTheme(theme); // Apply immediately
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    localStorage.setItem('appearanceSettings', JSON.stringify(settings));
    setTheme(settings.theme); // Ensure theme is applied
    setSaving(false);
    toast.success('Appearance settings saved');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-100 rounded-xl"><Palette className="w-5 h-5 text-pink-600" /></div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Appearance</h2>
            <p className="text-sm text-gray-500">Customize the admin panel look & feel</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-pink-600 hover:bg-pink-700 text-white rounded-xl gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </Button>
      </div>

      {/* Theme */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Color Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => handleThemeChange(t.key)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition',
                  settings.theme === t.key
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600',
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Accent Color */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Accent Color</h3>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.key}
              onClick={() => setSettings({ ...settings, accentColor: c.key })}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition',
                settings.accentColor === c.key ? 'border-gray-800' : 'border-transparent hover:border-gray-300',
              )}
            >
              <span className="w-5 h-5 rounded-full block" style={{ background: c.bg }} />
              <span className="text-sm text-gray-700">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* UI Preferences */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">UI Preferences</h3>
        {[
          { key: 'sidebarCompact', label: 'Compact sidebar', desc: 'Show icons only in sidebar' },
          { key: 'showBreadcrumbs', label: 'Show breadcrumbs', desc: 'Display navigation path at top of pages' },
          { key: 'animationsEnabled', label: 'Enable animations', desc: 'Smooth transitions & motion effects' },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3.5 border border-gray-200 rounded-xl hover:bg-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
            <Switch
              checked={!!settings[item.key as keyof typeof settings]}
              onCheckedChange={(v) => setSettings({ ...settings, [item.key]: v })}
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Table & Format */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tables & Formatting</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Rows per page (tables)</Label>
            <select
              value={settings.tableRowsPerPage}
              onChange={(e) => setSettings({ ...settings, tableRowsPerPage: e.target.value })}
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {['10', '20', '25', '50', '100'].map((v) => (
                <option key={v} value={v}>{v} rows</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Date Format</Label>
            <select
              value={settings.dateFormat}
              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
              className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DD MMM YYYY">20 Feb 2026</option>
              <option value="DD/MM/YYYY">20/02/2026</option>
              <option value="MM/DD/YYYY">02/20/2026</option>
              <option value="YYYY-MM-DD">2026-02-20</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
