'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import MobileBottomNav from './MobileBottomNav';

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
      // Check admin role from JWT app_metadata — no network call needed
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
              {/* Mobile Menu Toggle - hidden on mobile (handled by MobileBottomNav) */}
              <button className="hidden lg:hidden p-2 -ml-2 text-gray-600" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                {branding?.siteLogo ? (
                  <Image
                    src={branding.siteLogo}
                    alt="Logo"
                    width={200}
                    height={40}
                    className="object-contain"
                    style={{ maxHeight: '2.5rem', width: 'auto' }}
                    priority
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
                {/* Wishlist - desktop only */}
                <WishlistHeaderButton className="hidden lg:flex" />

                {/* Cart - desktop only */}
                <div className="hidden lg:block">
                  <CartHeaderButton />
                </div>

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

            {/* Mobile Search - desktop fallback only, hidden on mobile (MobileBottomNav handles it) */}
            <div className="hidden pb-3">
              <SearchBar />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - replaces old mobile menu drawer */}
      <MobileBottomNav categories={categories} branding={branding} />

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
