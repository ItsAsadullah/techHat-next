'use client';

import { useState, useEffect, useRef } from 'react';
import { fetchSystemLogs, clearSystemLogs, LogEntry, LogCategory, LogLevel } from '@/lib/actions/log-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Play, Square, Trash2, Download, AlertTriangle, Info, AlertCircle, 
  TerminalSquare, Filter, RefreshCcw, Database, Shield, FileText, ChevronDown, ChevronRight, X 
} from 'lucide-react';
import { toast } from 'sonner';

export default function SystemLogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTailing, setIsTailing] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<LogCategory | 'all'>('all');
  const [level, setLevel] = useState<LogLevel | 'all'>('all');
  
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const loadLogs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const res = await fetchSystemLogs({ search, category, level });
    if (res.success && res.data) {
      setLogs(res.data);
    } else {
      toast.error('Failed to load logs');
    }
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [category, level]);

  // Handle Search Delay
  useEffect(() => {
    const delay = setTimeout(() => {
      loadLogs();
    }, 500);
    return () => clearTimeout(delay);
  }, [search]);

  // Live Tail effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTailing) {
      interval = setInterval(() => {
        loadLogs(false);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isTailing, search, category, level]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedLogs);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedLogs(next);
  };

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      setLoading(true);
      const res = await clearSystemLogs();
      if (res.success) {
        setLogs([]);
        toast.success('Logs cleared successfully');
      } else {
        toast.error('Failed to clear logs');
      }
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `system-logs-${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Logs downloaded successfully');
  };

  const getLevelColor = (l: LogLevel) => {
    switch(l) {
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'warn': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'info': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'debug': return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getLevelIcon = (l: LogLevel) => {
    switch(l) {
      case 'error': return <AlertCircle className="w-3.5 h-3.5" />;
      case 'warn': return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'info': return <Info className="w-3.5 h-3.5" />;
      case 'debug': return <TerminalSquare className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[600px] bg-[#0f111a] rounded-xl border border-gray-800 overflow-hidden shadow-2xl font-mono text-sm">
      {/* Toolbar */}
      <div className="bg-[#1a1d27] border-b border-gray-800 p-4 flex flex-col md:flex-row gap-4 items-center justify-between shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <div className="flex bg-[#0f111a] p-1 rounded-lg border border-gray-800">
            {[
              { id: 'all', label: 'All Logs', icon: FileText },
              { id: 'access', label: 'Access', icon: TerminalSquare },
              { id: 'database', label: 'Database', icon: Database },
              { id: 'system', label: 'System', icon: Info },
              { id: 'auth', label: 'Auth', icon: Shield },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  category === tab.id 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(37,99,235,0.2)]' 
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="h-6 w-px bg-gray-800 hidden md:block" />

          <div className="flex items-center gap-2">
            {['all', 'error', 'warn', 'info', 'debug'].map(l => (
              <button
                key={l}
                onClick={() => setLevel(l as any)}
                className={`px-2.5 py-1 rounded text-xs font-medium uppercase tracking-wider transition-colors border ${
                  level === l 
                    ? l === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : l === 'warn' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : l === 'info' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : l === 'debug' ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                    : 'bg-white/10 text-white border-white/20'
                    : 'bg-transparent text-gray-500 border-transparent hover:bg-gray-800'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-[#0f111a] border-gray-800 text-gray-200 placeholder:text-gray-600 focus-visible:ring-blue-500 focus-visible:border-blue-500 h-8 rounded-lg text-xs font-sans"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-2 text-gray-500 hover:text-gray-300">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTailing(!isTailing)}
              className={`h-8 border-gray-800 text-xs font-sans ${isTailing ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 border-green-500/30' : 'bg-[#0f111a] text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              {isTailing ? <Square className="w-3.5 h-3.5 mr-1.5 fill-current" /> : <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />}
              Live Tail
            </Button>
            
            <Button variant="outline" size="icon" onClick={() => loadLogs()} disabled={loading || isTailing} className="h-8 w-8 bg-[#0f111a] border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50">
              <RefreshCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleDownload} title="Download JSON" className="h-8 w-8 bg-[#0f111a] border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800">
              <Download className="w-3.5 h-3.5" />
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleClear} title="Clear Logs" className="h-8 w-8 bg-[#0f111a] border-gray-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/30">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Log Output Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 relative"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
      >
        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 font-sans">
            <RefreshCcw className="w-6 h-6 animate-spin" />
            <p>Connecting to log stream...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3 font-sans">
            <Filter className="w-8 h-8 opacity-50" />
            <p>No logs found matching your filters.</p>
            <Button variant="link" onClick={() => { setSearch(''); setCategory('all'); setLevel('all'); }} className="text-blue-400 h-auto p-0">
              Clear filters
            </Button>
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogs.has(log.id);
            const date = new Date(log.timestamp);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
            const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            
            return (
              <div key={log.id} className="group flex flex-col hover:bg-gray-800/30 transition-colors rounded">
                <div 
                  className={`flex items-start gap-3 p-1.5 cursor-pointer border-l-2 ${isExpanded ? 'bg-gray-800/50 border-blue-500' : 'border-transparent hover:border-gray-600'}`}
                  onClick={() => toggleExpand(log.id)}
                >
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                    <span className="text-gray-500 text-[11px] whitespace-nowrap">{dateStr} {timeStr}</span>
                  </div>
                  
                  <div className={`flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getLevelColor(log.level)}`}>
                    {getLevelIcon(log.level)}
                    {log.level}
                  </div>
                  
                  <div className="shrink-0 w-24">
                    <span className="text-blue-400/70 text-[11px] bg-blue-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{log.category}</span>
                  </div>

                  <div className={`flex-1 break-all ${log.level === 'error' ? 'text-red-200 font-semibold' : log.level === 'warn' ? 'text-amber-200' : 'text-gray-300'}`}>
                    {log.message}
                  </div>
                </div>
                
                {isExpanded && log.metadata && (
                  <div className="ml-[180px] mr-4 mb-2 p-3 bg-[#0a0c13] rounded-lg border border-gray-800/50 shadow-inner">
                    <pre className="text-gray-400 text-[11px] whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer Status */}
      <div className="bg-[#1a1d27] border-t border-gray-800 p-2 px-4 flex items-center justify-between text-[11px] text-gray-500 font-sans shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isTailing ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-gray-600'}`}></span>
            {isTailing ? 'Live Tailing Active' : 'Tailing Paused'}
          </span>
          <span>{logs.length} events loaded</span>
        </div>
        <div>
          v1.4.2 LogViewer
        </div>
      </div>
    </div>
  );
}
