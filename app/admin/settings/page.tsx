import Link from 'next/link';
import {
  Store,
  FileText,
  Layers,
  ListChecks,
  ShoppingCart,
  CreditCard,
  Users,
  Bell,
  Palette,
  ShieldCheck,
  HardDrive,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe2,
  Home,
} from 'lucide-react';
import { getStoreSettings } from '@/lib/actions/invoice-settings-actions';
import { prisma } from '@/lib/prisma';

const sections = [
  {
    href: '/admin/settings/homepage',
    icon: Home,
    title: 'Homepage Management',
    desc: 'Hero banners, section order, promo banners, and flash sale config',
    color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  {
    href: '/admin/settings/store',
    icon: Store,
    title: 'Store Info',
    desc: 'Business name, address, phone, currency & regional settings',
    color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  {
    href: '/admin/settings/invoice',
    icon: FileText,
    title: 'Invoice & Branding',
    desc: 'Logo, layout designer, footer text, company details on invoices',
    color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  {
    href: '/admin/settings/categories',
    icon: Layers,
    title: 'Categories',
    desc: 'Create and manage product category hierarchy',
    color: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  {
    href: '/admin/settings/spec-templates',
    icon: ListChecks,
    title: 'Spec Templates',
    desc: 'Reusable specification templates for product types',
    color: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
    dot: 'bg-cyan-500',
  },
  {
    href: '/admin/settings/pos',
    icon: ShoppingCart,
    title: 'POS Settings',
    desc: 'Configure point-of-sale terminal, tax, and receipt options',
    color: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    dot: 'bg-green-500',
  },
  {
    href: '/admin/settings/payments',
    icon: CreditCard,
    title: 'Payment Methods',
    desc: 'Cash, card, bKash, Nagad, Rocket and bank transfer settings',
    color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  {
    href: '/admin/settings/staff',
    icon: Users,
    title: 'Staff & Roles',
    desc: 'Manage staff members, salaries and access roles',
    color: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    dot: 'bg-pink-500',
  },
  {
    href: '/admin/settings/notifications',
    icon: Bell,
    title: 'Notifications',
    desc: 'Order, stock, customer and expense alert preferences',
    color: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    dot: 'bg-yellow-500',
  },
  {
    href: '/admin/settings/branding',
    icon: Globe2,
    title: 'Branding & Header',
    desc: 'Site logo, favicon, and top info bar (hotline, delivery offer)',
    color: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  {
    href: '/admin/settings/appearance',
    icon: Palette,
    title: 'Appearance',
    desc: 'Light/dark theme, accent color, sidebar and date format',
    color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  {
    href: '/admin/settings/security',
    icon: ShieldCheck,
    title: 'Security',
    desc: 'Password, two-factor auth and session management',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-500',
  },
  {
    href: '/admin/settings/backup',
    icon: HardDrive,
    title: 'Data Backup',
    desc: 'Export full database backup, restore or selectively delete data',
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-700',
  },
];

export default async function SettingsPage() {
  const [store, categoryCount, staffCount] = await Promise.all([
    getStoreSettings(),
    prisma.category.count(),
    prisma.staff.count().catch(() => 0),
  ]);

  const stats = [
    { label: 'Store Name', value: store.storeName || '—' },
    { label: 'Currency', value: `${store.currency} (${store.currencySymbol})` },
    { label: 'Categories', value: categoryCount.toString() },
    { label: 'Staff Members', value: staffCount.toString() },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage every aspect of your business — store, catalog, operations, and system.
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          All systems normal
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{s.label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          <Zap className="w-3 h-3" />
          All Settings
        </span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-0.5 transition-all" />
              </div>

              {/* Content */}
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">{s.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>

              {/* Active indicator line */}
              <div className={`absolute bottom-0 left-5 right-5 h-0.5 ${s.dot} rounded-full opacity-0 group-hover:opacity-100 transition-opacity`} />
            </Link>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-4">
        Changes in each section are saved independently. Use{' '}
        <Link href="/admin/settings/backup" className="text-gray-600 dark:text-gray-400 underline underline-offset-2 hover:text-gray-900 dark:hover:text-gray-200">
          Data Backup
        </Link>{' '}
        before making large changes.
      </p>
    </div>
  );
}