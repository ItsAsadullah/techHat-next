// ─── Cart Types ───────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  name: string;
  slug: string;
  price: number;         // original price
  offerPrice: number | null;
  image: string | null;
  brand: string | null;
  quantity: number;
  stock: number;
  warrantyMonths: number | null;
}

export interface CartState {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
}

export interface CartContextType extends CartState {
  addToCart: (item: Omit<CartItem, 'quantity'>, sourceEl?: HTMLElement | null) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  cartIconRef: React.RefObject<HTMLButtonElement | null>;
}

// ─── Wishlist Types ───────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  offerPrice: number | null;
  image: string | null;
  brand: string | null;
  discountPercentage: number | null;
  stock: number;
}

export interface WishlistState {
  items: WishlistItem[];
  count: number;
  isOpen: boolean;
}

export interface WishlistContextType extends WishlistState {
  addToWishlist: (item: WishlistItem, sourceEl?: HTMLElement | null) => void;
  removeFromWishlist: (id: string) => void;
  toggleWishlist: (item: WishlistItem, sourceEl?: HTMLElement | null) => void;
  isWishlisted: (id: string) => boolean;
  openWishlist: () => void;
  closeWishlist: () => void;
  wishlistIconRef: React.RefObject<HTMLButtonElement | null>;
}
