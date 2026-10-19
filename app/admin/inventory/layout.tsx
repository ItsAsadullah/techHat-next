'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Warehouse, Settings2, Replace, ArrowLeftRight, TrendingUp } from 'lucide-react';

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/admin/inventory', icon: LayoutDashboard, exact: true },
    { name: 'Stock Ledger', href: '/admin/inventory/ledger', icon: Settings2, exact: false },
    { name: 'Warehouses', href: '/admin/inventory/warehouses', icon: Warehouse, exact: false },
    { name: 'Goods Receive (GRN)', href: '/admin/inventory/grn', icon: Settings2, exact: false },
    { name: 'Stock Transfers', href: '/admin/inventory/transfers', icon: ArrowLeftRight, exact: false },
    { name: 'Stock Adjustments', href: '/admin/inventory/adjustments', icon: Replace, exact: false },
    { name: 'Valuation', href: '/admin/inventory/valuation', icon: TrendingUp, exact: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-muted/10 pb-20">
      <div className="bg-background border-b px-4 sm:px-6 py-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory & Warehousing</h1>
          <p className="text-muted-foreground text-sm">Manage your stock, warehouses, and incoming goods.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-30 overflow-x-auto print:hidden">
        <nav className="flex space-x-1" aria-label="Tabs">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
              
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 p-4 sm:p-6 min-w-0">
        {children}
      </div>
    </div>
  );
}
