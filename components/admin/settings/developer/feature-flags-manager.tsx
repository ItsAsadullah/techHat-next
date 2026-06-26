'use client';

import { useState, useEffect } from 'react';
import { fetchFeatureFlags, toggleFeatureFlag, updateFeatureFlagRollout, FeatureFlag } from '@/lib/actions/feature-flags-actions';
import { Flag, Settings2, Beaker, Zap, Shield, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function FeatureFlagsManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadFlags = async () => {
    setLoading(true);
    const res = await fetchFeatureFlags();
    if (res.success && res.data) {
      setFlags(res.data);
      setError(null);
    } else {
      setError(res.error || 'Failed to fetch flags');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    setSavingId(id);
    // Optimistic UI update
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !currentStatus } : f));
    
    const res = await toggleFeatureFlag(id, !currentStatus);
    
    if (res.success) {
      toast.success('Feature flag updated');
    } else {
      toast.error('Failed to update feature flag');
      // Revert optimistic update
      setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: currentStatus } : f));
    }
    setSavingId(null);
  };

  const handleRolloutChange = async (id: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0 || num > 100) return;

    // Optimistic UI update
    setFlags(prev => prev.map(f => f.id === id ? { ...f, rolloutPercentage: num } : f));
  };

  const saveRollout = async (id: string, percentage: number) => {
    setSavingId(id);
    const res = await updateFeatureFlagRollout(id, percentage);
    if (res.success) {
      toast.success('Rollout percentage updated');
    } else {
      toast.error('Failed to update rollout');
    }
    setSavingId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'beta': return <Beaker className="w-4 h-4 text-amber-500" />;
      case 'experiment': return <Zap className="w-4 h-4 text-blue-500" />;
      case 'system': return <Shield className="w-4 h-4 text-purple-500" />;
      default: return <Settings2 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 gap-3">
        <RefreshCcw className="w-8 h-8 animate-spin text-amber-500" />
        <p>Loading feature configurations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-3">
        <AlertTriangle className="w-8 h-8" />
        <p>{error}</p>
        <button onClick={loadFlags} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 mt-4 hover:bg-gray-200">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800 text-sm">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p>
          <strong>Warning:</strong> Changing these flags may instantly affect users across the application. 
          Use rollout percentages to gradually test new features in production.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-gray-400" /> All Flags
          </h2>
        </div>
        
        <div className="divide-y divide-gray-100">
          {flags.map(flag => (
            <div key={flag.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-900">{flag.name}</h3>
                  <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 bg-gray-100 rounded-md capitalize">
                    {getTypeIcon(flag.type)}
                    {flag.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{flag.description}</p>
                <p className="text-xs text-gray-400 font-mono pt-1">ID: {flag.id}</p>
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 shrink-0">
                
                {flag.rolloutPercentage !== undefined && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1.5 pl-3">
                    <span className="text-xs font-medium text-gray-500">Rollout %</span>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className="w-16 h-8 text-sm text-center border border-gray-300 rounded focus:ring-amber-500 focus:border-amber-500"
                      value={flag.rolloutPercentage}
                      onChange={(e) => handleRolloutChange(flag.id, e.target.value)}
                      onBlur={(e) => saveRollout(flag.id, parseInt(e.target.value, 10))}
                      disabled={savingId === flag.id}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-2 px-3">
                  <span className={`text-sm font-medium ${flag.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Switch 
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag.id, flag.enabled)}
                    disabled={savingId === flag.id}
                  />
                </div>

              </div>

            </div>
          ))}
          
          {flags.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No feature flags configured.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
