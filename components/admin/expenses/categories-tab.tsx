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

export function CategoriesTab({ categories, onEdit, onDelete, onSeedDefaults, actionLoading }: {
  categories: ExpenseCategory[];
  onEdit: (c: ExpenseCategory) => void;
  onDelete: (id: string) => void;
  onSeedDefaults: () => void;
  actionLoading: boolean;
}) {
  return (
    <div className="space-y-4">
      {categories.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-semibold text-amber-800 mb-1">কোনো ক্যাটাগরি নেই</h3>
          <p className="text-amber-600 text-sm mb-4">প্রথমে খরচের ক্যাটাগরি তৈরি করুন অথবা ডিফল্ট ক্যাটাগরি যোগ করুন</p>
          <button
            onClick={onSeedDefaults}
            disabled={actionLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            ডিফল্ট ক্যাটাগরি যোগ করুন
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${cat.color || '#6B7280'}15` }}
                >
                  {cat.icon || '📌'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{cat._count.expenses}টি খরচ</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(cat.id)}
                  disabled={actionLoading}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || '#6B7280' }} />
              <span className="text-xs text-gray-400">{cat.slug}</span>
              {!cat.isActive && (
                <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">নিষ্ক্রিয়</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
