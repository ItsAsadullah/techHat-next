'use client';

import Link from 'next/link';
import { Phone, Truck, MapPin, Globe } from 'lucide-react';

interface TopBarProps {
  hotline?: string;
  deliveryText?: string;
  showDelivery?: boolean;
}

export default function TopUtilityBar({
  hotline = '01700-000000',
  deliveryText = 'Free Delivery on Orders Over ৳2,000',
  showDelivery = true,
}: TopBarProps) {
  return (
    <div className="hidden lg:block bg-gray-900 text-gray-300 text-xs border-b border-gray-800">
      <div className="container mx-auto px-4 flex items-center justify-between h-8">
        {/* Left */}
        <div className="flex items-center gap-5">
          <a href={`tel:${hotline.replace(/\D/g, '')}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
            <Phone className="w-3 h-3" />
            <span>Hotline: {hotline}</span>
          </a>
          {showDelivery && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Truck className="w-3 h-3" />
              <span>{deliveryText}</span>
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-5">
          <Link
            href="/track-order"
            className="flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <MapPin className="w-3 h-3" />
            <span>Track Order</span>
          </Link>
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <Globe className="w-3 h-3" />
            <span>EN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
