import Link from 'next/link';
import { ShoppingCart, ChevronRight, AlertTriangle, Truck, ClipboardCheck, DollarSign, CheckSquare, LayoutList, Landmark } from 'lucide-react';

const SECTIONS = [
  { title: 'Supplier Groups', href: '/admin/suppliers', icon: Truck, color: 'from-amber-500 to-amber-700', description: 'Create and manage supplier categories, payment terms, and default settings.', items: ['Supplier Categories', 'Payment Terms', 'Credit Limits', 'Default Currency'] },
  { title: 'Purchase Orders', href: '/admin/purchases', icon: ClipboardCheck, color: 'from-orange-500 to-orange-700', description: 'Configure PO number format, approval rules, default warehouse, and auto-receive settings.', items: ['PO Number Format', 'Approval Rules', 'Default Warehouse', 'Auto Receive'] },
  { title: 'GRN Settings', href: '/admin/purchases', icon: CheckSquare, color: 'from-green-500 to-green-700', description: 'Configure Goods Received Note settings, quality check requirements, and discrepancy handling.', items: ['GRN Workflow', 'Quality Check', 'Discrepancy Rules', 'Auto Post'] },
  { title: 'Payment Terms', href: '/admin/purchases', icon: DollarSign, color: 'from-blue-500 to-blue-700', description: 'Define standard payment terms for purchase orders — Net 30, Net 60, immediate, etc.', items: ['Term Types', 'Due Days', 'Early Payment Discount', 'Late Fee'] },
  { title: 'Expense Categories', href: '/admin/purchases', icon: LayoutList, color: 'from-violet-500 to-violet-700', description: 'Configure expense categories for purchase-related costs and overhead allocation.', items: ['Category List', 'GL Account Mapping', 'Cost Centers', 'Approval Needed'] },
  { title: 'Landed Cost', href: '/admin/purchases', icon: Landmark, color: 'from-rose-500 to-rose-700', description: 'Configure landed cost components — freight, customs, insurance, and how they are distributed.', items: ['Cost Components', 'Distribution Method', 'Currency Conversion', 'Auto Calculate'] },
];

export default function PurchaseWorkspacePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Purchase</span>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
          <ShoppingCart className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">Configure supplier groups, purchase orders, GRN, payment terms, and expense categories.</p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700">Purchase configuration settings are coming soon. Use the <Link href="/admin/purchases" className="font-semibold underline">Purchase module</Link> in the main sidebar to manage purchase orders now.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col opacity-60">
              <div className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Coming Soon</div>
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md mb-4`}><Icon className="w-5 h-5 text-white" /></div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{section.description}</p>
              <div className="space-y-1">{section.items.map((item) => (<div key={item} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300" /><span className="text-[11px] text-gray-500">{item}</span></div>))}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
