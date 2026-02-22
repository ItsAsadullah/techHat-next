'use client';

import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartSafe } from '@/lib/context/cart-context';

export default function CartPill() {
  const cart = useCartSafe();
  const count = cart?.count ?? 0;
  const total = cart?.total ?? 0;

  return (
    <motion.button
      onClick={() => cart?.openCart()}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.6 }}
      whileHover="hovered"
      aria-label={`Open cart (${count} items)`}
      className="
        fixed right-0 top-1/2 -translate-y-1/2 z-50
        hidden lg:flex flex-col items-center
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

      {/* Icon row */}
      <motion.span
        variants={{ hovered: { paddingTop: '16px', paddingBottom: '4px' } }}
        className="flex flex-col items-center gap-1 px-3 pt-3 pb-2 relative z-10"
      >
        <motion.span
          variants={{ hovered: { scale: 1.2 } }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="text-gray-800"
        >
          <ShoppingCart className="w-5 h-5" />
        </motion.span>

        {/* Divider */}
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

        {/* Divider */}
        <span className="w-6 h-px bg-gray-400/40 my-0.5" />

        {/* Total - expands on hover */}
        <motion.span
          variants={{
            hovered: { maxHeight: 40, opacity: 1, marginBottom: 4 },
          }}
          initial={{ maxHeight: 0, opacity: 0 }}
          animate={{ maxHeight: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="text-[10px] font-semibold text-gray-700 leading-tight overflow-hidden text-center whitespace-nowrap"
        >
          ৳{total.toLocaleString('en-BD')}
        </motion.span>
      </motion.span>

      {/* Bottom accent bar */}
      <motion.span
        variants={{ hovered: { scaleY: 1.5, backgroundColor: '#3b82f6' } }}
        className="w-full h-1 bg-blue-400/70 rounded-bl-sm relative z-10"
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}
