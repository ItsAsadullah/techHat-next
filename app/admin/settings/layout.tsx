'use client';

import {
  Settings,
  Layers,
  Tags,
  Users,
  Store,
  CreditCard,
  Bell,
  ShieldCheck,
  Palette,
  ShoppingCart,
  ListChecks,
  HardDrive,
  FileText,
  ChevronRight,
  Home,
  Globe2,
  Ticket,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsNav = [
  {
    group: 'Business',
    items: [
      { name: 'General', href: '/admin/settings', icon: Settings, exact: true },
      { name: 'Store Info', href: '/admin/settings/store', icon: Store },
      { name: 'Invoice & Branding', href: '/admin/settings/invoice', icon: FileText },
      { name: 'Homepage', href: '/admin/settings/homepage', icon: Home },
      { name: 'Branding & Header', href: '/admin/settings/branding', icon: Globe2 },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { name: 'Categories', href: '/admin/settings/categories', icon: Layers },
      { name: 'Brands', href: '/admin/settings/brands', icon: Tags },
      { name: 'Spec Templates', href: '/admin/settings/spec-templates', icon: ListChecks },
    ],
  },
  {
    group: 'Operations',
    items: [
      { name: 'POS Settings', href: '/admin/settings/pos', icon: ShoppingCart },
      { name: 'Payment Methods', href: '/admin/settings/payments', icon: CreditCard },
      { name: 'Staff & Roles', href: '/admin/settings/staff', icon: Users },
      { name: 'Coupons', href: '/admin/settings/coupons', icon: Ticket },
    ],
  },
  {
    group: 'System',
    items: [
      { name: 'Notifications', href: '/admin/settings/notifications', icon: Bell },
      { name: 'Analytics & Tracking', href: '/admin/settings/analytics', icon: BarChart3 },
      { name: 'Appearance', href: '/admin/settings/appearance', icon: Palette },
      { name: 'Security', href: '/admin/settings/security', icon: ShieldCheck },
      { name: 'Data Backup', href: '/admin/settings/backup', icon: HardDrive },
    ],
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f8f9fb] dark:bg-gray-950">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-col">
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <Settings className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none">Settings</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Configuration & Preferences</p>
            </div>
          </div>
        </div>

        {/* Nav Groups */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {settingsNav.map((group) => (
            <div key={group.group}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-1.5">
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                        isActive
                          ? 'bg-gray-900 dark:bg-gray-700 text-white font-semibold'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                      )}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600')} />
                      <span className="flex-1 truncate">{item.name}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/60 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">TechHat Admin</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">v1.0.0 &bull; All systems operational</p>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Nav ── */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex overflow-x-auto scrollbar-hide px-2 py-1.5 gap-1">
          {settingsNav.flatMap(g => g.items).map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all',
                  isActive
                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 p-4 pt-18 lg:p-8 lg:pt-8 bg-[#f8f9fb] dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
