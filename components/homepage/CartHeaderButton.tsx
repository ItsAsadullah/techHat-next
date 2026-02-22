'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartSafe } from '@/lib/context/cart-context';
import { cn } from '@/lib/utils';

interface CartHeaderButtonProps {
  onBeforeOpen?: () => void;
  className?: string;
  showLabel?: boolean;
}

export default function CartHeaderButton({ onBeforeOpen, className, showLabel }: CartHeaderButtonProps) {
  const cart = useCartSafe();

  const handleClick = () => {
    onBeforeOpen?.();
    cart?.openCart();
  };

  const count = cart?.count ?? 0;

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
      {!showLabel && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
