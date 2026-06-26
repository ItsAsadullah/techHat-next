'use client';

import { useState, useEffect } from 'react';
import { fetchCacheMetrics, clearAllCache, clearCacheByPath, clearCacheByTag, CacheMetrics } from '@/lib/actions/cache-actions';
import { Database, Zap, RefreshCcw, HardDrive, Trash2, ShieldAlert, FolderSync, Tag, Route } from 'lucide-react';
import { toast } from 'sonner';

export default function CacheManager() {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClearing, setIsClearing] = useState<string | null>(null);

  const [pathInput, setPathInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  const loadMetrics = async () => {
    const res = await fetchCacheMetrics();
    if (res.success && res.data) {
      setMetrics(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to purge all application caches? This may temporarily slow down the site as caches rebuild.')) return;
    
    setIsClearing('all');
    const res = await clearAllCache();
    if (res.success) {
      toast.success('Global cache purged successfully');
      setMetrics(prev => prev ? { ...prev, memoryUsage: 1, totalKeys: 0, hitRate: 0 } : prev);
    } else {
      toast.error(res.error || 'Failed to purge cache');
    }
    setIsClearing(null);
  };

  const handleClearPath = async () => {
    if (!pathInput.trim()) {
      toast.error('Please enter a valid path (e.g., /products)');
      return;
    }
    setIsClearing('path');
    const res = await clearCacheByPath(pathInput);
    if (res.success) {
      toast.success(`Cache cleared for ${pathInput}`);
      setPathInput('');
    } else {
      toast.error(res.error || `Failed to clear cache for ${pathInput}`);
    }
    setIsClearing(null);
  };

  const handleClearTag = async () => {
    if (!tagInput.trim()) {
      toast.error('Please enter a valid tag (e.g., products-list)');
      return;
    }
    setIsClearing('tag');
    const res = await clearCacheByTag(tagInput);
    if (res.success) {
      toast.success(`Cache cleared for tag ${tagInput}`);
      setTagInput('');
    } else {
      toast.error(res.error || `Failed to clear cache for tag ${tagInput}`);
    }
    setIsClearing(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 gap-3">
        <RefreshCcw className="w-8 h-8 animate-spin text-cyan-500" />
        <p>Loading cache metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Memory Usage</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.memoryUsage || 0} <span className="text-lg text-gray-500 font-normal">MB</span></p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Keys</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.totalKeys.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Hit Rate</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.hitRate.toFixed(1) || 0}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Targeted Cache Clearing */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FolderSync className="w-5 h-5 text-gray-400" /> Targeted Invalidation
            </h2>
          </div>
          <div className="p-6 space-y-6 flex-1">
            
            {/* By Path */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Route className="w-4 h-4 text-gray-400" /> Clear by Path
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. /products or /categories/electronics"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  value={pathInput}
                  onChange={(e) => setPathInput(e.target.value)}
                />
                <button 
                  onClick={handleClearPath}
                  disabled={isClearing === 'path' || !pathInput.trim()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isClearing === 'path' ? 'Clearing...' : 'Clear Path'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Revalidates specific Next.js page routes.</p>
            </div>

            <hr className="border-gray-100" />

            {/* By Tag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-gray-400" /> Clear by Fetch Tag
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="e.g. products-list"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
                <button 
                  onClick={handleClearTag}
                  disabled={isClearing === 'tag' || !tagInput.trim()}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {isClearing === 'tag' ? 'Clearing...' : 'Clear Tag'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">Purges specific data tags from the Next.js Data Cache.</p>
            </div>

          </div>
        </div>

        {/* Global Cache Clearing (Danger Zone) */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden flex flex-col relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-50 to-transparent rounded-bl-full pointer-events-none" />
          <div className="px-6 py-4 border-b border-red-50 bg-red-50/30">
            <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Global Purge
            </h2>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
            
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Purge All Application Cache</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
              This will instantly clear all server-side rendering (SSR) caches and data caches across the entire application. Your next visitors may experience slightly slower load times as the cache rebuilds.
            </p>

            <button 
              onClick={handleClearAll}
              disabled={isClearing === 'all'}
              className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 justify-center"
            >
              {isClearing === 'all' ? (
                <><RefreshCcw className="w-5 h-5 animate-spin" /> Purging...</>
              ) : (
                <><Trash2 className="w-5 h-5" /> Purge Everything Now</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
