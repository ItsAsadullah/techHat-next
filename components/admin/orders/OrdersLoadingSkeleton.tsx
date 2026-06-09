import { Loader2 } from "lucide-react";

// Reusable tiny skeleton block
const Block = ({ className }: { className: string }) => (
  <div className={`bg-gray-200 rounded ${className}`} />
);

export default function OrdersLoadingSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <Block className="h-8 w-40" />
          <Block className="h-4 w-64 mt-2" />
        </div>
        <Block className="h-10 w-28" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={`stat-${i}`} className="bg-white rounded-2xl border border-gray-100 p-5 h-28">
            <Block className="h-3 w-16 mb-2" />
            <Block className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="border-b border-gray-100 px-4 h-14 flex items-center gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <Block key={`tab-${i}`} className="h-4 w-20" />
          ))}
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex gap-3">
          <Block className="flex-1 h-10 max-w-md" />
          <Block className="h-10 w-24" />
        </div>

        {/* Orders Table */}
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={`row-${i}`} className="flex gap-4 items-center border-b border-gray-50 pb-4">
              <Block className="h-4 w-4 shrink-0" />
              <div className="flex-1 space-y-2">
                <Block className="h-4 w-24" />
              </div>
              <div className="flex-1 space-y-2">
                <Block className="h-4 w-32" />
                <Block className="h-3 w-24" />
              </div>
              <div className="flex-1">
                <div className="flex -space-x-2">
                  <Block className="w-8 h-8 border-2 border-white" />
                  <Block className="w-8 h-8 border-2 border-white" />
                </div>
              </div>
              <Block className="h-4 w-16" />
              <div className="flex-1 space-y-1">
                <Block className="h-5 w-16 rounded-full" />
              </div>
              <div className="w-24 flex gap-1 justify-end">
                <Block className="w-7 h-7 rounded-lg" />
                <Block className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom loader */}
      <div className="p-4 flex justify-center items-center bg-gray-50/50">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    </div>
  );
}
