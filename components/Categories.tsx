'use client';

import { Laptop, Smartphone, Wifi, Watch, Headphones, Monitor } from 'lucide-react';
import Link from 'next/link';

const categories = [
  { name: 'Laptops', icon: Laptop, count: 120, href: '/category/laptops', color: 'bg-blue-100 text-blue-600' },
  { name: 'Smartphones', icon: Smartphone, count: 85, href: '/category/smartphones', color: 'bg-purple-100 text-purple-600' },
  { name: 'WiFi Routers', icon: Wifi, count: 42, href: '/category/routers', color: 'bg-green-100 text-green-600' },
  { name: 'Smart Watches', icon: Watch, count: 56, href: '/category/smart-watches', color: 'bg-orange-100 text-orange-600' },
  { name: 'Accessories', icon: Headphones, count: 230, href: '/category/accessories', color: 'bg-pink-100 text-pink-600' },
  { name: 'Desktop PCs', icon: Monitor, count: 34, href: '/category/desktops', color: 'bg-indigo-100 text-indigo-600' },
];

export default function Categories() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading text-gray-900 mb-4">Browse by Category</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find exactly what you need by exploring our wide range of electronic categories.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center text-center hover:-translate-y-1"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${category.color}`}>
                <category.icon className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
              <p className="text-xs text-gray-500">{category.count} Products</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
