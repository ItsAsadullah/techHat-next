'use client';

import { Heart } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { WishlistContext } from '@/lib/context/wishlist-context';
import { cn } from '@/lib/utils';

interface WishlistHeaderButtonProps {
  onBeforeOpen?: () => void;
  className?: string;
  showLabel?: boolean;
}

export default function WishlistHeaderButton({ onBeforeOpen, className, showLabel }: WishlistHeaderButtonProps) {
  const wishlist = useContext(WishlistContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleClick = () => {
    onBeforeOpen?.();
    wishlist?.openWishlist();
  };

  // Use 0 for SSR to prevent hydration mismatch, then use actual count on client
  const count = mounted ? (wishlist?.count ?? 0) : 0;

  return (
    <button
      ref={wishlist?.wishlistIconRef}
      onClick={handleClick}
      className={cn('relative p-2 rounded-full hover:bg-gray-50 transition-colors', className)}
      title="Wishlist"
      aria-label={`Wishlist (${count} items)`}
    >
      <Heart className={cn('w-5 h-5', showLabel ? 'text-gray-500' : 'text-gray-600')} />
      {showLabel && (
        <span className="text-sm font-medium">
          Wishlist{count > 0 ? ` (${count})` : ''}
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
