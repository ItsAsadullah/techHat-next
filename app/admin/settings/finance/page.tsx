import Link from 'next/link';
import { DollarSign, ChevronRight, AlertTriangle, BookOpen, Landmark, CreditCard, ArrowDownLeft, ArrowUpRight, Percent, CalendarRange } from 'lucide-react';

const SECTIONS = [
  { title: 'Chart of Accounts', icon: BookOpen, color: 'from-green-500 to-green-700', description: 'Define your GL account structure — assets, liabilities, equity, income, and expenses.', items: ['Account Types', 'Account Groups', 'Sub Accounts', 'Opening Balance'] },
  { title: 'Bank & Cash Accounts', icon: Landmark, color: 'from-blue-500 to-blue-700', description: 'Configure bank accounts, cash drawers, and default payment accounts for transactions.', items: ['Bank Accounts', 'Cash Accounts', 'Default Account', 'Reconciliation'] },
  { title: 'Tax Configuration', icon: Percent, color: 'from-orange-500 to-orange-700', description: 'Set up VAT, GST, and other tax types with rates, account mapping, and tax groups.', items: ['Tax Types', 'Tax Rates', 'Tax Groups', 'Account Mapping', 'Inclusive/Exclusive'] },
  { title: 'Receivable Rules', icon: ArrowDownLeft, color: 'from-emerald-500 to-emerald-700', description: 'Configure credit limits, payment terms, overdue alerts, and collection rules for customers.', items: ['Credit Limits', 'Payment Terms', 'Overdue Alerts', 'Collection Rules'] },
  { title: 'Payable Rules', icon: ArrowUpRight, color: 'from-amber-500 to-amber-700', description: 'Set up supplier payment terms, due date calculation, and payable account defaults.', items: ['Payment Terms', 'Due Calculation', 'Early Discount', 'Default Account'] },
  { title: 'Fiscal Year', icon: CalendarRange, color: 'from-indigo-500 to-indigo-700', description: 'Configure your fiscal year period, closing procedures, and carry-forward rules.', items: ['Year Period', 'Closing Date', 'Auto Close', 'Carry Forward'] },
  { title: 'Payment Methods', icon: CreditCard, color: 'from-violet-500 to-violet-700', description: 'Link payment methods to bank/cash accounts for automatic journal entry generation.', items: ['Cash Posting', 'Card Account', 'MFS Account', 'Bank Account'] },
];

export default function FinanceWorkspacePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Finance</span>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-200 shrink-0"><DollarSign className="w-7 h-7 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">Configure chart of accounts, tax rules, receivable, payable, and fiscal year settings.</p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700">Full finance configuration is coming soon. Use the <Link href="/admin/accounting" className="font-semibold underline">Accounting module</Link> in the main sidebar to manage accounts now.</p>
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
