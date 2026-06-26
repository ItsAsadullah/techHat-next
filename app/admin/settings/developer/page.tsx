import Link from 'next/link';
import { Code2, ChevronRight, ArrowRight, CheckCircle2, HardDrive, FileText, Database, Flag, Activity, Palette, Bot, Trash2 } from 'lucide-react';

const SECTIONS = [
  { title: 'Data Backup', href: '/admin/settings/backup', icon: HardDrive, color: 'from-gray-600 to-gray-800', bgLight: 'bg-gray-50', textColor: 'text-gray-700', description: 'Export full database backup, restore from backup, or selectively delete data collections.', items: ['Full Backup', 'Selective Backup', 'Restore', 'Schedule Backup', 'Delete Data'], status: 'configured' },
  { title: 'Appearance', href: '/admin/settings/appearance', icon: Palette, color: 'from-rose-500 to-rose-700', bgLight: 'bg-rose-50', textColor: 'text-rose-600', description: 'Configure admin panel theme, accent color, date format, and display preferences.', items: ['Dark/Light Mode', 'Accent Color', 'Date Format', 'Sidebar Style'], status: 'configured' },
  { title: 'AI Assistant', href: '/admin/settings/ai-assistant', icon: Bot, color: 'from-purple-500 to-purple-700', bgLight: 'bg-purple-50', textColor: 'text-purple-600', description: 'Configure AI assistant settings, API keys, model selection, and usage limits.', items: ['AI Provider', 'API Key', 'Model Selection', 'Usage Limits', 'Feature Flags'], status: 'configured' },
  { title: 'System Logs', href: '/admin/settings/developer/logs', icon: FileText, color: 'from-orange-500 to-orange-700', bgLight: 'bg-orange-50', textColor: 'text-orange-600', description: 'View and download application logs, error logs, and performance logs for debugging.', items: ['Error Logs', 'Access Logs', 'Query Logs', 'Download Logs'], status: 'configured' },
  { title: 'System Health', href: '/admin/settings/developer/health', icon: Activity, color: 'from-green-500 to-green-700', bgLight: 'bg-green-50', textColor: 'text-green-600', description: 'Monitor database connection, memory usage, queue size, and scheduled job status.', items: ['DB Status', 'Memory Usage', 'Queue Size', 'Job Status', 'Cache Status'], status: 'configured' },
  { title: 'Feature Flags', href: '/admin/settings/developer/feature-flags', icon: Flag, color: 'from-amber-500 to-amber-700', bgLight: 'bg-amber-50', textColor: 'text-amber-600', description: 'Enable or disable experimental features, beta modules, and test configurations.', items: ['Flag List', 'Toggle Feature', 'Rollout %', 'Environment'], status: 'configured' },
  { title: 'Cache Management', href: '/admin/settings/developer/cache', icon: Database, color: 'from-cyan-500 to-cyan-700', bgLight: 'bg-cyan-50', textColor: 'text-cyan-600', description: 'Clear application cache, view cached keys, and configure cache TTL settings.', items: ['Clear Cache', 'Cache Keys', 'TTL Settings', 'Redis Config'], status: 'configured' },
  { title: 'Danger Zone', href: '/admin/settings/backup', icon: Trash2, color: 'from-red-600 to-red-800', bgLight: 'bg-red-50', textColor: 'text-red-600', description: 'Irreversible operations — full data wipe, factory reset, and schema migration tools.', items: ['Factory Reset', 'Full Wipe', 'Migration', 'Seed Data'], status: 'configured' },
];

export default function DeveloperWorkspacePage() {
  const configuredCount = SECTIONS.filter((s) => s.status === 'configured').length;
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">Developer</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg shadow-gray-300 shrink-0"><Code2 className="w-7 h-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Developer</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">System health, logs, cache, feature flags, data backup, appearance, and diagnostics tools.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{configuredCount} of {SECTIONS.length} configured</span>
        </div>
      </div>

      {/* Danger warning */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <Trash2 className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-800">This area contains sensitive system operations</p>
          <p className="text-xs text-red-600 mt-0.5">Some actions in this module are irreversible. Always create a backup before making changes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isComingSoon = section.status === 'coming-soon';
          return (
            <Link key={section.title} href={isComingSoon ? '#' : section.href}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'hover:border-gray-400 hover:shadow-lg hover:shadow-gray-100 hover:-translate-y-0.5'}`}
              >
              {isComingSoon && <div className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Coming Soon</div>}
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md mb-4`}><Icon className="w-5 h-5 text-white" /></div>
              <h3 className="text-base font-bold text-gray-900 mb-2">{section.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{section.description}</p>
              <div className="space-y-1 mb-4">{section.items.map((item) => (<div key={item} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300" /><span className="text-[11px] text-gray-500">{item}</span></div>))}</div>
              {!isComingSoon && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className={`text-[11px] font-semibold ${section.textColor}`}>{section.items.length} settings</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
