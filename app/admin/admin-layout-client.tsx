'use client';

import { useEffect, useState, startTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useBranding } from '@/lib/context/branding-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  CreditCard,
  BarChart3,
  Store,
  Wallet,
  ScanLine,
  X,
  Star,
  Sun,
  Moon,
  ChevronRight,
  Warehouse,
  Users,
  BookOpen,
  RotateCcw,
  Shield,
  Activity,
  Sparkles,
  ChevronLeft,
  FileText,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GlobalScannerProvider, useGlobalScanner } from '@/components/admin/global-scanner-provider';
import usePerformanceMonitor from '@/lib/hooks/use-performance-monitor';
import { ErpCopilot } from '@/components/admin/erp-copilot';

// Programmatically lock body scroll and hide main header for Admin
function AdminBodyLock({ isPOS }: { isPOS: boolean }) {
  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    // Lock outer main layout wrapper to exactly 100dvh and hide its overflow to prevent double scrollbars
    const outerMain = document.querySelector('main.min-h-screen');
    const originalMainHeight = outerMain ? (outerMain as HTMLElement).style.height : '';
    const originalMainOverflow = outerMain ? (outerMain as HTMLElement).style.overflow : '';
    if (outerMain) {
      (outerMain as HTMLElement).style.height = '100dvh';
      (outerMain as HTMLElement).style.overflow = 'hidden';
    }
    
    // Hide storefront header only for POS if needed, but since NavbarWrapper returns null, we can just hide it globally for safety
    const storeHeader = document.querySelector('header.sticky.top-0.z-\\[60\\]') || document.querySelector('header.sticky.top-0');
    const originalDisplay = storeHeader ? (storeHeader as HTMLElement).style.display : '';
    if (storeHeader) (storeHeader as HTMLElement).style.display = 'none';

    // Fix for mobile keyboard causing the page to scroll up and get stuck
    const handleFocusOut = () => {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
      }, 50);
    };
    
    window.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      if (outerMain) {
        (outerMain as HTMLElement).style.height = originalMainHeight;
        (outerMain as HTMLElement).style.overflow = originalMainOverflow;
      }
      if (storeHeader) (storeHeader as HTMLElement).style.display = originalDisplay;
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, [isPOS]);
  return null;
}

// ── Scanner Status Widget ──────────────────────────────────────────────────────
function ScannerStatus() {
  const { isConnected, scannerUrl, startSession, stopSession } = useGlobalScanner();
  const [isOn, setIsOn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    if (toggling) return;
    setToggling(true);
    if (isOn) {
      stopSession();
      setIsOn(false);
      setIsOpen(false);
    } else {
      await startSession();
      setIsOn(true);
      setIsOpen(true);
    }
    setToggling(false);
  };

  return (
    <>
      <div className="hidden sm:flex items-center gap-1.5">
        {(isOn || toggling) && (
          <span className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded-full hidden sm:inline",
            toggling ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600"
              : isConnected ? "bg-green-100 dark:bg-green-900/40 text-green-700"
              : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700"
          )}>
            {toggling ? '⟳' : isConnected ? '●' : '○'}
          </span>
        )}
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full border transition-colors duration-200 focus:outline-none",
            toggling ? "bg-blue-400 border-blue-400 cursor-wait"
              : isOn ? "bg-blue-600 border-blue-600"
              : "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          )}
        >
          <span className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200",
            isOn || toggling ? "translate-x-4" : "translate-x-0.5"
          )} />
        </button>
        <button
          onClick={() => isOn && setIsOpen(v => !v)}
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            isOn ? "text-blue-600 dark:text-blue-400" : "text-gray-400 cursor-default"
          )}
        >
          <ScanLine className="w-4 h-4" />
          <span className="hidden sm:inline">Scanner</span>
        </button>
      </div>

      {isOpen && isOn && (
        <div className="fixed top-14 right-3 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 z-[9999]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-blue-600" /> Mobile Scanner
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          {isConnected ? (
            <div className="text-center py-3 space-y-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <ScanLine className="w-5 h-5" />
              </div>
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Mobile Connected</p>
              <button onClick={() => { stopSession(); setIsOn(false); setIsOpen(false); }}
                className="w-full py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg">
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scannerUrl && (
                <>
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(scannerUrl)}`}
                      className="w-40 h-40" alt="Scanner QR Code" />
                  </div>
                  <p className="text-xs text-gray-500 text-center">Scan with phone</p>
                  <p className="text-[10px] text-gray-400 font-mono break-all text-center">{scannerUrl}</p>
                </>
              )}
              <button onClick={() => { stopSession(); setIsOn(false); setIsOpen(false); }}
                className="w-full py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                Turn Off
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Theme Toggle ──────────────────────────────────────────────────────────────
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { startTransition(() => setMounted(true)); }, []);
  if (!mounted) return <div className="w-8 h-8" />;
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

// ── Main Layout Client ────────────────────────────────────────────────────────
interface AdminLayoutClientProps {
  children: React.ReactNode;
  staffRole: string;
  staffName: string;
  isAuthed: boolean;
}

export function AdminLayoutClient({ children, staffRole, staffName, isAuthed }: AdminLayoutClientProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const { siteLogo } = useBranding();
  const router = useRouter();
  const pathname = usePathname();
  const isPOS = pathname === '/admin/pos';
  const isLoginPage = pathname === '/admin/login';

  // Performance monitoring
  usePerformanceMonitor();

  // Close drawer on route change
  useEffect(() => { startTransition(() => setDrawerOpen(false)); }, [pathname]);

  // Handle Auth Redirects Immediately (no loading spinners)
  useEffect(() => {
    if (!isAuthed && !isLoginPage) {
      router.replace('/');
    } else if (isAuthed && isLoginPage) {
      router.replace('/admin/dashboard');
    }
  }, [isAuthed, isLoginPage, router]);

  // Auth state change listener for sign outs across tabs
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/');
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [router]);

  const MENU_GROUPS = [
    {
      category: "Main",
      items: [
        { name: 'Dashboard',   href: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN','MANAGER','CASHIER','STAFF'] },
      ]
    },
    {
      category: "Sales & POS",
      items: [
        { name: 'Sales (POS)', href: '/admin/pos',        icon: ShoppingCart,    roles: ['ADMIN','MANAGER','CASHIER'] },
        { name: 'Orders',      href: '/admin/orders',    icon: CreditCard,      roles: ['ADMIN','MANAGER','CASHIER'] },
        { name: 'Due',   href: '/admin/customers', icon: Users,           roles: ['ADMIN','MANAGER','CASHIER','STAFF'] },
      ]
    },
    {
      category: "After-Sales",
      items: [
        { name: 'Returns',     href: '/admin/returns',   icon: RotateCcw,       roles: ['ADMIN','MANAGER','CASHIER'] },
        { name: 'Warranty Center', href: '/admin/warranty',  icon: Shield,       roles: ['ADMIN','MANAGER','STAFF'] },
      ]
    },
    {
      category: "Product Management",
      items: [
        { name: 'Products',    href: '/admin/products',  icon: Package,         roles: ['ADMIN','MANAGER','CASHIER','STAFF'] },
        { name: 'Inventory',   href: '/admin/inventory', icon: Warehouse,    roles: ['ADMIN','MANAGER','STAFF'] },
        { name: 'Reviews',     href: '/admin/reviews',   icon: Star,            roles: ['ADMIN','MANAGER'] },
      ]
    },
    {
      category: "Procurement",
      items: [
        { name: 'Purchases',   href: '/admin/purchases', icon: ShoppingCart, roles: ['ADMIN','MANAGER','STAFF'] },
        { name: 'Suppliers',   href: '/admin/suppliers', icon: Store,           roles: ['ADMIN','MANAGER','STAFF'] },
      ]
    },
    {
      category: "Finance & Accounting",
      items: [
        { name: 'Finance Dashboard', href: '/admin/finance', icon: BarChart3, roles: ['ADMIN'] },
        { name: 'Cash Flow',   href: '/admin/finance/cash-flow', icon: Activity, roles: ['ADMIN'] },
        { name: 'Income Statement', href: '/admin/finance/income-statement', icon: FileText, roles: ['ADMIN'] },
        { name: 'Balance Sheet', href: '/admin/finance/balance-sheet', icon: Building2, roles: ['ADMIN'] },
        { name: 'Expenses',    href: '/admin/expenses',  icon: Wallet,          roles: ['ADMIN','MANAGER'] },
        { name: 'Payables',    href: '/admin/reports/payables', icon: Wallet,   roles: ['ADMIN','MANAGER'] },
        { name: 'Accounting',  href: '/admin/accounting',icon: BookOpen,        roles: ['ADMIN'] },
      ]
    },
    {
      category: "Analytics & Settings",
      items: [
        { name: 'Reports',     href: '/admin/reports',   icon: BarChart3,       roles: ['ADMIN','MANAGER'] },
        { name: 'Settings',    href: '/admin/settings',  icon: Settings,        roles: ['ADMIN'] },
      ]
    }
  ];

  const allowedGroups = MENU_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(i => i.roles.includes(staffRole))
  })).filter(group => group.items.length > 0);

  const flatMenuItems = allowedGroups.flatMap(group => group.items);

  const BOTTOM_HREFS = ['/admin/dashboard', '/admin/orders', '/admin/products', '/admin/pos'];
  const bottomItems = flatMenuItems.filter(i => BOTTOM_HREFS.includes(i.href));

  const currentPage = flatMenuItems.find(i => pathname.startsWith(i.href));
  const initials = staffName.charAt(0).toUpperCase();

  const handleLogout = async () => { 
    await supabase.auth.signOut(); 
    try {
      localStorage.removeItem('th_cart');
      localStorage.removeItem('th_wishlist');
      localStorage.removeItem('techhat_pos_cart');
      localStorage.removeItem('techhat_pos_held_orders');
    } catch { /* ignore */ }
    window.location.href = '/'; 
  };

  // ── Early returns ──
  if (!isAuthed && !isLoginPage) {
    // Returning null prevents flash of content before useEffect redirect kicks in
    return null;
  }
  
  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <GlobalScannerProvider>
      <AdminBodyLock isPOS={isPOS} />
      <div className="h-[100dvh] bg-gray-50 dark:bg-gray-950 flex overflow-hidden">

        {/* Drawer overlay (mobile) */}
        {drawerOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
        )}

        {/* ════ SIDEBAR ════ */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 print:hidden shrink-0",
          "lg:static lg:translate-x-0 lg:w-64 lg:z-auto",
          drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>

          {/* Logo */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {siteLogo ? (
                <Image src={siteLogo} alt="Logo" width={140} height={28} style={{ maxHeight: '1.75rem', width: 'auto' }} className="object-contain" />
              ) : (
                <>
                  <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">T</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">TechHat Admin</span>
                </>
              )}
            </div>
            <button onClick={() => setDrawerOpen(false)} className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile user card */}
          <div className="lg:hidden px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{staffName}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{staffRole.charAt(0) + staffRole.slice(1).toLowerCase()}</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {allowedGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                {group.category !== 'Main' && (
                  <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    {group.category}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href} prefetch={false}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                          active
                            ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                        )}
                      >
                        <item.icon className="w-4.5 h-4.5 shrink-0" />
                        <span className="flex-1">{item.name}</span>
                        {active && <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <button onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors">
              <LogOut className="w-4.5 h-4.5 shrink-0" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* ════ MAIN ════ */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300",
          copilotOpen ? "2xl:mr-[350px]" : "2xl:mr-0"
        )}>

          {/* Header */}
          <header className={cn(
            "h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-3 lg:px-5 shrink-0 z-30 print:hidden",
            isPOS ? "hidden lg:flex" : ""
          )}>
            <div className="flex items-center gap-2 min-w-0">
              <button onClick={() => setDrawerOpen(v => !v)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 shrink-0">
                <Menu className="w-5 h-5" />
              </button>
              {/* Mobile page title */}
              <div className="flex items-center gap-2 lg:hidden min-w-0">
                {currentPage && (
                  <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                    <currentPage.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {currentPage?.name ?? 'Admin'}
                </span>
              </div>
              <span className="hidden lg:block text-sm font-semibold text-gray-600 dark:text-gray-300 truncate">
                {currentPage?.name ?? 'Admin Panel'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ScannerStatus />
              <button 
                onClick={() => setCopilotOpen(!copilotOpen)}
                className="hidden lg:flex 2xl:hidden w-8 h-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                title="Toggle Copilot"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <ThemeToggle />
              <div className="hidden lg:flex items-center gap-2 ml-1">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {initials}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">{staffName}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{staffRole.charAt(0) + staffRole.slice(1).toLowerCase()}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main id="admin-main-content" className={cn(
            "flex-1 overflow-x-hidden w-full max-w-full",
            isPOS ? "overflow-hidden p-0 lg:p-2 bg-white dark:bg-gray-900" : "overflow-y-auto p-3 sm:p-4 lg:p-8 pb-20 lg:pb-0 bg-gray-50/50 dark:bg-gray-950"
          )}>
            {children}
          </main>
        </div>

        {/* ════ RIGHT SIDEBAR (COPILOT) ════ */}
        <aside className={cn(
          "fixed inset-y-0 right-0 z-40 w-[350px] border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-transform duration-300 print:hidden shadow-2xl shrink-0",
          copilotOpen ? "translate-x-0" : "translate-x-full"
        )}>
          {/* Edge Toggle Handle */}
          <button
            onClick={() => setCopilotOpen(!copilotOpen)}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-[28px] w-[28px] h-16 bg-white dark:bg-gray-900 border border-r-0 border-gray-200 dark:border-gray-800 rounded-l-xl items-center justify-center shadow-[-4px_0_10px_rgba(0,0,0,0.05)] text-gray-500 hover:text-indigo-600 transition-colors z-50 group"
          >
            {copilotOpen ? <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" /> : <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          </button>

          {/* Mobile close button for copilot */}
          <button 
            onClick={() => setCopilotOpen(false)} 
            className="2xl:hidden absolute top-4 right-4 z-50 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 md:hidden"
          >
            <X className="w-4 h-4" />
          </button>
          <ErpCopilot staffRole={staffRole} staffName={staffName} onClose={() => setCopilotOpen(false)} />
        </aside>

        {/* ════ MOBILE BOTTOM NAV ════ */}
        <nav id="admin-bottom-nav" className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-stretch h-14">
            {bottomItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 relative text-[10px] font-semibold transition-colors",
                    active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full" />}
                  <item.icon className="w-5 h-5" />
                  <span>{item.name === 'Sales (POS)' ? 'POS' : item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setCopilotOpen(v => !v)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative text-[10px] font-semibold transition-colors",
                copilotOpen ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {copilotOpen && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-indigo-600 rounded-full" />}
              <Sparkles className="w-5 h-5" />
              <span>Copilot</span>
            </button>
            <button
              onClick={() => setDrawerOpen(v => !v)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 relative text-[10px] font-semibold transition-colors",
                drawerOpen ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              {drawerOpen && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full" />}
              <Menu className="w-5 h-5" />
              <span>More</span>
            </button>
          </div>
        </nav>

      </div>
    </GlobalScannerProvider>
  );
}
