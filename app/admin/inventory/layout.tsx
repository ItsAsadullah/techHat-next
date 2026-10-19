'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Warehouse,
  History,
  PackageCheck,
  ArrowLeftRight,
  ClipboardCheck,
  TrendingUp,
  Scale,
} from 'lucide-react';
import { InventoryInstructions } from './inventory-instructions';

const NAV_ITEMS = [
  { name: 'Overview', href: '/admin/inventory', icon: LayoutDashboard, exact: true },
  { name: 'Stock Ledger', href: '/admin/inventory/ledger', icon: History, exact: false },
  { name: 'হিসাব মেলানো (Reconcile)', href: '/admin/inventory/reconciliation', icon: Scale, exact: false },
  { name: 'Warehouses', href: '/admin/inventory/warehouses', icon: Warehouse, exact: false },
  { name: 'Goods Receive (GRN)', href: '/admin/inventory/grn', icon: PackageCheck, exact: false },
  { name: 'Stock Transfers', href: '/admin/inventory/transfers', icon: ArrowLeftRight, exact: false },
  { name: 'Stock Adjustments', href: '/admin/inventory/adjustments', icon: ClipboardCheck, exact: false },
  { name: 'Valuation (MAC)', href: '/admin/inventory/valuation', icon: TrendingUp, exact: false },
];

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col space-y-5 pb-16 max-w-[1600px] w-full mx-auto">
      {/* Single Unified Navigation Tab Bar */}
      <div
        role="region"
        aria-label="Inventory navigation bar"
        className="bg-card border border-border/80 rounded-xl shadow-xs px-3 py-2 flex items-center justify-between gap-3 print:hidden"
      >
        <nav
          className="flex items-center gap-1 overflow-x-auto scrollbar-none"
          aria-label="Inventory navigation"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group relative px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 pl-2 border-l border-border/60">
          <InventoryInstructions />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
