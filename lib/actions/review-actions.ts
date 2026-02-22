'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ═══════════════ Types ═══════════════

interface CreateReviewInput {
  productId: string;
  userId?: string;
  name: string;
  email?: string;
  rating: number;
  reviewText: string;
  images?: string[];
}

interface ReviewFilters {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified?: boolean;
  productId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ═══════════════ Verified Purchase Check ═══════════════

async function checkVerifiedPurchase(productId: string, userId?: string): Promise<{ isVerified: boolean; orderId?: string }> {
  if (!userId) return { isVerified: false };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItem = await (prisma as any).orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: { in: ['DELIVERED', 'COMPLETED'] },
        },
      },
      include: {
        order: { select: { id: true } },
      },
    });

    if (orderItem) {
      return { isVerified: true, orderId: orderItem.order.id };
    }
  } catch {
    // If order tables don't exist yet, just return false
  }

  return { isVerified: false };
}

// ═══════════════ Create Review ═══════════════

export async function createReview(input: CreateReviewInput) {
  try {
    // Validation
    if (!input.productId) throw new Error('Product ID is required');
    if (!input.name || input.name.trim().length < 2) throw new Error('Name must be at least 2 characters');
    if (!input.rating || input.rating < 1 || input.rating > 5) throw new Error('Rating must be between 1 and 5');
    if (!input.reviewText || input.reviewText.trim().length < 10) throw new Error('Review must be at least 10 characters');

    // Check verified purchase
    const { isVerified, orderId } = await checkVerifiedPurchase(input.productId, input.userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const review = await (prisma as any).review.create({
      data: {
        productId: input.productId,
        userId: input.userId || null,
        orderId: orderId || null,
        name: input.name.trim(),
        email: input.email || null,
        rating: input.rating,
        reviewText: input.reviewText.trim(),
        status: 'PENDING',
        isVerified,
        images: input.images && input.images.length > 0
          ? {
              create: input.images.map(url => ({ imageUrl: url })),
            }
          : undefined,
      },
      include: {
        images: true,
      },
    });

    return { success: true, review, message: 'Review submitted successfully! It will be visible after admin approval.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create review';
    return { success: false, error: message };
  }
}

// ═══════════════ Get Approved Reviews for Product ═══════════════

export async function getProductReviews(productId: string, page = 1, limit = 10) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reviews, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.findMany({
        where: {
          productId,
          status: 'APPROVED',
        },
        include: {
          images: true,
          user: {
            select: {
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          { isVerified: 'desc' },
          { helpfulCount: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.count({
        where: {
          productId,
          status: 'APPROVED',
        },
      }),
    ]);

    return {
      success: true,
      reviews,
      total,
      hasMore: page * limit < total,
      page,
    };
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return { success: false, reviews: [], total: 0, hasMore: false, page: 1 };
  }
}

// ═══════════════ Get Review Stats for Product ═══════════════

export async function getProductReviewStats(productId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews = await (prisma as any).review.findMany({
      where: { productId, status: 'APPROVED' },
      select: { rating: true },
    });

    const total = reviews.length;
    if (total === 0) {
      return {
        success: true,
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ratingBreakdown = reviews.reduce((acc: Record<number, number>, r: any) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const averageRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total;

    return {
      success: true,
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: total,
        ratingBreakdown,
      },
    };
  } catch (error) {
    console.error('Failed to get review stats:', error);
    return {
      success: false,
      stats: { averageRating: 0, totalReviews: 0, ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
    };
  }
}

// ═══════════════ Helpful Vote ═══════════════

export async function toggleHelpful(reviewId: string, userIp: string) {
  try {
    if (!reviewId || !userIp) throw new Error('Missing required fields');

    // Check if already voted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).reviewHelpful.findUnique({
      where: {
        reviewId_userIp: { reviewId, userIp },
      },
    });

    if (existing) {
      // Remove vote
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).$transaction([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).reviewHelpful.delete({
          where: { id: existing.id },
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).review.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ]);
      return { success: true, action: 'removed' };
    } else {
      // Add vote
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).$transaction([
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).reviewHelpful.create({
          data: { reviewId, userIp },
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (prisma as any).review.update({
          where: { id: reviewId },
          data: { helpfulCount: { increment: 1 } },
        }),
      ]);
      return { success: true, action: 'added' };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to toggle helpful';
    return { success: false, error: message };
  }
}

// ═══════════════ Admin: Get All Reviews ═══════════════

export async function getAdminReviews(filters: ReviewFilters = {}) {
  try {
    const { status, isVerified, productId, search, page = 1, limit = 20 } = filters;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;
    if (typeof isVerified === 'boolean') where.isVerified = isVerified;
    if (productId) where.productId = productId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { reviewText: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reviews, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
          user: { select: { fullName: true, email: true, avatarUrl: true } },
          images: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.count({ where }),
    ]);

    // Get counts per status
    const [pendingCount, approvedCount, rejectedCount, verifiedCount] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.count({ where: { status: 'PENDING' } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.count({ where: { status: 'APPROVED' } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.count({ where: { status: 'REJECTED' } }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma as any).review.count({ where: { isVerified: true } }),
    ]);

    return {
      success: true,
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      counts: {
        all: pendingCount + approvedCount + rejectedCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        verified: verifiedCount,
      },
    };
  } catch (error) {
    console.error('Failed to fetch admin reviews:', error);
    return {
      success: false,
      reviews: [],
      total: 0,
      page: 1,
      totalPages: 0,
      counts: { all: 0, pending: 0, approved: 0, rejected: 0, verified: 0 },
    };
  }
}

// ═══════════════ Admin: Approve Review ═══════════════

export async function approveReview(reviewId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).review.update({
      where: { id: reviewId },
      data: { status: 'APPROVED' },
    });

    revalidatePath('/admin/reviews');
    return { success: true, message: 'Review approved successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to approve review';
    return { success: false, error: message };
  }
}

// ═══════════════ Admin: Reject Review ═══════════════

export async function rejectReview(reviewId: string, adminNote?: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).review.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        adminNote: adminNote || null,
      },
    });

    revalidatePath('/admin/reviews');
    return { success: true, message: 'Review rejected' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reject review';
    return { success: false, error: message };
  }
}

// ═══════════════ Admin: Delete Review ═══════════════

export async function deleteReview(reviewId: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).review.delete({
      where: { id: reviewId },
    });

    revalidatePath('/admin/reviews');
    return { success: true, message: 'Review deleted permanently' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete review';
    return { success: false, error: message };
  }
}

// ═══════════════ Admin: Bulk Actions ═══════════════

export async function bulkUpdateReviewStatus(reviewIds: string[], status: 'APPROVED' | 'REJECTED') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).review.updateMany({
      where: { id: { in: reviewIds } },
      data: { status },
    });

    revalidatePath('/admin/reviews');
    return { success: true, message: `${reviewIds.length} reviews ${status.toLowerCase()} successfully` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update reviews';
    return { success: false, error: message };
  }
}

// ═══════════════ Admin: Bulk Delete ═══════════════

export async function bulkDeleteReviews(reviewIds: string[]) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).review.deleteMany({
      where: { id: { in: reviewIds } },
    });

    revalidatePath('/admin/reviews');
    return { success: true, message: `${reviewIds.length} reviews deleted` };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete reviews';
    return { success: false, error: message };
  }
}
