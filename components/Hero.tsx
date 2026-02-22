'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white py-12 md:py-20 lg:py-32">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3" />

      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>New Arrivals 2024</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-gray-900 leading-[1.1] mb-6">
              Latest Tech at the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Best Prices
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
              Discover cutting-edge smartphones, powerful computers, high-speed routers, and premium accessories designed to elevate your digital lifestyle.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#products"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
              >
                Shop Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/offers"
                className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
              >
                View Offers
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative lg:h-[500px] flex items-center justify-center"
          >
            {/* Placeholder for hero image */}
            <div className="relative w-full aspect-square max-w-[500px] bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl border border-gray-100 shadow-2xl p-8 flex items-center justify-center group hover:shadow-3xl transition-shadow duration-500">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-500">
                  <span className="text-xs font-mono">Image Placeholder</span>
                </div>
                <p className="text-sm text-gray-400">High-res electronics visual</p>
              </div>
              
              {/* Floating cards */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 max-w-[150px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xs">%</div>
                  <span className="text-xs font-bold text-gray-900">Best Deal</span>
                </div>
                <p className="text-xs text-gray-500">Save up to 30% on select items</p>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Premium</p>
                  <p className="text-xs text-gray-500">Quality Guaranteed</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
