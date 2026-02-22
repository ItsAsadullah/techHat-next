'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  Share2, 
  ShoppingCart, 
  Star, 
  StarHalf,
  ChevronRight,
  Shield, 
  Truck, 
  RotateCcw,
  MessageCircle,
  Play,
  ChevronLeft,
  Minus,
  Plus,
  Check,
  Copy,
  Facebook,
  Twitter,
  Clipboard,
  Package,
  Zap,
  Clock,
  BadgeCheck,
  ArrowRight,
  ThumbsUp,
  User,
  ChevronDown,
  ExternalLink,
  MapPin,
  Banknote,
  AlertCircle,
  Phone,
  Store,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ProductReviewSection from '@/components/products/product-review-section';
import CheckoutModal from '@/components/products/CheckoutModal';
import { getDivisions, getDistricts, getUpazilas, getUnions } from '@/lib/location-data';
import { useCart } from '@/lib/context/cart-context';
import { useWishlistSafe } from '@/lib/context/wishlist-context';
import { toast } from 'sonner';

// Types
interface ProductImage {
  id: string;
  url: string;
  isThumbnail: boolean;
  displayOrder: number;
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  offerPrice: number | null;
  stock: number;
  image: string | null;
  productImage: { id: string; url: string } | null;
  attributes: Record<string, string> | null;
}

interface ProductSpec {
  id: string;
  name: string;
  value: string;
}

interface ProductReview {
  id: string;
  name: string;
  rating: number;
  reviewText: string;
  status: string;
  isVerified: boolean;
  helpfulCount: number;
  images: { id: string; imageUrl: string }[];
  user?: { fullName: string | null; avatarUrl: string | null } | null;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

interface Product {
  image: string;
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  offerPrice: number | null;
  costPrice: number;
  stock: number;
  sku: string | null;
  barcode: string | null;
  unit: string | null;
  warrantyMonths: number | null;
  warrantyType: string | null;
  videoUrl: string | null;
  isFeatured: boolean;
  isFlashSale: boolean;
  productVariantType: string;
  specifications: Record<string, string> | null;
  attributes: Array<{ id: string; name: string; values: string[] }> | null;
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string; logo: string | null } | null;
  images: ProductImage[];
  variants: ProductVariant[];
  specs: ProductSpec[];
  reviews: ProductReview[];
  reviewStats: ReviewStats;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  offerPrice: number | null;
  image: string | null;
  brand: string | null;
}

interface Props {
  product: Product;
  relatedProducts: RelatedProduct[];
}

// Helper functions
function formatPrice(price: number) {
  return `৳${price.toLocaleString('en-BD')}`;
}

function getDiscount(price: number, offerPrice: number | null) {
  if (!offerPrice || offerPrice >= price) return 0;
  return Math.round(((price - offerPrice) / price) * 100);
}

function getAverageRating(reviews: ProductReview[]) {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

function RatingStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Star key={i} className={`${sizeClass} fill-amber-400 text-amber-400`} />);
    } else if (i - rating < 1) {
      stars.push(<StarHalf key={i} className={`${sizeClass} fill-amber-400 text-amber-400`} />);
    } else {
      stars.push(<Star key={i} className={`${sizeClass} text-gray-200`} />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function getWhatsAppUrl(product: Product, variant: ProductVariant | null, quantity: number) {
  const phone = '8801XXXXXXXXX'; // Replace with your WhatsApp number
  const variantInfo = variant && variant.name !== 'Default' ? ` (${variant.name})` : '';
  const price = variant 
    ? formatPrice(variant.offerPrice || variant.price) 
    : formatPrice(product.offerPrice || product.price);
  const message = encodeURIComponent(
    `Hi! I'd like to order:\n\n` +
    `📦 *${product.name}*${variantInfo}\n` +
    `💰 Price: ${price}\n` +
    `🔢 Quantity: ${quantity}\n\n` +
    `Please confirm availability and total price.`
  );
  return `https://wa.me/${phone}?text=${message}`;
}

// Helper to get attribute value safely
function getVariantAttributeValue(variant: ProductVariant, attrName: string): string | null {
  if (variant.attributes) {
    // Try exact match
    if (variant.attributes[attrName]) return variant.attributes[attrName];
    // Try case-insensitive match
    const key = Object.keys(variant.attributes).find(k => k.toLowerCase() === attrName.toLowerCase());
    if (key) return variant.attributes[key];
  }
  // Fallback: If variant.attributes is null but variant.name exists, use variant.name as the value
  // This handles simple products where variant name IS the attribute value (e.g., "Black", "White")
  return variant.name || null;
}

// Bangladesh Location Hierarchy
const locationData: Record<string, Record<string, string[]>> = {
  'Dhaka': {
    'Dhaka': ['Mirpur', 'Dhanmondi', 'Gulshan', 'Uttara', 'Mohammadpur', 'Tejgaon'],
    'Gazipur': ['Gazipur Sadar', 'Kaliakair', 'Kapasia', 'Sreepur', 'Kaliganj'],
    'Narayanganj': ['Narayanganj Sadar', 'Rupganj', 'Sonargaon', 'Bandar'],
    'Tangail': ['Tangail Sadar', 'Mirzapur', 'Gopalpur', 'Madhupur'],
  },
  'Chittagong': {
    'Chittagong': ['Panchlaish', 'Kotwali', 'Patenga', 'Bayazid', 'Halishahar'],
    'Cox\'s Bazar': ['Cox\'s Bazar Sadar', 'Ramu', 'Teknaf', 'Ukhia'],
    'Comilla': ['Comilla Sadar', 'Daudkandi', 'Chandina', 'Muradnagar'],
  },
  'Rajshahi': {
    'Rajshahi': ['Rajshahi Sadar', 'Poba', 'Mohanpur', 'Godagari'],
    'Bogra': ['Bogra Sadar', 'Shibganj', 'Sherpur', 'Adamdighi'],
    'Pabna': ['Pabna Sadar', 'Ishwardi', 'Santhia', 'Atgharia'],
  },
  'Khulna': {
    'Khulna': ['Khulna Sadar', 'Sonadanga', 'Daulatpur', 'Khalishpur'],
    'Jessore': ['Jessore Sadar', 'Sharsha', 'Chaugachha', 'Jhikargachha'],
    'Satkhira': ['Satkhira Sadar', 'Kalaroa', 'Tala', 'Debhata'],
  },
  'Sylhet': {
    'Sylhet': ['Sylhet Sadar', 'Jalalabad', 'South Surma', 'Companiganj'],
    'Moulvibazar': ['Moulvibazar Sadar', 'Sreemangal', 'Kulaura', 'Rajnagar'],
  },
  'Barisal': {
    'Barisal': ['Barisal Sadar', 'Bakerganj', 'Babuganj', 'Wazirpur'],
    'Patuakhali': ['Patuakhali Sadar', 'Kalapara', 'Dashmina', 'Dumki'],
  },
  'Rangpur': {
    'Rangpur': ['Rangpur Sadar', 'Gangachara', 'Kaunia', 'Badarganj'],
    'Dinajpur': ['Dinajpur Sadar', 'Birampur', 'Parbatipur', 'Khansama'],
  },
  'Mymensingh': {
    'Mymensingh': ['Mymensingh Sadar', 'Muktagachha', 'Trishal', 'Gafargaon'],
    'Jamalpur': ['Jamalpur Sadar', 'Sarishabari', 'Madarganj', 'Dewanganj'],
  },
};

// Helper to get color hex code from color name
function getColorCode(colorName: string): string | null {
  const colorMap: Record<string, string> = {
    // Basic colors
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#EF4444',
    'blue': '#3B82F6',
    'green': '#10B981',
    'yellow': '#F59E0B',
    'orange': '#F97316',
    'purple': '#A855F7',
    'pink': '#EC4899',
    'gray': '#6B7280',
    'grey': '#6B7280',
    'brown': '#92400E',
    'navy': '#1E3A8A',
    'cyan': '#06B6D4',
    'teal': '#14B8A6',
    'indigo': '#6366F1',
    'violet': '#8B5CF6',
    'magenta': '#D946EF',
    'lime': '#84CC16',
    'gold': '#FCD34D',
    'silver': '#C0C0C0',
    'bronze': '#CD7F32',
    // Shades
    'light blue': '#BFDBFE',
    'dark blue': '#1E40AF',
    'light green': '#BBF7D0',
    'dark green': '#065F46',
    'light gray': '#D1D5DB',
    'dark gray': '#374151',
  };
  
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || null;
}

function getYouTubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function ProductView({ product, relatedProducts }: Props) {
  const { addToCart } = useCart();
  const wishlist = useWishlistSafe();
  const addToCartBtnRef = useRef<HTMLButtonElement>(null);
  const wishlistBtnRef = useRef<HTMLButtonElement>(null);
  // State
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  
  // Initialize selectedVariant to null if there are multiple variants, 
  // so the user sees the "Total Stock" initially.
  // If there's only 1 variant (e.g. Simple Product treated as Variant), select it.
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length === 1 ? product.variants[0] : null
  );
  
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'specifications' | 'description' | 'reviews'>('specifications');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [showStickySidebar, setShowStickySidebar] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('Dhaka');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Dhaka');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('Mirpur');
  const [selectedUnion, setSelectedUnion] = useState<string>('Mirpur 10');
  const [isCustomUnion, setIsCustomUnion] = useState<boolean>(false);
  const [customUnionInput, setCustomUnionInput] = useState<string>(''); // For manual union entry
  const [customAddress, setCustomAddress] = useState<string>(''); // For village/para/mahalla
  const [showCheckout, setShowCheckout] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  
  // Refs for scroll sections
  const specsRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const stickyNavRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Sticky detection using IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel is not visible (scrolled past), sticky nav is stuck
        // Show sidebar when sentinel goes out of view
        setShowStickySidebar(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '0px', // Detect when sentinel leaves viewport naturally
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  
  // Scroll spy effect
  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        { ref: specsRef, key: 'specifications' as const },
        { ref: descRef, key: 'description' as const },
        { ref: reviewsRef, key: 'reviews' as const },
      ];
      
      const scrollPosition = window.scrollY + 200;
      
      for (const section of sections) {
        if (section.ref.current) {
          const { offsetTop, offsetHeight } = section.ref.current;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveTab(section.key);
            break;
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Smooth scroll to section
  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const yOffset = -100; // offset for sticky header
      const y = ref.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // Computed values - Show minimum price when no variant is selected
  const currentPrice = selectedVariant 
    ? selectedVariant.price 
    : (product.variants.length > 1 ? Math.min(...product.variants.map(v => v.price)) : product.price);
  
  const currentOfferPrice = selectedVariant 
    ? selectedVariant.offerPrice 
    : (product.variants.length > 1 ? Math.min(...product.variants.map(v => v.offerPrice || v.price)) : product.offerPrice);
  
  const displayPrice = currentOfferPrice || currentPrice;
  const originalPrice = currentOfferPrice ? currentPrice : null;
  const discount = getDiscount(currentPrice, currentOfferPrice);
  const avgRating = getAverageRating(product.reviews);

  // Stock Calculation
  const totalStock = useMemo(() => {
    // If we have variants, sum their stock to get total product stock
    if (product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + v.stock, 0);
    }
    return product.stock;
  }, [product]);

  // Show selected variant stock, or total stock if nothing selected
  const currentStock = selectedVariant ? selectedVariant.stock : totalStock;
  const inStock = currentStock > 0;

  // Get images - maintain original order from product
  const allImages = product.images;

  const currentImage = allImages[selectedImageIndex] || allImages[0];
  const displayImage = currentImage?.url || product.image || (product.images && product.images[0]?.url);

  // Handlers
  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // Switch to variant's image if available
    if (variant.productImage) {
      const idx = product.images.findIndex(i => i.id === variant.productImage!.id);
      if (idx >= 0) {
        setSelectedImageIndex(idx);
      } else {
        setSelectedImageIndex(0);
      }
    } else {
      setSelectedImageIndex(0);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleAddToCart = useCallback((sourceEl?: HTMLButtonElement | null) => {
    if (!inStock) return;
    const variantId = selectedVariant?.id;
    const cartId = variantId ? `${product.id}__${variantId}` : product.id;
    const variantLabel = selectedVariant && selectedVariant.name !== 'Default'
      ? ` (${selectedVariant.name})`
      : '';
    addToCart(
      {
        id: cartId,
        name: `${product.name}${variantLabel}`,
        slug: product.slug,
        price: currentPrice,
        offerPrice: currentOfferPrice ?? null,
        image: displayImage ?? null,
        brand: product.brand?.name ?? null,
        stock: currentStock,
        warrantyMonths: product.warrantyMonths,
      },
      sourceEl ?? undefined
    );
    toast.success(`${product.name.slice(0, 30)}... added to cart`);
  }, [inStock, selectedVariant, product, currentPrice, currentOfferPrice, displayImage, currentStock, addToCart]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out ${product.name} on TechHat!`;
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
    setShowShareMenu(false);
  };

  // Parse variant attributes for group selection
  const variantAttributes = useMemo(() => {
    if (product.productVariantType !== 'variable') return null;
    if (product.attributes && Array.isArray(product.attributes) && product.attributes.length > 0) {
        return product.attributes;
    }
    return null;
  }, [product]);

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-blue-600 transition-colors">
              {product.category.name}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

          {/* ═══════════════ LEFT: IMAGE GALLERY (4 Columns) ═══════════════ */}
          <div className="lg:col-span-4 space-y-4">
            {/* Main Image */}
            <div 
              ref={imageRef}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 cursor-crosshair group"
              onMouseEnter={() => !showVideo && setImageZoom(true)}
              onMouseLeave={() => !showVideo && setImageZoom(false)}
              onMouseMove={handleMouseMove}
            >
              {showVideo && product.videoUrl ? (
                <div className="w-full h-full">
                  {(() => {
                    const videoId = getYouTubeId(product.videoUrl);
                    const embedUrl = videoId 
                      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&loop=1&playlist=${videoId}`
                      : product.videoUrl;
                    
                    return (
                      <iframe
                        src={embedUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    );
                  })()}
                </div>
              ) : currentImage ? (
                <Image
                  src={currentImage.url}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-contain transition-transform duration-200",
                    imageZoom && "scale-150"
                  )}
                  style={imageZoom ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              ) : null}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {discount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                    -{discount}%
                  </span>
                )}
                {product.isFlashSale && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Flash Sale
                  </span>
                )}
              </div>

              {/* Nav Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex(i => (i > 0 ? i - 1 : allImages.length - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex(i => (i < allImages.length - 1 ? i + 1 : 0))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {/* Image counter */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full">
                {selectedImageIndex + 1} / {allImages.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setShowVideo(false);
                    }}
                    className={cn(
                      "relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200",
                      idx === selectedImageIndex && !showVideo
                        ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                        : "border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
                {/* Video Thumbnail */}
                {product.videoUrl && (
                  (() => {
                    const videoId = getYouTubeId(product.videoUrl);
                    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;

                    return (
                      <button
                        onClick={() => {
                          setShowVideo(true);
                          setImageZoom(false);
                        }}
                        className={cn(
                          "relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all bg-gray-900 flex items-center justify-center group/video",
                          showVideo
                            ? "border-blue-500 ring-2 ring-blue-100 shadow-md"
                            : "border-gray-200 hover:border-blue-400"
                        )}
                      >
                        {thumbnailUrl ? (
                            <>
                                <Image 
                                    src={thumbnailUrl} 
                                    alt="Video Thumbnail" 
                                    fill 
                                    className="object-cover opacity-60 group-hover/video:opacity-80 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white drop-shadow-lg" />
                                </div>
                            </>
                         ) : (
                            <Play className="w-8 h-8 text-white/80" />
                         )}
                        <span className="absolute bottom-1 text-[9px] text-white/90 font-bold shadow-sm z-10">VIDEO</span>
                      </button>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          {/* ═══════════════ MIDDLE: PRODUCT INFO (5 Columns) ═══════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title with Wishlist */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight flex-1">
                {product.name}
              </h1>
              <button
                ref={wishlistBtnRef}
                onClick={() => {
                  wishlist?.toggleWishlist(
                    {
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      offerPrice: product.offerPrice,
                      image: displayImage ?? null,
                      brand: product.brand?.name ?? null,
                      discountPercentage: discount,
                      stock: currentStock,
                    },
                    wishlistBtnRef.current
                  );
                  if (!wishlist?.isWishlisted(product.id)) {
                    toast.success('Added to Wishlist');
                  }
                }}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all shrink-0",
                  wishlist?.isWishlisted(product.id)
                    ? "border-red-200 bg-red-50 text-red-500"
                    : "border-gray-200 bg-white text-gray-400 hover:text-red-400 hover:border-red-200"
                )}
              >
                <Heart className={cn("w-5 h-5", wishlist?.isWishlisted(product.id) && "fill-current")} />
              </button>
            </div>

            {/* Rating & Reviews Summary */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <RatingStars rating={avgRating} size="md" />
                <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
              </div>
              <button 
                onClick={() => setActiveTab('reviews')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {product.reviews.length} Review{product.reviews.length !== 1 ? 's' : ''}
              </button>
              {product.sku && (
                <span className="text-xs text-gray-400 font-mono">SKU: {selectedVariant?.sku || product.sku}</span>
              )}
            </div>

            {/* Price Block */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl lg:text-4xl font-black text-gray-900">
                  {formatPrice(displayPrice)}
                </span>
                {originalPrice && (
                  <span className="text-lg text-gray-400 line-through font-medium mb-1">
                    {formatPrice(originalPrice)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="bg-red-100 text-red-700 text-sm font-bold px-2.5 py-1 rounded-lg mb-1">
                    Save {discount}%
                  </span>
                )}
              </div>
              {product.isFlashSale && (
                <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-semibold">⚡ Flash Sale - Limited Time Offer!</span>
                </div>
              )}
            </div>

            {/* Brand & Category */}
            <div className="flex items-center gap-3">
              {product.brand && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full">
                  {product.brand.logo && (
                    <Image src={product.brand.logo} alt={product.brand.name} width={16} height={16} className="rounded" />
                  )}
                  {product.brand.name}
                </span>
              )}
              <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded-full">{product.category.name}</span>
            </div>

            {/* Key Features */}
            {product.specs && product.specs.length > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Key Features
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.specs.slice(0, 4).map((spec) => (
                    <div key={spec.id} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-gray-700">
                        <span className="font-semibold text-gray-900">{spec.name}:</span> {spec.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variant Selector */}
            {product.productVariantType === 'variable' && product.variants.length > 1 && (
              <div className="flex flex-wrap items-start gap-6">
                {variantAttributes?.map(attr => {
                  const currentAttrValue = selectedVariant ? getVariantAttributeValue(selectedVariant, attr.name) : null;
                  const isColorAttribute = attr.name.toLowerCase() === 'color' || attr.name.toLowerCase() === 'colour';
                  
                  return (
                    <div key={attr.id} className="flex items-center gap-2 flex-wrap">
                      {isColorAttribute ? (
                        <>
                          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                            {attr.name}:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map(val => {
                          // Check if this value is currently selected
                          const isSelected = currentAttrValue && currentAttrValue.toLowerCase() === val.toLowerCase();
                          
                          // Check availability: match variant.name with attribute value (case-insensitive)
                          const matchingVariants = product.variants.filter(v => {
                              const vAttrVal = getVariantAttributeValue(v, attr.name);
                              return vAttrVal && vAttrVal.toLowerCase() === val.toLowerCase();
                          });
                          
                          const available = matchingVariants.length > 0 && matchingVariants.some(v => v.stock > 0);
                          const colorCode = isColorAttribute ? getColorCode(val) : null;
                          
                          // Modern color-only design for color attributes
                          if (isColorAttribute && colorCode) {
                            return (
                              <button
                                key={val}
                                onClick={() => {
                                    // Find the best matching variant for this value
                                    let targetVariant: ProductVariant | undefined;
                                    
                                    if (selectedVariant && variantAttributes.length > 1) {
                                        targetVariant = product.variants.find(v => {
                                            const vVal = getVariantAttributeValue(v, attr.name);
                                            if (!vVal || vVal.toLowerCase() !== val.toLowerCase()) return false;
                                            
                                            return variantAttributes.every(otherAttr => {
                                                if (otherAttr.name === attr.name) return true;
                                                
                                                const currentOtherVal = getVariantAttributeValue(selectedVariant, otherAttr.name);
                                                const vOtherVal = getVariantAttributeValue(v, otherAttr.name);
                                                
                                                if (currentOtherVal) {
                                                    return vOtherVal && vOtherVal.toLowerCase() === currentOtherVal.toLowerCase();
                                                }
                                                return true;
                                            });
                                        });
                                    }
                                    
                                    if (!targetVariant) {
                                        targetVariant = product.variants.find(v => {
                                            const vVal = getVariantAttributeValue(v, attr.name);
                                            return vVal && vVal.toLowerCase() === val.toLowerCase();
                                        });
                                    }
                                    
                                    if (targetVariant) {
                                        handleVariantSelect(targetVariant);
                                    }
                                }}
                                disabled={!available}
                                className={cn(
                                  "relative w-8 h-8 rounded-full transition-all duration-300 group",
                                  available ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-40"
                                )}
                              >
                                {/* Color Circle */}
                                <span 
                                  className={cn(
                                    "absolute inset-0 rounded-full transition-all duration-300",
                                    val.toLowerCase() === 'white' ? "border-2 border-gray-300" : "border-2 border-transparent"
                                  )}
                                  style={{ backgroundColor: colorCode }}
                                />
                                
                                {/* Selected Ring */}
                                {isSelected && (
                                  <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-blue-500 animate-pulse" />
                                )}
                                
                                {/* Checkmark for selected */}
                                {isSelected && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                                
                                {/* Out of stock indicator */}
                                {!available && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="w-6 h-0.5 bg-gray-400 rotate-45" />
                                  </span>
                                )}
                                
                                {/* Tooltip on hover */}
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {val}
                                </span>
                              </button>
                            );
                          }
                        })}
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {attr.name}:
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map(val => {
                              // Check if this value is currently selected
                              const isSelected = currentAttrValue && currentAttrValue.toLowerCase() === val.toLowerCase();
                              
                              // Check availability: match variant.name with attribute value (case-insensitive)
                              const matchingVariants = product.variants.filter(v => {
                                  const vAttrVal = getVariantAttributeValue(v, attr.name);
                                  return vAttrVal && vAttrVal.toLowerCase() === val.toLowerCase();
                              });
                              
                              const available = matchingVariants.length > 0 && matchingVariants.some(v => v.stock > 0);
                              
                              // Standard button design for non-color attributes
                              return (
                                <button
                                  key={val}
                                  onClick={() => {
                                      let targetVariant: ProductVariant | undefined;
                                      
                                      if (selectedVariant && variantAttributes.length > 1) {
                                          targetVariant = product.variants.find(v => {
                                              const vVal = getVariantAttributeValue(v, attr.name);
                                              if (!vVal || vVal.toLowerCase() !== val.toLowerCase()) return false;
                                              
                                              return variantAttributes.every(otherAttr => {
                                                  if (otherAttr.name === attr.name) return true;
                                                  
                                                  const currentOtherVal = getVariantAttributeValue(selectedVariant, otherAttr.name);
                                                  const vOtherVal = getVariantAttributeValue(v, otherAttr.name);
                                                  
                                                  if (currentOtherVal) {
                                                      return vOtherVal && vOtherVal.toLowerCase() === currentOtherVal.toLowerCase();
                                                  }
                                                  return true;
                                              });
                                          });
                                      }
                                      
                                      if (!targetVariant) {
                                          targetVariant = product.variants.find(v => {
                                              const vVal = getVariantAttributeValue(v, attr.name);
                                              return vVal && vVal.toLowerCase() === val.toLowerCase();
                                          });
                                      }
                                      
                                      if (targetVariant) {
                                          handleVariantSelect(targetVariant);
                                      }
                                  }}
                                  disabled={!available}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 hover:scale-105",
                                    isSelected
                                      ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200"
                                      : available
                                      ? "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                                      : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through"
                                  )}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Fallback: Simple variant buttons if no attributes defined */}
                {!variantAttributes && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Variant</label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map(v => (
                        <button
                          key={v.id}
                          onClick={() => handleVariantSelect(v)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all duration-200",
                            selectedVariant?.id === v.id
                              ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                              : v.stock > 0
                              ? "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                          )}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock Status & Quantity Selector */}
            <div className="flex items-center gap-3 flex-wrap">
              {inStock ? (
                <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 text-sm font-semibold px-3 py-1.5 rounded-full border border-green-200">
                  <Check className="w-4 h-4" /> In Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-red-700 bg-red-50 text-sm font-semibold px-3 py-1.5 rounded-full border border-red-200">
                  Out of Stock
                </span>
              )}
              {inStock && (
                <span className="text-gray-600 text-sm font-medium bg-gray-100 px-3 py-1.5 rounded-full">
                  Stock: {currentStock}
                </span>
              )}
              
              {/* Quantity Selector - inline with stock */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-800">Quantity:</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white w-32">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(currentStock, parseInt(e.target.value) || 1)))}
                    className="flex-1 h-11 text-center text-base font-bold text-gray-900 border-x-2 border-gray-200 focus:outline-none w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                    className="w-10 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Cart and Buy Now */}
              <div className="flex gap-3">
                <button 
                  ref={addToCartBtnRef}
                  disabled={!inStock}
                  onClick={() => handleAddToCart(addToCartBtnRef.current)}
                  className="flex-1 h-12 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:shadow-none uppercase tracking-wide"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
                <button 
                  disabled={!inStock}
                  onClick={() => setShowCheckout(true)}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl uppercase tracking-wide"
                >
                  <Zap className="w-5 h-5" />
                  Buy Now
                </button>
              </div>

              {/* WhatsApp and Call */}
              <div className="flex gap-3">
                <a
                  href={getWhatsAppUrl(product, selectedVariant, quantity)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl uppercase tracking-wide"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order on WhatsApp
                </a>
                <a
                  href="tel:09678300400"
                  className="flex-1 h-12 bg-white border-2 border-gray-900 text-gray-900 hover:bg-gray-50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-wide"
                >
                  <Phone className="w-5 h-5" />
                  Call for Order
                </a>
              </div>
            </div>

            {/* Share Options */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <Share2 className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Share:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare('facebook')}
                    title="Share on Facebook"
                    className="w-9 h-9 flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-full transition-all hover:scale-110"
                  >
                    <Facebook className="w-4 h-4" fill="currentColor" />
                  </button>
                  <button
                    onClick={() => handleShare('whatsapp')}
                    title="Share on WhatsApp"
                    className="w-9 h-9 flex items-center justify-center bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full transition-all hover:scale-110"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => window.open(`fb-messenger://share?link=${encodeURIComponent(window.location.href)}`, '_blank')}
                    title="Share on Messenger"
                    className="w-9 h-9 flex items-center justify-center bg-[#0084FF] hover:bg-[#0073E6] text-white rounded-full transition-all hover:scale-110"
                  >
                    <MessageCircle className="w-4 h-4" fill="currentColor" />
                  </button>
                  <button
                    onClick={() => window.open(`https://www.instagram.com/`, '_blank')}
                    title="Share on Instagram"
                    className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white rounded-full transition-all hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    title="Share on X (Twitter)"
                    className="w-9 h-9 flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-full transition-all hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                    title="Share on LinkedIn"
                    className="w-9 h-9 flex items-center justify-center bg-[#0A66C2] hover:bg-[#004182] text-white rounded-full transition-all hover:scale-110"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    title="Copy link"
                    className="w-9 h-9 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-all hover:scale-110"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════ RIGHT: DELIVERY SIDEBAR (3 Columns) ═══════════════ */}
          <div className="lg:col-span-3 space-y-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden text-sm bg-gray-50/50 sticky top-24">
                {/* Delivery Header */}
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Delivery Options</span>
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                </div>
                
                <div className="divide-y divide-gray-100 bg-white">
                    {/* Location */}
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                        <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{selectedUnion}, {selectedUpazila}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{selectedDistrict}, {selectedDivision}</p>
                            {customAddress && <p className="text-xs text-gray-600 mt-1">{customAddress}</p>}
                        </div>
                        <button 
                          onClick={() => setShowLocationModal(true)}
                          className="text-blue-600 font-medium text-xs hover:underline"
                        >
                          CHANGE
                        </button>
                    </div>

                    {/* Sold By */}
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                        <Store className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Sold By:</p>
                            <p className="text-sm font-bold text-blue-600 mt-0.5">TechHat. Your Trusted Techshop</p>
                        </div>
                        <button className="text-blue-600 font-medium text-xs hover:underline">VISIT STORE</button>
                    </div>

                    {/* Home Delivery */}
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                        <Truck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <div className="flex justify-between">
                                <p className="font-medium text-gray-900">Home Delivery</p>
                                <span className="font-bold text-gray-900">৳ 60</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">Get your product delivered to your doorstep.</p>
                        </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                        <Banknote className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">Cash on Delivery Available</p>
                            <p className="text-xs text-gray-500 mt-0.5">Pay when you receive the product.</p>
                        </div>
                    </div>
                </div>

                {/* Service Header */}
                <div className="bg-gray-100 px-4 py-2 border-y border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Service & Warranty</span>
                    <Shield className="w-4 h-4 text-gray-400" />
                </div>

                <div className="divide-y divide-gray-100 bg-white">
                     {/* Warranty */}
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                        <BadgeCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">{product.warrantyMonths ? `${product.warrantyMonths} Months Warranty` : '100% Authentic Product'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{product.warrantyType || 'Brand Warranty'}</p>
                        </div>
                    </div>

                    {/* Return Policy */}
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                        <RotateCcw className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-medium text-gray-900">7 Days Return</p>
                            <p className="text-xs text-gray-500 mt-0.5">Change of mind is not applicable.</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* ═══════════════ SECTIONS: Specs / Description / Reviews ═══════════════ */}
        <div className="mt-16 border-t border-gray-100 pt-10 relative">
          {/* Sentinel for sticky detection */}
          <div ref={sentinelRef} className="absolute -top-20 left-0 w-full h-px" />
          
          {/* Sticky Navigation */}
          <div ref={stickyNavRef} className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 -mx-4 px-4 mb-8">
            <div className="flex gap-1 w-fit">
              {[
                { key: 'specifications', label: 'Specifications', count: product.specs.length, ref: specsRef },
                { key: 'description', label: 'Description', count: null, ref: descRef },
                { key: 'reviews', label: 'Reviews', count: product.reviews.length, ref: reviewsRef },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => scrollToSection(tab.ref)}
                  className={cn(
                    "px-5 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2",
                    activeTab === tab.key
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 hover:text-gray-700 border-transparent"
                  )}
                >
                  {tab.label}
                  {tab.count !== null && tab.count > 0 && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Content Sections */}
            <div className="lg:col-span-2 space-y-16">
              {/* Specifications Section */}
              <div ref={specsRef} className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
            {product.specs && product.specs.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100">
                  {product.specs.map((spec, index) => (
                    <div
                      key={spec.id}
                      className={cn(
                        "grid grid-cols-3 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}
                    >
                      <div className="col-span-1 font-semibold text-sm text-gray-700">{spec.name}</div>
                      <div className="col-span-2 text-sm text-gray-600">{spec.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12 bg-gray-50 rounded-2xl">No specifications available.</p>
            )}
          </div>

              {/* Description Section */}
              <div ref={descRef} className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Description</h2>
                {product.description ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm relative overflow-hidden">
                    <div 
                      className={cn(
                        "prose prose-gray prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-lg prose-img:shadow-md prose-img:max-w-full prose-img:h-auto max-w-none text-gray-600 leading-relaxed transition-all duration-300",
                        !descriptionExpanded && "max-h-[300px] overflow-hidden"
                      )}
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                    {!descriptionExpanded && product.description.length > 500 && (
                      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/90 to-white/0 pointer-events-none" />
                    )}
                    {product.description.length > 500 && (
                      <div className={cn("text-center relative z-10", !descriptionExpanded ? "mt-2" : "mt-6")}>
                        <button
                          onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-medium hover:bg-blue-100 transition-colors shadow-sm"
                        >
                          {descriptionExpanded ? (
                            <>
                              Show Less <ChevronDown className="w-4 h-4 rotate-180" />
                            </>
                          ) : (
                            <>
                              See More <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {/* Video Preview - Only show when expanded */}
                    {descriptionExpanded && product.videoUrl && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Play className="w-5 h-5 text-blue-600" />
                      Product Video
                    </h3>
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                      {getYouTubeId(product.videoUrl) ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${getYouTubeId(product.videoUrl)}`}
                          title="Product Video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                        />
                      ) : (
                        <video src={product.videoUrl} controls className="w-full h-full" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12 bg-gray-50 rounded-2xl">No description available.</p>
            )}
              </div>

              {/* Reviews Section */}
              <div ref={reviewsRef} className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                <ProductReviewSection
                  productId={product.id}
                  initialReviews={product.reviews}
                  initialStats={product.reviewStats}
                />
              </div>
            </div>

            {/* Right: Sticky Product Summary - Only show when scrolled */}
            <div className="lg:col-span-1">
              <AnimatePresence>
                {showStickySidebar && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="sticky top-32 z-30"
                  >
                    <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
                      {/* Product Thumbnail & Title */}
                      <div className="bg-gradient-to-br from-gray-50 to-white p-4 border-b border-gray-200">
                        <div className="flex gap-3">
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0 shadow-sm">
                            {displayImage ? (
                              <Image
                                src={displayImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                              />
                            ) : (
                              <Package className="w-10 h-10 text-gray-300 absolute inset-0 m-auto" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-tight mb-2">
                              {product.name}
                            </h3>
                            <button
                              onClick={() => setIsWishlisted(!isWishlisted)}
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-medium transition-all px-2.5 py-1 rounded-full",
                                isWishlisted 
                                  ? "text-red-600 bg-red-50 border border-red-200" 
                                  : "text-gray-500 bg-white border border-gray-300 hover:text-red-500 hover:border-red-300"
                              )}
                            >
                              <Heart className={cn("w-3.5 h-3.5", isWishlisted && "fill-current")} />
                              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="p-4 space-y-4">
                        {/* Price */}
                        <div>
                          <div className="flex items-baseline gap-2 mb-1.5 flex-wrap">
                            <span className="text-3xl font-black text-gray-900">
                              {formatPrice(displayPrice)}
                            </span>
                            {originalPrice && (
                              <>
                                <span className="text-base text-gray-400 line-through">
                                  {formatPrice(originalPrice)}
                                </span>
                                {discount > 0 && (
                                  <span className="inline-block bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                                    Save {discount}%
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          {product.isFlashSale && (
                            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-semibold">
                              <Zap className="w-3.5 h-3.5" />
                              Flash Sale - Limited Time!
                            </div>
                          )}
                        </div>

                        {/* Key Features */}
                        {product.specs && product.specs.length > 0 && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                              <Package className="w-3.5 h-3.5 text-blue-600" />
                              Key Features
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {product.specs.slice(0, 4).map((spec) => (
                                <div key={spec.id} className="flex items-start gap-1.5 text-xs">
                                  <ChevronRight className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                                  <span className="text-gray-700 line-clamp-1">
                                    <span className="font-semibold text-gray-900">{spec.name}:</span> {spec.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Variant Attributes */}
                        {product.productVariantType === 'variable' && product.variants.length > 1 && variantAttributes && (
                          <div className="pb-4 border-b border-gray-200">
                            <div className="flex flex-wrap items-center gap-3">
                            {variantAttributes.map(attr => {
                              const currentAttrValue = selectedVariant ? getVariantAttributeValue(selectedVariant, attr.name) : null;
                              const isColorAttribute = attr.name.toLowerCase() === 'color' || attr.name.toLowerCase() === 'colour';
                              
                              return (
                                <div key={attr.id} className="flex items-center gap-2">
                                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                    {attr.name}:
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {attr.values.map(val => {
                                      // Check if this value is currently selected
                                      const isSelected = currentAttrValue && currentAttrValue.toLowerCase() === val.toLowerCase();
                                      
                                      // Check availability: match variant.name with attribute value (case-insensitive)
                                      const matchingVariants = product.variants.filter(v => {
                                        const vAttrVal = getVariantAttributeValue(v, attr.name);
                                        return vAttrVal && vAttrVal.toLowerCase() === val.toLowerCase();
                                      });
                                      
                                      const available = matchingVariants.length > 0 && matchingVariants.some(v => v.stock > 0);
                                      const colorCode = isColorAttribute ? getColorCode(val) : null;
                                      
                                      if (isColorAttribute && colorCode) {
                                        return (
                                          <button
                                            key={val}
                                            onClick={() => {
                                              // Find the best matching variant for this value
                                              let targetVariant: ProductVariant | undefined;
                                              
                                              if (selectedVariant && variantAttributes.length > 1) {
                                                targetVariant = product.variants.find(v => {
                                                  const vVal = getVariantAttributeValue(v, attr.name);
                                                  if (!vVal || vVal.toLowerCase() !== val.toLowerCase()) return false;
                                                  
                                                  return variantAttributes.every(otherAttr => {
                                                    if (otherAttr.name === attr.name) return true;
                                                    
                                                    const currentOtherVal = getVariantAttributeValue(selectedVariant, otherAttr.name);
                                                    const vOtherVal = getVariantAttributeValue(v, otherAttr.name);
                                                    
                                                    if (currentOtherVal) {
                                                      return vOtherVal && vOtherVal.toLowerCase() === currentOtherVal.toLowerCase();
                                                    }
                                                    return true;
                                                  });
                                                });
                                              }
                                              
                                              if (!targetVariant) {
                                                targetVariant = product.variants.find(v => {
                                                  const vVal = getVariantAttributeValue(v, attr.name);
                                                  return vVal && vVal.toLowerCase() === val.toLowerCase();
                                                });
                                              }
                                              
                                              if (targetVariant) {
                                                handleVariantSelect(targetVariant);
                                              }
                                            }}
                                            disabled={!available}
                                            className={cn(
                                              "w-8 h-8 rounded-full border-2 transition-all shadow-sm relative",
                                              isSelected 
                                                ? "border-blue-500 ring-2 ring-blue-200 scale-110" 
                                                : "border-gray-300 hover:border-gray-400",
                                              !available && "opacity-40 cursor-not-allowed"
                                            )}
                                            style={{ backgroundColor: colorCode }}
                                            title={val}
                                          >
                                            {isSelected && (
                                              <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                                            )}
                                          </button>
                                        );
                                      }
                                      
                                      return (
                                        <button
                                          key={val}
                                          onClick={() => {
                                            // Find the best matching variant for this value
                                            let targetVariant: ProductVariant | undefined;
                                            
                                            if (selectedVariant && variantAttributes.length > 1) {
                                              targetVariant = product.variants.find(v => {
                                                const vVal = getVariantAttributeValue(v, attr.name);
                                                if (!vVal || vVal.toLowerCase() !== val.toLowerCase()) return false;
                                                
                                                return variantAttributes.every(otherAttr => {
                                                  if (otherAttr.name === attr.name) return true;
                                                  
                                                  const currentOtherVal = getVariantAttributeValue(selectedVariant, otherAttr.name);
                                                  const vOtherVal = getVariantAttributeValue(v, otherAttr.name);
                                                  
                                                  if (currentOtherVal) {
                                                    return vOtherVal && vOtherVal.toLowerCase() === currentOtherVal.toLowerCase();
                                                  }
                                                  return true;
                                                });
                                              });
                                            }
                                            
                                            if (!targetVariant) {
                                              targetVariant = product.variants.find(v => {
                                                const vVal = getVariantAttributeValue(v, attr.name);
                                                return vVal && vVal.toLowerCase() === val.toLowerCase();
                                              });
                                            }
                                            
                                            if (targetVariant) {
                                              handleVariantSelect(targetVariant);
                                            }
                                          }}
                                          disabled={!available}
                                          className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                                            isSelected
                                              ? "border-blue-500 bg-blue-500 text-white shadow-md"
                                              : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50",
                                            !available && "opacity-40 cursor-not-allowed line-through"
                                          )}
                                        >
                                          {val}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                            </div>
                          </div>
                        )}

                        {/* Stock & Quantity - Same Line */}
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Stock Status */}
                          <div>
                            {inStock ? (
                              <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-green-200">
                                <Check className="w-4 h-4" />
                                <span>In Stock: {currentStock}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-2 text-red-700 bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg border-2 border-red-200">
                                <AlertCircle className="w-4 h-4" />
                                <span>Out of Stock</span>
                              </div>
                            )}
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                              Qty:
                            </label>
                            <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm">
                              <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={!inStock}
                                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, Math.min(currentStock, parseInt(e.target.value) || 1)))}
                                disabled={!inStock}
                                className="w-12 h-8 text-center text-sm font-bold border-x-2 border-gray-300 focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-gray-50"
                              />
                              <button
                                onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                                disabled={!inStock}
                                className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2.5 pt-2">
                          <button 
                            disabled={!inStock}
                            onClick={() => handleAddToCart()}
                            className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                          </button>
                          <button 
                            disabled={!inStock}
                            onClick={() => setShowCheckout(true)}
                            className="w-full h-11 bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
                          >
                            <Zap className="w-4 h-4" />
                            Buy Now
                          </button>
                          <a
                            href={getWhatsAppUrl(product, selectedVariant, quantity)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full h-11 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                          >
                            <MessageCircle className="w-4 h-4" />
                            Order via WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ═══════════════ RELATED PRODUCTS ═══════════════ */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 border-t border-gray-100 pt-12">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">You May Also Like</h2>
                <p className="text-gray-500 text-sm mt-1">Similar products from {product.category.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6">
              {relatedProducts.slice(0, 6).map(rp => {
                const rpDiscount = getDiscount(rp.price, rp.offerPrice);
                return (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.slug}`}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      {rp.image ? (
                        <Image
                          src={rp.image}
                          alt={rp.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                      {rpDiscount > 0 && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          -{rpDiscount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3 lg:p-4">
                      {rp.brand && (
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">{rp.brand}</p>
                      )}
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors leading-snug mb-2">
                        {rp.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-gray-900">
                          {formatPrice(rp.offerPrice || rp.price)}
                        </span>
                        {rp.offerPrice && rp.offerPrice < rp.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(rp.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* View More Button */}
            {relatedProducts.length > 6 && (
              <div className="text-center mt-10">
                <Link
                  href={`/category/${product.category.slug}`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all"
                >
                  View More Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════ LOCATION SELECTOR MODAL ═══════════════ */}
      <AnimatePresence>
        {showLocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={() => setShowLocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[75vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Select Delivery Location</h2>
                  <p className="text-xs text-gray-600 mt-0.5">Choose your complete address</p>
                </div>
                <button 
                  onClick={() => setShowLocationModal(false)} 
                  className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Division */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    বিভাগ (Division)
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => {
                      setSelectedDivision(e.target.value);
                      const districts = getDistricts(e.target.value);
                      setSelectedDistrict(districts[0] || '');
                      const upazilas = getUpazilas(e.target.value, districts[0] || '');
                      setSelectedUpazila(upazilas[0] || '');
                      const unions = getUnions(e.target.value, districts[0] || '', upazilas[0] || '');
                      setSelectedUnion(unions[0] || '');
                    }}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  >
                    {getDivisions().map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    জেলা (District)
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      const upazilas = getUpazilas(selectedDivision, e.target.value);
                      setSelectedUpazila(upazilas[0] || '');
                      const unions = getUnions(selectedDivision, e.target.value, upazilas[0] || '');
                      setSelectedUnion(unions[0] || '');
                    }}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  >
                    {getDistricts(selectedDivision).map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Upazila */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    উপজেলা (Upazila/Thana)
                  </label>
                  <select
                    value={selectedUpazila}
                    onChange={(e) => {
                      setSelectedUpazila(e.target.value);
                      const unions = getUnions(selectedDivision, selectedDistrict, e.target.value);
                      setSelectedUnion(unions[0] || '');
                    }}
                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  >
                    {getUpazilas(selectedDivision, selectedDistrict).map(upa => (
                      <option key={upa} value={upa}>{upa}</option>
                    ))}
                  </select>
                </div>

                {/* Union */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    ইউনিয়ন/পৌরসভা (Union/Pourashava)
                  </label>
                  {!isCustomUnion ? (
                    <select
                      value={selectedUnion}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER__') {
                          setIsCustomUnion(true);
                          setCustomUnionInput('');
                        } else {
                          setSelectedUnion(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                    >
                      {getUnions(selectedDivision, selectedDistrict, selectedUpazila).map(union => (
                        <option key={union} value={union}>{union}</option>
                      ))}
                      <option value="__OTHER__" className="text-blue-600 font-semibold">✍️ অন্যান্য (টাইপ করুন)</option>
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customUnionInput}
                        onChange={(e) => setCustomUnionInput(e.target.value)}
                        placeholder="ইউনিয়ন/পৌরসভার নাম লিখুন..."
                        className="w-full px-3 py-2 bg-white border-2 border-blue-400 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomUnion(false);
                          setCustomUnionInput('');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                      >
                        ← তালিকা থেকে নির্বাচন করুন
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    গ্রাম/পাড়া/মহল্লা (Village/Para/Mahalla)
                  </label>
                  <input
                    type="text"
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Enter your area, village, or neighborhood..."
                    className="w-full px-3 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Optional: Add specific location details</p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] font-semibold text-gray-700 mb-0.5">Selected Address:</p>
                  <p className="text-xs text-gray-900 font-medium">
                    {customAddress && `${customAddress}, `}
                    {isCustomUnion ? customUnionInput : selectedUnion}, {selectedUpazila}, {selectedDistrict}, {selectedDivision}
                  </p>
                </div>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  <Check className="w-4 h-4" />
                  Confirm Location
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        items={[{
          productId: product.id,
          variantId: selectedVariant?.id || null,
          productName: product.name + (selectedVariant ? ` (${selectedVariant.name})` : ''),
          variantName: selectedVariant?.name || null,
          quantity,
          unitPrice: displayPrice,
          image: selectedVariant?.image || product.images?.[0]?.url || null,
        }]}
      />
    </div>
  );
}
