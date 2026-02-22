'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, Copy, CheckCircle2, Clock, Tag, Zap, BadgePercent } from 'lucide-react';
import { toast } from 'sonner';

interface Coupon {
  code: string;
  type: 'percent' | 'flat' | 'shipping';
  value: number;
  minOrder?: number;
  expiry?: string;
  badge: string;
  color: string;
  desc: string;
}

// Demo coupons — in production, fetch from API
const DEMO_COUPONS: Coupon[] = [
  { code: 'WELCOME10', type: 'percent', value: 10, minOrder: 500, expiry: '2025-12-31', badge: 'New User', color: 'from-blue-500 to-indigo-500', desc: '10% off on your first order' },
  { code: 'FREESHIP', type: 'shipping', value: 0, expiry: '2025-09-30', badge: 'Free Shipping', color: 'from-green-500 to-emerald-500', desc: 'Free delivery on any order' },
  { code: 'SAVE150', type: 'flat', value: 150, minOrder: 1000, expiry: '2025-08-31', badge: 'Flat Discount', color: 'from-orange-500 to-red-500', desc: '৳150 off on orders above ৳1000' },
  { code: 'TECH20', type: 'percent', value: 20, minOrder: 2000, expiry: '2025-07-31', badge: 'Tech Sale', color: 'from-purple-500 to-pink-500', desc: '20% off on electronics above ৳2000' },
];

const typeIcons = { percent: BadgePercent, flat: Tag, shipping: Zap };

export default function CouponsPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [promoInput, setPromoInput] = useState('');

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      toast.success(`Copied "${code}" to clipboard!`);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  const isExpired = (expiry?: string) => {
    if (!expiry) return false;
    return new Date(expiry) < new Date();
  };

  const daysLeft = (expiry?: string) => {
    if (!expiry) return null;
    const diff = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
    return diff;
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Ticket className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Coupons & Offers</h1>
            <p className="text-sm text-gray-500">{DEMO_COUPONS.length} vouchers available</p>
          </div>
        </div>
      </div>

      {/* Promo Code Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-800 text-sm mb-3">Have a promo code?</h2>
        <div className="flex gap-3">
          <input
            value={promoInput}
            onChange={e => setPromoInput(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono uppercase outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all tracking-widest"
          />
          <button
            onClick={() => {
              const found = DEMO_COUPONS.find(c => c.code === promoInput);
              if (found) toast.success(`Valid coupon! ${found.desc}`);
              else toast.error('Invalid or expired coupon code');
            }}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Coupon Cards */}
      <div className="grid gap-4">
        {DEMO_COUPONS.map((coupon, i) => {
          const TypeIcon = typeIcons[coupon.type];
          const expired = isExpired(coupon.expiry);
          const days = daysLeft(coupon.expiry);
          return (
            <motion.div
              key={coupon.code}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${expired ? 'border-gray-100 opacity-60' : 'border-gray-100'}`}
            >
              {/* Top stripe */}
              <div className={`bg-gradient-to-r ${coupon.color} h-1.5`} />
              <div className="p-5 flex items-start gap-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${coupon.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <TypeIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{coupon.badge}</span>
                    {expired && <span className="text-xs font-semibold px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Expired</span>}
                    {!expired && days !== null && days <= 7 && (
                      <span className="text-xs font-semibold px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />{days}d left
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{coupon.desc}</p>
                  {coupon.minOrder && (
                    <p className="text-xs text-gray-400 mt-1">Min. order: ৳{coupon.minOrder.toLocaleString()}</p>
                  )}
                  {coupon.expiry && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> Valid till {new Date(coupon.expiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <button
                    onClick={() => !expired && handleCopy(coupon.code)}
                    disabled={expired}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border-2 border-dashed transition-all ${
                      expired
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : copied === coupon.code
                          ? 'border-green-300 bg-green-50 text-green-700'
                          : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                    } font-mono tracking-widest`}
                  >
                    {copied === coupon.code
                      ? <><CheckCircle2 className="w-3.5 h-3.5" />Copied!</>
                      : <><Copy className="w-3.5 h-3.5" />{coupon.code}</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center pb-2">
        Coupons are applied at checkout. Terms and conditions apply.
      </p>
    </div>
  );
}
