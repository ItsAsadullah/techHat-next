import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Activity } from 'lucide-react';
import SystemHealthViewer from '@/components/admin/settings/developer/system-health-viewer';

export const metadata: Metadata = {
  title: 'System Health | Developer Settings | TechHat Admin',
  description: 'Monitor server vitals, database latency, and system load.',
};

export default function SystemHealthPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Settings</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/admin/settings/developer" className="hover:text-gray-800 transition-colors">Developer</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-900">System Health</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/settings/developer"
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">System Health & Metrics</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Live monitoring of memory usage, compute resources, database latency, and process uptime.
            </p>
          </div>
        </div>
      </div>

      {/* Main Health Viewer Component */}
      <SystemHealthViewer />
    </div>
  );
}
