'use client';

import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-bold text-gray-900 font-heading">
                TechHat
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Your one-stop destination for premium electronics and gadgets. We bring the latest technology to your doorstep with authentic products and reliable service.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Customer Service</h4>
            <ul className="space-y-4">
              {['My Account', 'Order History', 'Track Order', 'Wishlist', 'Returns & Exchanges'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Top Categories</h4>
            <ul className="space-y-4">
              {['Laptops & Computers', 'Smartphones', 'Smart Watches', 'Audio & Headphones', 'Cameras'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-500">Level 4, Tech Plaza, Dhanmondi 27, Dhaka-1209, Bangladesh</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-500">+880 1712 345 678</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                <span className="text-sm text-gray-500">support@techhat.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} TechHat. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-400 hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-400 hover:text-gray-600">Terms of Service</a>
            <a href="#" className="text-sm text-gray-400 hover:text-gray-600">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
