'use client';

import { Truck, ShieldCheck, RotateCcw, BadgeCheck } from 'lucide-react';

const features = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    description: 'Free shipping on orders over ৳2,000. Same-day delivery available in Dhaka.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    description: 'Your payment information is processed securely with 256-bit SSL encryption.',
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '7-day hassle-free return policy. Your satisfaction is our priority.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  {
    icon: BadgeCheck,
    title: 'Genuine Products',
    description: '100% authentic products with official warranty and brand guarantee.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-10 sm:py-12 lg:py-16 bg-gray-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Why Choose TechHat</h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">We care about your shopping experience</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="text-center group"
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 ${feature.bg} rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
