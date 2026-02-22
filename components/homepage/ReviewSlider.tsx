'use client';

import { useRef } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HomepageReview } from '@/lib/homepage-types';

export default function ReviewSlider({ reviews }: { reviews: HomepageReview[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!reviews.length) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 360;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-10 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Customer Reviews</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">Hear from our happy customers</p>
        </div>

        <div className="relative">
          {/* Scroll Buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors hidden lg:flex"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors hidden lg:flex"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="flex-shrink-0 w-[320px] sm:w-[360px] bg-white border border-gray-100 rounded-2xl p-6 snap-start hover:shadow-lg transition-shadow"
              >
                <Quote className="w-8 h-8 text-blue-100 mb-3" />

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-4 h-4',
                        star <= review.rating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-200 fill-gray-200'
                      )}
                    />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-4 mb-4">
                  &ldquo;{review.reviewText}&rdquo;
                </p>

                {/* Reviewer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {review.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{review.name}</p>
                      <p className="text-xs text-gray-400">{review.productName}</p>
                    </div>
                  </div>
                  {review.isVerified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
