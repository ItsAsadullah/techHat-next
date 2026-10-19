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
  Boxes,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InventoryInstructions } from './inventory-instructions';

const NAV_ITEMS = [
  { name: 'Overview', href: '/admin/inventory', icon: LayoutDashboard, exact: true },
  { name: 'Stock Ledger', href: '/admin/inventory/ledger', icon: History, exact: false },
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

  const activeTab = NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 dark:bg-background pb-20">
      {/* Unified Professional Top Header & Navigation Bar */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-xs print:hidden">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          {/* Top Row: Identity, Breadcrumb & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-border/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Boxes className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-sm">
                  <Link
                    href="/admin/inventory"
                    className="font-bold text-foreground hover:text-indigo-600 transition-colors truncate"
                  >
                    Inventory & Warehousing
                  </Link>
                  {activeTab && !activeTab.exact && (
                    <>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {activeTab.name}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground hidden sm:block truncate">
                  Enterprise stock control, multi-warehouse transfers, reconciliations & MAC valuation
                </p>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden lg:flex items-center gap-1.5 mr-1">
                <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 border-border/80">
                  <Link href="/admin/inventory/grn/new">
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    Receive GRN
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 border-border/80">
                  <Link href="/admin/inventory/transfers/new">
                    <ArrowLeftRight className="h-3.5 w-3.5 text-blue-600" />
                    Transfer
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="h-8 text-xs gap-1.5 border-border/80">
                  <Link href="/admin/inventory/adjustments/new">
                    <ClipboardCheck className="h-3.5 w-3.5 text-amber-600" />
                    Count / Adjust
                  </Link>
                </Button>
              </div>
              <InventoryInstructions />
            </div>
          </div>

          {/* Bottom Row: Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none" aria-label="Inventory navigation">
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
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
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
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 min-w-0">
        {children}
      </main>
    </div>
  );
}
