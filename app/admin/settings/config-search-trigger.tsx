'use client';

import { Search, Command } from 'lucide-react';

export function ConfigSearchTrigger() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('open-config-search'))}
      className="flex items-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-5 py-3 text-sm text-white/80 transition-all group w-full sm:w-72"
    >
      <Search className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left text-white/60">Search any setting...</span>
      <span className="flex items-center gap-0.5 bg-white/10 rounded px-2 py-0.5 text-xs font-mono text-white/50 border border-white/10">
        <Command className="w-3 h-3" />K
      </span>
    </button>
  );
}
