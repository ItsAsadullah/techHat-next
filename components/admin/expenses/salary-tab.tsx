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

export interface SalaryTabProps {
  staffMembers: StaffMember[];
  salaries: StaffSalary[];
  month: number;
  year: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  onGenerateSalaries: () => void;
  onPaySalary: (s: StaffSalary) => void;
  onEditSalary: (s: StaffSalary) => void;
  onDeleteSalary: (s: StaffSalary) => void;
  onEditStaff: (s: StaffMember) => void;
  onDeleteStaff: (id: string) => void;
  actionLoading: boolean;
}

export function SalaryTab(props: SalaryTabProps) {
  const { staffMembers, salaries, month, year, onMonthChange, onYearChange, onGenerateSalaries, onPaySalary, onEditSalary, onDeleteSalary, onEditStaff, onDeleteStaff, actionLoading } = props;
  const [view, setView] = useState<'salary' | 'staff'>('salary');

  const totalNet = salaries.reduce((s, sal) => s + sal.netSalary, 0);
  const totalPaid = salaries.reduce((s, sal) => s + sal.paidAmount, 0);
  const totalDue = salaries.reduce((s, sal) => s + sal.dueAmount, 0);

  const salaryStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'বকেয়া', color: 'text-amber-700', bg: 'bg-amber-50' },
    PARTIAL: { label: 'আংশিক', color: 'text-blue-700', bg: 'bg-blue-50' },
    PAID: { label: 'পরিশোধিত', color: 'text-green-700', bg: 'bg-green-50' },
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('salary')}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", view === 'salary' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50")}
            >
              <HandCoins className="w-4 h-4 inline mr-1.5" />
              বেতন শীট
            </button>
            <button
              onClick={() => setView('staff')}
              className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-colors", view === 'staff' ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50")}
            >
              <Users className="w-4 h-4 inline mr-1.5" />
              স্টাফ তালিকা ({staffMembers.length})
            </button>
          </div>

          {view === 'salary' && (
            <div className="flex items-center gap-2">
              <select
                value={month}
                onChange={(e) => onMonthChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {MONTH_NAMES_BN.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={onGenerateSalaries}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDollarSign className="w-4 h-4" />}
                বেতন তৈরি করুন
              </button>
            </div>
          )}
        </div>
      </div>

      {view === 'salary' ? (
        <>
          {/* Salary Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">মোট বেতন</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(totalNet)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">পরিশোধিত</p>
              <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-500">বকেয়া</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(totalDue)}</p>
            </div>
          </div>

          {/* Salary Table */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {salaries.length === 0 ? (
              <div className="text-center py-16">
                <HandCoins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{MONTH_NAMES_BN[month - 1]} {year} মাসের বেতন তৈরি হয়নি</p>
                <p className="text-gray-400 text-sm mt-1">&quot;বেতন তৈরি করুন&quot; বাটনে ক্লিক করুন</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">স্টাফ</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পদবি</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বেসিক</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বোনাস/ওভারটাইম</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">কর্তন/অগ্রিম</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">নেট বেতন</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পরিশোধিত</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বকেয়া</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">স্ট্যাটাস</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaries.map((salary) => {
                      const statusConf = salaryStatusConfig[salary.status] || salaryStatusConfig.PENDING;
                      return (
                        <tr key={salary.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                                {salary.staff?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{salary.staff?.name}</p>
                                <p className="text-xs text-gray-400">{salary.staff?.phone}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-600">{salary.staff?.role || '—'}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-700 text-right">{formatCurrency(salary.basicSalary)}</td>
                          <td className="px-5 py-3.5 text-sm text-green-600 text-right">
                            {salary.bonus + salary.overtime > 0 ? `+${formatCurrency(salary.bonus + salary.overtime)}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-sm text-red-600 text-right">
                            {salary.deduction + salary.advance > 0 ? `-${formatCurrency(salary.deduction + salary.advance)}` : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-sm font-bold text-gray-900 text-right">{formatCurrency(salary.netSalary)}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-green-700 text-right">{formatCurrency(salary.paidAmount)}</td>
                          <td className="px-5 py-3.5 text-sm font-medium text-red-700 text-right">
                            {salary.dueAmount > 0 ? formatCurrency(salary.dueAmount) : '—'}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-medium", statusConf.bg, statusConf.color)}>
                              {statusConf.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditSalary(salary)}
                                disabled={actionLoading}
                                title="বোনাস/ওভারটাইম/কর্তন সম্পাদনা"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-50"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                সম্পাদনা
                              </button>
                              <button
                                onClick={() => onDeleteSalary(salary)}
                                disabled={actionLoading}
                                title="বেতন রেকর্ড মুছুন"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                মুছুন
                              </button>
                              {salary.status !== 'PAID' ? (
                                <button
                                  onClick={() => onPaySalary(salary)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                  <Banknote className="w-3.5 h-3.5" />
                                  পরিশোধ
                                </button>
                              ) : (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1 px-2">
                                  <Check className="w-3.5 h-3.5" /> সম্পন্ন
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold">
                      <td colSpan={5} className="px-5 py-3 text-sm text-gray-700">মোট</td>
                      <td className="px-5 py-3 text-sm text-right text-gray-900">{formatCurrency(totalNet)}</td>
                      <td className="px-5 py-3 text-sm text-right text-green-700">{formatCurrency(totalPaid)}</td>
                      <td className="px-5 py-3 text-sm text-right text-red-700">{formatCurrency(totalDue)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Staff List */
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {staffMembers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">কোনো স্টাফ যোগ করা হয়নি</p>
              <p className="text-gray-400 text-sm mt-1">নতুন স্টাফ যোগ করুন</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">নাম</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">ফোন</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">পদবি</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">যোগদানের তারিখ</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">বেসিক বেতন</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">স্ট্যাটাস</th>
                    <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((staff) => (
                    <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                            {staff.email && <p className="text-xs text-gray-400">{staff.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{staff.phone}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{staff.role || '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{formatDate(staff.joiningDate)}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900 text-right">{formatCurrency(staff.baseSalary)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex px-2.5 py-1 rounded-full text-xs font-medium",
                          staff.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        )}>
                          {staff.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditStaff(staff)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteStaff(staff.id)}
                            disabled={actionLoading}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
