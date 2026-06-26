import Link from 'next/link';
import { Plug, ChevronRight, ArrowRight, CheckCircle2, BarChart3, CreditCard, Truck, Globe, Facebook, Cloud, Key, Webhook } from 'lucide-react';

const SECTIONS = [
  { title: 'Analytics & Tracking', href: '/admin/settings/analytics', icon: BarChart3, color: 'from-pink-500 to-pink-700', bgLight: 'bg-pink-50', textColor: 'text-pink-600', description: 'Connect Meta Pixel, Google Analytics, Google Tag Manager, and TikTok Pixel for visitor tracking.', items: ['Meta Pixel', 'Google Analytics', 'Google Tag Manager', 'TikTok Pixel', 'Custom Scripts'], status: 'configured' },
  { title: 'Payment Gateway', href: '/admin/settings/payments', icon: CreditCard, color: 'from-emerald-500 to-emerald-700', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', description: 'Configure payment gateway API keys for bKash, Nagad, Rocket, and card payment processors.', items: ['bKash API', 'Nagad API', 'Rocket API', 'Card Gateway', 'Sandbox Mode'], status: 'configured' },
  { title: 'Courier API', href: '/admin/settings/integrations', icon: Truck, color: 'from-blue-500 to-blue-700', bgLight: 'bg-blue-50', textColor: 'text-blue-600', description: 'Integrate with courier services for automated shipping labels, tracking, and delivery updates.', items: ['Courier Provider', 'API Key', 'Tracking Webhook', 'Auto Label'], status: 'coming-soon' },
  { title: 'Google Integration', href: '/admin/settings/integrations', icon: Globe, color: 'from-orange-500 to-orange-700', bgLight: 'bg-orange-50', textColor: 'text-orange-600', description: 'Connect Google services — Merchant Center, Maps API, OAuth, and Google Search Console.', items: ['Merchant Center', 'Maps API', 'OAuth 2.0', 'Search Console'], status: 'coming-soon' },
  { title: 'Meta / Facebook', href: '/admin/settings/integrations', icon: Facebook, color: 'from-blue-600 to-blue-800', bgLight: 'bg-blue-50', textColor: 'text-blue-700', description: 'Connect Facebook Catalog, Instagram Shopping, and Meta Business Suite for social commerce.', items: ['FB Catalog', 'Instagram Shop', 'Meta Business', 'Product Feed'], status: 'coming-soon' },
  { title: 'Cloud Storage', href: '/admin/settings/integrations', icon: Cloud, color: 'from-cyan-500 to-cyan-700', bgLight: 'bg-cyan-50', textColor: 'text-cyan-600', description: 'Connect Cloudinary or S3-compatible storage for product images, receipts, and document backup.', items: ['Cloudinary', 'AWS S3', 'Image CDN', 'Auto Optimize'], status: 'coming-soon' },
  { title: 'API Keys', href: '/admin/settings/integrations', icon: Key, color: 'from-amber-500 to-amber-700', bgLight: 'bg-amber-50', textColor: 'text-amber-600', description: 'Generate and manage API keys for external integrations with the TechHat ERP system.', items: ['Generate Key', 'Key Permissions', 'Expiry Date', 'Usage Logs', 'Revoke Key'], status: 'coming-soon' },
  { title: 'Webhooks', href: '/admin/settings/integrations', icon: Webhook, color: 'from-violet-500 to-violet-700', bgLight: 'bg-violet-50', textColor: 'text-violet-600', description: 'Configure outbound webhooks to notify external systems of ERP events in real time.', items: ['Webhook Endpoints', 'Event Types', 'Secret Token', 'Retry Policy'], status: 'coming-soon' },
];

export default function IntegrationsWorkspacePage() {
  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Integrations</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shadow-pink-200 shrink-0"><Plug className="w-7 h-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">Connect TechHat ERP with payment gateways, analytics, courier APIs, Google, Meta, and cloud storage.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{configuredCount} of {SECTIONS.length} connected</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isComingSoon = section.status === 'coming-soon';
          return (
            <Link key={section.title} href={isComingSoon ? '#' : section.href}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-pink-300 hover:shadow-lg hover:shadow-pink-50 hover:-translate-y-0.5'}`}
              >
              {isComingSoon && <div className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Coming Soon</div>}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md mb-4`}><Icon className="w-5 h-5 text-white" /></div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{section.description}</p>
              <div className="space-y-1 mb-4">{section.items.map((item) => (<div key={item} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300" /><span className="text-[11px] text-gray-500">{item}</span></div>))}</div>
              {!isComingSoon && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className={`text-[11px] font-semibold ${section.textColor}`}>{section.items.length} settings</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">Configure <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
