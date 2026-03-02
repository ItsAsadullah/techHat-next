'use client';

import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartSafe } from '@/lib/context/cart-context';
import { useEffect, useState } from 'react';

export default function CartPill() {
  const cart = useCartSafe();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const count = mounted ? (cart?.count ?? 0) : 0;
  const total = mounted ? (cart?.total ?? 0) : 0;

  return (
    <motion.button
      onClick={() => cart?.openCart()}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.6 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Open cart (${count} items)`}
      className="
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        flex flex-col items-center
        rounded-l-2xl
        border border-white/30
        shadow-[0_8px_32px_rgba(0,0,0,0.18)]
        backdrop-blur-xl
        bg-white/20
        overflow-hidden
        cursor-pointer
        select-none
      "
      style={{ WebkitBackdropFilter: 'blur(16px)' }}
    >
      {/* Gradient overlay */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/30 to-white/10 pointer-events-none rounded-l-2xl" />

      {/* Content */}
      <span className="flex flex-col items-center gap-1 px-3 pt-3 pb-2 relative z-10">
        <span className="text-gray-800">
          <ShoppingCart className="w-5 h-5" />
        </span>

        <span className="w-6 h-px bg-gray-400/40 my-0.5" />

        {/* Count */}
        <motion.span
          key={count}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-[11px] font-bold text-gray-800 leading-tight"
        >
          {count} item{count !== 1 ? 's' : ''}
        </motion.span>

        <span className="w-6 h-px bg-gray-400/40 my-0.5" />

        {/* Total — always visible, no hover needed */}
        <span className="text-[10px] font-semibold text-gray-700 leading-tight text-center whitespace-nowrap pb-1">
          ৳{total.toLocaleString('en-BD')}
        </span>
      </span>

      {/* Bottom accent bar */}
      <span className="w-full h-1 bg-blue-400/70 rounded-bl-sm relative z-10" />
    </motion.button>
  );
}
