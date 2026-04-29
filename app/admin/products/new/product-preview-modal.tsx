'use client';

import { useState, useRef } from 'react';
import {
  X, Star, Zap, Package, ChevronLeft, ChevronRight, Eye,
  Heart, ShoppingCart, MessageCircle, Phone, Share2,
  MapPin, Store, Truck, Banknote, BadgeCheck, RotateCcw, Shield,
  Check, Minus, Plus, Play,
  Facebook, Instagram, Linkedin, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function sanitizePreviewHtml(html: string) {
  if (typeof window === 'undefined') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script, iframe, object, embed, link, meta').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        node.removeAttribute(attr.name);
      }
    });
  });
  return doc.body.innerHTML;
}

interface GalleryImage {
  id: string;
  url: string;
  isThumbnail: boolean;
  file?: File;
}

interface Variation {
  id: string;
  name: string;
  sku: string;
  price: number;
  offerPrice: number;
  stock: number;
  image?: string;
  cost?: number;
  attributes?: Record<string, string>;
}

interface SpecRow {
  id: string;
  key: string;
  value: string;
}

interface TemplateSpec {
  id: string;
  name: string;
  value: string;
}

interface AttributeDef {
  id: string;
  name: string;
  attributeId?: number;
  values: string[];
}

interface PreviewData {
  name: string;
  description: string;
  price: number;
  offerPrice: number;
  costPrice: number;
  stock: number;
  sku: string;
  upc: string;
  unit: string;
  warrantyMonths: number;
  isActive: boolean;
  isFlashSale: boolean;
  productType: string;
  galleryImages: GalleryImage[];
  variations: Variation[];
  attributes: AttributeDef[];
  specs: SpecRow[];
  templateSpecs: TemplateSpec[];
  categoryName?: string;
  brandName?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  data: PreviewData;
}

function formatPrice(n: number) {
  return `৳${n.toLocaleString('en-BD')}`;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn('w-3.5 h-3.5', i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')}
        />
      ))}
    </div>
  );
}

const COLOR_MAP: Record<string, string> = {
  red: '#ef4444', green: '#22c55e', blue: '#3b82f6', yellow: '#eab308',
  orange: '#f97316', purple: '#a855f7', pink: '#ec4899', black: '#111827',
  white: '#ffffff', gray: '#9ca3af', grey: '#9ca3af', brown: '#92400e',
  silver: '#cbd5e1', gold: '#d97706', cyan: '#06b6d4', teal: '#14b8a6',
  indigo: '#6366f1', lime: '#84cc16', rose: '#f43f5e', violet: '#7c3aed',
  sky: '#0ea5e9', emerald: '#10b981', amber: '#f59e0b', fuchsia: '#d946ef',
};

function getColorCode(colorName: string): string | null {
  const lower = colorName.toLowerCase().trim();
  if (/^#([0-9a-f]{3}){1,2}$/i.test(lower)) return lower;
  return COLOR_MAP[lower] ?? null;
}

export function ProductPreviewModal({ open, onClose, data }: Props) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(
    data.variations.length > 0 ? data.variations[0].id : null
  );
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>(() => {
    const first = data.variations[0];
    if (first?.attributes) return { ...first.attributes };
    return {};
  });
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'description'>('specs');
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });
  const imageRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const images = data.galleryImages.filter(img => img.url);
  const sortedImages = [...images].sort((a, b) => (b.isThumbnail ? 1 : 0) - (a.isThumbnail ? 1 : 0));
  const currentImage = sortedImages[selectedImageIdx];
  const displayImage = currentImage?.url ?? '';

  const selectedVariation = data.variations.find(v => v.id === selectedVariationId) ?? null;
  const effectivePrice = selectedVariation ? selectedVariation.price : data.price;
  const effectiveOffer = selectedVariation ? selectedVariation.offerPrice : data.offerPrice;
  const effectiveStock = selectedVariation ? selectedVariation.stock : data.stock;
  const effectiveSKU = selectedVariation ? selectedVariation.sku : data.sku;
  const displayPrice = effectiveOffer > 0 ? effectiveOffer : effectivePrice;
  const hasDiscount = effectiveOffer > 0 && effectiveOffer < effectivePrice;
  const discountPct = hasDiscount ? Math.round(((effectivePrice - effectiveOffer) / effectivePrice) * 100) : 0;
  const inStock = effectiveStock > 0;

  const handleAttrSelect = (attrName: string, value: string) => {
    const next = { ...selectedAttrs, [attrName]: value };
    setSelectedAttrs(next);
    const matched = data.variations.find(v => {
      if (!v.attributes) return false;
      return Object.entries(next).every(([k, val]) => v.attributes![k] === val);
    });
    if (matched) setSelectedVariationId(matched.id);
  };

  const allSpecs = [
    ...data.templateSpecs.filter(s => s.name && s.value).map(s => ({ key: s.name, value: s.value })),
    ...data.specs.filter(s => s.key || s.value).map(s => ({ key: s.key, value: s.value })),
  ].filter(s => s.key && s.value);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = imageRef.current;
    if (!el || !displayImage) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - left) / width) * 100,
      y: ((e.clientY - top) / height) * 100,
      show: true,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-[1200px] max-h-[96vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm text-gray-700">Product Preview</span>
            <span className="text-xs text-gray-400">— how customers see this product</span>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* Breadcrumb */}
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-2.5 text-xs text-gray-500">
            Home
            {data.categoryName && <> &rsaquo; <span>{data.categoryName}</span></>}
            {data.brandName && <> &rsaquo; <span>{data.brandName}</span></>}
            {data.name && <> &rsaquo; <span className="text-gray-700 font-medium">{data.name}</span></>}
          </div>

          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

              {/* ═══ LEFT: Images (4 cols) ═══ */}
              <div className="lg:col-span-4 space-y-3">
                <div
                  ref={imageRef}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 cursor-crosshair group"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={() => setZoomPos(p => ({ ...p, show: false }))}
                >
                  {displayImage ? (
                    <>
                      <img src={displayImage} alt={data.name || 'Product'} className="w-full h-full object-contain pointer-events-none select-none" />
                      {zoomPos.show && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundImage: `url(${displayImage})`,
                            backgroundSize: '300%',
                            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-300">
                      <Package className="w-16 h-16" />
                      <p className="text-sm font-medium text-gray-400">No image uploaded</p>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                    {discountPct > 0 && (
                      <span className="bg-red-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">-{discountPct}%</span>
                    )}
                    {data.isFlashSale && (
                      <span className="flex items-center gap-1 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        <Zap className="w-3 h-3" /> Flash Sale
                      </span>
                    )}
                  </div>

                  {/* Nav arrows */}
                  {sortedImages.length > 1 && (
                    <>
                      <button type="button"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
                        onClick={() => setSelectedImageIdx(i => (i - 1 + sortedImages.length) % sortedImages.length)}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gray-700 hover:bg-white transition-all opacity-0 group-hover:opacity-100 z-10"
                        onClick={() => setSelectedImageIdx(i => (i + 1) % sortedImages.length)}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Counter */}
                  {sortedImages.length > 1 && (
                    <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full pointer-events-none">
                      {selectedImageIdx + 1} / {sortedImages.length}
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                {sortedImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {sortedImages.map((img, idx) => (
                      <button type="button"
                        key={img.id}
                        onClick={() => setSelectedImageIdx(idx)}
                        className={cn(
                          'shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all',
                          idx === selectedImageIdx
                            ? 'border-blue-500 ring-2 ring-blue-100'
                            : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                        )}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ MIDDLE: Product Info (5 cols) ═══ */}
              <div className="lg:col-span-5 space-y-5">
                {/* Title + Wishlist */}
                <div className="flex items-start gap-3">
                  <h1 className="flex-1 text-2xl font-bold text-gray-900 leading-snug">
                    {data.name || <span className="text-gray-400 italic">Product name not set</span>}
                  </h1>
                  <button type="button"
                    onClick={() => setIsWishlisted(w => !w)}
                    className={cn(
                      'shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all',
                      isWishlisted ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-500'
                    )}
                  >
                    <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
                  </button>
                </div>

                {/* Rating + SKU */}
                <div className="flex items-center gap-3 flex-wrap">
                  <RatingStars rating={4} />
                  <span className="text-sm text-blue-600 font-medium">0 reviews</span>
                  {effectiveSKU && (
                    <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-md">
                      SKU: {effectiveSKU}
                    </span>
                  )}
                </div>

                {/* Price block */}
                <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl lg:text-4xl font-black text-gray-900">
                      {displayPrice > 0 ? formatPrice(displayPrice) : <span className="text-gray-300">৳ —</span>}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-xl text-gray-400 line-through font-medium">{formatPrice(effectivePrice)}</span>
                        <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">Save {discountPct}%</span>
                      </>
                    )}
                  </div>
                  {data.isFlashSale && (
                    <div className="mt-3 flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm font-semibold w-fit">
                      <Zap className="w-4 h-4" /> Flash Sale — Limited Time Offer!
                    </div>
                  )}
                </div>

                {/* Brand + Category pills */}
                {(data.brandName || data.categoryName) && (
                  <div className="flex flex-wrap gap-2">
                    {data.brandName && (
                      <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full">
                        <Store className="w-3.5 h-3.5 text-gray-400" /> {data.brandName}
                      </span>
                    )}
                    {data.categoryName && (
                      <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded-full border border-gray-100">
                        {data.categoryName}
                      </span>
                    )}
                  </div>
                )}

                {/* Key Features (first 4 specs) */}
                {allSpecs.length > 0 && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 text-blue-600" /> Key Features
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {allSpecs.slice(0, 4).map((spec, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs">
                          <svg className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                          <span className="text-gray-700 line-clamp-2">
                            <span className="font-semibold text-gray-900">{spec.key}:</span> {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variant selectors */}
                {data.productType === 'variable' && data.attributes.length > 0 && (
                  <div className="space-y-4">
                    {data.attributes.filter(a => a.values.length > 0).map(attr => {
                      const isColorAttr = ['color', 'colour'].includes(attr.name.toLowerCase());
                      return (
                        <div key={attr.id}>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            {attr.name}
                            {selectedAttrs[attr.name] && (
                              <span className="ml-2 font-semibold text-gray-700 normal-case capitalize">: {selectedAttrs[attr.name]}</span>
                            )}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {attr.values.map(val => {
                              const isSelected = selectedAttrs[attr.name] === val;
                              const colorCode = isColorAttr ? getColorCode(val) : null;
                              if (isColorAttr && colorCode) {
                                return (
                                  <button type="button" key={val} onClick={() => handleAttrSelect(attr.name, val)} title={val} className="relative w-8 h-8 rounded-full transition-all duration-300 group">
                                    <span className="absolute inset-0 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: colorCode }} />
                                    {isSelected && <span className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-blue-500" />}
                                    {isSelected && (
                                      <Check className="absolute inset-0 m-auto w-4 h-4 drop-shadow" style={{ color: colorCode === '#ffffff' ? '#111' : 'white' }} />
                                    )}
                                    <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">{val}</span>
                                  </button>
                                );
                              }
                              return (
                                <button type="button" key={val} onClick={() => handleAttrSelect(attr.name, val)}
                                  className={cn(
                                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                                    isSelected ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-200' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50'
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
                )}

                {/* Stock + Quantity */}
                <div className="flex items-center gap-4 flex-wrap">
                  {inStock ? (
                    <div className="inline-flex items-center gap-2 text-green-700 bg-green-50 text-sm font-bold px-4 py-2 rounded-full border-2 border-green-200">
                      <Check className="w-4 h-4" /> In Stock
                      {effectiveStock <= 10 && <span className="text-xs font-normal text-green-600">({effectiveStock} left)</span>}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-red-700 bg-red-50 text-sm font-bold px-4 py-2 rounded-full border-2 border-red-200">Out of Stock</div>
                  )}
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden h-11 w-32">
                    <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={!inStock} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center text-sm font-bold border-x-2 border-gray-200 h-full flex items-center justify-center">{quantity}</span>
                    <button type="button" onClick={() => setQuantity(q => Math.min(effectiveStock || 99, q + 1))} disabled={!inStock} className="w-10 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button type="button" disabled={!inStock} className="flex-1 h-12 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-all">
                      <ShoppingCart className="w-4 h-4" /> Add to Cart
                    </button>
                    <button type="button" disabled={!inStock} className="flex-1 h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-bold text-sm transition-all">
                      <Zap className="w-4 h-4" /> Buy Now
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" className="flex-1 h-12 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all">
                      <MessageCircle className="w-4 h-4" /> Order on WhatsApp
                    </button>
                    <button type="button" className="flex-1 h-12 flex items-center justify-center gap-2 bg-white border-2 border-gray-900 hover:bg-gray-50 text-gray-900 rounded-xl font-bold text-sm transition-all">
                      <Phone className="w-4 h-4" /> Call for Order
                    </button>
                  </div>
                </div>

                {/* Share */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" /> Share:
                  </span>
                  {[
                    { label: 'Facebook', color: '#1877F2', icon: Facebook },
                    { label: 'WhatsApp', color: '#25D366', icon: MessageCircle },
                    { label: 'Instagram', color: '#E1306C', icon: Instagram },
                    { label: 'LinkedIn', color: '#0A66C2', icon: Linkedin },
                    { label: 'Copy', color: '#6b7280', icon: Copy },
                  ].map(({ label, color, icon: Icon }) => (
                    <button type="button" key={label} title={label} style={{ backgroundColor: color }} className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-90 transition-opacity">
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ═══ RIGHT: Delivery Sidebar (3 cols) ═══ */}
              <div className="lg:col-span-3">
                <div className="border border-gray-200 rounded-lg overflow-hidden text-sm bg-gray-50/50">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Delivery Options</span>
                    <Truck className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="divide-y divide-gray-100 bg-white">
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                      <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Dhaka, Dhaka</p>
                        <button type="button" className="text-xs text-blue-600 font-semibold mt-0.5 hover:underline">CHANGE</button>
                      </div>
                    </div>
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                      <Store className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-600">TechHat</p>
                        <button type="button" className="text-xs text-blue-600 font-semibold mt-0.5 hover:underline">VISIT STORE</button>
                      </div>
                    </div>
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                      <Truck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Home Delivery — ৳60</p>
                        <p className="text-xs text-gray-500 mt-0.5">Delivery within 2-3 business days.</p>
                      </div>
                    </div>
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                      <Banknote className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Cash on Delivery Available</p>
                        <p className="text-xs text-gray-500 mt-0.5">Pay when you receive the product.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 px-4 py-2 border-y border-gray-200 flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Service & Warranty</span>
                    <Shield className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="divide-y divide-gray-100 bg-white">
                    <div className="p-4 flex gap-3 hover:bg-gray-50 transition-colors">
                      <BadgeCheck className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {data.warrantyMonths > 0 ? `${data.warrantyMonths} Months Warranty` : '100% Authentic Product'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Brand Warranty</p>
                      </div>
                    </div>
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

            {/* ═══ BOTTOM: Specs / Description ═══ */}
            {(allSpecs.length > 0 || data.description) && (
              <div className="mt-10 border-t border-gray-100 pt-8">
                <div className="flex gap-1 border-b border-gray-200 mb-6">
                  {(['specs', 'description'] as const).filter(t => t === 'specs' ? allSpecs.length > 0 : !!data.description).map(tab => (
                    <button type="button"
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        'px-5 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2 border-b-2 -mb-px',
                        activeTab === tab ? 'text-blue-600 border-blue-600' : 'text-gray-500 hover:text-gray-700 border-transparent'
                      )}
                    >
                      {tab === 'specs' ? 'Specifications' : 'Description'}
                      {tab === 'specs' && allSpecs.length > 0 && (
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', activeTab === tab ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500')}>
                          {allSpecs.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {activeTab === 'specs' && allSpecs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 px-6 pt-5 pb-3">Technical Specifications</h2>
                    <div className="divide-y divide-gray-100">
                      {allSpecs.map((spec, idx) => (
                        <div key={idx} className={cn('grid grid-cols-3 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          <div className="col-span-1 font-semibold text-sm text-gray-700">{spec.key}</div>
                          <div className="col-span-2 text-sm text-gray-600">{spec.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'description' && data.description && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Product Description</h2>
                    <div
                      className="prose prose-gray prose-headings:font-bold prose-a:text-blue-600 prose-img:rounded-lg prose-img:max-w-full max-w-none text-gray-600 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizePreviewHtml(data.description) }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Preview only — actual page may vary slightly
          </p>
          <button type="button" onClick={onClose} className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
