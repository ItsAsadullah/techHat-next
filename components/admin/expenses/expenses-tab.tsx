'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  Search,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  Check,
  AlertTriangle,
  BarChart3,
  PieChart,
  Receipt,
  Tag,
  Clock,
  FileText,
  Printer,
  Download,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  CircleDollarSign,
  HandCoins,
  ArrowUpDown,
  MoreHorizontal,
  Briefcase,
  Settings,
  Hash,
  ChevronDown,
  Eye,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ExpenseCategory, Expense, StaffMember, StaffSalary, SalaryDueItem, ExpenseStats, Tab 
} from './types';
import { 
    PAYMENT_METHODS, MONTH_NAMES_BN, MONTH_NAMES, DEFAULT_CATEGORIES, 
    formatCurrency, formatDate, getPaymentMethodLabel, getPaymentMethodIcon 
} from './constants';

export interface ExpensesTabProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  search: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (v: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onSearch: () => void;
  actionLoading: boolean;
}

export function ExpensesTab(props: ExpensesTabProps) {
  const { expenses, categories, pagination, search, onSearchChange, categoryFilter, onCategoryFilterChange, paymentFilter, onPaymentFilterChange, dateFrom, dateTo, onDateFromChange, onDateToChange, showFilters, onToggleFilters, onPageChange, onDelete, onEdit, onSearch, actionLoading } = props;

  const totalOnPage = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="খরচ খুঁজুন (শিরোনাম, নোট, রেফারেন্স)..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <button
            onClick={onToggleFilters}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors",
              showFilters ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            ফিল্টার
          </button>
        </div>

        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-gray-100 mt-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ক্যাটাগরি</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { onCategoryFilterChange(e.target.value); onSearch(); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">সকল ক্যাটাগরি</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">পেমেন্ট মেথড</label>
                  <select
                    value={paymentFilter}
                    onChange={(e) => { onPaymentFilterChange(e.target.value); onSearch(); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">সকল পেমেন্ট</option>
                    {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">তারিখ থেকে</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => { onDateFromChange(e.target.value); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">তারিখ পর্যন্ত</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => { onDateToChange(e.target.value); }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    onCategoryFilterChange('');
                    onPaymentFilterChange('');
                    onDateFromChange('');
                    onDateToChange('');
                    onSearch();
                  }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  ফিল্টার রিসেট করুন
                </button>
                <button onClick={onSearch} className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  খুঁজুন
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-16">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">কোনো খরচ পাওয়া যায়নি</p>
            <p className="text-gray-400 text-sm mt-1">নতুন খরচ যোগ করুন</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">তারিখ</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">শিরোনাম</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">ক্যাটাগরি</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পেমেন্ট</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">প্রাপক</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পরিমাণ</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => {
                    const PayIcon = getPaymentMethodIcon(expense.paymentMethod);
                    return (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                          {formatDate(expense.date)}
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                          {expense.reference && (
                            <p className="text-xs text-gray-400 mt-0.5">Ref: {expense.reference}</p>
                          )}
                          {expense.note && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{expense.note}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${expense.category?.color || '#6B7280'}15`,
                              color: expense.category?.color || '#6B7280',
                            }}
                          >
                            <span>{expense.category?.icon || '📌'}</span>
                            {expense.category?.name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <PayIcon className="w-3.5 h-3.5" />
                            {getPaymentMethodLabel(expense.paymentMethod)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600">
                          {expense.paidTo || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onEdit(expense)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="এডিট করুন"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(expense.id)}
                              disabled={actionLoading}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-gray-700">
                      পৃষ্ঠার মোট ({expenses.length}টি)
                    </td>
                    <td className="px-5 py-3 text-right text-sm font-bold text-blue-700">
                      {formatCurrency(totalOnPage)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  মোট {pagination.total}টির মধ্যে {((pagination.page - 1) * pagination.limit) + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} দেখাচ্ছে
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onPageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          pageNum === pagination.page ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => onPageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
