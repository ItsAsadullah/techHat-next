import Link from 'next/link';
import { Zap, ChevronRight, AlertTriangle, Clock, CheckSquare, HardDrive, Webhook, Hash, Brain } from 'lucide-react';

const SECTIONS = [
  { title: 'Scheduled Jobs', icon: Clock, color: 'from-purple-500 to-purple-700', description: 'Configure and manage recurring scheduled tasks — stock alerts, report generation, and data sync.', items: ['Job List', 'Schedule Type', 'Run Frequency', 'Last Run', 'Next Run', 'Enable/Disable'] },
  { title: 'Approval Workflows', icon: CheckSquare, color: 'from-blue-500 to-blue-700', description: 'Set up multi-step approval workflows for purchase orders, refunds, and expense claims.', items: ['Workflow Steps', 'Approvers', 'Escalation Rules', 'Auto Approve'] },
  { title: 'Auto Backup', icon: HardDrive, color: 'from-green-500 to-green-700', description: 'Configure automatic database backups — schedule, retention period, and storage location.', items: ['Backup Schedule', 'Retention Days', 'Storage Location', 'Backup Format'] },
  { title: 'Webhook Events', icon: Webhook, color: 'from-orange-500 to-orange-700', description: 'Configure webhooks to send events to external systems when orders, stock, or payments change.', items: ['Event Types', 'Endpoint URL', 'Secret Key', 'Retry Policy', 'Log Events'] },
  { title: 'Auto Numbering', icon: Hash, color: 'from-cyan-500 to-cyan-700', description: 'Configure automatic numbering sequences for orders, invoices, POs, and warranty tickets.', items: ['Order Number', 'Invoice Number', 'PO Number', 'Warranty Number', 'Reset Annually'] },
  { title: 'AI Automation', icon: Brain, color: 'from-rose-500 to-rose-700', description: 'Configure AI-powered automation rules for product descriptions, classification, and insights.', items: ['Auto Description', 'Category AI', 'Price Suggestion', 'Reorder AI'] },
];

export default function AutomationWorkspacePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Automation</span>
      </div>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-200 shrink-0"><Zap className="w-7 h-7 text-white" /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">Configure scheduled jobs, approval workflows, auto backup, webhooks, and AI automation.</p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-700">Automation configuration is coming soon. These features will be available in the next release.</p>
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
