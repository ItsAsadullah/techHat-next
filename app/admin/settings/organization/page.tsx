import Link from 'next/link';
import {
  Building2, Store, FileText, Globe2, Home, ChevronRight,
  ArrowRight, CheckCircle2, MapPin, Clock, Calendar, DollarSign, Phone,
} from 'lucide-react';

const SECTIONS = [
  {
    title: 'Store Info & Shipping',
    href: '/admin/settings/store',
    icon: Store,
    color: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    description: 'Business name, address, phone, currency, shipping charges and free delivery threshold.',
    items: ['Business Name', 'Address', 'Phone & Email', 'Currency', 'Shipping Charges', 'Free Delivery Threshold'],
    status: 'configured',
  },
  {
    title: 'Invoice & Branding',
    href: '/admin/settings/invoice',
    icon: FileText,
    color: 'from-indigo-500 to-indigo-600',
    bgLight: 'bg-indigo-50',
    textColor: 'text-indigo-600',
    description: 'Company logo, invoice layout designer, footer text, and company details on invoices.',
    items: ['Company Logo', 'Invoice Layout', 'Footer Text', 'Company Details', 'Invoice Number Format'],
    status: 'configured',
  },
  {
    title: 'Site Branding & Header',
    href: '/admin/settings/branding',
    icon: Globe2,
    color: 'from-cyan-500 to-cyan-600',
    bgLight: 'bg-cyan-50',
    textColor: 'text-cyan-600',
    description: 'Site logo, favicon, top information bar — hotline number and delivery offer text.',
    items: ['Site Logo', 'Favicon', 'Top Bar Hotline', 'Delivery Offer Text', 'Show/Hide Top Bar'],
    status: 'configured',
  },
  {
    title: 'Homepage Management',
    href: '/admin/settings/homepage',
    icon: Home,
    color: 'from-orange-500 to-orange-600',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
    description: 'Hero banners, section ordering, promotional banners, and flash sale configuration.',
    items: ['Hero Banners', 'Section Order', 'Promo Banners', 'Flash Sale', 'Featured Sections'],
    status: 'configured',
  },
  {
    title: 'Business Hours',
    href: '/admin/settings/organization',
    icon: Clock,
    color: 'from-teal-500 to-teal-600',
    bgLight: 'bg-teal-50',
    textColor: 'text-teal-600',
    description: 'Configure your store\'s operating hours, holidays, and timezone settings.',
    items: ['Opening Hours', 'Closing Hours', 'Holidays', 'Timezone', 'Fiscal Year'],
    status: 'coming-soon',
  },
  {
    title: 'Branches & Locations',
    href: '/admin/settings/organization',
    icon: MapPin,
    color: 'from-rose-500 to-rose-600',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    description: 'Manage multiple branches, their addresses, phone numbers, and active status.',
    items: ['Branch List', 'Add Branch', 'Branch Address', 'Branch Contact'],
    status: 'coming-soon',
  },
];

export default function OrganizationWorkspacePage() {
  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Organization</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Configure your company profile, store information, invoice branding, business hours, and site appearance.
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{configuredCount} of {SECTIONS.length} configured</span>
        </div>
      </div>

      {/* Sections Grid */}
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
                  : 'hover:border-blue-300 hover:shadow-lg hover:shadow-blue-50 hover:-translate-y-0.5'
              }`}
              
            >
              {/* Coming soon badge */}
              {isComingSoon && (
                <div className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Coming Soon
                </div>
              )}

              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md mb-4 shrink-0`}>
                <Icon className="w-5.5 h-5.5 text-white" />
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 mb-2">{section.title}</h3>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{section.description}</p>

              {/* Setting items */}
              <div className="space-y-1 mb-4">
                {section.items.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${section.bgLight} border border-gray-200`} style={{ background: 'currentColor' }} />
                    <span className="text-[11px] text-gray-500">{item}</span>
                  </div>
                ))}
              </div>

              {/* Footer */}
              {!isComingSoon && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className={`text-[11px] font-semibold ${section.textColor}`}>
                    {section.items.length} settings
                  </span>
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
