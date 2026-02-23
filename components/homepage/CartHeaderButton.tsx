'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartSafe } from '@/lib/context/cart-context';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface CartHeaderButtonProps {
  onBeforeOpen?: () => void;
  className?: string;
  showLabel?: boolean;
}

export default function CartHeaderButton({ onBeforeOpen, className, showLabel }: CartHeaderButtonProps) {
  const cart = useCartSafe();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    onBeforeOpen?.();
    cart?.openCart();
  };

  // Use 0 for SSR to prevent hydration mismatch, then use actual count on client
  const count = mounted ? (cart?.count ?? 0) : 0;

  return (
    <button
      ref={cart?.cartIconRef}
      onClick={handleClick}
      className={cn('relative p-2 rounded-full hover:bg-gray-50 transition-colors', className)}
      title="Cart"
      aria-label={`Cart (${count} items)`}
    >
      <ShoppingCart className={cn('w-5 h-5', showLabel ? 'text-gray-500' : 'text-gray-600')} />
      {showLabel && (
        <span className="text-sm font-medium">
          Cart{count > 0 ? ` (${count})` : ''}
        </span>
      )}
      {!showLabel && mounted && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
