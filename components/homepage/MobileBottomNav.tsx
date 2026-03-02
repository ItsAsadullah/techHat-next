'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Menu, ShoppingCart, Heart, Search, User, X, ChevronRight, LayoutDashboard, LogOut, Package, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartSafe } from '@/lib/context/cart-context';
import { useContext } from 'react';
import { WishlistContext } from '@/lib/context/wishlist-context';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface MobileBottomNavProps {
  categories?: Category[];
  branding?: {
    siteLogo?: string;
  };
}

type ActiveTab = 'home' | 'menu' | 'cart' | 'wishlist' | 'search' | 'account' | null;

export default function MobileBottomNav({ categories = [], branding }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCartSafe();
  const wishlist = useContext(WishlistContext);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      const role = session?.user?.app_metadata?.app_role;
      setIsAdmin(role === 'admin' || role === 'super_admin');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      const role = session?.user?.app_metadata?.app_role;
      setIsAdmin(role === 'admin' || role === 'super_admin');
    });
    return () => subscription.unsubscribe();
  }, []);

  // Sync active tab with pathname
  useEffect(() => {
    if (pathname === '/') setActiveTab('home');
    else if (pathname?.startsWith('/account')) setActiveTab('account');
    else setActiveTab(null);
  }, [pathname]);

  // Hide on admin/scanner
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/scanner')) return null;

  const cartCount = mounted ? (cart?.count ?? 0) : 0;
  const wishlistCount = mounted ? (wishlist?.count ?? 0) : 0;

  const handleTabPress = (tab: ActiveTab) => {
    if (tab === 'home') {
      setActiveTab('home');
      setMenuOpen(false);
      setSearchOpen(false);
      setAccountMenuOpen(false);
      router.push('/');
    } else if (tab === 'menu') {
      setMenuOpen((prev) => !prev);
      setSearchOpen(false);
      setAccountMenuOpen(false);
      setActiveTab(menuOpen ? null : 'menu');
    } else if (tab === 'cart') {
      setActiveTab('cart');
      setMenuOpen(false);
      setSearchOpen(false);
      setAccountMenuOpen(false);
      cart?.openCart();
      setTimeout(() => setActiveTab(null), 400);
    } else if (tab === 'wishlist') {
      setActiveTab('wishlist');
      setMenuOpen(false);
      setSearchOpen(false);
      setAccountMenuOpen(false);
      wishlist?.openWishlist();
      setTimeout(() => setActiveTab(null), 400);
    } else if (tab === 'search') {
      setSearchOpen((prev) => !prev);
      setMenuOpen(false);
      setAccountMenuOpen(false);
      setActiveTab(searchOpen ? null : 'search');
    } else if (tab === 'account') {
      setMenuOpen(false);
      setSearchOpen(false);
      if (!user) {
        setShowAuthModal(true);
        setActiveTab(null);
      } else {
        setAccountMenuOpen((prev) => !prev);
        setActiveTab(accountMenuOpen ? null : 'account');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setActiveTab(null);
    }
  };

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setAccountMenuOpen(false);
    setActiveTab(null);
    window.location.href = '/';
  };

  const navItems = [
    { id: 'home' as ActiveTab, icon: Home, label: 'Home' },
    { id: 'menu' as ActiveTab, icon: Menu, label: 'Menu' },
    { id: 'cart' as ActiveTab, icon: ShoppingCart, label: 'Cart', count: cartCount, center: true },
    { id: 'wishlist' as ActiveTab, icon: Heart, label: 'Wishlist', count: wishlistCount },
    { id: 'search' as ActiveTab, icon: Search, label: 'Search' },
    { id: 'account' as ActiveTab, icon: User, label: 'Account' },
  ];

  return (
    <>
      {/* Overlays */}
      <AnimatePresence>
        {(menuOpen || searchOpen || accountMenuOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(false);
              setAccountMenuOpen(false);
              setActiveTab(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Menu Drawer (left slide) ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-50 shadow-2xl lg:hidden overflow-y-auto flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <Link href="/" onClick={() => setMenuOpen(false)}>
                {branding?.siteLogo ? (
                  <Image src={branding.siteLogo} alt="Logo" width={140} height={32} className="object-contain" style={{ maxHeight: '2rem', width: 'auto' }} />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">TechHat</span>
                  </div>
                )}
              </Link>
              <button onClick={() => { setMenuOpen(false); setActiveTab(null); }} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories with accordion */}
            <nav className="flex-1 p-3 space-y-0.5">
              <Link href="/" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors">
                <Home className="w-4 h-4" /> Home
              </Link>

              {categories.map((cat) => (
                <div key={cat.id}>
                  {cat.children && cat.children.length > 0 ? (
                    <button
                      onClick={() => toggleCat(cat.id)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-semibold text-gray-800 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <span>{cat.name}</span>
                      <motion.span animate={{ rotate: expandedCats.has(cat.id) ? 90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </motion.span>
                    </button>
                  ) : (
                    <Link href={`/category/${cat.slug}`} onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-800 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      {cat.name}
                    </Link>
                  )}

                  <AnimatePresence>
                    {cat.children && cat.children.length > 0 && expandedCats.has(cat.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-3 pl-3 border-l-2 border-blue-100 space-y-0.5 pb-1">
                          <Link href={`/category/${cat.slug}`} onClick={() => setMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors">
                            All {cat.name}
                          </Link>
                          {cat.children.map((child) => (
                            <Link key={child.id} href={`/category/${child.slug}`} onClick={() => setMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors">
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Auth section */}
            <div className="p-3 border-t border-gray-100 space-y-1">
              {user ? (
                <>
                  <div className="px-4 py-2 mb-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {isAdmin ? (
                    <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50">
                      <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Admin Panel
                    </Link>
                  ) : (
                    <>
                      <Link href="/account" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50">
                        <UserCircle2 className="w-4 h-4 text-blue-600" /> My Account
                      </Link>
                      <Link href="/account/orders" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50">
                        <Package className="w-4 h-4 text-green-600" /> My Orders
                      </Link>
                    </>
                  )}
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 w-full">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <button onClick={() => { setMenuOpen(false); setShowAuthModal(true); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-gray-50 w-full">
                  <User className="w-4 h-4 text-gray-500" /> Login / Register
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[72px] left-3 right-3 z-50 lg:hidden"
          >
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex items-center">
              <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-3 py-4 text-sm outline-none bg-transparent"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="p-2 mr-1 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button type="submit" className="m-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
                Go
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Account Quick Menu ── */}
      <AnimatePresence>
        {accountMenuOpen && user && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-[76px] right-3 z-50 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden lg:hidden"
          >
            <div className="p-3 border-b border-gray-50">
              <p className="text-sm font-semibold text-gray-800 truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              {isAdmin ? (
                <Link href="/admin/dashboard" onClick={() => setAccountMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <LayoutDashboard className="w-4 h-4 text-indigo-500" /> Admin Panel
                </Link>
              ) : (
                <>
                  <Link href="/account" onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <UserCircle2 className="w-4 h-4 text-blue-600" /> My Account
                  </Link>
                  <Link href="/account/orders" onClick={() => setAccountMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Package className="w-4 h-4 text-green-600" /> My Orders
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Navigation Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        {/* Safe area fill */}
        <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-end justify-around px-2 pb-safe">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'menu' && menuOpen) || (item.id === 'search' && searchOpen) || (item.id === 'account' && accountMenuOpen);
              const Icon = item.icon;

              if (item.center) {
                // Cart: elevated floating button
                return (
                  <button
                    key={item.id}
                    ref={item.id === 'cart' ? cart?.cartIconRef : undefined}
                    onClick={() => handleTabPress(item.id)}
                    className="relative flex flex-col items-center -mb-1 group"
                    aria-label={item.label}
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 -mt-6 border-4 border-white"
                    >
                      <Icon className="w-6 h-6 text-white" />
                      {mounted && (item.count ?? 0) > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                          {(item.count ?? 0) > 99 ? '99+' : item.count}
                        </span>
                      )}
                    </motion.div>
                    <span className="text-[10px] font-medium text-blue-600 mt-0.5 mb-1">{item.label}</span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  ref={item.id === 'wishlist' ? wishlist?.wishlistIconRef : undefined}
                  onClick={() => handleTabPress(item.id)}
                  className="relative flex flex-col items-center pt-1 pb-2 min-w-[48px] group"
                  aria-label={item.label}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        initial={{ y: 8, opacity: 0, scale: 0.8 }}
                        animate={{ y: -2, opacity: 1, scale: 1 }}
                        exit={{ y: 8, opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="absolute -top-3 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-md shadow-blue-500/30"
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className={`relative transition-all duration-200 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    {mounted && (item.count ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full">
                        {(item.count ?? 0) > 99 ? '9+' : item.count}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium mt-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
