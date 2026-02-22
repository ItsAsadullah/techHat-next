'use client';

import { ShieldCheck, Truck, BadgeCheck, Tag } from 'lucide-react';

const features = [
  {
    title: 'Genuine Products',
    description: '100% authentic items sourced directly from brands.',
    icon: BadgeCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-100'
  },
  {
    title: 'Fast Delivery',
    description: 'Express shipping within 24-48 hours nationwide.',
    icon: Truck,
    color: 'text-purple-600',
    bg: 'bg-purple-100'
  },
  {
    title: 'Warranty Support',
    description: 'Full warranty coverage and easy returns policy.',
    icon: ShieldCheck,
    color: 'text-green-600',
    bg: 'bg-green-100'
  },
  {
    title: 'Best Prices',
    description: 'Competitive pricing with regular deals and discounts.',
    icon: Tag,
    color: 'text-orange-600',
    bg: 'bg-orange-100'
  }
];

export default function Features() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.title}
              className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors duration-300"
            >
              <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-6`}>
                <feature.icon className={`w-8 h-8 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
