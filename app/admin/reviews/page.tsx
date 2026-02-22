'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  BadgeCheck, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Eye, 
  X, 
  Loader2, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  ShieldX, 
  ChevronLeft, 
  ChevronRight,
  Image as ImageIcon,
  ExternalLink,
  CheckSquare,
  Square,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════ Types ═══════════════

interface ReviewImage {
  id: string;
  imageUrl: string;
}

interface AdminReview {
  id: string;
  name: string;
  email: string | null;
  rating: number;
  reviewText: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  helpfulCount: number;
  adminNote: string | null;
  images: ReviewImage[];
  product: { id: string; name: string; slug: string };
  user: { fullName: string | null; email: string | null; avatarUrl: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

interface ReviewCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  verified: number;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected' | 'verified';

// ═══════════════ Rating Stars ═══════════════

function RatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            "w-3.5 h-3.5",
            star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

// ═══════════════ Status Badge ═══════════════

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    APPROVED: { label: 'Approved', className: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  }[status] || { label: status, className: 'bg-gray-50 text-gray-700 border-gray-200', icon: Clock };

  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border", config.className)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ═══════════════ Review Detail Modal ═══════════════

function ReviewDetailModal({ 
  review, 
  onClose, 
  onApprove, 
  onReject, 
  onDelete 
}: { 
  review: AdminReview; 
  onClose: () => void; 
  onApprove: (id: string) => void; 
  onReject: (id: string, note?: string) => void; 
  onDelete: (id: string) => void;
}) {
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Review Details</h2>
            <p className="text-xs text-gray-500">ID: {review.id.slice(0, 8)}...</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reviewer Info */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {review.user?.avatarUrl ? (
                <Image src={review.user.avatarUrl} alt="" width={48} height={48} className="rounded-full" />
              ) : (
                review.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900">{review.name}</h3>
                {review.isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    <BadgeCheck className="w-3 h-3" />
                    Verified Purchase
                  </span>
                )}
                <StatusBadge status={review.status} />
              </div>
              {review.email && <p className="text-sm text-gray-500">{review.email}</p>}
              {review.user?.email && review.user.email !== review.email && (
                <p className="text-xs text-gray-400">Account: {review.user.email}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(review.createdAt).toLocaleDateString('en-US', { 
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Product */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Product</p>
              <p className="font-semibold text-gray-900">{review.product.name}</p>
            </div>
            <Link 
              href={`/products/${review.product.slug}`} 
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Rating</p>
            <div className="flex items-center gap-2">
              <RatingDisplay rating={review.rating} />
              <span className="text-sm font-bold text-gray-700">
                {review.rating}/5
              </span>
            </div>
          </div>

          {/* Review Text */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Review</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review.reviewText}</p>
            </div>
          </div>

          {/* Images */}
          {review.images.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Photos ({review.images.length})</p>
              <div className="flex gap-3 flex-wrap">
                {review.images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setImagePreview(img.imageUrl)}
                    className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors"
                  >
                    <Image src={img.imageUrl} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-blue-700">{review.helpfulCount}</p>
              <p className="text-xs text-blue-600 font-medium">Helpful Votes</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-purple-700">{review.isVerified ? 'Yes' : 'No'}</p>
              <p className="text-xs text-purple-600 font-medium">Verified Purchase</p>
            </div>
          </div>

          {/* Admin Note */}
          {review.adminNote && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs text-amber-700 font-bold mb-1">Admin Note</p>
              <p className="text-sm text-amber-800">{review.adminNote}</p>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
              <p className="text-sm font-bold text-red-700">Rejection Reason (optional)</p>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Add a note about why this review is being rejected..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-red-200 text-sm focus:ring-2 focus:ring-red-400 outline-none bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onReject(review.id, rejectNote); onClose(); }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Confirm Reject
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-100 flex items-center gap-3 flex-wrap sticky bottom-0 bg-white rounded-b-2xl">
          {review.status !== 'APPROVED' && (
            <button
              onClick={() => { onApprove(review.id); onClose(); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
          )}
          {review.status !== 'REJECTED' && !showRejectForm && (
            <button
              onClick={() => setShowRejectForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold hover:bg-amber-700 transition-colors shadow-sm"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          )}
          <button
            onClick={() => { 
              if (confirm('Are you sure you want to permanently delete this review?')) {
                onDelete(review.id); 
                onClose(); 
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </motion.div>

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setImagePreview(null)}
            className="fixed inset-0 bg-black/90 z-[10000] flex items-center justify-center p-4"
          >
            <Image src={imagePreview} alt="" width={800} height={600} className="rounded-2xl object-contain max-h-[80vh]" />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════ Main Admin Reviews Page ═══════════════

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [counts, setCounts] = useState<ReviewCounts>({ all: 0, pending: 0, approved: 0, rejected: 0, verified: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      
      if (activeFilter === 'pending') params.set('status', 'PENDING');
      else if (activeFilter === 'approved') params.set('status', 'APPROVED');
      else if (activeFilter === 'rejected') params.set('status', 'REJECTED');
      else if (activeFilter === 'verified') params.set('verified', 'true');

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews);
        setCounts(data.counts);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, activeFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ═══ Actions ═══

  const handleApprove = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch('/api/admin/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });
      if (res.ok) fetchReviews();
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleReject = async (reviewId: string, adminNote?: string) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch('/api/admin/reviews/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, adminNote }),
      });
      if (res.ok) fetchReviews();
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (reviewId: string) => {
    setActionLoading(reviewId);
    try {
      const res = await fetch('/api/admin/reviews/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });
      if (res.ok) fetchReviews();
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading('bulk');
    try {
      const res = await fetch('/api/admin/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewIds: Array.from(selectedIds) }),
      });
      if (res.ok) { fetchReviews(); setSelectedIds(new Set()); }
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading('bulk');
    try {
      const res = await fetch('/api/admin/reviews/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewIds: Array.from(selectedIds) }),
      });
      if (res.ok) { fetchReviews(); setSelectedIds(new Set()); }
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} reviews permanently?`)) return;
    setActionLoading('bulk');
    try {
      const res = await fetch('/api/admin/reviews/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewIds: Array.from(selectedIds) }),
      });
      if (res.ok) { fetchReviews(); setSelectedIds(new Set()); }
    } catch { /* silent */ }
    finally { setActionLoading(null); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map(r => r.id)));
    }
  };

  // ═══ Filter Tabs ═══

  const filterTabs: { key: FilterTab; label: string; count: number; icon: typeof Clock; color: string }[] = [
    { key: 'all', label: 'All', count: counts.all, icon: MessageSquare, color: 'text-gray-700 bg-gray-100' },
    { key: 'pending', label: 'Pending', count: counts.pending, icon: Clock, color: 'text-amber-700 bg-amber-100' },
    { key: 'approved', label: 'Approved', count: counts.approved, icon: ShieldCheck, color: 'text-green-700 bg-green-100' },
    { key: 'rejected', label: 'Rejected', count: counts.rejected, icon: ShieldX, color: 'text-red-700 bg-red-100' },
    { key: 'verified', label: 'Verified', count: counts.verified, icon: BadgeCheck, color: 'text-blue-700 bg-blue-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
          <p className="text-sm text-gray-500 mt-1">Moderate and manage customer reviews</p>
        </div>
        <button
          onClick={fetchReviews}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveFilter(tab.key); setPage(1); }}
            className={cn(
              "rounded-xl p-4 text-left transition-all border-2 hover:shadow-md",
              activeFilter === tab.key
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-100 bg-white hover:border-gray-200"
            )}
          >
            <tab.icon className={cn("w-5 h-5 mb-2", activeFilter === tab.key ? "text-blue-600" : "text-gray-400")} />
            <p className="text-2xl font-black text-gray-900">{tab.count}</p>
            <p className="text-xs font-medium text-gray-500">{tab.label}</p>
          </button>
        ))}
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search reviews by name, email, or content..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
              {selectedIds.size} selected
            </span>
            <button
              onClick={handleBulkApprove}
              disabled={actionLoading === 'bulk'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={handleBulkReject}
              disabled={actionLoading === 'bulk'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={actionLoading === 'bulk'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Reviews Found</h3>
            <p className="text-sm text-gray-500">
              {activeFilter !== 'all' ? 'Try changing the filter' : 'No reviews have been submitted yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[40px_1fr_1fr_100px_100px_80px_100px_120px] gap-4 px-6 py-3 bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <div className="flex items-center">
                <button onClick={toggleSelectAll}>
                  {selectedIds.size === reviews.length ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              <div>Reviewer</div>
              <div>Product</div>
              <div>Rating</div>
              <div>Status</div>
              <div>Verified</div>
              <div>Date</div>
              <div>Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {reviews.map(review => (
                <div
                  key={review.id}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-[40px_1fr_1fr_100px_100px_80px_100px_120px] gap-3 md:gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center",
                    selectedIds.has(review.id) && "bg-blue-50/50",
                    actionLoading === review.id && "opacity-50 pointer-events-none"
                  )}
                >
                  {/* Checkbox */}
                  <div className="hidden md:flex items-center">
                    <button onClick={() => toggleSelect(review.id)}>
                      {selectedIds.has(review.id) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                  </div>

                  {/* Reviewer */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{review.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{review.email || review.user?.email || '—'}</p>
                    </div>
                  </div>

                  {/* Product */}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate font-medium">{review.product.name}</p>
                    <p className="text-[11px] text-gray-400 truncate line-clamp-1">{review.reviewText.slice(0, 60)}...</p>
                  </div>

                  {/* Rating */}
                  <div>
                    <RatingDisplay rating={review.rating} />
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={review.status} />
                  </div>

                  {/* Verified */}
                  <div>
                    {review.isVerified ? (
                      <BadgeCheck className="w-5 h-5 text-green-500" />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors text-gray-400 hover:text-blue-600"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {review.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleApprove(review.id)}
                        className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-gray-400 hover:text-green-600"
                        title="Approve"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {review.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleReject(review.id)}
                        className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors text-gray-400 hover:text-amber-600"
                        title="Reject"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => { 
                        if (confirm('Delete this review permanently?')) handleDelete(review.id);
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <ReviewDetailModal
            review={selectedReview}
            onClose={() => setSelectedReview(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
