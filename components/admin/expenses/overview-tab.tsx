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

export function OverviewTab({ stats, onTabChange, onGoToSalary }: {
  stats: ExpenseStats | null;
  onTabChange: (tab: Tab) => void;
  onGoToSalary: (month: number, year: number) => void;
}) {
  if (!stats) return <div className="text-center py-12 text-gray-500">ডেটা লোড হচ্ছে...</div>;

  const statCards = [
    {
      label: 'এই মাসের খরচ',
      value: formatCurrency(stats.totalThisMonth),
      change: stats.monthlyChange,
      icon: Wallet,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: 'আজকের খরচ',
      value: formatCurrency(stats.totalToday),
      sub: `${stats.expenseCountToday}টি এন্ট্রি`,
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      onClick: undefined as (() => void) | undefined,
    },
    {
      label: 'বকেয়া বেতন',
      value: formatCurrency(stats.salaryDueTotal),
      sub: stats.salaryDueBreakdown.length > 0 ? `${stats.salaryDueBreakdown.length}জন স্টাফের বকেয়া আছে — বিস্তারিত দেখুন ↓` : 'সকল বেতন পরিশোধিত',
      icon: Users,
      iconBg: stats.salaryDueTotal > 0 ? 'bg-red-100' : 'bg-green-100',
      iconColor: stats.salaryDueTotal > 0 ? 'text-red-600' : 'text-green-600',
      onClick: stats.salaryDueTotal > 0 ? () => onTabChange('salary') : undefined,
    },
    {
      label: 'বার্ষিক খরচ',
      value: formatCurrency(stats.totalThisYear),
      sub: new Date().getFullYear().toString(),
      icon: BarChart3,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      onClick: undefined as (() => void) | undefined,
    },
  ];

  const maxCategoryTotal = Math.max(...(stats.categoryBreakdown.map(c => c.total) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div
            key={i}
            onClick={card.onClick}
            className={cn(
              "bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow",
              card.onClick && "cursor-pointer hover:border-red-300 hover:bg-red-50/30"
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                {(card as any).change !== undefined && (card as any).change !== 0 && (
                  <div className={cn("flex items-center gap-1 mt-1 text-xs font-medium", (card as any).change > 0 ? "text-red-500" : "text-green-500")}>
                    {(card as any).change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs((card as any).change)}% গত মাসের তুলনায়
                  </div>
                )}
                {card.sub && <p className={cn("text-xs mt-1", card.onClick ? 'text-red-500 font-medium' : 'text-gray-400')}>{card.sub}</p>}
              </div>
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", card.iconBg)}>
                <card.icon className={cn("w-6 h-6", card.iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            ক্যাটাগরি অনুযায়ী খরচ (এই মাস)
          </h3>
          {stats.categoryBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">এই মাসে কোনো খরচ নেই</p>
          ) : (
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{cat.icon || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{cat.name}</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(cat.total)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(cat.total / maxCategoryTotal) * 100}%`,
                          backgroundColor: cat.color || '#6B7280',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            মাসিক খরচের ট্রেন্ড
          </h3>
          {stats.monthlyTrend.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">পর্যাপ্ত ডেটা নেই</p>
          ) : (
            <div className="space-y-3">
              {stats.monthlyTrend.map((m, i) => {
                const maxTotal = Math.max(...stats.monthlyTrend.map(t => t.total), 1);
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16">{MONTH_NAMES_BN[m.month - 1]?.slice(0, 3)}</span>
                    <div className="flex-1">
                      <div className="w-full h-6 bg-gray-50 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${Math.max((m.total / maxTotal) * 100, 8)}%` }}
                        >
                          <span className="text-[10px] text-white font-medium whitespace-nowrap">
                            {formatCurrency(m.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 w-10 text-right">{m.count}টি</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Salary Summary + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-blue-600" />
            এই মাসের বেতন সারসংক্ষেপ
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <p className="text-lg font-bold text-blue-700">{formatCurrency(stats.salaryThisMonth)}</p>
              <p className="text-xs text-blue-600 mt-1">মোট বেতন</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-lg font-bold text-green-700">{formatCurrency(stats.salaryPaidThisMonth)}</p>
              <p className="text-xs text-green-600 mt-1">পরিশোধিত</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <p className="text-lg font-bold text-red-700">{formatCurrency(stats.salaryDueTotal)}</p>
              <p className="text-xs text-red-600 mt-1">বকেয়া</p>
            </div>
          </div>

          {/* Per-staff due breakdown */}
          {stats.salaryDueBreakdown.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">বকেয়া বিস্তারিত</p>
              <div className="space-y-2">
                {stats.salaryDueBreakdown.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.staffName}</p>
                      <p className="text-xs text-gray-500">{MONTH_NAMES_BN[item.month - 1]} {item.year} · নেট: {formatCurrency(item.netSalary)} · পরিশোধ: {formatCurrency(item.paidAmount)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-red-700">{formatCurrency(item.dueAmount)}</p>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        item.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                      )}>
                        {item.status === 'PARTIAL' ? 'আংশিক' : 'বকেয়া'}
                      </span>
                    </div>
                    <button
                      onClick={() => onGoToSalary(item.month, item.year)}
                      className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      পরিশোধ →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700 font-medium">সকল বেতন পরিশোধিত — কোনো বকেয়া নেই</p>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            সাম্প্রতিক খরচ
          </h3>
          {stats.recentExpenses.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">কোনো খরচ নেই</p>
          ) : (
            <div className="space-y-3">
              {stats.recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <span className="text-lg">{expense.category?.icon || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{expense.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
