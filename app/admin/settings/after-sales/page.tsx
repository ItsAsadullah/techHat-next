import Link from 'next/link';
import { Wrench, ChevronRight, Shield, RefreshCcw, RotateCcw, Truck, AlertTriangle, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

const SECTIONS = [
  { title: 'Warranty Settings', href: '/admin/warranty', icon: Shield, color: 'from-rose-500 to-rose-700', bgLight: 'bg-rose-50', textColor: 'text-rose-600', description: 'Configure warranty types, durations, coverage rules, and status workflow.', items: ['Warranty Types', 'Duration Rules', 'Coverage Policy', 'Status Workflow'], status: 'configured' },
  { title: 'Exchange Rules', href: '/admin/returns', icon: RefreshCcw, color: 'from-orange-500 to-orange-700', bgLight: 'bg-orange-50', textColor: 'text-orange-600', description: 'Set product exchange rules, time limits, condition requirements, and price difference handling.', items: ['Exchange Period', 'Condition Rules', 'Price Difference', 'Eligible Products'], status: 'configured' },
  { title: 'Return Settings', href: '/admin/returns', icon: RotateCcw, color: 'from-amber-500 to-amber-700', bgLight: 'bg-amber-50', textColor: 'text-amber-600', description: 'Configure return policies, accepted return reasons, refund types, and restocking fees.', items: ['Return Period', 'Return Reasons', 'Refund Types', 'Restocking Fee'], status: 'configured' },
  { title: 'Supplier Dispatch', href: '/admin/warranty', icon: Truck, color: 'from-blue-500 to-blue-700', bgLight: 'bg-blue-50', textColor: 'text-blue-600', description: 'Manage supplier warranty dispatch — send defective items to suppliers for replacement or repair.', items: ['Dispatch Rules', 'Supplier Contact', 'Tracking Number', 'Resolution Types'], status: 'coming-soon' },
  { title: 'Claim Rules', href: '/admin/warranty', icon: AlertTriangle, color: 'from-purple-500 to-purple-700', bgLight: 'bg-purple-50', textColor: 'text-purple-600', description: 'Define claim eligibility rules, required documents, approval workflow, and compensation policies.', items: ['Claim Eligibility', 'Required Docs', 'Approval Flow', 'Compensation'], status: 'coming-soon' },
  { title: 'Customer Notifications', href: '/admin/settings/notifications', icon: MessageSquare, color: 'from-cyan-500 to-cyan-700', bgLight: 'bg-cyan-50', textColor: 'text-cyan-600', description: 'Configure automatic notifications for warranty claims, exchanges, and return status updates.', items: ['Claim Updates', 'Exchange Status', 'Return Status', 'SMS Templates'], status: 'coming-soon' },
];

export default function AfterSalesWorkspacePage() {
  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">After Sales</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-200 shrink-0"><Wrench className="w-7 h-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">After Sales</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">Configure warranty policies, exchange rules, returns, supplier dispatch, and claim management.</p>
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
            <Link key={section.title} href={isComingSoon ? '#' : section.href}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-rose-300 hover:shadow-lg hover:shadow-rose-50 hover:-translate-y-0.5'}`}
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
