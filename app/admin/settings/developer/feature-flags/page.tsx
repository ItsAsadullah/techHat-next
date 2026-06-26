import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, ArrowLeft, Flag } from 'lucide-react';
import FeatureFlagsManager from '@/components/admin/settings/developer/feature-flags-manager';

export const metadata: Metadata = {
  title: 'Feature Flags | Developer Settings | TechHat Admin',
  description: 'Manage experimental features and beta modules.',
};

export default function FeatureFlagsPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/settings" className="hover:text-gray-800 transition-colors">Settings</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/admin/settings/developer" className="hover:text-gray-800 transition-colors">Developer</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-900">Feature Flags</span>
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
              <Flag className="w-6 h-6 text-amber-600" />
              <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Toggle experimental features, beta API endpoints, and new UI designs without redeploying code.
            </p>
          </div>
        </div>
      </div>

      {/* Main Feature Flags Component */}
      <FeatureFlagsManager />
    </div>
  );
}
