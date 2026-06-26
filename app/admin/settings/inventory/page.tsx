import Link from 'next/link';
import { Warehouse, ChevronRight, ArrowRight, CheckCircle2, Barcode, Tag, Hash, BarChart2, AlertTriangle, RefreshCw, ArrowLeftRight } from 'lucide-react';

const SECTIONS = [
  { title: 'Warehouses', href: '/admin/settings/inventory', icon: Warehouse, color: 'from-emerald-500 to-emerald-700', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', description: 'Create and manage warehouses, set default locations and stock assignment rules.', items: ['Warehouse List', 'Default Warehouse', 'Location Zones', 'Stock Transfer'], status: 'coming-soon' },
  { title: 'Barcode Settings', href: '/admin/settings/inventory', icon: Barcode, color: 'from-blue-500 to-blue-700', bgLight: 'bg-blue-50', textColor: 'text-blue-600', description: 'Configure barcode format, auto-generation rules, and barcode scanner behavior in POS.', items: ['Barcode Format', 'Auto Generate', 'Scanner Mode', 'Print Size'], status: 'coming-soon' },
  { title: 'Label Printing', href: '/admin/settings/inventory', icon: Tag, color: 'from-violet-500 to-violet-700', bgLight: 'bg-violet-50', textColor: 'text-violet-600', description: 'Set up label templates, printer settings, and what information appears on product labels.', items: ['Label Template', 'Label Size', 'Print Fields', 'Bulk Print'], status: 'coming-soon' },
  { title: 'Serial Numbers', href: '/admin/settings/inventory', icon: Hash, color: 'from-cyan-500 to-cyan-700', bgLight: 'bg-cyan-50', textColor: 'text-cyan-600', description: 'Enable serial number tracking for specific product categories and configure format rules.', items: ['Enable Tracking', 'Number Format', 'Auto Assignment', 'History'], status: 'coming-soon' },
  { title: 'Stock Valuation', href: '/admin/settings/inventory', icon: BarChart2, color: 'from-amber-500 to-amber-700', bgLight: 'bg-amber-50', textColor: 'text-amber-600', description: 'Configure stock costing method — FIFO, LIFO, or Weighted Average for inventory valuation.', items: ['Costing Method', 'FIFO', 'LIFO', 'Weighted Average', 'Valuation Report'], status: 'coming-soon' },
  { title: 'Reorder Rules', href: '/admin/settings/inventory', icon: RefreshCw, color: 'from-orange-500 to-orange-700', bgLight: 'bg-orange-50', textColor: 'text-orange-600', description: 'Set minimum stock levels and automatic reorder alerts for low-inventory products.', items: ['Min Stock Level', 'Reorder Point', 'Alert Email', 'Auto PO'], status: 'coming-soon' },
  { title: 'Stock Alerts', href: '/admin/settings/inventory', icon: AlertTriangle, color: 'from-rose-500 to-rose-700', bgLight: 'bg-rose-50', textColor: 'text-rose-600', description: 'Configure low stock, out of stock, and overstock alerts with notification preferences.', items: ['Low Stock Alert', 'Out of Stock', 'Overstock Alert', 'Notify Users'], status: 'coming-soon' },
  { title: 'Transfer Rules', href: '/admin/settings/inventory', icon: ArrowLeftRight, color: 'from-slate-500 to-slate-700', bgLight: 'bg-slate-50', textColor: 'text-slate-600', description: 'Configure inter-warehouse transfer rules, approval requirements, and transit policies.', items: ['Transfer Approval', 'Transit Time', 'Auto Confirm', 'Transfer Limits'], status: 'coming-soon' },
];

export default function InventoryWorkspacePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Inventory</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200 shrink-0">
            <Warehouse className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">Configure warehouses, barcode, stock valuation, reorder rules, and transfer policies.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-700">Setup required — 0 of {SECTIONS.length}</span>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Inventory Module — Coming Soon</p>
          <p className="text-xs text-amber-600 mt-0.5">Advanced inventory features are being developed. You can currently manage stock via the Inventory section in the main sidebar.</p>
        </div>
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
