import { Sparkles, AlertCircle, TrendingDown, ArrowRight } from 'lucide-react';

interface AIAssistantCardProps {
  recommendations: any;
  onAddProduct: (productId: string, variantId?: string) => void;
  isLoading: boolean;
}

export function AIAssistantCard({ recommendations, onAddProduct, isLoading }: AIAssistantCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 shadow-sm animate-pulse mt-6">
        <div className="h-4 bg-indigo-200/50 dark:bg-indigo-800/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-10 bg-white/50 dark:bg-gray-900/50 rounded"></div>
          <div className="h-10 bg-white/50 dark:bg-gray-900/50 rounded"></div>
        </div>
      </div>
    );
  }

  if (!recommendations || (!recommendations.frequentlyPurchased?.length && !recommendations.lowStock?.length)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 p-6 shadow-sm mt-6">
      <h2 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> AI Procurement Assistant
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Low Stock Alerts */}
        {recommendations.lowStock?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> Critical Stock
            </h3>
            <div className="space-y-2">
              {recommendations.lowStock.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                    <p className="text-[10px] text-gray-500 font-mono">{item.sku} • Stock: {item.stock}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onAddProduct(item.id)}
                    className="text-[10px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 px-2 py-1 rounded transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Frequently Purchased */}
        {recommendations.frequentlyPurchased?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" /> Frequently Bought Here
            </h3>
            <div className="space-y-2">
              {recommendations.frequentlyPurchased.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Product ID: {item.productId.substring(0,8)}...</p>
                    <p className="text-[10px] text-gray-500">Ordered {item._sum.quantity} times previously</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => onAddProduct(item.productId, item.variantId)}
                    className="text-[10px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400 px-2 py-1 rounded transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
