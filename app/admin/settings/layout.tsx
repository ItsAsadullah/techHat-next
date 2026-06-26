'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Settings,
  ChevronRight,
  Search,
  Building2,
  Package,
  Warehouse,
  ShoppingBag,
  ShoppingCart,
  Wrench,
  DollarSign,
  Users,
  MessageSquare,
  Printer,
  Zap,
  Plug,
  Code2,
  ArrowLeft,
  Command,
} from 'lucide-react';

// ─── Module registry (single source of truth) ─────────────────────────────
export const CONFIG_MODULES = [
  {
    id: 'organization',
    name: 'Organization',
    href: '/admin/settings/organization',
    icon: Building2,
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    description: 'Company info, branches, currency, fiscal year',
    count: 8,
  },
  {
    id: 'products',
    name: 'Products & Catalog',
    href: '/admin/settings/products',
    icon: Package,
    color: 'from-violet-500 to-violet-600',
    bgLight: 'bg-violet-50',
    textColor: 'text-violet-600',
    borderColor: 'border-violet-200',
    description: 'Categories, brands, attributes, spec templates',
    count: 4,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    href: '/admin/settings/inventory',
    icon: Warehouse,
    color: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    description: 'Warehouses, barcode, stock valuation, reorder rules',
    count: 11,
  },
  {
    id: 'sales',
    name: 'Sales',
    href: '/admin/settings/sales',
    icon: ShoppingBag,
    color: 'from-orange-500 to-orange-600',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    description: 'POS, invoices, discounts, tax, return & exchange',
    count: 14,
  },
  {
    id: 'purchase',
    name: 'Purchase',
    href: '/admin/settings/purchase',
    icon: ShoppingCart,
    color: 'from-amber-500 to-amber-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    description: 'Suppliers, GRN, payment terms, purchase approvals',
    count: 9,
  },
  {
    id: 'after-sales',
    name: 'After Sales',
    href: '/admin/settings/after-sales',
    icon: Wrench,
    color: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-200',
    description: 'Warranty, exchange, returns, claim rules',
    count: 10,
  },
  {
    id: 'finance',
    name: 'Finance',
    href: '/admin/settings/finance',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    bgLight: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    description: 'Chart of accounts, tax, receivable, payable',
    count: 12,
  },
  {
    id: 'users',
    name: 'Users & Security',
    href: '/admin/settings/users',
    icon: Users,
    color: 'from-slate-500 to-slate-600',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    description: 'Staff, roles, permissions, audit logs, 2FA',
    count: 11,
  },
  {
    id: 'communication',
    name: 'Communication',
    href: '/admin/settings/communication',
    icon: MessageSquare,
    color: 'from-cyan-500 to-cyan-600',
    bgLight: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    borderColor: 'border-cyan-200',
    description: 'Email, SMS, WhatsApp, Telegram notifications',
    count: 8,
  },
  {
    id: 'printing',
    name: 'Printing',
    href: '/admin/settings/printing',
    icon: Printer,
    color: 'from-indigo-500 to-indigo-600',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    borderColor: 'border-indigo-200',
    description: 'Receipt, label, invoice templates, thermal printer',
    count: 11,
  },
  {
    id: 'automation',
    name: 'Automation',
    href: '/admin/settings/automation',
    icon: Zap,
    color: 'from-purple-500 to-purple-600',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    description: 'Cron jobs, approval workflows, auto backup, webhooks',
    count: 8,
  },
  {
    id: 'integrations',
    name: 'Integrations',
    href: '/admin/settings/integrations',
    icon: Plug,
    color: 'from-pink-500 to-pink-600',
    bgLight: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200',
    description: 'Payment gateway, analytics, courier API, cloud',
    count: 12,
  },
  {
    id: 'developer',
    name: 'Developer',
    href: '/admin/settings/developer',
    icon: Code2,
    color: 'from-gray-500 to-gray-700',
    bgLight: 'bg-gray-50',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-200',
    description: 'Logs, cache, feature flags, system health, backup',
    count: 10,
  },
];

// ─── Layout ───────────────────────────────────────────────────────────────
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Detect if we're inside a module workspace (not on the root)
  const isRoot = pathname === '/admin/settings';

  // Find active module
  const activeModule = CONFIG_MODULES.find(
    (m) => pathname.startsWith(m.href) && m.href !== '/admin/settings'
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f7]">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 relative">
            {/* Left: breadcrumb */}
            <div className="flex items-center gap-3 text-sm shrink-0">
              {!isRoot && (
                <button 
                  onClick={() => router.back()}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors shrink-0"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <Link
                href="/admin/settings"
                className={cn(
                  'flex items-center gap-1.5 font-semibold transition-colors',
                  isRoot
                    ? 'text-gray-900'
                    : 'text-gray-500 hover:text-gray-800'
                )}
              >
                <Settings className="w-4 h-4" />
                Configuration Center
              </Link>
              {activeModule && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                  <span className="font-semibold text-gray-900 hidden sm:inline">{activeModule.name}</span>
                </>
              )}
            </div>

            {/* Center: Large search bar (visible on medium+ screens) */}
            <div className="absolute left-1/2 -translate-x-1/2 w-full max-w-lg hidden md:block">
              <SearchTrigger className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-sm text-gray-500 font-medium transition-all group shadow-sm hover:shadow-md" />
            </div>

            {/* Right: Mobile search trigger & spacing */}
            <div className="flex items-center">
              <div className="md:hidden">
                <SearchTrigger className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-xs text-gray-500 font-medium transition-all group" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Module Sub-nav (shown only inside a module) ── */}
      {activeModule && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-2.5 overflow-x-auto scrollbar-hide">
              <Link
                href="/admin/settings"
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 shrink-0 transition-colors mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                All Modules
              </Link>
              <div className="w-px h-4 bg-gray-200 shrink-0" />
              {CONFIG_MODULES.map((m) => {
                const Icon = m.icon;
                const isActive = pathname.startsWith(m.href);
                return (
                  <Link
                    key={m.id}
                    href={m.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all',
                      isActive
                        ? `bg-gradient-to-r ${m.color} text-white shadow-sm`
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* ── Global Search Modal ── */}
      <GlobalSearchModal />
    </div>
  );
}

// ─── Search Trigger Button ─────────────────────────────────────────────────
function SearchTrigger({ className }: { className?: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-config-search'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('open-config-search'))}
      className={className || "flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg text-xs text-gray-500 font-medium transition-all group"}
    >
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        <span className="hidden sm:inline">Search settings...</span>
      </div>
      <span className="hidden sm:flex items-center gap-0.5 ml-1 bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[10px] font-mono text-gray-400 group-hover:border-gray-300 shadow-sm">
        <Command className="w-3 h-3" />K
      </span>
    </button>
  );
}

// ─── Global Search Index ───────────────────────────────────────────────────
const SEARCH_INDEX = [
  // Organization
  { label: 'Company Information', module: 'Organization', href: '/admin/settings/organization', desc: 'Business name, address, contact' },
  { label: 'Store Info & Shipping', module: 'Organization', href: '/admin/settings/store', desc: 'Currency, address, shipping charges' },
  { label: 'Invoice & Branding', module: 'Organization', href: '/admin/settings/invoice', desc: 'Logo, invoice layout, footer text' },
  { label: 'Site Branding & Header', module: 'Organization', href: '/admin/settings/branding', desc: 'Site logo, topbar hotline' },
  { label: 'Homepage Management', module: 'Organization', href: '/admin/settings/homepage', desc: 'Hero banners, promo sections' },
  // Products
  { label: 'Categories', module: 'Products & Catalog', href: '/admin/settings/categories', desc: 'Product category hierarchy' },
  { label: 'Brands', module: 'Products & Catalog', href: '/admin/settings/brands', desc: 'Manage product brands and logos' },
  { label: 'Attributes', module: 'Products & Catalog', href: '/admin/settings/attributes', desc: 'Product attribute definitions' },
  { label: 'Spec Templates', module: 'Products & Catalog', href: '/admin/settings/spec-templates', desc: 'Reusable specification templates' },
  // Sales
  { label: 'POS Settings', module: 'Sales', href: '/admin/settings/pos', desc: 'Point-of-sale terminal, tax, receipts' },
  { label: 'Payment Methods', module: 'Sales', href: '/admin/settings/payments', desc: 'Cash, bKash, Nagad, card settings' },
  { label: 'Coupons', module: 'Sales', href: '/admin/settings/coupons', desc: 'Discount coupon codes' },
  // Users
  { label: 'Staff & Roles', module: 'Users & Security', href: '/admin/settings/staff', desc: 'Staff members, salaries, roles' },
  { label: 'Security', module: 'Users & Security', href: '/admin/settings/security', desc: 'Password, 2FA, session management' },
  // Communication
  { label: 'Notifications', module: 'Communication', href: '/admin/settings/notifications', desc: 'Order, stock, customer alerts' },
  // Printing
  { label: 'Invoice Templates', module: 'Printing', href: '/admin/settings/invoice', desc: 'Invoice layout and branding' },
  // Integrations
  { label: 'Analytics & Tracking', module: 'Integrations', href: '/admin/settings/analytics', desc: 'Meta Pixel, GA, GTM, TikTok' },
  // Developer
  { label: 'Data Backup', module: 'Developer', href: '/admin/settings/backup', desc: 'Export, restore, or delete data' },
  { label: 'Appearance', module: 'Developer', href: '/admin/settings/appearance', desc: 'Theme, accent color, date format' },
  { label: 'AI Assistant', module: 'Developer', href: '/admin/settings/ai-assistant', desc: 'AI configuration and settings' },
];

// ─── Global Search Modal ───────────────────────────────────────────────────
function GlobalSearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-config-search', handler);
    return () => window.removeEventListener('open-config-search', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  const results = query.length < 1
    ? SEARCH_INDEX.slice(0, 8)
    : SEARCH_INDEX.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.module.toLowerCase().includes(query.toLowerCase()) ||
          item.desc.toLowerCase().includes(query.toLowerCase())
      );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings, modules, features..."
            className="flex-1 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
          />
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-400">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              No settings found for &quot;{query}&quot;
            </div>
          ) : (
            results.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={close}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 group transition-colors"
              >
                <div className="mt-0.5 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <Settings className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
                  <p className="text-xs text-gray-400 truncate">{item.module} · {item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 mt-0.5 shrink-0 transition-colors" />
              </Link>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> navigate</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px]">↵</kbd> open</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 border border-gray-200 rounded px-1 py-0.5 font-mono text-[10px]">ESC</kbd> close</span>
          <span className="ml-auto">{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}
