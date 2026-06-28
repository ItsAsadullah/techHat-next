'use client';

import { useState, useEffect, useCallback } from 'react';
import { getIncomeStatement } from '@/lib/actions/finance-actions';
import { 
  FileText, Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Loader2, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/components/admin/expenses/constants';

type StatementData = {
  revenue: { name: string; amount: number }[];
  cogs: { name: string; amount: number }[];
  expenses: { name: string; amount: number }[];
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalExpenses: number;
  netIncome: number;
};

export function IncomeStatementClient() {
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getIncomeStatement(dateFrom || undefined, dateTo || undefined);
    if (result.success && result.data) {
      setData(result.data as StatementData);
    }
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Income Statement (P&L)
          </h1>
          <p className="text-gray-500 mt-1">
            Track your revenue, costs, and net profit over time
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 border-r border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm text-gray-700 outline-none bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2 px-3">
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm text-gray-700 outline-none bg-transparent"
            />
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading financial statement...</p>
        </div>
      ) : data ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 bg-gray-50/50 border-b border-gray-100">
            <div className="p-6 md:border-r border-gray-100">
              <p className="text-sm font-semibold text-gray-500 mb-1">Gross Profit</p>
              <h2 className="text-3xl font-bold text-gray-900">
                {formatCurrency(data.grossProfit)}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-500 mb-1">Net Income</p>
              <h2 className={cn(
                "text-3xl font-bold",
                data.netIncome >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatCurrency(data.netIncome)}
              </h2>
            </div>
          </div>

          {/* Statement Body */}
          <div className="p-6 md:p-8 space-y-8">
            
            {/* Revenue Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-xs">
                Revenue
              </h3>
              <div className="space-y-3 pl-2">
                {data.revenue.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {data.revenue.length === 0 && <p className="text-sm text-gray-400">No revenue data</p>}
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total Revenue</span>
                  <span className="font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</span>
                </div>
              </div>
            </div>

            {/* COGS Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-xs">
                Cost of Goods Sold (COGS)
              </h3>
              <div className="space-y-3 pl-2">
                {data.cogs.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium text-red-600">- {formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {data.cogs.length === 0 && <p className="text-sm text-gray-400">No COGS data</p>}
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total COGS</span>
                  <span className="font-bold text-red-600">- {formatCurrency(data.totalCogs)}</span>
                </div>
              </div>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center border border-gray-200">
              <span className="font-bold text-gray-900">Gross Profit (Revenue - COGS)</span>
              <span className="font-bold text-gray-900 text-lg">{formatCurrency(data.grossProfit)}</span>
            </div>

            {/* Operating Expenses Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 uppercase tracking-wider text-xs">
                Operating Expenses
              </h3>
              <div className="space-y-3 pl-2">
                {data.expenses.map(item => (
                  <div key={item.name} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{item.name}</span>
                    <span className="font-medium text-red-600">- {formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {data.expenses.length === 0 && <p className="text-sm text-gray-400">No expenses data</p>}
                <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Total Operating Expenses</span>
                  <span className="font-bold text-red-600">- {formatCurrency(data.totalExpenses)}</span>
                </div>
              </div>
            </div>

            {/* Net Income Total */}
            <div className={cn(
              "rounded-xl p-6 flex justify-between items-center border",
              data.netIncome >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            )}>
              <span className={cn(
                "font-bold text-lg",
                data.netIncome >= 0 ? "text-green-900" : "text-red-900"
              )}>
                Net Income (Profit / Loss)
              </span>
              <span className={cn(
                "font-bold text-2xl flex items-center gap-2",
                data.netIncome >= 0 ? "text-green-700" : "text-red-700"
              )}>
                {data.netIncome >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                {formatCurrency(data.netIncome)}
              </span>
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
