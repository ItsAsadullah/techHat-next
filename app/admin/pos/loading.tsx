import { Loader2 } from 'lucide-react';

export default function POSLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-gray-50 overflow-hidden animate-pulse">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col h-full border-r border-gray-200">
        {/* Search & Categories */}
        <div className="p-4 bg-white border-b border-gray-200 space-y-4">
          <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full shrink-0"></div>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 h-48 p-2 flex flex-col">
                <div className="h-28 w-full bg-gray-200 rounded-xl"></div>
                <div className="mt-2 h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-white flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center h-16">
           <div className="h-6 w-32 bg-gray-200 rounded"></div>
           <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
        </div>
        
        <div className="flex-1 p-4 flex flex-col items-center justify-center gap-4">
           <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
           <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>

        {/* Totals */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-4">
           <div className="h-4 w-full bg-gray-200 rounded"></div>
           <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
           <div className="h-12 w-full bg-gray-200 rounded-xl mt-4"></div>
        </div>
      </div>
    </div>
  );
}
