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
  ArrowLeft,
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

  const isOverview = pathname === '/admin/inventory';
  const activeTab = NAV_ITEMS.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href)
  );
  const isNestedSubpage = activeTab && !activeTab.exact && pathname !== activeTab.href;
  const backHref = isNestedSubpage ? activeTab.href : '/admin/inventory';
  const backLabel = isNestedSubpage ? `Back to ${activeTab.name}` : 'Back to Overview';

  return (
    <div className="flex flex-col space-y-6 pb-16 max-w-[1600px] w-full mx-auto">
      {/* Unified Professional Top Command Bar & Navigation */}
      <div
        role="region"
        aria-label="Inventory command bar"
        className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden print:hidden"
      >
        {/* Top Row: Back Button, Identity, Breadcrumb & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            {!isOverview && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-8 px-2.5 text-xs font-semibold gap-1.5 shrink-0 bg-muted/40 hover:bg-muted"
              >
                <Link href={backHref} title={backLabel}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{backLabel}</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            )}

            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Boxes className="h-4.5 w-4.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm flex-wrap">
                <Link
                  href="/admin/inventory"
                  className="font-bold text-foreground hover:text-indigo-600 transition-colors truncate"
                >
                  Inventory & Warehousing
                </Link>
                {activeTab && !activeTab.exact && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Link
                      href={activeTab.href}
                      className={cn(
                        'font-semibold transition-colors truncate',
                        isNestedSubpage
                          ? 'text-muted-foreground hover:text-foreground'
                          : 'text-indigo-600 dark:text-indigo-400'
                      )}
                    >
                      {activeTab.name}
                    </Link>
                  </>
                )}
                {isNestedSubpage && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">
                      {pathname.endsWith('/new') ? 'Create New' : 'Details'}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground hidden md:block truncate">
                Enterprise stock control, multi-warehouse transfers, reconciliations & MAC valuation
              </p>
            </div>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden xl:flex items-center gap-1.5 mr-1">
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
        <nav
          className="flex items-center gap-1 overflow-x-auto px-3 sm:px-4 py-2 bg-muted/20 scrollbar-none"
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
