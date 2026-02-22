'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useBranding } from '@/lib/context/branding-context';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ChevronUp,
  CreditCard,
  Smartphone,
} from 'lucide-react';

const footerLinks = {
  about: {
    title: 'About TechHat',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Our Blog', href: '/blog' },
      { label: 'Press & Media', href: '/press' },
      { label: 'Affiliate Program', href: '/affiliate' },
    ],
  },
  customerService: {
    title: 'Customer Service',
    links: [
      { label: 'Help Center', href: '/help' },
      { label: 'Track Your Order', href: '/track-order' },
      { label: 'Shipping Info', href: '/shipping' },
      { label: 'Returns & Exchanges', href: '/returns' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'FAQs', href: '/faqs' },
    ],
  },
  policies: {
    title: 'Policies',
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'Warranty Policy', href: '/warranty' },
    ],
  },
  vendor: {
    title: 'Sell on TechHat',
    links: [
      { label: 'Vendor Registration', href: '/vendor/register' },
      { label: 'Vendor Dashboard', href: '/vendor/dashboard' },
      { label: 'Seller Guidelines', href: '/vendor/guidelines' },
      { label: 'Commission Rates', href: '/vendor/commissions' },
    ],
  },
};

const socialLinks = [
  { Icon: Facebook, href: 'https://facebook.com/techhat', label: 'Facebook', color: 'hover:text-blue-500' },
  { Icon: Twitter, href: 'https://twitter.com/techhat', label: 'Twitter', color: 'hover:text-sky-500' },
  { Icon: Instagram, href: 'https://instagram.com/techhat', label: 'Instagram', color: 'hover:text-pink-500' },
  { Icon: Youtube, href: 'https://youtube.com/techhat', label: 'YouTube', color: 'hover:text-red-500' },
];

const paymentMethods = ['Visa', 'Mastercard', 'bKash', 'Nagad', 'Rocket', 'COD'];

export default function EnterpriseFooter() {
  const { siteLogo } = useBranding();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2"
      >
        <ChevronUp className="w-4 h-4" />
        Back to top
      </button>

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
          {/* Brand Info */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              {siteLogo ? (
                <Image
                  src={siteLogo}
                  alt="Logo"
                  width={160}
                  height={40}
                  className="h-10 w-auto object-contain"
                  unoptimized={siteLogo.endsWith('.svg')}
                />
              ) : (
                <>
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-extrabold text-lg">T</span>
                  </div>
                  <span className="text-xl font-extrabold text-white">TechHat</span>
                </>
              )}
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Your trusted destination for premium electronics, gadgets, and tech accessories.
              Quality products, competitive prices, and exceptional service.
            </p>

            {/* Contact Info */}
            <div className="space-y-2.5">
              <a href="tel:+8801700000000" className="flex items-center gap-2.5 text-sm hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-blue-500" />
                <span>+880 1700-000000</span>
              </a>
              <a href="mailto:support@techhat.com" className="flex items-center gap-2.5 text-sm hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>support@techhat.com</span>
              </a>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>House #12, Road #5, Dhanmondi, Dhaka-1205, Bangladesh</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map(({ Icon, href, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className={`w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 ${color} transition-colors hover:bg-gray-700`}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-sm font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods + Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          {/* Payment Methods */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span className="text-xs text-gray-500 font-medium mr-2">We Accept:</span>
            {paymentMethods.map((method) => (
              <div
                key={method}
                className="px-3 py-1.5 bg-gray-800 rounded-md text-xs font-medium text-gray-400 flex items-center gap-1.5"
              >
                {method === 'Visa' || method === 'Mastercard' ? (
                  <CreditCard className="w-3.5 h-3.5" />
                ) : method === 'COD' ? null : (
                  <Smartphone className="w-3.5 h-3.5" />
                )}
                {method}
              </div>
            ))}
          </div>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} TechHat. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-gray-300 transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
