'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, User, Menu, X, LayoutDashboard, LogOut, ChevronDown, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from './AuthModal';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/context/cart-context';
import { useWishlist } from '@/lib/context/wishlist-context';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';

interface Category {
    id: string;
    name: string;
    slug: string;
    children?: Category[];
}

export default function Navbar({ initialCategories }: { initialCategories?: Category[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const { count: cartCount, openCart, cartIconRef } = useCart();
  const { count: wishlistCount, openWishlist, wishlistIconRef } = useWishlist();

  // If initialCategories is not provided (e.g. static build), we might fetch client side or use passed props
  // For now we assume they are passed from a server component wrapper
  const categories = initialCategories || [];

  useEffect(() => {
    setMounted(true);

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide navbar on admin and scanner routes — they have their own full layouts
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/scanner')) {
      return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 font-heading">
              TechHat
            </span>
          </Link>

          {/* Desktop Menu with Mega Menu */}
          <div className="hidden lg:flex items-center gap-1 flex-1">
             {mounted ? (
               <NavigationMenu>
                  <NavigationMenuList>
                      <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                              <Link href="/" className={navigationMenuTriggerStyle()}>
                                  Home
                              </Link>
                          </NavigationMenuLink>
                      </NavigationMenuItem>
                      
                      {categories.slice(0, 5).map((category) => (
                           <NavigationMenuItem key={category.id}>
                               {category.children && category.children.length > 0 ? (
                                   <>
                                       <NavigationMenuTrigger>{category.name}</NavigationMenuTrigger>
                                       <NavigationMenuContent>
                                           <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                               {category.children.map((child) => (
                                                   <li key={child.id}>
                                                       <NavigationMenuLink asChild>
                                                           <Link
                                                               href={`/category/${child.slug}`}
                                                               className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                                           >
                                                               <div className="text-sm font-medium leading-none">{child.name}</div>
                                                           </Link>
                                                       </NavigationMenuLink>
                                                   </li>
                                               ))}
                                           </ul>
                                       </NavigationMenuContent>
                                   </>
                               ) : (
                                   <NavigationMenuLink asChild>
                                       <Link href={`/category/${category.slug}`} className={navigationMenuTriggerStyle()}>
                                           {category.name}
                                       </Link>
                                   </NavigationMenuLink>
                               )}
                           </NavigationMenuItem>
                      ))}
                      
                      <NavigationMenuItem>
                          <NavigationMenuLink asChild>
                              <Link href="/offers" className={cn(navigationMenuTriggerStyle(), "text-purple-600 font-semibold")}>
                                  Offers
                              </Link>
                          </NavigationMenuLink>
                      </NavigationMenuItem>
                  </NavigationMenuList>
               </NavigationMenu>
             ) : (
               /* Static SSR placeholder — same visual layout, no Radix IDs */
               <nav className="flex items-center gap-1">
                 <Link href="/" className={navigationMenuTriggerStyle()}>Home</Link>
                 {categories.slice(0, 5).map((category) => (
                   <Link
                     key={category.id}
                     href={`/category/${category.slug}`}
                     className={navigationMenuTriggerStyle()}
                   >
                     {category.name}
                     {category.children && category.children.length > 0 && (
                       <ChevronDown className="relative top-px ml-1 h-3 w-3 transition duration-300" />
                     )}
                   </Link>
                 ))}
                 <Link href="/offers" className={cn(navigationMenuTriggerStyle(), "text-purple-600 font-semibold")}>
                   Offers
                 </Link>
               </nav>
             )}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <input
                id="navbar-search"
                name="q"
                type="search"
                autoComplete="on"
                placeholder="Search products..."
                className="w-48 pl-10 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:w-64 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Wishlist */}
            <button
              ref={wishlistIconRef}
              onClick={openWishlist}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
              aria-label={`Wishlist (${wishlistCount} items)`}
              title="Wishlist"
            >
              <Heart className={cn('w-5 h-5 transition-colors', wishlistCount > 0 ? 'text-red-500 fill-red-500' : 'text-gray-600')} />
              <AnimatePresence>
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white px-0.5"
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Cart */}
            <button
              ref={cartIconRef}
              onClick={openCart}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label={`Cart (${cartCount} items)`}
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white px-0.5"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Auth */}
            <div className="relative group">
              {user ? (
                <div className="flex items-center gap-3">
                  <Link 
                    href="/admin/dashboard"
                    className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-50 rounded-full border border-gray-200 transition-colors"
                  >
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Dashboard</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 p-1.5 pr-3 hover:bg-gray-50 rounded-full border border-gray-200 transition-colors"
                >
                  <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Login</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-100 bg-white"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <div className="relative">
                <input
                  id="navbar-mobile-search"
                  name="q"
                  type="search"
                  autoComplete="on"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              
              <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                <Link
                    href="/"
                    className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600"
                    onClick={() => setIsOpen(false)}
                >
                    Home
                </Link>
                {categories.map((category) => (
                    <div key={category.id} className="space-y-1">
                        <div className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50/50 rounded-lg">
                            {category.name}
                        </div>
                        {category.children && category.children.length > 0 && (
                            <div className="pl-6 border-l-2 border-gray-100 ml-4 space-y-1">
                                {category.children.map(child => (
                                    <Link
                                        key={child.id}
                                        href={`/category/${child.slug}`}
                                        className="block px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {child.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between px-4">
                <button className="flex items-center gap-2 text-gray-600" onClick={() => { setIsOpen(false); setShowAuthModal(true); }}>
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Login / Register</span>
                </button>
                <button
                  className="flex items-center gap-2 text-gray-600 relative"
                  onClick={() => { setIsOpen(false); openCart(); }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span className="text-sm font-medium">Cart ({cartCount})</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </nav>
  );
}
