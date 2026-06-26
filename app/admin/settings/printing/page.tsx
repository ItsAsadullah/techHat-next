import Link from 'next/link';
import { Printer, ChevronRight, ArrowRight, CheckCircle2, Receipt, Tag, FileText, Thermometer, Barcode, QrCode, Maximize2, Settings } from 'lucide-react';

const SECTIONS = [
  { title: 'Invoice Templates', href: '/admin/settings/invoice', icon: FileText, color: 'from-indigo-500 to-indigo-700', bgLight: 'bg-indigo-50', textColor: 'text-indigo-600', description: 'Design invoice layout, set company info, logo position, footer text, and print margins.', items: ['Layout Designer', 'Company Info', 'Logo Position', 'Footer Text', 'Margins'], status: 'configured' },
  { title: 'Receipt Printer', href: '/admin/settings/printing', icon: Receipt, color: 'from-blue-500 to-blue-700', bgLight: 'bg-blue-50', textColor: 'text-blue-600', description: 'Configure POS receipt printer settings, paper size, and receipt content options.', items: ['Printer Type', 'Paper Size', 'Receipt Content', 'Logo on Receipt', 'Auto Print'], status: 'coming-soon' },
  { title: 'Label Printer', href: '/admin/settings/printing', icon: Tag, color: 'from-violet-500 to-violet-700', bgLight: 'bg-violet-50', textColor: 'text-violet-600', description: 'Configure label printer for product barcodes, price tags, and warehouse shelf labels.', items: ['Label Size', 'Printer Driver', 'Label Template', 'Print Queue'], status: 'coming-soon' },
  { title: 'Thermal Printer', href: '/admin/settings/printing', icon: Thermometer, color: 'from-orange-500 to-orange-700', bgLight: 'bg-orange-50', textColor: 'text-orange-600', description: 'Configure ESC/POS thermal printer settings for POS receipts and kitchen order slips.', items: ['ESC/POS Settings', 'Connection Type', 'Character Set', 'Line Width'], status: 'coming-soon' },
  { title: 'Barcode Settings', href: '/admin/settings/printing', icon: Barcode, color: 'from-emerald-500 to-emerald-700', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', description: 'Configure barcode format, size, and which product information to include on printed barcodes.', items: ['Barcode Format', 'Barcode Size', 'Include Price', 'Include Name', 'Bulk Print'], status: 'coming-soon' },
  { title: 'QR Settings', href: '/admin/settings/printing', icon: QrCode, color: 'from-cyan-500 to-cyan-700', bgLight: 'bg-cyan-50', textColor: 'text-cyan-600', description: 'Configure QR codes for product pages, warranty cards, invoices, and digital receipts.', items: ['QR Content', 'QR Size', 'Error Correction', 'On Invoice', 'On Warranty Card'], status: 'coming-soon' },
  { title: 'Paper Size & Margins', href: '/admin/settings/printing', icon: Maximize2, color: 'from-rose-500 to-rose-700', bgLight: 'bg-rose-50', textColor: 'text-rose-600', description: 'Set default paper sizes, print margins, and orientation for different document types.', items: ['A4 Settings', 'Thermal Size', 'Margin Top/Bottom', 'Orientation', 'DPI'], status: 'coming-soon' },
];

export default function PrintingWorkspacePage() {
  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Printing</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0"><Printer className="w-7 h-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Printing</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">Configure receipt printers, label printers, invoice templates, barcode, and thermal printer settings.</p>
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
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-50 hover:-translate-y-0.5'}`}
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
