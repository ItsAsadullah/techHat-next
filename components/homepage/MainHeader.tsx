'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Menu, X, LayoutDashboard, LogOut, ChevronDown, Package, UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '@/components/AuthModal';
import SearchBar from './SearchBar';
import TopUtilityBar from './TopUtilityBar';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import CartHeaderButton from './CartHeaderButton';
import WishlistHeaderButton from './WishlistHeaderButton';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface BrandingProps {
  hotline?: string;
  deliveryText?: string;
  showDelivery?: boolean;
  siteLogo?: string;
}

export default function MainHeader({
  initialCategories,
  branding,
}: {
  initialCategories?: Category[];
  branding?: BrandingProps;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const categories = initialCategories || [];

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        fetch('/api/account/role', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then(r => r.json())
          .then(d => setIsAdmin(d.isAdmin === true))
          .catch(() => setIsAdmin(false));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.access_token) {
        fetch('/api/account/role', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
          .then(r => r.json())
          .then(d => setIsAdmin(d.isAdmin === true))
          .catch(() => setIsAdmin(false));
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hide on admin and scanner routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/scanner')) {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* Top Utility Bar */}
        <TopUtilityBar
          hotline={branding?.hotline}
          deliveryText={branding?.deliveryText}
          showDelivery={branding?.showDelivery}
        />

        {/* Main Header */}
        <div className="border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 lg:gap-6 h-16">
              {/* Mobile Menu Toggle */}
              <button className="lg:hidden p-2 -ml-2 text-gray-600" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                {branding?.siteLogo ? (
                  <Image
                    src={branding.siteLogo}
                    alt="Logo"
                    width={160}
                    height={40}
                    className="h-10 w-auto object-contain"
                    priority
                    unoptimized={branding.siteLogo.endsWith('.svg')}
                  />
                ) : (
                  <>
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <span className="text-white font-extrabold text-lg">T</span>
                    </div>
                    <span className="hidden sm:block text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                      TechHat
                    </span>
                  </>
                )}
              </Link>

              {/* Search Bar - desktop */}
              <div className="hidden lg:flex flex-1 justify-center">
                <SearchBar />
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-1 sm:gap-2 ml-auto lg:ml-0">
                {/* Wishlist */}
                <WishlistHeaderButton className="hidden sm:flex" />

                {/* Cart */}
                <CartHeaderButton />

                {/* User / Auth */}
                {mounted && (
                  <div className="relative">
                    {user ? (
                      <>
                        <button
                          onClick={() => setShowUserMenu(!showUserMenu)}
                          className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-50 rounded-full border border-gray-200 transition-colors"
                        >
                          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(user.user_metadata?.full_name || user.email || '').slice(0, 2).toUpperCase() || <User className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
                        </button>
                        <AnimatePresence>
                          {showUserMenu && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 4 }}
                              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                            >
                              <div className="p-3 border-b border-gray-50">
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                              </div>
                              <div className="py-1">
                                {isAdmin ? (
                                  /* Admin user — show only Admin Panel */
                                  <Link
                                    href="/admin/dashboard"
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                    onClick={() => setShowUserMenu(false)}
                                  >
                                    <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                                    Admin Panel
                                  </Link>
                                ) : (
                                  /* Regular user — show My Account + My Orders */
                                  <>
                                    <Link
                                      href="/account"
                                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                      onClick={() => setShowUserMenu(false)}
                                    >
                                      <UserCircle2 className="w-4 h-4 text-blue-600" />
                                      My Account
                                    </Link>
                                    <Link
                                      href="/account/orders"
                                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                      onClick={() => setShowUserMenu(false)}
                                    >
                                      <Package className="w-4 h-4 text-green-600" />
                                      My Orders
                                    </Link>
                                  </>
                                )}
                                <button
                                  onClick={() => {
                                    setShowUserMenu(false);
                                    handleLogout();
                                  }}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                                >
                                  <LogOut className="w-4 h-4" />
                                  Logout
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowAuthModal(true)}
                        className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-50 rounded-full border border-gray-200 transition-colors"
                      >
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">Login</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Search */}
            <div className="lg:hidden pb-3">
              <SearchBar />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 left-0 bottom-0 w-[300px] bg-white z-50 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  {branding?.siteLogo ? (
                    <Image
                      src={branding.siteLogo}
                      alt="Logo"
                      width={120}
                      height={32}
                      className="h-8 w-auto object-contain"
                      unoptimized={branding.siteLogo.endsWith('.svg')}
                    />
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">T</span>
                      </div>
                      <span className="text-lg font-bold text-gray-800">TechHat</span>
                    </>
                  )}
                </Link>
                <button onClick={() => setIsOpen(false)} className="p-2 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-4 space-y-1">
                <Link
                  href="/"
                  className="block px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="block px-4 py-3 text-sm font-semibold text-gray-800 rounded-lg hover:bg-gray-50"
                      onClick={() => setIsOpen(false)}
                    >
                      {cat.name}
                    </Link>
                    {cat.children && cat.children.length > 0 && (
                      <div className="ml-4 pl-4 border-l-2 border-gray-100 space-y-0.5">
                        {cat.children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="block px-4 py-2 text-sm text-gray-600 rounded-lg hover:bg-blue-50 hover:text-blue-600"
                            onClick={() => setIsOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="p-4 border-t border-gray-100 space-y-2">
                <WishlistHeaderButton
                  showLabel
                  onBeforeOpen={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 w-full text-gray-700"
                />
                <CartHeaderButton
                  showLabel
                  onBeforeOpen={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 w-full text-gray-700"
                />
                {user ? (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 rounded-lg hover:bg-red-50 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowAuthModal(true);
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 rounded-lg hover:bg-gray-50 w-full"
                  >
                    <User className="w-5 h-5 text-gray-500" />
                    Login / Register
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
