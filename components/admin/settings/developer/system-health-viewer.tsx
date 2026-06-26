'use client';

import { useState, useEffect } from 'react';
import { fetchSystemHealth, SystemHealthData } from '@/lib/actions/health-actions';
import { 
  Server, Database, Cpu, Activity, Clock, RefreshCcw, HardDrive, 
  Wifi, ShieldCheck, AlertTriangle, XCircle, Zap
} from 'lucide-react';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

export default function SystemHealthViewer() {
  const [data, setData] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (background = false) => {
    if (!background) setLoading(true);
    setIsRefreshing(true);
    
    const res = await fetchSystemHealth();
    if (res.success && res.data) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error || 'Failed to fetch health data');
    }
    
    setIsRefreshing(false);
    if (!background) setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Auto refresh every 10 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 gap-3">
        <RefreshCcw className="w-8 h-8 animate-spin text-green-500" />
        <p>Analyzing system vitals...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-3">
        <AlertTriangle className="w-8 h-8" />
        <p>{error}</p>
        <button onClick={() => loadData()} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900 mt-4 hover:bg-gray-200">
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Overview Status Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              System is operational
              {isRefreshing && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2"></span>}
            </h2>
            <p className="text-sm text-gray-500">
              Last updated: {new Date(data.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-center md:text-right">
            <p className="text-sm font-semibold text-gray-500 mb-1">Server Uptime</p>
            <p className="text-xl font-bold text-gray-900 font-mono tracking-tight">{formatUptime(data.os.uptime)}</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm font-semibold text-gray-500 mb-1">Process Uptime</p>
            <p className="text-xl font-bold text-gray-900 font-mono tracking-tight">{formatUptime(data.process.uptime)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Memory & CPU */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-50" />
            <div className="flex items-center gap-3 mb-6 relative">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Compute Resources</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              {/* OS Memory */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-600">OS Memory</span>
                  <span className="text-xs text-gray-500">{formatBytes(data.os.totalMem - data.os.freeMem)} / {formatBytes(data.os.totalMem)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ${data.os.memUsagePercent > 85 ? 'bg-red-500' : data.os.memUsagePercent > 70 ? 'bg-amber-500' : 'bg-blue-500'}`} 
                    style={{ width: `${data.os.memUsagePercent}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-right">{data.os.memUsagePercent.toFixed(1)}% Used</p>
              </div>

              {/* Process Memory (V8 Heap) */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-semibold text-gray-600">Node.js Heap</span>
                  <span className="text-xs text-gray-500">{formatBytes(data.process.memoryUsage.heapUsed)} / {formatBytes(data.process.memoryUsage.heapTotal)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${(data.process.memoryUsage.heapUsed / data.process.memoryUsage.heapTotal) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-right">{((data.process.memoryUsage.heapUsed / data.process.memoryUsage.heapTotal) * 100).toFixed(1)}% Used</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">CPU Cores</p>
                <p className="font-semibold text-gray-900">{data.os.cpus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Platform</p>
                <p className="font-semibold text-gray-900 capitalize">{data.os.platform} {data.os.release}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Load Avg (1m)</p>
                <p className="font-semibold text-gray-900">{data.os.loadAvg[0]?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Node Version</p>
                <p className="font-semibold text-gray-900">{data.process.nodeVersion}</p>
              </div>
            </div>
            <div className="mt-4">
               <p className="text-xs text-gray-400">Processor: {data.os.cpuModel}</p>
            </div>
          </div>
        </div>

        {/* Side Panel: DB & Queue */}
        <div className="space-y-6">
          
          {/* Database Health */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-50 to-transparent rounded-bl-full opacity-50" />
            <div className="flex items-center justify-between mb-4 relative">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-bold text-gray-900">Database</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                data.database.status === 'connected' ? 'bg-green-100 text-green-700' :
                data.database.status === 'degraded' ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {data.database.status}
              </span>
            </div>

            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="w-4 h-4 text-gray-400" /> Latency
                </div>
                <span className="font-mono font-bold text-gray-900">{data.database.latencyMs} ms</span>
              </div>
              {data.database.error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl break-all">
                  {data.database.error}
                </div>
              )}
            </div>
          </div>

          {/* Queue Health */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Background Jobs</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="text-xs font-medium text-purple-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-purple-700 font-mono">{data.queue.activeJobs}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-1">Waiting</p>
                <p className="text-2xl font-bold text-gray-700 font-mono">{data.queue.waitingJobs}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
