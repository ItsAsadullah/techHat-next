'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GlobalScannerProvider, useGlobalScanner } from '@/components/admin/global-scanner-provider';

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
            await startSession(); // wait for POST /api/scanner/activate to complete
            setIsOn(true);
            setIsOpen(true);
        }
        setToggling(false);
    };

    return (
        <>
            {/* Switch row */}
            <div className="flex items-center gap-2">
                {/* Compact status badge */}
                {(isOn || toggling) && (
                    <span className={cn(
                        "text-xs font-semibold px-2 py-0.5 rounded-full transition-colors",
                        toggling
                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                            : isConnected
                                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                                : "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400"
                    )}>
                        {toggling ? '⟳ Activating…' : isConnected ? '• Connected' : '○ Waiting'}
                    </span>
                )}

                {/* Switch toggle */}
                <button
                    onClick={handleToggle}
                    disabled={toggling}
                    title={isOn ? 'Turn off scanner' : 'Turn on scanner'}
                    className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full border-2 transition-colors duration-200 focus:outline-none",
                        toggling
                            ? "bg-blue-400 border-blue-400 cursor-wait"
                            : isOn
                                ? "bg-blue-600 border-blue-600"
                                : "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    )}
                >
                    <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200",
                        isOn || toggling ? "translate-x-5" : "translate-x-0.5"
                    )} />
                </button>

                {/* Scanner label/icon — click to open panel */}
                <button
                    onClick={() => isOn && setIsOpen(v => !v)}
                    className={cn(
                        "flex items-center gap-1.5 text-xs font-medium transition-colors",
                        isOn
                            ? "text-blue-600 dark:text-blue-400 cursor-pointer"
                            : "text-gray-400 cursor-default"
                    )}
                >
                    <ScanLine className="w-4 h-4" />
                    Scanner
                </button>
            </div>

            {/* Panel */}
            {isOpen && isOn && (
                <div className="fixed top-16 right-4 w-72 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4 z-[9999] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <ScanLine className="w-4 h-4 text-blue-600" />
                            Mobile Scanner
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {isConnected ? (
                        <div className="text-center py-4 space-y-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                <ScanLine className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">Mobile Connected</p>
                                <p className="text-xs text-gray-500 mt-1">Scans go to the focused input field</p>
                            </div>
                            <button
                                onClick={() => { stopSession(); setIsOn(false); setIsOpen(false); }}
                                className="w-full py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            >
                                Disconnect
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scannerUrl && (
                                <>
                                    <div className="bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-center">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(scannerUrl)}`}
                                            className="w-40 h-40"
                                            alt="Scanner QR"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">Scan with phone or open the link below</p>
                                    <p className="text-[10px] text-gray-400 font-mono break-all px-1 text-center">{scannerUrl}</p>
                                </>
                            )}
                            <button
                                onClick={() => { stopSession(); setIsOn(false); setIsOpen(false); }}
                                className="w-full py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                Turn Off
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  const isDark = theme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
    >
      {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <GlobalScannerProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
    </GlobalScannerProvider>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [staffRole, setStaffRole] = useState<string>('ADMIN');
  const [staffName, setStaffName] = useState<string>('Admin User');
  const { siteLogo } = useBranding();
  const router = useRouter();
  const pathname = usePathname();
  const isPOS = pathname === '/admin/pos';
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const checkAuth = async () => {
      const onLogin = pathname === '/admin/login';
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsAuthed(false);
        if (!onLogin) {
          // Keep loading=true so spinner shows until redirect completes
          router.replace('/admin/login');
        } else {
          setLoading(false);
        }
        return;
      }
      // Already authed — redirect away from login page
      if (onLogin) {
        router.replace('/admin/dashboard');
        return; // pathname will change → this effect re-runs → role check happens
      }
      // Check role via /api/account/role
      // Cache result in sessionStorage keyed by access token to avoid
      // making this API call on every admin page navigation.
      const accessToken = session.access_token;
      let isAdmin = false;
      let roleName = 'customer';
      let displayName =
        session.user.user_metadata?.full_name ||
        session.user.email?.split('@')[0] ||
        'Admin';

      try {
        const cacheKey = `role-check-${accessToken.slice(-16)}`;
        const cached = sessionStorage.getItem(cacheKey);
        let data: { isAdmin?: boolean; role?: string; name?: string } | null = null;

        if (cached) {
          data = JSON.parse(cached);
        } else {
          const res = await fetch('/api/account/role', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            data = await res.json();
            sessionStorage.setItem(cacheKey, JSON.stringify(data));
          }
        }

        if (data) {
          isAdmin = data.isAdmin === true;
          roleName = data.role ?? 'customer';
          if (data.name) displayName = data.name;
        }
      } catch {
        // network error — deny
      }

      if (!isAdmin) {
        setIsAuthed(false);
        setLoading(false);
        router.replace('/');
        return;
      }

      setStaffRole(
        (['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'].includes(roleName.toUpperCase())
          ? roleName.toUpperCase()
          : 'ADMIN') as string
      );
      setStaffName(displayName);
      setIsAuthed(true);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth state changes (signed in / out in this or another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsAuthed(false);
        setLoading(false);
        router.replace('/');
      }
      // SIGNED_IN is handled by the pathname change triggering this effect
    });

    // Handle bfcache: recheck session when page is restored from back/forward cache
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) checkAuth();
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const ALL_MENU_ITEMS = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['ADMIN','MANAGER','CASHIER','STAFF'] },
    { name: 'Products', href: '/admin/products', icon: Package, roles: ['ADMIN','MANAGER','CASHIER','STAFF'] },
    { name: 'Reviews', href: '/admin/reviews', icon: Star, roles: ['ADMIN','MANAGER'] },
    { name: 'Sales (POS)', href: '/admin/pos', icon: ShoppingCart, roles: ['ADMIN','MANAGER','CASHIER'] },
    { name: 'Orders', href: '/admin/orders', icon: CreditCard, roles: ['ADMIN','MANAGER','CASHIER'] },
    { name: 'Expenses', href: '/admin/expenses', icon: Wallet, roles: ['ADMIN','MANAGER'] },
    { name: 'Vendors', href: '/admin/vendors', icon: Store, roles: ['ADMIN','MANAGER'] },
    { name: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['ADMIN','MANAGER'] },
    { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['ADMIN'] },
  ];
  const menuItems = ALL_MENU_ITEMS.filter(item => item.roles.includes(staffRole));

  // Guard: redirect if current path is not allowed for this role
  useEffect(() => {
    if (loading) return;
    const allowed = ALL_MENU_ITEMS.find(item => pathname.startsWith(item.href));
    if (allowed && !allowed.roles.includes(staffRole)) {
      router.replace('/admin/dashboard');
    }
  }, [pathname, staffRole, loading]);

  // Login page: render directly, no sidebar, no auth guard spinner
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show spinner while loading OR while unauthenticated (redirect in progress)
  if (loading || !isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prefetch dashboard data if needed, but here we just optimize navigation
  // To speed up navigation, we can use the `prefetch` prop on Link components (default is true in Next.js)
  // The issue might be related to layout re-rendering or heavy computations.
  // Let's optimize the Sidebar links to avoid full layout shifts if possible, though Next.js handles this well.
  // The main culprit for slow navigation in dev mode is usually compilation. in Prod it should be fast.
  // However, we can ensure we are not doing heavy work in the layout on every render.
  
  // The checkAuth runs on every mount of the layout. Since layout persists, it should be fine.
  // But if the layout unmounts, it runs again.
  
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-950 flex overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 lg:translate-x-0 lg:static",
          !isSidebarOpen && "-translate-x-full lg:w-0 lg:overflow-hidden lg:border-none"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {siteLogo ? (
                <img
                  src={siteLogo}
                  alt="Logo"
                  style={{ maxHeight: '2rem', width: 'auto' }}
                  className="object-contain"
                />
              ) : (
                <>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100">TechHat Admin</span>
                </>
              )}
            </div>
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-500 hover:bg-gray-100 rounded-md"
            >
                <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 shadow-sm" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                  prefetch={true} // Ensure prefetching is enabled
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-blue-600" : "text-gray-400")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-8">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-4">
            <ScannerStatus />
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{staffName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{staffRole.charAt(0) + staffRole.slice(1).toLowerCase()}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          isPOS ? "p-2" : "p-4 lg:p-8"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
