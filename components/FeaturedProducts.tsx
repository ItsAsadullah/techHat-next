'use client';

import { ShoppingCart, Heart } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Mock data
const products = [
  {
    id: 1,
    name: 'MacBook Pro M3 14"',
    price: 159999,
    originalPrice: 169999,
    discount: 6,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&q=80',
  },
  {
    id: 2,
    name: 'iPhone 15 Pro Max',
    price: 139999,
    originalPrice: 149999,
    discount: 7,
    image: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=500&q=80',
  },
  {
    id: 3,
    name: 'Sony WH-1000XM5',
    price: 28000,
    originalPrice: 32000,
    discount: 12,
    image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500&q=80',
  },
  {
    id: 4,
    name: 'Samsung Odyssey G9',
    price: 125000,
    originalPrice: 145000,
    discount: 14,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
  },
  {
    id: 5,
    name: 'Logitech MX Master 3S',
    price: 9500,
    originalPrice: 11000,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&q=80',
  },
  {
    id: 6,
    name: 'iPad Air 5th Gen',
    price: 55000,
    originalPrice: 62000,
    discount: 11,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80',
  },
  {
    id: 7,
    name: 'Asus ROG Rapture Router',
    price: 35000,
    originalPrice: 42000,
    discount: 16,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80', // reusing image for placeholder
  },
  {
    id: 8,
    name: 'Apple Watch Series 9',
    price: 45000,
    originalPrice: 52000,
    discount: 13,
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80',
  },
];

export default function FeaturedProducts() {
  return (
    <section id="products" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold font-heading text-gray-900 mb-2">Featured Products</h2>
            <p className="text-gray-600">Hand-picked selections just for you</p>
          </div>
          <a href="/products" className="hidden md:inline-flex text-blue-600 font-medium hover:text-blue-700 items-center">
            View All Products <span className="ml-1">→</span>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300"
            >
              {/* Image */}
              <div className="relative aspect-square rounded-t-2xl overflow-hidden bg-gray-100">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Badges */}
                {product.discount > 0 && (
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    -{product.discount}%
                  </div>
                )}

                {/* Quick Actions */}
                <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-500 hover:text-red-500 hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300">
                  <Heart className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                  {product.name}
                </h3>
                
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-lg font-bold text-blue-600">
                    ৳{product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      ৳{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <button className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-colors active:scale-95 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <a href="/products" className="inline-flex text-blue-600 font-medium hover:text-blue-700 items-center">
            View All Products <span className="ml-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
