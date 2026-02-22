'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorageState } from '@/lib/hooks/useLocalStorageState';
import { Star, ThumbsUp, BadgeCheck, ChevronDown, User, ImageIcon, X, Loader2, Send, Camera, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

// ═══════════════ Types ═══════════════

interface ReviewImage {
  id: string;
  imageUrl: string;
}

interface ReviewData {
  id: string;
  name: string;
  email?: string;
  rating: number;
  reviewText: string;
  status: string;
  isVerified: boolean;
  helpfulCount: number;
  images: ReviewImage[];
  user?: {
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

interface ProductReviewSectionProps {
  productId: string;
  initialReviews: ReviewData[];
  initialStats: ReviewStats;
}

// ═══════════════ Rating Stars Component ═══════════════

function RatingStars({ rating, size = 'sm', interactive = false, onRate }: { 
  rating: number; 
  size?: 'sm' | 'md' | 'lg' | 'xl'; 
  interactive?: boolean;
  onRate?: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const sizeClass = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-7 h-7',
  }[size];

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={cn(
            "transition-transform",
            interactive && "cursor-pointer hover:scale-110 active:scale-95"
          )}
        >
          <Star
            className={cn(
              sizeClass,
              "transition-colors",
              star <= displayRating
                ? "fill-amber-400 text-amber-400"
                : "text-gray-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ═══════════════ Review Form Component ═══════════════

function ReviewForm({ productId, onSubmitted }: { productId: string; onSubmitted: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [name, setName] = useLocalStorageState('review_name', '');
  const [email, setEmail] = useLocalStorageState('review_email', '');
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxImages = 5;
    const remaining = maxImages - images.length;
    
    Array.from(files).slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  }, [images.length]);

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          name,
          email,
          rating,
          reviewText,
          images: images.length > 0 ? images : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setRating(0);
      setName('');
      setEmail('');
      setReviewText('');
      setImages([]);
      onSubmitted();

      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
        >
          <Star className="w-4 h-4" />
          Write a Review
        </button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl border-2 border-blue-100 p-6 shadow-lg"
          >
            {success ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BadgeCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-sm text-gray-500">Your review has been submitted and is pending approval.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Write Your Review</h3>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Rating */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Your Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <RatingStars rating={rating} size="xl" interactive onRate={setRating} />
                    {rating > 0 && (
                      <span className="text-sm text-gray-500 font-medium">
                        {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                      </span>
                    )}
                  </div>
                  {rating === 0 && error && (
                    <p className="text-xs text-red-500 mt-1">Please select a rating</p>
                  )}
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="review-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      required
                      minLength={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Email <span className="text-gray-400 text-xs font-normal">(optional)</span>
                    </label>
                    <input
                      id="review-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={e => setReviewText(e.target.value)}
                    placeholder="Share your experience with this product... (minimum 10 characters)"
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    required
                    minLength={10}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {reviewText.length}/10 characters minimum
                  </p>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Photos <span className="text-gray-400 text-xs font-normal">(optional, max 5)</span>
                  </label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                        <Image src={img} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 flex flex-col items-center justify-center cursor-pointer transition-colors">
                        <Camera className="w-5 h-5 text-gray-400" />
                        <span className="text-[10px] text-gray-400 mt-1">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || rating === 0}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-semibold text-sm transition-all"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

// ═══════════════ Single Review Card ═══════════════

function ReviewCard({ review }: { review: ReviewData }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [isHelpful, setIsHelpful] = useState(false);
  const [loadingHelpful, setLoadingHelpful] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageGalleryIndex, setImageGalleryIndex] = useState(0);

  const displayName = review.user?.fullName || review.name;
  const avatar = review.user?.avatarUrl;

  const handleHelpful = async () => {
    if (loadingHelpful) return;
    setLoadingHelpful(true);
    try {
      const res = await fetch('/api/reviews/helpful', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: review.id }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.action === 'added') {
          setHelpfulCount(prev => prev + 1);
          setIsHelpful(true);
        } else {
          setHelpfulCount(prev => Math.max(0, prev - 1));
          setIsHelpful(false);
        }
      }
    } catch { /* silent */ }
    finally { setLoadingHelpful(false); }
  };

  const openImageGallery = (index: number) => {
    setImageGalleryIndex(index);
    setImagePreview(review.images[index].imageUrl);
  };

  const nextImage = () => {
    const nextIndex = (imageGalleryIndex + 1) % review.images.length;
    setImageGalleryIndex(nextIndex);
    setImagePreview(review.images[nextIndex].imageUrl);
  };

  const prevImage = () => {
    const prevIndex = (imageGalleryIndex - 1 + review.images.length) % review.images.length;
    setImageGalleryIndex(prevIndex);
    setImagePreview(review.images[prevIndex].imageUrl);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 hover:shadow-md transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {avatar ? (
                <Image src={avatar} alt="" width={40} height={40} className="rounded-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-gray-900">{displayName}</p>
                {review.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <BadgeCheck className="w-3 h-3" />
                    Verified Purchase
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <RatingStars rating={review.rating} size="sm" />
        </div>

        {/* Review Text */}
        <p className="text-sm text-gray-600 leading-relaxed mb-3">{review.reviewText}</p>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {review.images.map((img, index) => (
              <button
                key={img.id}
                onClick={() => openImageGallery(index)}
                className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
              >
                <Image src={img.imageUrl} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Helpful */}
        <div className="flex items-center gap-4 pt-3 border-t border-gray-50">
          <button
            onClick={handleHelpful}
            disabled={loadingHelpful}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-lg",
              isHelpful
                ? "text-blue-600 bg-blue-50 border border-blue-200"
                : "text-gray-500 hover:text-blue-600 hover:bg-gray-50 border border-transparent"
            )}
          >
            <ThumbsUp className={cn("w-3.5 h-3.5", isHelpful && "fill-blue-600")} />
            Helpful ({helpfulCount})
          </button>
        </div>
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImagePreview(null)}
            className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-4xl max-h-[85vh] w-full"
            >
              <Image
                src={imagePreview}
                alt=""
                width={1200}
                height={800}
                className="rounded-2xl object-contain mx-auto max-h-[85vh] w-auto"
              />
              
              {/* Close Button */}
              <button
                onClick={() => setImagePreview(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Arrows */}
              {review.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  {/* Image Counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full text-white text-sm font-medium">
                    {imageGalleryIndex + 1} / {review.images.length}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ═══════════════ Rating Summary ═══════════════

function RatingSummary({ stats }: { stats: ReviewStats }) {
  if (stats.totalReviews === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 mb-6">
        <div className="text-center">
          <div className="text-5xl font-black text-gray-900 mb-2">0.0</div>
          <RatingStars rating={0} size="lg" />
          <p className="text-sm text-gray-500 mt-2">No reviews yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
        {/* Average Score */}
        <div className="text-center sm:text-left">
          <div className="text-5xl font-black text-gray-900 mb-1">{stats.averageRating.toFixed(1)}</div>
          <RatingStars rating={stats.averageRating} size="lg" />
          <p className="text-sm text-gray-500 mt-2">
            Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="flex-1 w-full space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = stats.ratingBreakdown[star] || 0;
            const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-3">{star}</span>
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: (5 - star) * 0.1 }}
                    className="h-full bg-amber-400 rounded-full"
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right font-medium">
                  {pct}% ({count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════ See All Reviews Modal ═══════════════

function SeeAllReviewsModal({ 
  productId, 
  isOpen, 
  onClose, 
  initialStats 
}: { 
  productId: string; 
  isOpen: boolean; 
  onClose: () => void;
  initialStats: ReviewStats;
}) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1' | 'photos'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchReviews = async (pageNum = 1, filterType = filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews?product_id=${productId}&page=${pageNum}&limit=20`);
      const data = await res.json();
      if (data.success) {
        let filtered = data.reviews;
        if (filterType !== 'all') {
          if (filterType === 'photos') {
            filtered = filtered.filter((r: ReviewData) => r.images && r.images.length > 0);
          } else {
            const rating = parseInt(filterType);
            filtered = filtered.filter((r: ReviewData) => r.rating === rating);
          }
        }
        setReviews(pageNum === 1 ? filtered : [...reviews, ...filtered]);
        setHasMore(data.hasMore);
        setPage(pageNum);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReviews(1, filter);
    }
  }, [isOpen, filter]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Reviews</h2>
            <p className="text-sm text-gray-500 mt-1">{initialStats.totalReviews} total reviews</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Rating Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <RatingSummary stats={initialStats} />
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {[
              { key: 'all', label: 'All' },
              { key: '5', label: '5★' },
              { key: '4', label: '4★' },
              { key: '3', label: '3★' },
              { key: '2', label: '2★' },
              { key: '1', label: '1★' },
              { key: 'photos', label: 'With Photos' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  filter === f.key
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Review List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reviews found with this filter</p>
            </div>
          ) : (
            <>
              {reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
              ))}
              
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => fetchReviews(page + 1)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════ Empty State ═══════════════

function EmptyReviews({ onWrite }: { onWrite: () => void }) {
  return (
    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ImageIcon className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">No Reviews Yet</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Be the first to share your experience with this product!
      </p>
      <button
        onClick={onWrite}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg hover:shadow-xl"
      >
        <Star className="w-4 h-4" />
        Write a Review
      </button>
    </div>
  );
}

// ═══════════════ Main Product Review Section ═══════════════

export default function ProductReviewSection({ productId, initialReviews, initialStats }: ProductReviewSectionProps) {
  const [reviews, setReviews] = useState<ReviewData[]>(initialReviews);
  const [stats, setStats] = useState<ReviewStats>(initialStats);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  const displayedReviews = reviews.slice(0, 3);
  const hasMore = reviews.length > 3;

  const refreshReviews = async () => {
    try {
      const [reviewsRes, statsRes] = await Promise.all([
        fetch(`/api/reviews?product_id=${productId}&page=1&limit=100`),
        fetch(`/api/reviews?product_id=${productId}&stats=true`),
      ]);
      const reviewsData = await reviewsRes.json();
      const statsData = await statsRes.json();
      if (reviewsData.success) {
        setReviews(reviewsData.reviews);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch { /* silent */ }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        {/* Header */}
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
          <p className="text-gray-600">Real experiences from verified buyers</p>
        </div>

        {/* Rating Summary */}
        <RatingSummary stats={stats} />

        {/* Review Form */}
        <ReviewForm productId={productId} onSubmitted={refreshReviews} />

        {/* Reviews Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              {stats.totalReviews === 0 ? 'No Reviews Yet' : `${stats.totalReviews} Reviews`}
            </h3>
          </div>

          {stats.totalReviews === 0 ? (
            <EmptyReviews onWrite={() => setShowWriteForm(true)} />
          ) : (
            <>
              <div className="space-y-6">
                {displayedReviews.map(review => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center pt-8">
                  <button
                    onClick={() => setShowAllModal(true)}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <ChevronDown className="w-5 h-5" />
                    See All {stats.totalReviews} Reviews
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* See All Reviews Modal */}
      <AnimatePresence>
        {showAllModal && (
          <SeeAllReviewsModal
            productId={productId}
            isOpen={showAllModal}
            onClose={() => setShowAllModal(false)}
            initialStats={stats}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
