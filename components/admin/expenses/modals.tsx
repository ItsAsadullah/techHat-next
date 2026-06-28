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

// ── Expense Form Modal ──
export function ExpenseFormModal({ expense, categories, onClose, onSaved }: {
  expense: Expense | null;
  categories: ExpenseCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!expense;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: expense?.title || '',
    amount: expense?.amount?.toString() || '',
    categoryId: expense?.categoryId || '',
    date: expense?.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    paymentMethod: expense?.paymentMethod || 'CASH',
    paidTo: expense?.paidTo || '',
    reference: expense?.reference || '',
    note: expense?.note || '',
    isRecurring: expense?.isRecurring || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.amount || !form.categoryId) {
      alert('শিরোনাম, পরিমাণ ও ক্যাটাগরি আবশ্যক');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        const { updateExpense } = await import('@/lib/actions/expense-actions');
        const result = await updateExpense(expense!.id, {
          ...form,
          amount: parseFloat(form.amount),
        });
        if (!result.success) { alert(result.error); return; }
      } else {
        const { createExpense } = await import('@/lib/actions/expense-actions');
        const result = await createExpense({
          ...form,
          amount: parseFloat(form.amount),
        });
        if (!result.success) { alert(result.error); return; }
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'খরচ সম্পাদনা করুন' : 'নতুন খরচ যোগ করুন'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">খরচের শিরোনাম *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="যেমন: দোকান ভাড়া"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">পরিমাণ (৳) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">তারিখ</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ক্যাটাগরি *</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              required
            >
              <option value="">ক্যাটাগরি নির্বাচন করুন</option>
              {categories.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">পেমেন্ট মেথড</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: pm.value })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all",
                    form.paymentMethod === pm.value
                      ? "border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <pm.icon className="w-4 h-4" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Paid To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">প্রাপক</label>
              <input
                type="text"
                value={form.paidTo}
                onChange={(e) => setForm({ ...form, paidTo: e.target.value })}
                placeholder="কাকে দেওয়া হয়েছে"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">রেফারেন্স নং</label>
              <input
                type="text"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="রসিদ/রেফারেন্স নং"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">নোট</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={3}
              placeholder="অতিরিক্ত মন্তব্য..."
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isRecurring}
              onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">এটি একটি পুনরাবৃত্তিমূলক খরচ (মাসিক)</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Category Form Modal ──
export function CategoryFormModal({ category, onClose, onSaved }: {
  category: ExpenseCategory | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: category?.name || '',
    icon: category?.icon || '📌',
    color: category?.color || '#6B7280',
  });

  const EMOJI_OPTIONS = ['📌', '🏠', '⚡', '💧', '🌐', '🚗', '🔧', '📦', '📢', '🍽️', '💰', '🏪', '📱', '🖥️', '👔', '🎯', '📊', '🔒', '🧹', '📝'];
  const COLOR_OPTIONS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4', '#84CC16', '#6B7280'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('ক্যাটাগরির নাম আবশ্যক'); return; }
    setFormError('');
    setLoading(true);
    try {
      if (isEdit) {
        const { updateExpenseCategory } = await import('@/lib/actions/expense-actions');
        const result = await updateExpenseCategory(category!.id, form);
        if (!result.success) { setFormError(result.error || 'সমস্যা হয়েছে'); setLoading(false); return; }
      } else {
        const { createExpenseCategory } = await import('@/lib/actions/expense-actions');
        const result = await createExpenseCategory(form);
        if (!result.success) { setFormError(result.error || 'সমস্যা হয়েছে'); setLoading(false); return; }
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ক্যাটাগরির নাম *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormError(''); }}
              placeholder="যেমন: দোকান ভাড়া"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">আইকন</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={cn(
                    "w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all",
                    form.icon === emoji ? "border-blue-400 bg-blue-50 ring-2 ring-blue-500/20" : "border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">রং</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    form.color === color ? "ring-2 ring-offset-2 ring-blue-500 border-white" : "border-gray-200"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${form.color}20` }}>
              {form.icon}
            </div>
            <span className="text-sm font-medium text-gray-700">{form.name || 'ক্যাটাগরির নাম'}</span>
            <div className="w-3 h-3 rounded-full ml-auto" style={{ backgroundColor: form.color }} />
          </div>

          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">{formError}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'আপডেট' : 'সংরক্ষণ'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Staff Form Modal ──
export function StaffFormModal({ staff, onClose, onSaved }: {
  staff: StaffMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!staff;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: staff?.name || '',
    phone: staff?.phone || '',
    email: staff?.email || '',
    role: staff?.role || '',
    baseSalary: staff?.baseSalary?.toString() || '',
    joiningDate: staff?.joiningDate ? new Date(staff.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    address: staff?.address || '',
    nidNumber: staff?.nidNumber || '',
    emergencyContact: staff?.emergencyContact || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) { alert('নাম ও ফোন নম্বর আবশ্যক'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        const { updateStaff } = await import('@/lib/actions/expense-actions');
        const result = await updateStaff(staff!.id, {
          ...form,
          baseSalary: parseFloat(form.baseSalary) || 0,
        });
        if (!result.success) { alert(result.error); return; }
      } else {
        const { createStaff } = await import('@/lib/actions/expense-actions');
        const result = await createStaff({
          ...form,
          baseSalary: parseFloat(form.baseSalary) || 0,
        });
        if (!result.success) { alert(result.error); return; }
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'স্টাফ সম্পাদনা' : 'নতুন স্টাফ যোগ করুন'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">নাম *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="সম্পূর্ণ নাম"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ফোন নম্বর *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">পদবি</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="">পদবি নির্বাচন করুন</option>
                <option value="Manager">ম্যানেজার</option>
                <option value="Salesman">সেলসম্যান</option>
                <option value="Cashier">ক্যাশিয়ার</option>
                <option value="Technician">টেকনিশিয়ান</option>
                <option value="Helper">হেল্পার</option>
                <option value="Delivery">ডেলিভারি</option>
                <option value="Security">সিকিউরিটি</option>
                <option value="Cleaner">ক্লিনার</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">বেসিক বেতন (৳)</label>
              <input
                type="number"
                value={form.baseSalary}
                onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                placeholder="0"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">যোগদানের তারিখ</label>
              <input
                type="date"
                value={form.joiningDate}
                onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ঠিকানা</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              placeholder="স্থায়ী ঠিকানা"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">NID নম্বর</label>
              <input
                type="text"
                value={form.nidNumber}
                onChange={(e) => setForm({ ...form, nidNumber: e.target.value })}
                placeholder="জাতীয় পরিচয়পত্র নং"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">জরুরি যোগাযোগ</label>
              <input
                type="tel"
                value={form.emergencyContact}
                onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {isEdit ? 'আপডেট' : 'সংরক্ষণ'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Pay Salary Modal ──
export function PaySalaryModal({ salary, onClose, onPay, loading }: {
  salary: StaffSalary;
  onClose: () => void;
  onPay: (id: string, amount: number, method: string) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState(salary.dueAmount.toString());
  const [method, setMethod] = useState('CASH');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">বেতন পরিশোধ</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Staff Info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-lg font-bold">
              {salary.staff?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{salary.staff?.name}</p>
              <p className="text-sm text-gray-500">{salary.staff?.role || 'Staff'} | {MONTH_NAMES_BN[salary.month - 1]} {salary.year}</p>
            </div>
          </div>

          {/* Salary Details */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-xl">
              <p className="text-sm font-bold text-blue-700">{formatCurrency(salary.netSalary)}</p>
              <p className="text-xs text-blue-600">নেট বেতন</p>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <p className="text-sm font-bold text-green-700">{formatCurrency(salary.paidAmount)}</p>
              <p className="text-xs text-green-600">পরিশোধিত</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl">
              <p className="text-sm font-bold text-red-700">{formatCurrency(salary.dueAmount)}</p>
              <p className="text-xs text-red-600">বকেয়া</p>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">পরিশোধের পরিমাণ (৳)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max={salary.dueAmount}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
            <div className="flex gap-2 mt-2">
              <button type="button" onClick={() => setAmount(salary.dueAmount.toString())} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                সম্পূর্ণ
              </button>
              <button type="button" onClick={() => setAmount((salary.dueAmount / 2).toString())} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
                অর্ধেক
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">পেমেন্ট মেথড</label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setMethod(pm.value)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 border rounded-xl text-sm transition-all",
                    method === pm.value ? "border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <pm.icon className="w-4 h-4" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button
              onClick={() => {
                const a = parseFloat(amount);
                if (!a || a <= 0) { alert('সঠিক পরিমাণ দিন'); return; }
                onPay(salary.id, a, method);
              }}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              পরিশোধ করুন
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Edit Salary Modal ──
export function EditSalaryModal({ salary, onClose, onSave, loading }: {
  salary: StaffSalary;
  onClose: () => void;
  onSave: (id: string, data: { overtime: number; bonus: number; deduction: number; advance: number; note?: string }) => void;
  loading: boolean;
}) {
  const [overtime, setOvertime] = useState(salary.overtime.toString());
  const [bonus, setBonus] = useState(salary.bonus.toString());
  const [deduction, setDeduction] = useState(salary.deduction.toString());
  const [advance, setAdvance] = useState(salary.advance.toString());
  const [note, setNote] = useState(salary.note || '');

  const ovt = parseFloat(overtime) || 0;
  const bon = parseFloat(bonus) || 0;
  const ded = parseFloat(deduction) || 0;
  const adv = parseFloat(advance) || 0;
  const netSalary = salary.basicSalary + ovt + bon - ded - adv;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">বেতন সম্পাদনা</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Staff info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
              {salary.staff?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-gray-900">{salary.staff?.name}</p>
              <p className="text-xs text-gray-500">{MONTH_NAMES_BN[salary.month - 1]} {salary.year} | বেসিক: {formatCurrency(salary.basicSalary)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500">নেট বেতন</p>
              <p className={cn("text-lg font-bold", netSalary >= 0 ? "text-gray-900" : "text-red-600")}>
                {formatCurrency(Math.max(0, netSalary))}
              </p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ওভারটাইম (৳)</label>
              <input
                type="number"
                min="0"
                value={overtime}
                onChange={(e) => setOvertime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">বোনাস (৳)</label>
              <input
                type="number"
                min="0"
                value={bonus}
                onChange={(e) => setBonus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <span className="text-red-500">−</span> কর্তন (৳)
              </label>
              <input
                type="number"
                min="0"
                value={deduction}
                onChange={(e) => setDeduction(e.target.value)}
                className="w-full px-3 py-2 border border-red-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <span className="text-orange-500">−</span> অগ্রিম (৳)
              </label>
              <input
                type="number"
                min="0"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                className="w-full px-3 py-2 border border-orange-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400"
                placeholder="0"
              />
            </div>
          </div>

          {/* Calculation summary */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
            <div className="flex justify-between text-gray-600">
              <span>বেসিক বেতন</span><span className="font-medium">{formatCurrency(salary.basicSalary)}</span>
            </div>
            {ovt > 0 && <div className="flex justify-between text-green-600"><span>+ ওভারটাইম</span><span>+{formatCurrency(ovt)}</span></div>}
            {bon > 0 && <div className="flex justify-between text-green-600"><span>+ বোনাস</span><span>+{formatCurrency(bon)}</span></div>}
            {ded > 0 && <div className="flex justify-between text-red-500"><span>− কর্তন</span><span>−{formatCurrency(ded)}</span></div>}
            {adv > 0 && <div className="flex justify-between text-orange-500"><span>− অগ্রিম</span><span>−{formatCurrency(adv)}</span></div>}
            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5 mt-1">
              <span>নেট বেতন</span><span>{formatCurrency(Math.max(0, netSalary))}</span>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">মন্তব্য (ঐচ্ছিক)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="যেমন: অতিরিক্ত কাজের বোনাস"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              বাতিল
            </button>
            <button
              onClick={() => onSave(salary.id, { overtime: ovt, bonus: bon, deduction: ded, advance: adv, note })}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
