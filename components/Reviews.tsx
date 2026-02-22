'use client';

import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

const reviews = [
  {
    id: 1,
    name: 'Rahim Ahmed',
    rating: 5,
    text: "Ordered a MacBook Pro and got it within 24 hours. The packaging was excellent and the product is 100% genuine. Highly recommended!",
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    verified: true
  },
  {
    id: 2,
    name: 'Sarah Khan',
    rating: 5,
    text: "Best place to buy tech gadgets. Their customer service is top-notch and they helped me choose the right router for my office.",
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    verified: true
  },
  {
    id: 3,
    name: 'Tanvir Hasan',
    rating: 4,
    text: "Great prices compared to other local shops. I bought a Samsung monitor and it works perfectly. Delivery took 2 days.",
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    verified: true
  },
];

export default function Reviews() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold font-heading text-gray-900 mb-4">Trusted by Tech Lovers</h2>
          <p className="text-gray-600">See what our customers have to say about their experience.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative">
              <Quote className="absolute top-8 right-8 w-8 h-8 text-blue-100 fill-blue-50" />
              
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                  />
                ))}
              </div>

              <p className="text-gray-600 mb-8 leading-relaxed">"{review.text}"</p>

              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image src={review.image} alt={review.name} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    {review.name}
                    {review.verified && (
                      <span className="text-green-500 bg-green-50 p-0.5 rounded-full" title="Verified Buyer">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </h4>
                  <span className="text-xs text-gray-400">Verified Buyer</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
