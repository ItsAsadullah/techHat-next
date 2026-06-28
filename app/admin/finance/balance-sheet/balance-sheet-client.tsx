'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBalanceSheet } from '@/lib/actions/finance-actions';
import { 
  Building2, Calendar, Filter, Scale, CheckCircle2, XCircle, Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/components/admin/expenses/constants';

type BalanceSheetData = {
  assets: { name: string; amount: number; code: string }[];
  liabilities: { name: string; amount: number; code: string }[];
  equity: { name: string; amount: number; code: string }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
};

export function BalanceSheetClient() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [asOfDate, setAsOfDate] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getBalanceSheet(asOfDate || undefined);
    if (result.success && result.data) {
      setData(result.data as BalanceSheetData);
    }
    setLoading(false);
  }, [asOfDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Balance Sheet
          </h1>
          <p className="text-gray-500 mt-1">
            View Assets, Liabilities, and Equity at a specific point in time
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-gray-200">
            <span className="text-sm font-medium text-gray-500">As of</span>
            <Calendar className="w-4 h-4 text-gray-400 ml-1" />
            <input 
              type="date" 
              value={asOfDate}
              onChange={e => setAsOfDate(e.target.value)}
              className="text-sm text-gray-700 outline-none bg-transparent"
            />
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading balance sheet...</p>
        </div>
      ) : data ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Alert */}
          <div className={cn(
            "rounded-2xl p-4 flex items-center gap-3 border",
            data.isBalanced 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          )}>
            {data.isBalanced ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600" />
            )}
            <div>
              <p className="font-bold">
                {data.isBalanced ? "Balance Sheet is balanced" : "Warning: Balance Sheet is out of balance"}
              </p>
              <p className="text-sm opacity-90">
                Assets ({formatCurrency(data.totalAssets)}) = Liabilities ({formatCurrency(data.totalLiabilities)}) + Equity ({formatCurrency(data.totalEquity)})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left Column: Assets */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  Assets
                </h2>
              </div>
              <div className="p-6 flex-1">
                <div className="space-y-3 pl-2">
                  {data.assets.map(item => (
                    <div key={item.code} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {data.assets.length === 0 && <p className="text-sm text-gray-400">No assets recorded</p>}
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Assets</span>
                <span className="font-bold text-indigo-700 text-xl">{formatCurrency(data.totalAssets)}</span>
              </div>
            </div>

            {/* Right Column: Liabilities & Equity */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  Liabilities & Equity
                </h2>
              </div>
              <div className="p-6 flex-1 space-y-8">
                
                {/* Liabilities */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">
                    Liabilities
                  </h3>
                  <div className="space-y-3 pl-2">
                    {data.liabilities.map(item => (
                      <div key={item.code} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {data.liabilities.length === 0 && <p className="text-sm text-gray-400">No liabilities recorded</p>}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total Liabilities</span>
                      <span className="font-bold text-gray-900">{formatCurrency(data.totalLiabilities)}</span>
                    </div>
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider">
                    Equity
                  </h3>
                  <div className="space-y-3 pl-2">
                    {data.equity.map(item => (
                      <div key={item.code} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.name}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                    {data.equity.length === 0 && <p className="text-sm text-gray-400">No equity recorded</p>}
                    <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                      <span className="font-bold text-gray-900">Total Equity</span>
                      <span className="font-bold text-gray-900">{formatCurrency(data.totalEquity)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Liabilities & Equity</span>
                <span className="font-bold text-indigo-700 text-xl">
                  {formatCurrency(data.totalLiabilities + data.totalEquity)}
                </span>
              </div>
            </div>

          </div>
        </motion.div>
      ) : (
        <div className="text-center text-red-500 py-10 bg-white rounded-3xl border border-red-100">
          Failed to load data. Please try again.
        </div>
      )}
    </div>
  );
}
