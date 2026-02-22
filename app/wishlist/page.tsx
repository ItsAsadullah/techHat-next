import type { Metadata } from 'next';
import WishlistPageClient from '@/components/wishlist/WishlistPageClient';

export const metadata: Metadata = {
  title: 'My Wishlist | TechHat',
  description: 'View and manage your saved products on TechHat.',
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
