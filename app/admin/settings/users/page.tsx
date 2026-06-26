import Link from 'next/link';
import {
  Users, ShieldCheck, UserCog, KeyRound, ClipboardList, ChevronRight, ArrowRight, CheckCircle2, Lock, Eye, AlertTriangle,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function UsersWorkspacePage() {
  const staffCount = await prisma.staff.count().catch(() => 0);

  const SECTIONS = [
    { title: 'Staff & Roles', href: '/admin/settings/staff', icon: Users, color: 'from-slate-500 to-slate-700', bgLight: 'bg-slate-50', textColor: 'text-slate-600', description: 'Manage staff members, assign roles, set salaries, and control access permissions.', items: ['Staff List', 'Add Staff', 'Roles', 'Departments', 'Salaries'], status: 'configured', badge: `${staffCount} staff` },
    { title: 'Security', href: '/admin/settings/security', icon: ShieldCheck, color: 'from-red-500 to-red-700', bgLight: 'bg-red-50', textColor: 'text-red-600', description: 'Configure password policies, two-factor authentication, and session management.', items: ['Password Policy', '2FA', 'Session Length', 'Login Attempts', 'IP Restriction'], status: 'configured', badge: null },
    { title: 'Permissions', href: '/admin/settings/users', icon: KeyRound, color: 'from-amber-500 to-amber-700', bgLight: 'bg-amber-50', textColor: 'text-amber-600', description: 'Fine-grained permission control per role — what each role can see and do.', items: ['Role Permissions', 'Module Access', 'Action Limits', 'Data Visibility'], status: 'coming-soon', badge: null },
    { title: 'Audit Logs', href: '/admin/settings/users', icon: ClipboardList, color: 'from-blue-500 to-blue-700', bgLight: 'bg-blue-50', textColor: 'text-blue-600', description: 'View complete audit trail of every configuration change, login, and sensitive operation.', items: ['Login History', 'Setting Changes', 'Data Changes', 'Export Logs'], status: 'coming-soon', badge: null },
    { title: 'Activity Monitor', href: '/admin/settings/users', icon: Eye, color: 'from-emerald-500 to-emerald-700', bgLight: 'bg-emerald-50', textColor: 'text-emerald-600', description: 'Real-time view of who is logged in, what they are doing, and their session details.', items: ['Active Sessions', 'Force Logout', 'Session Details', 'Device Info'], status: 'coming-soon', badge: null },
  ];

  return <WorkspacePage module="Users & Security" moduleHref="/admin/settings/users" icon={Users} gradient="from-slate-500 to-slate-700" shadowColor="shadow-slate-200" hoverBorder="hover:border-slate-300" hoverShadow="hover:shadow-slate-50" sections={SECTIONS} description="Manage staff members, roles, permissions, security settings, and audit trails for your ERP system." />;
}

// ─── Reusable Workspace Renderer ──────────────────────────────────────────
function WorkspacePage({ module, moduleHref, icon: Icon, gradient, shadowColor, hoverBorder, hoverShadow, sections, description }: {
  module: string;
  moduleHref: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadowColor: string;
  hoverBorder: string;
  hoverShadow: string;
  sections: Array<{
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgLight: string;
    textColor: string;
    description: string;
    items: string[];
    status: string;
    badge?: string | null;
  }>;
  description: string;
}) {
  const configuredCount = sections.filter((s) => s.status === 'configured').length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Configuration Center</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-gray-900">{module}</span>
      </div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadowColor} shrink-0`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module}</h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 shrink-0">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-semibold text-green-700">{configuredCount} of {sections.length} configured</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sections.map((section) => {
          const SIcon = section.icon;
          const isComingSoon = section.status === 'coming-soon';
          return (
            <Link key={section.title} href={isComingSoon ? '#' : section.href}
              className={`group relative bg-white rounded-2xl border border-gray-200 p-5 flex flex-col transition-all duration-200 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : `${hoverBorder} ${hoverShadow} hover:shadow-lg hover:-translate-y-0.5`}`}
              >
              {isComingSoon && <div className="absolute top-3 right-3 bg-gray-100 border border-gray-200 text-gray-500 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Coming Soon</div>}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-md shrink-0`}><SIcon className="w-5 h-5 text-white" /></div>
                {section.badge && <span className={`text-xs font-bold ${section.textColor} ${section.bgLight} px-2.5 py-1 rounded-lg`}>{section.badge}</span>}
              </div>
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
