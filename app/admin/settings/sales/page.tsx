import Link from 'next/link';
import {
  ShoppingBag, ShoppingCart, CreditCard, Ticket, Receipt, RefreshCcw,
  ChevronRight, ArrowRight, CheckCircle2, Percent, Package, RotateCcw,
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'POS Settings',
    href: '/admin/settings/pos',
    icon: ShoppingCart,
    color: 'from-orange-500 to-orange-700',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    description: 'Configure the point-of-sale terminal, tax rates, receipt options, and default behavior.',
    items: ['Tax Rate', 'Receipt Format', 'Default Payment', 'Barcode Scanner', 'Cash Drawer', 'Rounding'],
    status: 'configured',
  },
  {
    title: 'Payment Methods',
    href: '/admin/settings/payments',
    icon: CreditCard,
    color: 'from-emerald-500 to-emerald-700',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    description: 'Enable and configure payment methods — cash, card, bKash, Nagad, Rocket, and bank transfer.',
    items: ['Cash', 'Card Payment', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'],
    status: 'configured',
  },
  {
    title: 'Coupon Management',
    href: '/admin/settings/coupons',
    icon: Ticket,
    color: 'from-amber-500 to-amber-700',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    description: 'Create and manage discount coupon codes with usage limits, expiry dates, and minimum order amounts.',
    items: ['Create Coupon', 'Usage Limits', 'Expiry Dates', 'Min Order Amount', 'Coupon Types'],
    status: 'configured',
  },
  {
    title: 'Invoice Settings',
    href: '/admin/settings/invoice',
    icon: Receipt,
    color: 'from-indigo-500 to-indigo-700',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    description: 'Configure invoice number format, tax display, payment terms, and footer notes.',
    items: ['Invoice Prefix', 'Number Format', 'Tax Display', 'Payment Terms', 'Footer Notes'],
    status: 'configured',
  },
  {
    title: 'Discount & Price Rules',
    href: '/admin/settings/sales',
    icon: Percent,
    color: 'from-rose-500 to-rose-700',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    description: 'Configure automatic discounts, price tiers, customer group pricing, and product-level discounts.',
    items: ['Auto Discounts', 'Price Tiers', 'Customer Groups', 'Wholesale Price', 'Bulk Discount'],
    status: 'coming-soon',
  },
  {
    title: 'Return Rules',
    href: '/admin/settings/returns',
    icon: RotateCcw,
    color: 'from-slate-500 to-slate-700',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-600',
    description: 'Set return policies, allowed return periods, refund types, and return reason categories.',
    items: ['Return Period', 'Refund Type', 'Return Reasons', 'Restocking Fee', 'Return Conditions'],
    status: 'coming-soon',
  },
];

export default function SalesWorkspacePage() {
  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Sales</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-200 shrink-0">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Configure POS, payment methods, invoices, discounts, coupons, and return policies for your retail operations.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{configuredCount} of {SECTIONS.length} configured</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isComingSoon = section.status === 'coming-soon';

          return (
            <Link
              key={section.title}
              href={isComingSoon ? '#' : section.href}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${
                isComingSoon
                  ? 'opacity-60 cursor-not-allowed'
                  : 'hover:border-orange-300 hover:shadow-lg hover:shadow-orange-50 hover:-translate-y-0.5'
              }`}
              
            >
              {isComingSoon && (
                <div className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Coming Soon
                </div>
              )}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{section.description}</p>
              <div className="space-y-1 mb-4">
                {section.items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="text-[11px] text-gray-500">{item}</span>
                  </div>
                ))}
              </div>
              {!isComingSoon && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className={`text-[11px] font-semibold ${section.textColor}`}>{section.items.length} settings</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                    Configure <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
