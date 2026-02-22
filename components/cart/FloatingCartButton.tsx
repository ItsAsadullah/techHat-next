'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/context/cart-context';
import { cn } from '@/lib/utils';

export default function FloatingCartButton() {
  const { count, openCart } = useCart();

  return (
    <motion.button
      onClick={openCart}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
      className={cn(
        'fixed bottom-6 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl',
        'hover:shadow-2xl transition-shadow',
        'lg:hidden'
      )}
      aria-label={`Open cart (${count} items)`}
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="text-sm font-semibold">Cart</span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            style={{ backgroundColor: '#ffffff', color: '#2563eb' }}
            className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
          >
            {count > 99 ? '99+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
