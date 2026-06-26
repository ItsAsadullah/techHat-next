import Link from 'next/link';
import {
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
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';
import { prisma } from '@/lib/prisma';
import { ConfigSearchTrigger } from './config-search-trigger';

// ─── Module Definitions ────────────────────────────────────────────────────
const MODULES = [
  {
    id: 'organization',
    name: 'Organization',
    href: '/admin/settings/organization',
    icon: Building2,
    gradient: 'from-blue-500 to-blue-700',
    lightBg: 'bg-blue-50 group-hover:bg-blue-100',
    textColor: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
    shadowHover: 'hover:shadow-blue-100',
    description: 'Company profile, branches, currency, fiscal year, business hours',
    sections: ['Company Info', 'Store Details', 'Invoice & Branding', 'Homepage', 'Site Branding'],
    configured: true,
  },
  {
    id: 'products',
    name: 'Products & Catalog',
    href: '/admin/settings/products',
    icon: Package,
    gradient: 'from-violet-500 to-violet-700',
    lightBg: 'bg-violet-50 group-hover:bg-violet-100',
    textColor: 'text-violet-600',
    borderHover: 'hover:border-violet-300',
    shadowHover: 'hover:shadow-violet-100',
    description: 'Categories, brands, attributes, spec templates, warranty types',
    sections: ['Categories', 'Brands', 'Attributes', 'Spec Templates'],
    configured: true,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    href: '/admin/settings/inventory',
    icon: Warehouse,
    gradient: 'from-emerald-500 to-emerald-700',
    lightBg: 'bg-emerald-50 group-hover:bg-emerald-100',
    textColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-300',
    shadowHover: 'hover:shadow-emerald-100',
    description: 'Warehouses, barcode, label printing, stock valuation, reorder rules',
    sections: ['Warehouses', 'Barcode', 'Stock Valuation', 'Reorder Rules', 'Stock Alerts'],
    configured: false,
  },
  {
    id: 'sales',
    name: 'Sales',
    href: '/admin/settings/sales',
    icon: ShoppingBag,
    gradient: 'from-orange-500 to-orange-700',
    lightBg: 'bg-orange-50 group-hover:bg-orange-100',
    textColor: 'text-orange-600',
    borderHover: 'hover:border-orange-300',
    shadowHover: 'hover:shadow-orange-100',
    description: 'POS, invoices, discount rules, tax, returns, exchange, loyalty',
    sections: ['POS Settings', 'Payment Methods', 'Coupons', 'Tax Rules', 'Return Rules'],
    configured: true,
  },
  {
    id: 'purchase',
    name: 'Purchase',
    href: '/admin/settings/purchase',
    icon: ShoppingCart,
    gradient: 'from-amber-500 to-amber-700',
    lightBg: 'bg-amber-50 group-hover:bg-amber-100',
    textColor: 'text-amber-600',
    borderHover: 'hover:border-amber-300',
    shadowHover: 'hover:shadow-amber-100',
    description: 'Supplier groups, GRN settings, payment terms, purchase approvals',
    sections: ['Supplier Groups', 'Purchase Orders', 'GRN Settings', 'Payment Terms'],
    configured: false,
  },
  {
    id: 'after-sales',
    name: 'After Sales',
    href: '/admin/settings/after-sales',
    icon: Wrench,
    gradient: 'from-rose-500 to-rose-700',
    lightBg: 'bg-rose-50 group-hover:bg-rose-100',
    textColor: 'text-rose-600',
    borderHover: 'hover:border-rose-300',
    shadowHover: 'hover:shadow-rose-100',
    description: 'Warranty types, exchange rules, return reasons, courier settings',
    sections: ['Warranty', 'Exchange', 'Returns', 'Claim Rules', 'Courier'],
    configured: false,
  },
  {
    id: 'finance',
    name: 'Finance',
    href: '/admin/settings/finance',
    icon: DollarSign,
    gradient: 'from-green-500 to-green-700',
    lightBg: 'bg-green-50 group-hover:bg-green-100',
    textColor: 'text-green-600',
    borderHover: 'hover:border-green-300',
    shadowHover: 'hover:shadow-green-100',
    description: 'Chart of accounts, tax configuration, receivable, payable, fiscal closing',
    sections: ['Chart of Accounts', 'Tax Config', 'Receivable', 'Payable', 'Fiscal Year'],
    configured: false,
  },
  {
    id: 'users',
    name: 'Users & Security',
    href: '/admin/settings/users',
    icon: Users,
    gradient: 'from-slate-500 to-slate-700',
    lightBg: 'bg-slate-50 group-hover:bg-slate-100',
    textColor: 'text-slate-600',
    borderHover: 'hover:border-slate-300',
    shadowHover: 'hover:shadow-slate-100',
    description: 'Staff, roles, permissions, 2FA, session settings, audit logs',
    sections: ['Staff', 'Roles', 'Security', 'Permissions', 'Audit Logs'],
    configured: true,
  },
  {
    id: 'communication',
    name: 'Communication',
    href: '/admin/settings/communication',
    icon: MessageSquare,
    gradient: 'from-cyan-500 to-cyan-700',
    lightBg: 'bg-cyan-50 group-hover:bg-cyan-100',
    textColor: 'text-cyan-600',
    borderHover: 'hover:border-cyan-300',
    shadowHover: 'hover:shadow-cyan-100',
    description: 'Email, SMS, WhatsApp, Telegram, notification rules and templates',
    sections: ['Notifications', 'Email', 'SMS', 'WhatsApp', 'Telegram'],
    configured: true,
  },
  {
    id: 'printing',
    name: 'Printing',
    href: '/admin/settings/printing',
    icon: Printer,
    gradient: 'from-indigo-500 to-indigo-700',
    lightBg: 'bg-indigo-50 group-hover:bg-indigo-100',
    textColor: 'text-indigo-600',
    borderHover: 'hover:border-indigo-300',
    shadowHover: 'hover:shadow-indigo-100',
    description: 'Receipt printer, label printer, invoice templates, ESC/POS settings',
    sections: ['Invoice Templates', 'Receipt Printer', 'Label Printer', 'Thermal', 'Barcode'],
    configured: true,
  },
  {
    id: 'automation',
    name: 'Automation',
    href: '/admin/settings/automation',
    icon: Zap,
    gradient: 'from-purple-500 to-purple-700',
    lightBg: 'bg-purple-50 group-hover:bg-purple-100',
    textColor: 'text-purple-600',
    borderHover: 'hover:border-purple-300',
    shadowHover: 'hover:shadow-purple-100',
    description: 'Scheduled jobs, approval workflows, auto backup, webhook events',
    sections: ['Cron Jobs', 'Approval Workflow', 'Auto Backup', 'Webhooks'],
    configured: false,
  },
  {
    id: 'integrations',
    name: 'Integrations',
    href: '/admin/settings/integrations',
    icon: Plug,
    gradient: 'from-pink-500 to-pink-700',
    lightBg: 'bg-pink-50 group-hover:bg-pink-100',
    textColor: 'text-pink-600',
    borderHover: 'hover:border-pink-300',
    shadowHover: 'hover:shadow-pink-100',
    description: 'Payment gateway, analytics, courier API, Google, Meta, cloud storage',
    sections: ['Analytics', 'Payment APIs', 'Courier API', 'Social', 'Cloud'],
    configured: true,
  },
  {
    id: 'developer',
    name: 'Developer',
    href: '/admin/settings/developer',
    icon: Code2,
    gradient: 'from-gray-600 to-gray-800',
    lightBg: 'bg-gray-50 group-hover:bg-gray-100',
    textColor: 'text-gray-700',
    borderHover: 'hover:border-gray-400',
    shadowHover: 'hover:shadow-gray-100',
    description: 'System health, logs, cache, feature flags, data backup, diagnostics',
    sections: ['Data Backup', 'System Logs', 'Cache', 'Feature Flags', 'Appearance'],
    configured: true,
  },
];

export default async function ConfigurationCenterPage() {
  const [store, categoryCount, brandCount, staffCount] = await Promise.all([
    getStoreSettings(),
    prisma.category.count(),
    prisma.brand.count(),
    prisma.staff.count().catch(() => 0),
  ]);

  const configuredCount = MODULES.filter((m) => m.configured).length;
  const totalSections = MODULES.reduce((acc, m) => acc + m.sections.length, 0);

  return (
    <div className="space-y-10">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl px-8 py-10 text-white shadow-xl">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-8 -right-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
        </div>

        <div className="relative">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/20 text-xs font-semibold">
                  <Sparkles className="w-3 h-3" />
                  Enterprise Configuration Center
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                TechHat ERP Settings
              </h1>
              <p className="text-gray-300 text-sm sm:text-base max-w-lg">
                Central workspace to configure every module of TechHat ERP — from catalog and sales to finance, integrations, and automation.
              </p>
            </div>

          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Modules', value: MODULES.length, sub: 'configuration areas' },
              { label: 'Configured', value: configuredCount, sub: `of ${MODULES.length} ready` },
              { label: 'Categories', value: categoryCount, sub: 'product categories' },
              { label: 'Brands', value: brandCount, sub: 'active brands' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl px-4 py-3 border border-white/10">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs font-semibold text-white/70 mt-0.5">{stat.label}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section Heading ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configuration Modules</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {MODULES.length} modules · {totalSections} configuration sections · Click any module to begin
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-green-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Configured
          </span>
          <span className="flex items-center gap-1.5 text-amber-500 font-semibold">
            <AlertCircle className="w-3.5 h-3.5" /> Needs Setup
          </span>
        </div>
      </div>

      {/* ── Module Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.id}
              href={mod.href}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 ${mod.borderHover} ${mod.shadowHover} hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center shadow-md`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {/* Status badge */}
                {mod.configured ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Setup
                  </span>
                )}
              </div>

              {/* Module name */}
              <h3 className="text-base font-bold text-gray-900 mb-1.5 leading-tight">{mod.name}</h3>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed flex-1 mb-4">{mod.description}</p>

              {/* Section pills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {mod.sections.slice(0, 3).map((s) => (
                  <span key={s} className={`text-[10px] font-semibold ${mod.textColor} ${mod.lightBg} px-2 py-0.5 rounded-md border border-transparent transition-colors`}>
                    {s}
                  </span>
                ))}
                {mod.sections.length > 3 && (
                  <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
                    +{mod.sections.length - 3} more
                  </span>
                )}
              </div>

              {/* Open arrow */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-400">{mod.sections.length} sections</span>
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                  Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Quick Access Row ── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Access — Frequently Used</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'POS Settings', href: '/admin/settings/pos', color: 'text-orange-500' },
            { label: 'Brands', href: '/admin/settings/brands', color: 'text-violet-500' },
            { label: 'Categories', href: '/admin/settings/categories', color: 'text-violet-500' },
            { label: 'Staff', href: '/admin/settings/staff', color: 'text-slate-500' },
            { label: 'Invoice', href: '/admin/settings/invoice', color: 'text-blue-500' },
            { label: 'Backup', href: '/admin/settings/backup', color: 'text-gray-500' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center text-center px-3 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 transition-all hover:border-gray-300"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <p className="text-center text-xs text-gray-400 pb-4">
        TechHat ERP Configuration Center · {store.storeName || 'Your Store'} · v1.0
      </p>
    </div>
  );
}
