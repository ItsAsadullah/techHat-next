import Link from 'next/link';
import { MessageSquare, ChevronRight, ArrowRight, CheckCircle2, Bell, Mail, Smartphone, MessageCircle, Send, FileText, Users } from 'lucide-react';

const SECTIONS = [
  { title: 'Notifications', href: '/admin/settings/notifications', icon: Bell, color: 'from-cyan-500 to-cyan-700', bgLight: 'bg-cyan-50', textColor: 'text-cyan-600', description: 'Configure stock alerts, order notifications, customer and expense notification preferences.', items: ['Stock Alerts', 'Order Alerts', 'Customer Alerts', 'Expense Alerts', 'Alert Frequency'], status: 'configured' },
  { title: 'Email Settings', href: '/admin/settings/communication', icon: Mail, color: 'from-blue-500 to-blue-700', bgLight: 'bg-blue-50', textColor: 'text-blue-600', description: 'Configure SMTP server, from address, and email templates for order confirmations and alerts.', items: ['SMTP Server', 'From Address', 'Test Email', 'Email Templates'], status: 'coming-soon' },
  { title: 'SMS Settings', href: '/admin/settings/communication', icon: Smartphone, color: 'from-green-500 to-green-700', bgLight: 'bg-green-50', textColor: 'text-green-600', description: 'Connect SMS provider, configure sender ID, and set up SMS templates for order updates.', items: ['SMS Provider', 'Sender ID', 'OTP Settings', 'SMS Templates'], status: 'coming-soon' },
  { title: 'WhatsApp', href: '/admin/settings/communication', icon: MessageCircle, color: 'from-emerald-500 to-emerald-700', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', description: 'Set up WhatsApp Business API for order notifications, warranty updates, and customer messages.', items: ['API Token', 'Phone Number', 'Message Templates', 'Auto Reply'], status: 'coming-soon' },
  { title: 'Telegram', href: '/admin/settings/communication', icon: Send, color: 'from-sky-500 to-sky-700', bgLight: 'bg-sky-50', textColor: 'text-sky-600', description: 'Configure Telegram bot for admin alerts, stock notifications, and daily sales reports.', items: ['Bot Token', 'Chat ID', 'Alert Types', 'Daily Report'], status: 'coming-soon' },
  { title: 'Notification Templates', href: '/admin/settings/communication', icon: FileText, color: 'from-violet-500 to-violet-700', bgLight: 'bg-violet-50', textColor: 'text-violet-600', description: 'Create and manage notification templates with dynamic variables for personalized messages.', items: ['Order Template', 'Warranty Template', 'Due Reminder', 'Custom Templates'], status: 'coming-soon' },
  { title: 'Customer Notifications', href: '/admin/settings/communication', icon: Users, color: 'from-pink-500 to-pink-700', bgLight: 'bg-pink-50', textColor: 'text-pink-600', description: 'Control which notifications customers receive and through which channels.', items: ['Order Confirmation', 'Status Updates', 'Promotional', 'Opt-out Settings'], status: 'coming-soon' },
];

export default function CommunicationWorkspacePage() {
  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Communication</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-200 shrink-0"><MessageSquare className="w-7 h-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">Configure email, SMS, WhatsApp, Telegram, and notification templates for your business.</p>
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
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-50 hover:-translate-y-0.5'}`}
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
